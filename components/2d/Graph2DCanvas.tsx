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
const BG_COLOR    = '#d4d4d8';
const BASE_R      = 5;
const LABEL_FONT  = '500 11px Inter, ui-sans-serif, sans-serif';

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

  // Refs for drag state — updated synchronously so the canvas painter
  // always sees the current value on the very next animation frame,
  // without waiting for a React re-render cycle.
  const draggingNodeRef    = useRef<NodeObject | null>(null);
  const dragNeighborIdsRef = useRef<Set<string>>(new Set());

  // react-force-graph mutates link objects in place (replaces string ids with
  // NodeObject refs). We keep one stable copy so identity comparisons work.
  const graphData = useMemo(() => ({
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


  // ── Highlight sets ─────────────────────────────────────────────────────────
  // Compare against graphData.links (mutated in-place by the library) so object
  // identity works after source/target become NodeObject refs.
  const { highlightNodeIds, highlightLinkSet } = useMemo(() => {
    // During drag we use refs (handled in paintNode directly).
    // Here we only handle hover / selected / search.
    const focus = hoveredNode ?? selectedNode;
    const hNodeIds = new Set<string>();
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
        }
      });
    }

    return { highlightNodeIds: hNodeIds, highlightLinkSet: hLinks };
  }, [hoveredNode, selectedNode, searchQuery, graphData]);

  const hasHighlight = highlightNodeIds.size > 0;

  // ── Node painter ───────────────────────────────────────────────────────────
  const paintNode = useCallback(
    (node: NodeObject, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const r     = nodeRadius(node);
      const color = nodeColor(node);

      // During drag: read refs synchronously (no React re-render needed)
      const isDragging = draggingNodeRef.current !== null;
      const isHL = isDragging
        ? dragNeighborIdsRef.current.has(node.id)
        : !hasHighlight || highlightNodeIds.has(node.id);
      const isHov = isDragging
        ? node.id === draggingNodeRef.current?.id
        : hoveredNode?.id === node.id;
      const isSel = selectedNode?.id === node.id;

      ctx.save();
      ctx.globalAlpha = isHL ? 1 : 0.12;

      // Glow halo on hover / selection
      if ((isHov || isSel) && isHL) {
        ctx.shadowColor = color;
        ctx.shadowBlur  = isSel ? 22 : 15;
        ctx.beginPath();
        ctx.arc(node.x!, node.y!, r + (isSel ? 5 : 3), 0, Math.PI * 2);
        ctx.fillStyle = color + (isSel ? '44' : '28');
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Main dot
      ctx.shadowColor = isHL ? color : 'transparent';
      ctx.shadowBlur  = isHL ? (isHov || isSel ? 10 : 5) : 0;
      ctx.beginPath();
      ctx.arc(node.x!, node.y!, r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // White ring on selected
      if (isSel) {
        ctx.strokeStyle = 'rgba(0,0,0,0.7)';
        ctx.lineWidth   = 1.2 / globalScale;
        ctx.stroke();
      }

      ctx.shadowBlur = 0;
      ctx.restore();

      // Labels: hidden below LABEL_MIN_ZOOM, fade in smoothly up to LABEL_FULL_ZOOM
      const LABEL_MIN_ZOOM  = 1.2;
      const LABEL_FULL_ZOOM = 2.2;
      if (globalScale < LABEL_MIN_ZOOM) return;

      const labelFade = Math.min(1, (globalScale - LABEL_MIN_ZOOM) / (LABEL_FULL_ZOOM - LABEL_MIN_ZOOM));
      const fontSize  = Math.max(9, Math.min(13, 11 / Math.sqrt(globalScale)));
      ctx.save();
      ctx.font         = LABEL_FONT.replace('11px', `${fontSize}px`);
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'top';
      ctx.globalAlpha  = labelFade * (isHL ? 1 : 0.18);
      ctx.shadowColor  = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur   = 6;
      ctx.fillStyle    = isHov || isSel
        ? '#000000'
        : (isDragging || hasHighlight) && !isHL
          ? 'rgba(80,80,100,0.35)'
          : 'rgba(30,30,50,0.85)';
      ctx.fillText(node.label, node.x!, node.y! + r + 4);
      ctx.restore();
    },
    [hasHighlight, highlightNodeIds, hoveredNode, selectedNode],
  );

  // ── Link painter ───────────────────────────────────────────────────────────
  const paintLink = useCallback(
    (link: LinkObject, ctx: CanvasRenderingContext2D) => {
      const src = link.source as NodeObject;
      const tgt = link.target as NodeObject;
      if (src?.x == null || tgt?.x == null) return;

      // Also dim links during drag using refs
      const isDragging = draggingNodeRef.current !== null;
      const isHL = isDragging
        ? dragNeighborIdsRef.current.has(resolveId(link.source)) &&
          dragNeighborIdsRef.current.has(resolveId(link.target))
        : !hasHighlight || highlightLinkSet.has(link);

      const str  = link.strength ?? 0.5;
      const weak = str < 0.4;

      ctx.beginPath();
      ctx.moveTo(src.x, src.y!);
      ctx.lineTo(tgt.x, tgt.y!);
      ctx.strokeStyle = isHL
        ? weak ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.5)'
        : weak ? 'rgba(0,0,0,0.03)' : 'rgba(0,0,0,0.06)';
      ctx.lineWidth = isHL ? (str >= 0.9 ? 1.4 : 0.9) : 0.5;
      if (weak) ctx.setLineDash([3, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
    },
    [hasHighlight, highlightLinkSet],
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
      ctx.fillStyle = color;                                   // ← required
      ctx.beginPath();
      ctx.arc(node.x!, node.y!, nodeRadius(node) + 8, 0, Math.PI * 2);
      ctx.fill();                                              // ← required
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

  const handleBgClick = useCallback(() => setSelectedNode(null), []);

  // ── Drag: write to refs synchronously so painter sees it immediately ────────
  const handleDragStart = useCallback((node: NodeObject) => {
    draggingNodeRef.current = node;
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
    <div className="graph2d-root">
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
    </div>
  );
}
