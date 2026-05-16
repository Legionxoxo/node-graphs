'use client';

import { useCallback, useMemo } from 'react';
import { ReactFlow, Controls, Background, MiniMap, BackgroundVariant } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useGraphStore } from '@/store/graphStore';
import { useSampleData } from '@/hooks/useSampleData';
import CardNode from './CustomNode';
import CustomEdge from './CustomEdge';

const nodeTypes = {
  card: CardNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

const defaultEdgeOptions = {
  type: 'custom',
  animated: true,
  style: { stroke: '#4a5568', strokeWidth: 1.5 },
};

export default function GraphCanvas() {
  useSampleData();

  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    selectedNodeId,
    selectNode,
  } = useGraphStore();

  const onSelectionChange = useCallback(
    ({ nodes: selectedNodes }: { nodes: any[] }) => {
      if (selectedNodes.length === 1) {
        selectNode(selectedNodes[0].id);
      } else {
        selectNode(null);
      }
    },
    [selectNode]
  );

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) || null,
    [nodes, selectedNodeId]
  );

  return (
    <div className="w-full h-screen flex">
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onSelectionChange={onSelectionChange}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.1}
          maxZoom={4}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        >
          <Controls
            showInteractive={false}
            style={{
              background: '#1a1a2e',
              border: '1px solid #333',
              borderRadius: '8px',
            }}
          />
          <MiniMap
            nodeColor={(node) => (node.selected ? '#00d9ff' : '#3a3a5c')}
            maskColor="rgba(0, 0, 0, 0.7)"
            style={{
              background: '#1a1a2e',
              border: '1px solid #333',
              borderRadius: '8px',
            }}
          />
          <Background
            color="#2d2d44"
            gap={20}
            variant={BackgroundVariant.Dots}
            style={{ opacity: 0.5 }}
          />
        </ReactFlow>
      </div>

      {/* Sidebar for selected node */}
      {selectedNode && (
        <div
          className="w-64 bg-[#1a1a2e] border-l border-[#333] p-4 overflow-auto"
          style={{ maxHeight: '100vh' }}
        >
          <h2 className="text-lg font-semibold text-white mb-2">
            {selectedNode.data.label}
          </h2>
          {selectedNode.data.description && (
            <p className="text-sm text-gray-400 mb-4">
              {selectedNode.data.description}
            </p>
          )}
          <div className="text-xs text-gray-500">
            <p>ID: {selectedNode.id}</p>
            <p>
              Position: {Math.round(selectedNode.position.x)}, {Math.round(selectedNode.position.y)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}