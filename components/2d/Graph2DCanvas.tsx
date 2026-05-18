'use client';

import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import graphDataSource, { GROUP_COLORS } from './graphData';
import GraphControls from './GraphControls';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

// ─── Types ────────────────────────────────────────────────────────────────────
interface NodeObject {
  id: string;
  label: string;
  group: string;
  val?: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

interface LinkObject {
  source: NodeObject | string;
  target: NodeObject | string;
  strength?: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const BG_COLOR   = '#ffffff';
const BASE_R     = 5;
const LABEL_FONT = '500 11px Inter, ui-sans-serif, sans-serif';

const COLOR_ACTIVE   = '#896BE6';
const COLOR_NEIGHBOR = '#5C5C5C';
const COLOR_REST     = '#DEDEDE';

const TRANSITION_MS = 220;

// ─── Color helpers ────────────────────────────────────────────────────────────
function parseColor(c: string): [number, number, number, number] {
  if (c.startsWith('#')) {
    const hex = c.slice(1);
    const n = parseInt(hex.length === 3 ? hex.split('').map(x => x + x).join('') : hex, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1];
  }
  const m = c.match(/[\d.]+/g);
  if (!m) return [0, 0, 0, 1];
  return [+m[0], +m[1], +m[2], m[3] != null ? +m[3] : 1];
}

function lerpColor(a: string, b: string, t: number): string {
  const [ar, ag, ab, aa] = parseColor(a);
  const [br, bg, bb, ba] = parseColor(b);
  return `rgba(${Math.round(ar + (br - ar) * t)},${Math.round(ag + (bg - ag) * t)},${Math.round(ab + (bb - ab) * t)},${(aa + (ba - aa) * t).toFixed(3)})`;
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

// ─── Pure helpers ─────────────────────────────────────────────────────────────
const nodeColor  = (n: NodeObject) => GROUP_COLORS[n.group] ?? GROUP_COLORS.default;
const nodeRadius = (n: NodeObject) => BASE_R * Math.sqrt(n.val ?? 1);
const resolveId  = (r: NodeObject | string) => (typeof r === 'object' ? r.id : r);

const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) { lines.push(current); current = word; }
    else current = test;
  }
  if (current) lines.push(current);
  return lines;
};

// ─── Transition state ────────────────────────────────────────────────────────
interface NodeTransition {
  fromColor: string;
  toColor: string;
  fromRadius: number;
  toRadius: number;
  startTime: number;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function Graph2DCanvas() {
  const fgRef      = useRef<any>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const getCanvas  = () => wrapperRef.current?.querySelector<HTMLCanvasElement>('canvas') ?? null;

  const [hoveredNode,  setHoveredNode]  = useState<NodeObject | null>(null);
  const [selectedNode, setSelectedNode] = useState<NodeObject | null>(null);
  const [searchQuery,  setSearchQuery]  = useState('');
  const [dimensions,   setDimensions]   = useState({ w: 800, h: 600 });

  const draggingNodeRef    = useRef<NodeObject | null>(null);
  const dragNeighborIdsRef = useRef<Set<string>>(new Set());

  // ── Transition refs (written in event handlers, read in paintNode RAF) ──────
  const nodeTransitions = useRef<Map<string, NodeTransition>>(new Map());
  // Tracks current interpolated color/radius for mid-flight snapshot
  const currentColorRef  = useRef<Map<string, string>>(new Map());
  const currentRadiusRef = useRef<Map<string, number>>(new Map());

  const graphData = useMemo<{ nodes: NodeObject[]; links: LinkObject[] }>(() => ({
    nodes: graphDataSource.nodes.map(n => ({ ...n })),
    links: graphDataSource.links.map(l => ({ ...l })),
  }), []);

  // ── Helper: compute target colors given a focus node and search ─────────────
  // Called directly in event handlers with EXPLICIT new state — no closures,
  // no React batching issues, no stale values.
  const startTransitions = useCallback((
    newFocus: NodeObject | null,
    newSearch: string,
    newSelected: NodeObject | null,
  ) => {
    const focusId = newFocus?.id ?? null;
    const selectedId = newSelected?.id ?? null;

    // NOTE: We no longer use a guard to skip transitions. The RAF-based
    // transition system in paintNode already handles "don't restart mid-flight"
    // correctly — nodeTransitions.current.set() simply overwrites any in-flight
    // transition for that node, using its current interpolated color as the new
    // "from" (captured from currentColorRef, which paintNode keeps in sync).
    // A guard was causing legitimate state changes to be skipped.

    const now = performance.now();
    const activeFocusId = (newFocus ?? newSelected)?.id ?? null;

    // Build highlight set for the new state
    const highlightIds = new Set<string>();
    const activeFocus  = newFocus ?? newSelected;

    if (newSearch.trim()) {
      const q = newSearch.toLowerCase();
      graphData.nodes.forEach(n => {
        if ((n.label ?? n.id).toLowerCase().includes(q)) highlightIds.add(n.id);
      });
    }
    if (activeFocus) {
      highlightIds.add(activeFocus.id);
      graphData.links.forEach(l => {
        const src = resolveId(l.source);
        const tgt = resolveId(l.target);
        if (src === activeFocus.id || tgt === activeFocus.id) {
          highlightIds.add(src);
          highlightIds.add(tgt);
        }
      });
    }
    const hasHL = highlightIds.size > 0;

    graphData.nodes.forEach(node => {
      // Snapshot current actual visible state on the screen as "from"
      // This is 100% immune to timing/sleep drift because it uses the actual painted state.
      const fromColor = currentColorRef.current.get(node.id) ?? nodeColor(node);
      const fromRadius = currentRadiusRef.current.get(node.id) ?? 1.0;

      // Compute target color for new state
      const isActive = node.id === activeFocus?.id ||
        (newSearch.trim() && (node.label ?? node.id).toLowerCase().includes(newSearch.toLowerCase()));
      const toColor: string = hasHL
        ? highlightIds.has(node.id)
          ? (isActive ? COLOR_ACTIVE : COLOR_NEIGHBOR)
          : COLOR_REST
        : nodeColor(node);
      const toRadius = hasHL && node.id === activeFocus?.id ? 1.3 : 1.0;

      nodeTransitions.current.set(node.id, {
        fromColor, toColor, fromRadius, toRadius, startTime: now,
      });
    });
  }, [graphData]);

  // ── Responsive canvas size ─────────────────────────────────────────────────
  useEffect(() => {
    const update = () => setDimensions({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // ── Visibility & Window Focus: clear hover on hide/blur ───────────────────
  // Use refs for reactive state so these callbacks always read fresh values
  const selectedNodeRef = useRef<NodeObject | null>(null);
  selectedNodeRef.current = selectedNode;
  const searchQueryRef  = useRef('');
  searchQueryRef.current = searchQuery;

  useEffect(() => {
    const clearAllHover = () => {
      draggingNodeRef.current    = null;
      dragNeighborIdsRef.current = new Set();
      setHoveredNode(null);
      startTransitions(null, searchQueryRef.current, selectedNodeRef.current);
    };

    const onVisibility = () => {
      if (document.hidden) clearAllHover();
    };

    const onBlur = () => {
      clearAllHover();
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
    };
  }, [startTransitions]);

  // ── d3 force configuration ─────────────────────────────────────────────────
  useEffect(() => {
    let rafId: ReturnType<typeof setTimeout>;
    const tryApplyForces = () => {
      const fg = fgRef.current;
      if (!fg || typeof fg.d3Force !== 'function') { rafId = setTimeout(tryApplyForces, 80); return; }
      import('d3-force').then((d3) => {
        fg.d3Force('center', null);
        fg.d3Force('x', d3.forceX(0).strength(0.09));
        fg.d3Force('y', d3.forceY(0).strength(0.09));
        fg.d3Force('charge').strength(-120);
        fg.d3Force('link')
          .distance((l: LinkObject) => { const s = l.strength ?? 0.5; return s >= 0.8 ? 80 : s >= 0.4 ? 70 : 120; })
          .strength((l: LinkObject) => (l.strength ?? 0.5) * 0.9);
        fg.d3Force('collide', d3.forceCollide((n: NodeObject) => nodeRadius(n) + 3));
        fg.d3ReheatSimulation?.();
      });
    };
    rafId = setTimeout(tryApplyForces, 80);
    return () => clearTimeout(rafId);
  }, []);

  // ── Highlight sets (for links + labels — React state path) ────────────────
  const { highlightNodeIds, highlightLinkSet } = useMemo(() => {
    const focus = hoveredNode ?? selectedNode;
    const hNodeIds = new Set<string>();
    const hLinks   = new Set<LinkObject>();
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      graphData.nodes.forEach((n: any) => { if ((n.label ?? n.id).toLowerCase().includes(q)) hNodeIds.add(n.id); });
    }
    if (focus) {
      hNodeIds.add(focus.id);
      graphData.links.forEach(l => {
        const src = resolveId(l.source); const tgt = resolveId(l.target);
        if (src === focus.id || tgt === focus.id) { hLinks.add(l); hNodeIds.add(src); hNodeIds.add(tgt); }
      });
    }
    return { highlightNodeIds: hNodeIds, highlightLinkSet: hLinks };
  }, [hoveredNode, selectedNode, searchQuery, graphData]);

  const hasHighlight = highlightNodeIds.size > 0;

  // ── Node painter (called every RAF frame by the library) ───────────────────
  const paintNode = useCallback(
    (node: NodeObject, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const now = performance.now();
      const tr  = nodeTransitions.current.get(node.id);

      let displayColor: string;
      let radiusMul: number;

      if (tr) {
        const elapsed = now - tr.startTime;
        if (elapsed >= TRANSITION_MS) {
          // Transition is complete! Draw the exact target state and remove from active transitions
          displayColor = tr.toColor;
          radiusMul    = tr.toRadius;
          currentColorRef.current.set(node.id, displayColor);
          currentRadiusRef.current.set(node.id, radiusMul);
          nodeTransitions.current.delete(node.id);
        } else {
          const t  = easeInOut(Math.max(0, elapsed / TRANSITION_MS));
          displayColor = lerpColor(tr.fromColor, tr.toColor, t);
          radiusMul    = tr.fromRadius + (tr.toRadius - tr.fromRadius) * t;
          currentColorRef.current.set(node.id, displayColor);
          currentRadiusRef.current.set(node.id, radiusMul);
        }
      } else {
        displayColor = currentColorRef.current.get(node.id) ?? nodeColor(node);
        radiusMul    = currentRadiusRef.current.get(node.id) ?? 1.0;
      }

      const r = nodeRadius(node) * radiusMul;
      ctx.save();
      ctx.beginPath();
      ctx.arc(node.x!, node.y!, r, 0, Math.PI * 2);
      ctx.fillStyle = displayColor;
      ctx.fill();
      ctx.restore();

      // ── Labels ─────────────────────────────────────────────────────────────
      const isActive = node.id === (draggingNodeRef.current?.id ?? hoveredNode?.id ?? selectedNode?.id) ||
        (searchQuery.trim() && (node.label ?? node.id).toLowerCase().includes(searchQuery.toLowerCase()));

      const LABEL_MIN_ZOOM = 1.0, LABEL_FULL_ZOOM = 2.0;
      if (!isActive && globalScale < LABEL_MIN_ZOOM) return;
      const labelFade = isActive ? 1 : Math.min(1, (globalScale - LABEL_MIN_ZOOM) / (LABEL_FULL_ZOOM - LABEL_MIN_ZOOM));
      if (labelFade <= 0) return;

      const fontSize  = Math.max(9, Math.min(13, 11 / Math.sqrt(globalScale)));
      const textColor = isActive ? '#3E3E3E' : hasHighlight && !highlightNodeIds.has(node.id) ? COLOR_REST : nodeColor(node);

      ctx.save();
      ctx.font = LABEL_FONT.replace('11px', `${fontSize}px`);
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.globalAlpha = labelFade; ctx.fillStyle = textColor;
      const maxWidth = 200 / globalScale;
      const lineH    = (fontSize + 2) / globalScale;
      const lines    = wrapText(ctx, node.label, maxWidth);
      const startY   = node.y! + r + 4 / globalScale;
      lines.forEach((line, i) => ctx.fillText(line, node.x!, startY + i * lineH));
      ctx.restore();
    },
    [hoveredNode, selectedNode, searchQuery, hasHighlight, highlightNodeIds],
  );

  // ── Link painter ───────────────────────────────────────────────────────────
  const paintLink = useCallback(
    (link: LinkObject, ctx: CanvasRenderingContext2D) => {
      const src = link.source as NodeObject;
      const tgt = link.target as NodeObject;
      if (src?.x == null || tgt?.x == null) return;
      const str  = link.strength ?? 0.5;
      const weak = str <= 0.6;
      const isHighlighted = hasHighlight && highlightLinkSet.has(link);
      ctx.save();
      ctx.globalAlpha = isHighlighted ? 1 : hasHighlight ? 0.4 : 1;
      ctx.beginPath();
      ctx.moveTo(src.x, src.y!); ctx.lineTo(tgt.x, tgt.y!);
      ctx.strokeStyle = isHighlighted ? COLOR_ACTIVE : weak ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 0.5;
      if (weak) ctx.setLineDash([3, 5]);
      ctx.stroke(); ctx.setLineDash([]);
      ctx.restore();
    },
    [graphData, hasHighlight, highlightLinkSet],
  );

  const paintPointerArea = useCallback(
    (node: NodeObject, color: string, ctx: CanvasRenderingContext2D) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(node.x!, node.y!, nodeRadius(node) + 8, 0, Math.PI * 2);
      ctx.fill();
    }, [],
  );

  // ── Interaction handlers — transitions start HERE with explicit state ───────
  const handleNodeHover = useCallback((node: NodeObject | null) => {
    setHoveredNode(node ?? null);
    const canvas = fgRef.current?.canvas;
    // When hovering a node → pointer cursor. When not → grab (for canvas pan)
    if (canvas) canvas.style.cursor = node ? 'pointer' : 'grab';
    startTransitions(node ?? null, searchQueryRef.current, selectedNodeRef.current);
  }, [startTransitions]);

  const handleNodeClick = useCallback((node: NodeObject, event: MouseEvent) => {
    event?.stopPropagation?.();
    const newSelected = selectedNodeRef.current?.id === node.id ? null : node;
    setSelectedNode(newSelected);
    startTransitions(hoveredNode, searchQueryRef.current, newSelected);
  }, [startTransitions, hoveredNode]);

  const handleBgClick = useCallback(() => {
    setSelectedNode(null);
    startTransitions(null, searchQueryRef.current, null);
  }, [startTransitions]);

  const handleDragStart = useCallback((node: NodeObject) => {
    draggingNodeRef.current = node;
    setHoveredNode(node);
    const neighbors = new Set<string>([node.id]);
    graphData.links.forEach(l => {
      const src = resolveId(l.source); const tgt = resolveId(l.target);
      if (src === node.id) neighbors.add(tgt);
      if (tgt === node.id) neighbors.add(src);
    });
    dragNeighborIdsRef.current = neighbors;
    startTransitions(node, searchQueryRef.current, selectedNodeRef.current);
  }, [graphData, startTransitions]);

  const handleDragEnd = useCallback((node: NodeObject) => {
    node.fx = null; node.fy = null;
    draggingNodeRef.current    = null;
    dragNeighborIdsRef.current = new Set();
    setHoveredNode(null);
    startTransitions(null, searchQueryRef.current, selectedNodeRef.current);
  }, [startTransitions]);

  // ── Search handler ─────────────────────────────────────────────────────────
  const handleSearch = useCallback((q: string) => {
    setSearchQuery(q);
    startTransitions(hoveredNode, q, selectedNodeRef.current);
  }, [startTransitions, hoveredNode]);

  // ── Controls ───────────────────────────────────────────────────────────────
  const handleZoomIn  = useCallback(() => { fgRef.current?.zoom((fgRef.current?.zoom() ?? 1) * 1.4, 300); }, []);
  const handleZoomOut = useCallback(() => { fgRef.current?.zoom((fgRef.current?.zoom() ?? 1) / 1.4, 300); }, []);
  const handleFitView = useCallback(() => { fgRef.current?.zoomToFit(500, 80); }, []);

  return (
    <div
      ref={wrapperRef}
      className="graph2d-root"
      onMouseLeave={() => {
        setHoveredNode(null);
        startTransitions(null, searchQueryRef.current, selectedNodeRef.current);
      }}
    >
      <ForceGraph2D
        ref={fgRef}
        graphData={graphData as any}
        width={dimensions.w}
        height={dimensions.h}
        backgroundColor={BG_COLOR}
        nodeRelSize={BASE_R}
        nodeVal={(n: any) => n.val ?? 1}
        nodeCanvasObject={paintNode as any}
        nodeCanvasObjectMode={() => 'replace'}
        nodePointerAreaPaint={paintPointerArea as any}
        linkCanvasObject={paintLink as any}
        linkCanvasObjectMode={() => 'replace'}
        linkDirectionalParticles={0}
        onNodeHover={handleNodeHover as any}
        onNodeClick={handleNodeClick as any}
        onBackgroundClick={handleBgClick}
        showPointerCursor={(n: any) => !!n}
        enableNodeDrag={true}
        onNodeDrag={handleDragStart as any}
        onNodeDragEnd={handleDragEnd as any}
        d3AlphaDecay={0.008}
        d3VelocityDecay={0.3}
        warmupTicks={100}
        cooldownTicks={Infinity}
        minZoom={0.1}
        maxZoom={12}
        enableZoomInteraction
        enablePanInteraction
      />

      <GraphControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFitView={handleFitView}
        onSearch={handleSearch}
        nodeCount={graphData.nodes.length}
        linkCount={graphData.links.length}
      />

      {selectedNode && (
        <div className="graph2d-info-card" onClick={e => e.stopPropagation()}>
          <div className="graph2d-info-dot" style={{ background: nodeColor(selectedNode) }} />
          <div>
            <div className="graph2d-info-label">{selectedNode.label}</div>
            <div className="graph2d-info-group">{selectedNode.group}</div>
          </div>
          <button className="graph2d-info-close" onClick={() => {
            setSelectedNode(null);
            startTransitions(hoveredNode, searchQueryRef.current, null);
          }}>×</button>
        </div>
      )}
    </div>
  );
}
