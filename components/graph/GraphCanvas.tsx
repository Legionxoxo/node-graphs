'use client';

import { ReactFlow, Controls, Background, BackgroundVariant, Panel, useReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useGraphStore } from '@/store/graphStore';
import { useSampleData } from '@/hooks/useSampleData';
import CardNode from './CustomNode';
import CustomEdge from './CustomEdge';

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

const nodeTypes = {
  card: CardNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

const defaultEdgeOptions = {
  type: 'custom',
};

export default function GraphCanvas() {
  useSampleData();

  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
  } = useGraphStore();

  return (
    <div className="w-full h-screen flex">
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
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
          translateExtent={[[-2000, -2000], [3000, 3000]]}
          nodeExtent={[[-2000, -2000], [3000, 3000]]}
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
    </div>
  );
}