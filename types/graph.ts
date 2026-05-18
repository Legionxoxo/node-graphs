import { Node, Edge } from '@xyflow/react';

export interface GraphNodeData extends Record<string, unknown> {
  label: string;
  color?: string;
  description?: string;
  nextPage?: number;
  isExpandedChain?: boolean;
  chainId?: string;
}

export type GraphNode = Node<GraphNodeData, 'card' | 'ellipsis'>;

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
  chainPagination: Record<string, number>;
  sidebarChainId: string | null;
  setNodes: (nodes: GraphNode[]) => void;
  setEdges: (edges: GraphEdge[]) => void;
  selectNode: (id: string | null) => void;
  toggleChain: (chainId: string) => void;
  paginateChain: (chainId: string, pageIndex: number) => void;
  openChainSidebar: (chainId: string) => void;
  closeChainSidebar: () => void;
  onNodesChange: (changes: any[]) => void;
  onEdgesChange: (changes: any[]) => void;
  onConnect: (params: any) => void;
}