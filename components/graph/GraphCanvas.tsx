'use client';

import { ReactFlow, Controls, Background, BackgroundVariant, Panel, useReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useGraphStore } from '@/store/graphStore';
import { useSampleData } from '@/hooks/useSampleData';
import CardNode from './CustomNode';
import CustomEdge from './CustomEdge';
import EllipsisNode from './EllipsisNode';
import ChainSidebar from './ChainSidebar';
import { useMemo } from 'react';

function TakeMeHomeButton() {
  const { fitView } = useReactFlow();
  return (
    <Panel position="top-center">
      <button
        onClick={() => fitView({ padding: 0.2, duration: 800 })}
        className="px-6 py-2 mt-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-semibold shadow-lg transition-all duration-200"
      >
        Take me home
      </button>
    </Panel>
  );
}

const defaultEdgeOptions = {
  type: 'custom',
};

export default function GraphCanvas() {
  useSampleData();

  const nodeTypes = useMemo(() => ({
    card: CardNode,
    ellipsis: EllipsisNode,
  }), []);

  const edgeTypes = useMemo(() => ({
    custom: CustomEdge,
  }), []);

  const {
    nodes,
    edges,
    chainPagination,
    onNodesChange,
    onEdgesChange,
    onConnect,
  } = useGraphStore();

  const { visibleNodes, visibleEdges } = useMemo(() => {
    const outEdges: Record<string, string> = {};
    const inEdges: Record<string, string> = {};

    edges.forEach(e => {
      if (e.data?.edgeType === 'sequential') {
        outEdges[e.source] = e.target;
        inEdges[e.target] = e.source;
      }
    });

    const starts = nodes.filter(n => !inEdges[n.id] && outEdges[n.id]);

    let nextNodes = [...nodes];
    let nextEdges = [...edges];

    starts.forEach(start => {
      const chain: string[] = [start.id];
      let curr = outEdges[start.id];
      while (curr) {
        chain.push(curr);
        curr = outEdges[curr];
      }

      if (chain.length > 5) {
        const n0 = nodes.find(n => n.id === chain[0]);
        const pageIndex = chainPagination[start.id] ?? -1;
        
        const pagedNodes = chain.slice(1, chain.length - 3);
        const tailNodes = chain.slice(chain.length - 3);
        
        let topEllipsisId: string | null = null;
        let bottomEllipsisId: string | null = null;
        let visiblePagedNodes: string[] = [];

        if (pageIndex === -1) {
          bottomEllipsisId = pagedNodes[0];
          visiblePagedNodes = [];
        } else {
          const startIndex = pageIndex * 5;
          const endIndex = startIndex + 5;
          
          if (startIndex > 0) {
            topEllipsisId = pagedNodes[startIndex - 1];
          }
          
          visiblePagedNodes = pagedNodes.slice(startIndex, endIndex);
          
          if (endIndex < pagedNodes.length) {
            bottomEllipsisId = pagedNodes[endIndex];
          }
        }

        const visibleSet = new Set([
          chain[0],
          ...(topEllipsisId ? [topEllipsisId] : []),
          ...visiblePagedNodes,
          ...(bottomEllipsisId ? [bottomEllipsisId] : []),
          ...tailNodes
        ]);

        const orderedVisibleChain = chain.filter(id => visibleSet.has(id));

        const n1 = nodes.find(n => n.id === chain[1]);
        let dx = 0, dy = 100;
        if (n0 && n1) {
          dx = n1.position.x - n0.position.x;
          dy = n1.position.y - n0.position.y;
        }

        nextNodes = nextNodes.map(n => {
          if (chain.includes(n.id)) {
            if (!visibleSet.has(n.id)) {
              return { ...n, hidden: true };
            }

            const isTopEllipsis = n.id === topEllipsisId;
            const isBottomEllipsis = n.id === bottomEllipsisId;
            
            let type = n.type;
            let data = { ...n.data, isExpandedChain: true, chainId: start.id };

            if (isTopEllipsis) {
              type = 'ellipsis';
              data.nextPage = pageIndex - 1;
            } else if (isBottomEllipsis) {
              type = 'ellipsis';
              data.nextPage = pageIndex === -1 ? 0 : pageIndex + 1;
            }

            const visibleIdx = orderedVisibleChain.indexOf(n.id);
            const pos = n0 ? {
              x: n0.position.x + dx * visibleIdx,
              y: n0.position.y + dy * visibleIdx,
            } : n.position;

            return {
              ...n,
              type,
              data,
              position: pos
            };
          }
          return n;
        });

        nextEdges = nextEdges.map(e => {
          if (!visibleSet.has(e.source) || !visibleSet.has(e.target)) {
            if (chain.includes(e.source) || chain.includes(e.target)) {
              return { ...e, hidden: true };
            }
          }
          return e;
        });

        for (let i = 0; i < orderedVisibleChain.length - 1; i++) {
          const u = orderedVisibleChain[i];
          const v = orderedVisibleChain[i + 1];
          const origIndexU = chain.indexOf(u);
          const origIndexV = chain.indexOf(v);
          if (origIndexV !== origIndexU + 1) {
            nextEdges.push({
              id: `fake_${u}_${v}`,
              source: u,
              target: v,
              type: 'custom',
              data: { edgeType: 'sequential' }
            });
          }
        }
      }
    });

    return {
      visibleNodes: nextNodes.filter(n => !n.hidden),
      visibleEdges: nextEdges.filter(e => !e.hidden)
    };
  }, [nodes, edges, chainPagination]);

  return (
    <div className="w-full h-screen flex">
      <div className="flex-1 relative">
        <ReactFlow
          nodes={visibleNodes}
          edges={visibleEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.1}
          maxZoom={4}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          translateExtent={[[-2000, -2000], [3000, 5500]]}
          nodeExtent={[[-2000, -2000], [3000, 5500]]}
        >
          <Controls
            showInteractive={false}
            showFitView={false}
          />
          <TakeMeHomeButton />
          <Background
            color="var(--background-dot, #d1d5db)"
            gap={20}
            variant={BackgroundVariant.Dots}
            style={{ opacity: 0.6 }}
          />
        </ReactFlow>
      </div>
      <ChainSidebar />
    </div>
  );
}