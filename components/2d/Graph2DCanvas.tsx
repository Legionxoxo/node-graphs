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

interface BBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const BG_COLOR = '#ffffff';
const BASE_R = 5;

const COLOR_ACTIVE = '#896BE6';
const COLOR_NEIGHBOR = '#5C5C5C';
const COLOR_REST = '#DEDEDE';

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
const nodeColor = (n: NodeObject) => GROUP_COLORS[n.group] ?? GROUP_COLORS.default;
const nodeRadius = (n: NodeObject) => BASE_R * Math.sqrt(n.val ?? 1);
const resolveId = (r: NodeObject | string) => (typeof r === 'object' ? r.id : r);

// AABB Collision detection (Made slightly stricter with <= to avoid touching borders)
const isColliding = (b1: BBox, b2: BBox): boolean => {
  return !(
    b1.x + b1.width <= b2.x ||
    b2.x + b2.width <= b1.x ||
    b1.y + b1.height <= b2.y ||
    b2.y + b2.height <= b1.y
  );
};

// Truncates text to a specific word count and adds ellipsis if needed
const truncateWords = (text: string, maxWords: number): string => {
  if (!text) return '';
  const words = text.split(' ');
  if (words.length > maxWords) {
    return words.slice(0, maxWords).join(' ') + '...';
  }
  return text;
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
  const fgRef = useRef<any>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [hoveredNode, setHoveredNode] = useState<NodeObject | null>(null);
  const [selectedNode, setSelectedNode] = useState<NodeObject | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dimensions, setDimensions] = useState({ w: 800, h: 600 });
  const [renderTrigger, setRenderTrigger] = useState(0);

  const draggingNodeRef = useRef<NodeObject | null>(null);
  const dragNeighborIdsRef = useRef<Set<string>>(new Set());

  const pumpRafRef = useRef<number | null>(null);

  // ── Transition refs ─────────────────────────────────────────────────────────
  const nodeTransitions = useRef<Map<string, NodeTransition>>(new Map());
  const currentColorRef = useRef<Map<string, string>>(new Map());
  const currentRadiusRef = useRef<Map<string, number>>(new Map());

  // ── Deferred label rendering & Collision ────────────────────────────────────
  const deferredLabels = useRef<Array<{ priority: number, draw: () => void }>>([]);
  const paintCountRef = useRef(0);
  const drawnLabelsBBoxes = useRef<BBox[]>([]);

  // ── Safe Refs for Callbacks ─────────────────────────────────────────────────
  const selectedNodeRef = useRef<NodeObject | null>(null);
  const searchQueryRef = useRef('');

  useEffect(() => {
    selectedNodeRef.current = selectedNode;
    searchQueryRef.current = searchQuery;
  }, [selectedNode, searchQuery]);

  const graphData = useMemo<{ nodes: NodeObject[]; links: LinkObject[] }>(() => ({
    nodes: graphDataSource.nodes.map(n => ({ ...n })),
    links: graphDataSource.links.map(l => ({ ...l })),
  }), []);

  // ── Helper: compute target colors given a focus node and search ─────────────
  const startTransitions = useCallback((
    newFocus: NodeObject | null,
    newSearch: string,
    newSelected: NodeObject | null,
  ) => {
    const now = performance.now();

    if (pumpRafRef.current) cancelAnimationFrame(pumpRafRef.current);

    let frames = 0;
    const pumpCanvas = () => {
      frames++;
      if (frames < 15) {
        setRenderTrigger(prev => prev + 1);
        pumpRafRef.current = requestAnimationFrame(pumpCanvas);
      } else {
        pumpRafRef.current = null;
      }
    };
    pumpCanvas();

    const highlightIds = new Set<string>();
    const activeFocus = newFocus ?? newSelected;

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
      const fromColor = currentColorRef.current.get(node.id) ?? nodeColor(node);
      const fromRadius = currentRadiusRef.current.get(node.id) ?? 1.0;

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

  // ── d3 force configuration ─────────────────────────────────────────────────
  useEffect(() => {
    let rafId: ReturnType<typeof setTimeout>;
    let isMounted = true;

    const tryApplyForces = () => {
      const fg = fgRef.current;
      if (!fg || typeof fg.d3Force !== 'function') {
        rafId = setTimeout(tryApplyForces, 80);
        return;
      }
      import('d3-force').then((d3) => {
        if (!isMounted) return;

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

    return () => {
      isMounted = false;
      clearTimeout(rafId);
    };
  }, []);

  // ── Highlight sets (for links + labels) ───────────────────────────────────
  const { highlightNodeIds, highlightLinkSet } = useMemo(() => {
    const focus = hoveredNode ?? selectedNode;
    const hNodeIds = new Set<string>();
    const hLinks = new Set<LinkObject>();

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

  // ── Node painter ─────────────────────────────────────────────────────────────
  const paintNode = useCallback(
    (node: NodeObject, ctx: CanvasRenderingContext2D, globalScale: number) => {
      paintCountRef.current++;

      const now = performance.now();
      const tr = nodeTransitions.current.get(node.id);

      let displayColor: string;
      let radiusMul: number;

      if (tr) {
        const elapsed = now - tr.startTime;
        if (elapsed >= TRANSITION_MS) {
          displayColor = tr.toColor;
          radiusMul = tr.toRadius;
          currentColorRef.current.set(node.id, displayColor);
          currentRadiusRef.current.set(node.id, radiusMul);
          nodeTransitions.current.delete(node.id);
        } else {
          const t = easeInOut(Math.max(0, elapsed / TRANSITION_MS));
          displayColor = lerpColor(tr.fromColor, tr.toColor, t);
          radiusMul = tr.fromRadius + (tr.toRadius - tr.fromRadius) * t;
          currentColorRef.current.set(node.id, displayColor);
          currentRadiusRef.current.set(node.id, radiusMul);
        }
      } else {
        displayColor = currentColorRef.current.get(node.id) ?? nodeColor(node);
        radiusMul = currentRadiusRef.current.get(node.id) ?? 1.0;
      }

      const r = nodeRadius(node) * radiusMul;
      ctx.save();
      ctx.beginPath();
      ctx.arc(node.x!, node.y!, r, 0, Math.PI * 2);
      ctx.fillStyle = displayColor;
      ctx.fill();
      ctx.restore();

      const isActive = node.id === (draggingNodeRef.current?.id ?? hoveredNode?.id ?? selectedNode?.id) ||
        (searchQuery.trim() && (node.label ?? node.id).toLowerCase().includes(searchQuery.toLowerCase()));

      const LABEL_MIN_ZOOM = 1.5, LABEL_FULL_ZOOM = 2.25;

      const drawLabel = () => {
        const labelFade = isActive ? 1 : Math.min(1, 0.3 + (globalScale - LABEL_MIN_ZOOM) / (LABEL_FULL_ZOOM - LABEL_MIN_ZOOM));
        if (labelFade <= 0) return;

        const VISUAL_FONT_SIZE = globalScale < 2.0 ? 10 : globalScale < 2.5 ? 12 : globalScale < 3.0 ? 14 : 16;
        const fontSize = VISUAL_FONT_SIZE / globalScale;
        const textColor = isActive ? '#3E3E3E' : hasHighlight && !highlightNodeIds.has(node.id) ? COLOR_REST : nodeColor(node);

        ctx.save();
        ctx.font = `500 ${fontSize}px Inter, ui-sans-serif, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.globalAlpha = labelFade;
        ctx.fillStyle = textColor;

        let currentY = node.y! + r + 2 / globalScale;
        const textToDraw = isActive ? node.label : truncateWords(node.label, 6);

        const lineHeight = fontSize * 1.2;
        const paddingX = 2 / globalScale;
        const paddingY = 2 / globalScale; // Very small padding over Y

        let textWidth = ctx.measureText(textToDraw).width;

        let proposedBBox: BBox = {
          x: node.x! - textWidth / 2 - paddingX,
          y: currentY - paddingY,
          width: textWidth + paddingX * 2,
          height: lineHeight + paddingY * 2
        };

        let isOverlap = drawnLabelsBBoxes.current.some(box => isColliding(proposedBBox, box));
        let useTwoLines = false;
        let line1 = textToDraw;
        let line2 = '';

        if (isOverlap && textToDraw.includes(' ')) {
          // Try wrapping to 2 lines
          const words = textToDraw.split(' ');
          const mid = Math.ceil(words.length / 2);
          line1 = words.slice(0, mid).join(' ');
          line2 = words.slice(mid).join(' ');

          const w1 = ctx.measureText(line1).width;
          const w2 = ctx.measureText(line2).width;
          textWidth = Math.max(w1, w2);

          // Recalculate BBox completely for 2 lines
          proposedBBox = {
            x: node.x! - textWidth / 2 - paddingX,
            y: currentY - paddingY,
            width: textWidth + paddingX * 2,
            height: (lineHeight * 2) + paddingY * 2
          };

          useTwoLines = true;
          // Check if the NEW 2-line shape still overlaps
          isOverlap = drawnLabelsBBoxes.current.some(box => isColliding(proposedBBox, box));
        }

        // Logic to add small padding shift (over Y) to clear minor overlaps
        let yShifts = 0;
        const maxShifts = 3;
        const shiftAmount = 2 / globalScale; // Shift slightly down

        while (isOverlap && yShifts < maxShifts) {
          currentY += shiftAmount;
          proposedBBox.y += shiftAmount;
          isOverlap = drawnLabelsBBoxes.current.some(box => isColliding(proposedBBox, box));
          yShifts++;
        }

        // HIDING LOGIC COMPLETELY REMOVED. ALL LABELS WILL DRAW REGARDLESS OF OVERLAP.

        if (useTwoLines) {
          ctx.fillText(line1, node.x!, currentY);
          ctx.fillText(line2, node.x!, currentY + lineHeight);
        } else {
          ctx.fillText(textToDraw, node.x!, currentY);
        }

        drawnLabelsBBoxes.current.push(proposedBBox);
        ctx.restore();
      };

      // Assign priority so important elements claim space first
      const drawPriority = isActive ? 2 : (hasHighlight && highlightNodeIds.has(node.id) ? 1 : 0);

      if (isActive) {
        deferredLabels.current.push({ priority: drawPriority, draw: drawLabel });
      } else if (globalScale >= LABEL_MIN_ZOOM) {
        deferredLabels.current.push({ priority: drawPriority, draw: drawLabel });
      }

      // ── Flush frame logic ──────────────────────────────────────────────────
      if (paintCountRef.current >= graphData.nodes.length) {
        // Sort descending by priority so Active/Hovered nodes claim BBoxes first.
        deferredLabels.current.sort((a, b) => b.priority - a.priority);
        deferredLabels.current.forEach(item => item.draw());
        deferredLabels.current = [];

        // Reset counters and clear collision boundaries for the next frame
        drawnLabelsBBoxes.current = [];
        paintCountRef.current = 0;
      }
    },
    [hoveredNode, selectedNode, searchQuery, hasHighlight, highlightNodeIds, renderTrigger, graphData.nodes.length],
  );

  // ── Link painter ───────────────────────────────────────────────────────────
  const paintLink = useCallback(
    (link: LinkObject, ctx: CanvasRenderingContext2D) => {
      const src = link.source as NodeObject;
      const tgt = link.target as NodeObject;
      if (src?.x == null || tgt?.x == null) return;
      const str = link.strength ?? 0.5;
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

  // ── Interaction handlers ───────────────────────────────────────────────────
  const handleNodeHover = useCallback((node: NodeObject | null) => {
    setHoveredNode(node ?? null);
    const canvas = fgRef.current?.canvas;
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

  const handleNodeDrag = useCallback((node: NodeObject) => {
    if (draggingNodeRef.current?.id === node.id) return;
    draggingNodeRef.current = node;

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
    node.fx = null;
    node.fy = null;

    draggingNodeRef.current = null;
    dragNeighborIdsRef.current = new Set();

    // Clear any hover/drag highlight state so node doesn't retain hover appearance
    startTransitions(null, searchQueryRef.current, selectedNodeRef.current);

    // Gravity pull toward center
    const targetX = 0;
    const targetY = 0;

    const dx = targetX - (node.x ?? 0);
    const dy = targetY - (node.y ?? 0);

    const SPEED_MULTIPLIER = 0.015;

    node.vx = (node.vx ?? 0) + (dx * SPEED_MULTIPLIER);
    node.vy = (node.vy ?? 0) + (dy * SPEED_MULTIPLIER);

    if (fgRef.current) {
      fgRef.current.d3ReheatSimulation();
    }
  }, []);

  // ── Search handler ─────────────────────────────────────────────────────────
  const handleSearch = useCallback((q: string) => {
    setSearchQuery(q);
    startTransitions(hoveredNode, q, selectedNodeRef.current);
  }, [startTransitions, hoveredNode]);

  // ── Controls ───────────────────────────────────────────────────────────────
  const handleZoomIn = useCallback(() => {
    const fg = fgRef.current;
    if (!fg) return;
    const current = fg.zoom() ?? 1;
    const target = Math.min(12, current * 1.4);
    fg.zoom(target, 600);
  }, []);

  const handleZoomOut = useCallback(() => {
    const fg = fgRef.current;
    if (!fg) return;
    const current = fg.zoom() ?? 1;
    const target = Math.max(0.1, current / 1.4);
    fg.zoom(target, 600);
  }, []);

  const handleFitView = useCallback(() => { fgRef.current?.zoomToFit(500, 80); }, []);

  return (
    <div ref={wrapperRef} className="graph2d-root">
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
        onNodeDrag={handleNodeDrag as any}
        onNodeDragEnd={handleDragEnd as any}
        d3AlphaDecay={0.01}
        d3VelocityDecay={0.85}
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