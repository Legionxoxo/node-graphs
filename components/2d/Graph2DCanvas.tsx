'use client';

import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import graphDataSource, { GROUP_COLORS } from './graphData';
import GraphControls from './GraphControls';

// Must be dynamic — uses browser Canvas APIs
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
const BG_COLOR = '#ffffff';
const BASE_R      = 5;
const LABEL_FONT  = '500 11px Inter, ui-sans-serif, sans-serif';

// Highlight palette
const COLOR_ACTIVE  = '#896BE6'; // selected/hovered node
const COLOR_NEIGHBOR = '#5C5C5C'; // connected to active
const COLOR_REST    = '#DEDEDE'; // all other nodes

// Transition
const TRANSITION_MS = 300;

// ─── Pure helpers (no hooks) ─────────────────────────────────────────────────
const nodeColor  = (n: NodeObject) => GROUP_COLORS[n.group] ?? GROUP_COLORS.default;
const nodeRadius = (n: NodeObject) => BASE_R * Math.sqrt(n.val ?? 1);
const resolveId  = (r: NodeObject | string) => (typeof r === 'object' ? r.id : r);

// ─── Component ────────────────────────────────────────────────────────────────
export default function Graph2DCanvas() {
  const fgRef = useRef<any>(null);

  const [hoveredNode,   setHoveredNode]   = useState<NodeObject | null>(null);
  const [selectedNode,  setSelectedNode]  = useState<NodeObject | null>(null);
  const [searchQuery,   setSearchQuery]   = useState('');
  const [dimensions,    setDimensions]    = useState({ w: 800, h: 600 });

  // Drag state
  const draggingNodeRef    = useRef<NodeObject | null>(null);
  const dragNeighborIdsRef = useRef<Set<string>>(new Set());

  // react-force-graph mutates link objects in place (replaces string ids with
  // NodeObject refs). We keep one stable copy so identity comparisons work.
  const graphData = useMemo<{ nodes: NodeObject[]; links: LinkObject[] }>(() => ({
    nodes: graphDataSource.nodes.map(n => ({ ...n })),
    links: graphDataSource.links.map(l => ({ ...l })),
  }), []);

  // ── Responsive canvas size ─────────────────────────────────────────────────
  useEffect(() => {
    const update = () =>
      setDimensions({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // ── d3 force configuration ─────────────────────────────────────────────────
  // react-force-graph exposes fg.d3Force(name) to get/set named forces.
  // We wait a tick so the internal simulation is guaranteed to exist.
  useEffect(() => {
    // Use a polling retry instead of a fixed delay so that client-side
    // navigation (where the dynamic import may take > 150 ms) still works.
    // We keep retrying every 80 ms until the ForceGraph ref is mounted AND
    // its internal d3 simulation has been wired up (d3Force is callable).
    let rafId: ReturnType<typeof setTimeout>;

    const tryApplyForces = () => {
      const fg = fgRef.current;
      // d3Force is only available once the internal simulation is ready
      if (!fg || typeof fg.d3Force !== 'function') {
        rafId = setTimeout(tryApplyForces, 80);
        return;
      }

      import('d3-force').then((d3) => {
        // ── KEY: replace forceCenter with forceX + forceY ─────────────────
        // forceCenter only re-centers the whole simulation — it has NO per-node
        // gravitational pull, so dragged nodes never come back.
        // forceX/Y attract EACH NODE individually toward (0,0), which is what
        // creates Obsidian's circular blob + rubber-band snap-back on drag.
        fg.d3Force('center', null);
        fg.d3Force('x', d3.forceX(0).strength(0.06));
        fg.d3Force('y', d3.forceY(0).strength(0.06));

        // Gentle repulsion — nodes spread out but stay close enough to form blob
        fg.d3Force('charge').strength(-60);

        // Short link distances → connected nodes stay tight in the cluster
        fg.d3Force('link')
          .distance((l: LinkObject) => {
            const s = l.strength ?? 0.5;
            return s >= 0.8 ? 35 : s >= 0.4 ? 70 : 120;
          })
          .strength((l: LinkObject) => (l.strength ?? 0.5) * 0.9);

        // Collision — nodes never stack
        fg.d3Force('collide', d3.forceCollide((n: NodeObject) => nodeRadius(n) + 3));

        fg.d3ReheatSimulation?.();
      });
    };

    rafId = setTimeout(tryApplyForces, 80);
    return () => clearTimeout(rafId);
  }, []);


  // ── Highlight sets + computed colors ───────────────────────────────────────
  // neighborIds: direct neighbors of the active (hovered/selected) node
  // highlightLinkSet: links connected to the active node
  const { highlightNodeIds, neighborIds, highlightLinkSet } = useMemo(() => {
    const focus = hoveredNode ?? selectedNode;
    const hNodeIds = new Set<string>();
    const nIds     = new Set<string>();
    const hLinks   = new Set<LinkObject>();

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      graphData.nodes.forEach((n: any) => {
        const lbl: string = n.label ?? n.id;
        if (lbl.toLowerCase().includes(q)) hNodeIds.add(n.id);
      });
    }

    if (focus) {
      hNodeIds.add(focus.id);
      graphData.links.forEach(l => {
        const src = resolveId(l.source);
        const tgt = resolveId(l.target);
        if (src === focus.id || tgt === focus.id) {
          hLinks.add(l);
          hNodeIds.add(src);
          hNodeIds.add(tgt);
          if (src !== focus.id) nIds.add(src);
          if (tgt !== focus.id) nIds.add(tgt);
        }
      });
    }

    return { highlightNodeIds: hNodeIds, neighborIds: nIds, highlightLinkSet: hLinks };
  }, [hoveredNode, selectedNode, searchQuery, graphData]);

  const hasHighlight = highlightNodeIds.size > 0;

  // ── Color animation (300ms ease) ─────────────────────────────────────────
  // Tracks hover/selected state and drives a RAF loop to interpolate colors
  // during transitions. Node/link painters read from refs for RAF-sync access.
  const isAnimRef  = useRef(false);
  const hoverStart = useRef(0);
  const prevNodeColor = useRef<Record<string, string>>({});
  const prevNodeAlpha = useRef<Record<string, number>>({});
  const prevNodeScale = useRef<Record<string, number>>({});
  const prevLinkColor = useRef<Record<string, string>>({});
  const prevLinkAlpha = useRef<Record<string, number>>({});
  const prevTextColor = useRef<Record<string, string>>({});

  // Current display colors (written by RAF loop, read by painters via closure)
  const curNodeColor = useRef<Record<string, string>>({});
  const curNodeAlpha = useRef<Record<string, number>>({});
  const curNodeScale = useRef<Record<string, number>>({});
  const curLinkColor = useRef<Record<string, string>>({});
  const curLinkAlpha = useRef<Record<string, number>>({});
  const curTextColor = useRef<Record<string, string>>({});

  // Initialize defaults for all nodes/links
  useEffect(() => {
    graphData.nodes.forEach(n => {
      const c = nodeColor(n);
      curNodeColor.current[n.id] = c;
      prevNodeColor.current[n.id] = c;
      curNodeAlpha.current[n.id] = 1;
      prevNodeAlpha.current[n.id] = 1;
      curNodeScale.current[n.id] = 1;
      prevNodeScale.current[n.id] = 1;
      curTextColor.current[n.id] = nodeColor(n);
      prevTextColor.current[n.id] = nodeColor(n);
    });
    graphData.links.forEach((l, i) => {
      const str = l.strength ?? 0.5;
      const weak = str <= 0.4;
      const c = weak ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.25)';
      curLinkColor.current[i] = c;
      prevLinkColor.current[i] = c;
      curLinkAlpha.current[i] = 1;
      prevLinkAlpha.current[i] = 1;
    });
  }, [graphData]);

  // Kick off animation whenever highlight state changes
  useEffect(() => {
    // Snapshot "from" values before transitioning
    graphData.nodes.forEach(n => {
      prevNodeColor.current[n.id] = curNodeColor.current[n.id] ?? nodeColor(n);
      prevNodeAlpha.current[n.id] = curNodeAlpha.current[n.id] ?? 1;
      prevNodeScale.current[n.id] = curNodeScale.current[n.id] ?? 1;
      prevTextColor.current[n.id] = curTextColor.current[n.id] ?? nodeColor(n);
    });
    graphData.links.forEach((l, i) => {
      prevLinkColor.current[i] = curLinkColor.current[i] ?? 'rgba(0,0,0,0.25)';
      prevLinkAlpha.current[i] = curLinkAlpha.current[i] ?? 1;
    });

    hoverStart.current = performance.now();
    isAnimRef.current  = true;

    let rafId: number;
    const animate = () => {
      const elapsed = performance.now() - hoverStart.current;
      const t = Math.min(1, elapsed / TRANSITION_MS);
      const ease = 1 - Math.pow(1 - t, 3);

      const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

      if (hasHighlight) {
        graphData.nodes.forEach(n => {
          const fromColor = prevNodeColor.current[n.id] ?? nodeColor(n);
          const fromAlpha = prevNodeAlpha.current[n.id] ?? 1;
          const fromScale = prevNodeScale.current[n.id] ?? 1;
          const fromTextColor = prevTextColor.current[n.id] ?? nodeColor(n);
          let toColor: string;
          let toAlpha: number;
          let toScale: number;
          let toTextColor: string;
          if (highlightNodeIds.has(n.id)) {
            const isActive = n.id === (hoveredNode?.id ?? selectedNode?.id) || (searchQuery.trim() && n.label?.toLowerCase().includes(searchQuery.toLowerCase()));
            toColor = isActive ? COLOR_ACTIVE : COLOR_NEIGHBOR;
            toAlpha = 1;
            toScale = isActive ? 1.3 : 1;
            toTextColor = isActive ? '#3E3E3E' : (curNodeColor.current[n.id] ?? nodeColor(n));
          } else {
            toColor = COLOR_REST;
            toAlpha = 1;
            toScale = 1;
            toTextColor = COLOR_REST;
          }
          // Interpolate hex colors
          const fromR = parseInt(fromColor.slice(1, 3), 16);
          const fromG = parseInt(fromColor.slice(3, 5), 16);
          const fromB = parseInt(fromColor.slice(5, 7), 16);
          const toR = parseInt(toColor.slice(1, 3), 16);
          const toG = parseInt(toColor.slice(3, 5), 16);
          const toB = parseInt(toColor.slice(5, 7), 16);
          const rc = Math.round(lerp(fromR, toR, ease));
          const gc = Math.round(lerp(fromG, toG, ease));
          const bc = Math.round(lerp(fromB, toB, ease));
          curNodeColor.current[n.id] = `#${rc.toString(16).padStart(2, '0')}${gc.toString(16).padStart(2, '0')}${bc.toString(16).padStart(2, '0')}`;
          curNodeAlpha.current[n.id] = lerp(fromAlpha, toAlpha, ease);
          curNodeScale.current[n.id] = lerp(fromScale, toScale, ease);
          // Interpolate text color
          const tcFromR = parseInt(fromTextColor.slice(1, 3), 16);
          const tcFromG = parseInt(fromTextColor.slice(3, 5), 16);
          const tcFromB = parseInt(fromTextColor.slice(5, 7), 16);
          const tcToR = parseInt(toTextColor.slice(1, 3), 16);
          const tcToG = parseInt(toTextColor.slice(3, 5), 16);
          const tcToB = parseInt(toTextColor.slice(5, 7), 16);
          const tcR = Math.round(lerp(tcFromR, tcToR, ease));
          const tcG = Math.round(lerp(tcFromG, tcToG, ease));
          const tcB = Math.round(lerp(tcFromB, tcToB, ease));
          curTextColor.current[n.id] = `#${tcR.toString(16).padStart(2, '0')}${tcG.toString(16).padStart(2, '0')}${tcB.toString(16).padStart(2, '0')}`;
        });
        graphData.links.forEach((l, i) => {
          const fromAlpha = prevLinkAlpha.current[i] ?? 1;
          const toAlpha = highlightLinkSet.has(l) ? 1 : 0.4;
          curLinkColor.current[i] = COLOR_ACTIVE;
          curLinkAlpha.current[i] = lerp(fromAlpha, toAlpha, ease);
        });
      } else {
        graphData.nodes.forEach(n => {
          const fromColor = prevNodeColor.current[n.id] ?? nodeColor(n);
          const fromAlpha = prevNodeAlpha.current[n.id] ?? 1;
          const fromScale = prevNodeScale.current[n.id] ?? 1;
          const fromTextColor = prevTextColor.current[n.id] ?? nodeColor(n);
          const toColor = nodeColor(n);
          const toAlpha = 1;
          const toScale = 1;
          const toTextColor = nodeColor(n);
          const fromR = parseInt(fromColor.slice(1, 3), 16);
          const fromG = parseInt(fromColor.slice(3, 5), 16);
          const fromB = parseInt(fromColor.slice(5, 7), 16);
          const toR = parseInt(toColor.slice(1, 3), 16);
          const toG = parseInt(toColor.slice(3, 5), 16);
          const toB = parseInt(toColor.slice(5, 7), 16);
          const rc = Math.round(lerp(fromR, toR, ease));
          const gc = Math.round(lerp(fromG, toG, ease));
          const bc = Math.round(lerp(fromB, toB, ease));
          curNodeColor.current[n.id] = `#${rc.toString(16).padStart(2, '0')}${gc.toString(16).padStart(2, '0')}${bc.toString(16).padStart(2, '0')}`;
          curNodeAlpha.current[n.id] = lerp(fromAlpha, toAlpha, ease);
          curNodeScale.current[n.id] = lerp(fromScale, toScale, ease);
          // Interpolate text color back to node color
          const tcFromR = parseInt(fromTextColor.slice(1, 3), 16);
          const tcFromG = parseInt(fromTextColor.slice(3, 5), 16);
          const tcFromB = parseInt(fromTextColor.slice(5, 7), 16);
          const tcToR = parseInt(toTextColor.slice(1, 3), 16);
          const tcToG = parseInt(toTextColor.slice(3, 5), 16);
          const tcToB = parseInt(toTextColor.slice(5, 7), 16);
          const tcR = Math.round(lerp(tcFromR, tcToR, ease));
          const tcG = Math.round(lerp(tcFromG, tcToG, ease));
          const tcB = Math.round(lerp(tcFromB, tcToB, ease));
          curTextColor.current[n.id] = `#${tcR.toString(16).padStart(2, '0')}${tcG.toString(16).padStart(2, '0')}${tcB.toString(16).padStart(2, '0')}`;
        });
        graphData.links.forEach((l, i) => {
          const fromAlpha = prevLinkAlpha.current[i] ?? 1;
          const str = l.strength ?? 0.5;
          const weak = str <= 0.4;
          const toColor = weak ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.25)';
          const toAlpha = 1;
          curLinkColor.current[i] = toColor;
          curLinkAlpha.current[i] = lerp(fromAlpha, toAlpha, ease);
        });
      }

      if (t < 1) {
        rafId = requestAnimationFrame(animate);
      } else {
        isAnimRef.current = false;
      }
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [hasHighlight, hoveredNode, selectedNode, highlightNodeIds, neighborIds, highlightLinkSet, graphData]);

  // ── Node painter ───────────────────────────────────────────────────────────
  const paintNode = useCallback(
    (node: NodeObject, ctx: CanvasRenderingContext2D, globalScale: number) => {
      // Use draggingNodeRef for immediate response during drag; fallback to state
      const activeId = draggingNodeRef.current?.id ?? hoveredNode?.id ?? selectedNode?.id;
      const isActive = node.id === activeId || (searchQuery.trim() && node.label?.toLowerCase().includes(searchQuery.toLowerCase()));
      const r = nodeRadius(node) * (curNodeScale.current[node.id] ?? 1);

      const displayColor = curNodeColor.current[node.id] ?? nodeColor(node);
      const displayAlpha = curNodeAlpha.current[node.id] ?? 1;

      ctx.save();
      ctx.globalAlpha = displayAlpha;
      ctx.beginPath();
      ctx.arc(node.x!, node.y!, r, 0, Math.PI * 2);
      ctx.fillStyle = displayColor;
      ctx.fill();
      ctx.restore();

      // Labels: hidden below LABEL_MIN_ZOOM, fade in smoothly up to LABEL_FULL_ZOOM
      // Active nodes (hovered/selected/dragged) always show text in #3E3E3E
      const LABEL_MIN_ZOOM  = 1.0;
      const LABEL_FULL_ZOOM = 2.0;
      if (!isActive && globalScale < LABEL_MIN_ZOOM) return;

      const labelFade = isActive ? 1 : Math.min(1, (globalScale - LABEL_MIN_ZOOM) / (LABEL_FULL_ZOOM - LABEL_MIN_ZOOM));
      const fontSize  = Math.max(9, Math.min(13, 11 / Math.sqrt(globalScale)));
      const textColor = curTextColor.current[node.id] ?? displayColor;
      ctx.save();
      ctx.font         = LABEL_FONT.replace('11px', `${fontSize}px`);
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'top';
      ctx.globalAlpha  = labelFade * displayAlpha;
      ctx.fillStyle    = textColor;
      ctx.fillText(node.label, node.x!, node.y! + r + 4);
      ctx.restore();
    },
    [hoveredNode, selectedNode, searchQuery],
  );

  // ── Link painter ───────────────────────────────────────────────────────────
  const paintLink = useCallback(
    (link: LinkObject, ctx: CanvasRenderingContext2D) => {
      const src = link.source as NodeObject;
      const tgt = link.target as NodeObject;
      if (src?.x == null || tgt?.x == null) return;

      const linkIdx = graphData.links.indexOf(link);
      const displayColor = curLinkColor.current[linkIdx] ?? 'rgba(0,0,0,0.25)';
      const displayAlpha = curLinkAlpha.current[linkIdx] ?? 1;
      const str = link.strength ?? 0.5;
      const weak = str <= 0.6;

      ctx.save();
      ctx.globalAlpha = displayAlpha;
      ctx.beginPath();
      ctx.moveTo(src.x, src.y!);
      ctx.lineTo(tgt.x, tgt.y!);
      ctx.strokeStyle = displayColor;
      ctx.lineWidth = 0.5;
      if (weak) ctx.setLineDash([3, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    },
    [graphData],
  );

  // ── Pointer area — THIS IS THE CRITICAL CLICK FIX ─────────────────────────
  // The library paints each node's hit area on an offscreen canvas using a
  // unique color per node, then uses ctx.getImageData to resolve which node
  // was clicked. The callback MUST:
  //   1. Set ctx.fillStyle = the provided color
  //   2. Draw the shape path
  //   3. Call ctx.fill()
  // Without all three steps, the hit area is empty → clicks never register.
  const paintPointerArea = useCallback(
    (node: NodeObject, color: string, ctx: CanvasRenderingContext2D) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(node.x!, node.y!, nodeRadius(node) * (curNodeScale.current[node.id] ?? 1) + 8, 0, Math.PI * 2);
      ctx.fill();
    },
    [],
  );

  // ── Interaction handlers ───────────────────────────────────────────────────
  const handleNodeHover = useCallback((node: NodeObject | null) => {
    setHoveredNode(node ?? null);
    document.body.style.cursor = node ? 'pointer' : 'default';
  }, []);

  const handleNodeClick = useCallback(
    (node: NodeObject, event: MouseEvent) => {
      event?.stopPropagation?.();   // prevent bubble → background deselect
      setSelectedNode(prev => prev?.id === node.id ? null : node);
    },
    [],
  );

  const handleBgClick = useCallback(() => {
    setSelectedNode(null);
    document.body.style.cursor = 'default';
  }, []);

  // ── Drag: write to refs synchronously so painter sees it immediately ────────
  const handleDragStart = useCallback((node: NodeObject) => {
    draggingNodeRef.current = node;
    // Set hoveredNode so the animation system picks up the drag for highlight colors
    setHoveredNode(node);
    // Precompute this node's neighbors once so paintNode can read it cheaply
    const neighbors = new Set<string>([node.id]);
    graphData.links.forEach(l => {
      const src = resolveId(l.source);
      const tgt = resolveId(l.target);
      if (src === node.id) neighbors.add(tgt);
      if (tgt === node.id) neighbors.add(src);
    });
    dragNeighborIdsRef.current = neighbors;
  }, [graphData]);

  const handleDragEnd = useCallback((node: NodeObject) => {
    node.fx = null;
    node.fy = null;
    draggingNodeRef.current    = null;
    dragNeighborIdsRef.current = new Set();
    document.body.style.cursor = 'default';
    // Clear hover to restore default colors; selectedNode still takes over if set
    setHoveredNode(null);
  }, []);

  // ── Controls ───────────────────────────────────────────────────────────────
  const handleZoomIn  = useCallback(() => {
    fgRef.current?.zoom((fgRef.current?.zoom() ?? 1) * 1.4, 300);
  }, []);
  const handleZoomOut = useCallback(() => {
    fgRef.current?.zoom((fgRef.current?.zoom() ?? 1) / 1.4, 300);
  }, []);
  const handleFitView = useCallback(() => {
    fgRef.current?.zoomToFit(500, 80);
  }, []);

  return (
    <div className="graph2d-root" onMouseLeave={() => document.body.style.cursor = 'default'}>
      <ForceGraph2D
        ref={fgRef}
        graphData={graphData as any}
        width={dimensions.w}
        height={dimensions.h}
        backgroundColor={BG_COLOR}

        /* Node */
        nodeRelSize={BASE_R}
        nodeVal={(n: any) => n.val ?? 1}
        nodeCanvasObject={paintNode as any}
        nodeCanvasObjectMode={() => 'replace'}
        nodePointerAreaPaint={paintPointerArea as any}

        /* Links */
        linkCanvasObject={paintLink as any}
        linkCanvasObjectMode={() => 'replace'}
        linkDirectionalParticles={0}

        /* Interaction */
        onNodeHover={handleNodeHover as any}
        onNodeClick={handleNodeClick as any}
        onBackgroundClick={handleBgClick}
        onNodeDrag={handleDragStart as any}
        onNodeDragEnd={handleDragEnd as any}

        /* Physics */
        d3AlphaDecay={0.008}      // very slow decay → stays lively
        d3VelocityDecay={0.3}
        warmupTicks={100}
        cooldownTicks={Infinity}

        /* Viewport */
        minZoom={0.1}
        maxZoom={12}
        enableZoomInteraction
        enablePanInteraction
        enableNodeDrag
      />

      <GraphControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFitView={handleFitView}
        onSearch={setSearchQuery}
        nodeCount={graphData.nodes.length}
        linkCount={graphData.links.length}
      />

      {/* Info card for selected node */}
      {selectedNode && (
        <div className="graph2d-info-card" onClick={e => e.stopPropagation()}>
          <div
            className="graph2d-info-dot"
            style={{ background: nodeColor(selectedNode) }}
          />
          <div>
            <div className="graph2d-info-label">{selectedNode.label}</div>
            <div className="graph2d-info-group">{selectedNode.group}</div>
          </div>
          <button className="graph2d-info-close" onClick={() => setSelectedNode(null)}>
            ×
          </button>
        </div>
      )}



      {/* Legend */}
      {/*
      <div className="graph2d-legend">
        {Object.entries(GROUP_COLORS)
          .filter(([k]) => k !== 'default')
          .map(([group, color]) => (
            <div key={group} className="graph2d-legend-item">
              <span className="graph2d-legend-dot" style={{ background: color }} />
              <span className="graph2d-legend-name">{group}</span>
            </div>
          ))}
      </div>
      */}
    </div>
  );
}
