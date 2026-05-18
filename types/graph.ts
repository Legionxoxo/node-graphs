import { Node, Edge } from '@xyflow/react';

export interface GraphNodeData extends Record<string, unknown> {
  label: string;
  color?: string;
  description?: string;
}

export type GraphNode = Node<GraphNodeData, 'card'>;

export interface GraphEdgeData extends Record<string, unknown> {
  label?: string;
  animated?: boolean;
  edgeType?: 'sequential' | 'semantic';
}

export type GraphEdge = Edge<GraphEdgeData>;

export interface GraphState {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNodeId: string | null;
  setNodes: (nodes: GraphNode[]) => void;
  setEdges: (edges: GraphEdge[]) => void;
  selectNode: (id: string | null) => void;
  onNodesChange: (changes: any[]) => void;
  onEdgesChange: (changes: any[]) => void;
  onConnect: (params: any) => void;
}