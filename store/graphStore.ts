import { create } from 'zustand';
import { addEdge, applyNodeChanges, applyEdgeChanges } from '@xyflow/react';
import type { GraphState, GraphNode, GraphEdge } from '@/types/graph';

export const useGraphStore = create<GraphState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,

  setNodes: (nodes: GraphNode[]) => set({ nodes }),

  setEdges: (edges: GraphEdge[]) => set({ edges }),

  selectNode: (id: string | null) => set({ selectedNodeId: id }),

  onNodesChange: (changes: any[]) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },

  onEdgesChange: (changes: any[]) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },

  onConnect: (params: any) => {
    set({
      edges: addEdge(
        {
          ...params,
          animated: true,
          style: { stroke: '#4a5568', strokeWidth: 1.5 },
        },
        get().edges
      ),
    });
  },
}));