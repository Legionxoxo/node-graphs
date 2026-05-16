'use client';

import { useEffect } from 'react';
import { useGraphStore } from '@/store/graphStore';
import type { GraphNode, GraphEdge } from '@/types/graph';

// Tech Stack cluster (left side)
const sampleNodes: GraphNode[] = [
  // Tech Stack
  { id: '1', type: 'card', position: { x: 100, y: 100 }, data: { label: 'React' } },
  { id: '2', type: 'card', position: { x: 250, y: 100 }, data: { label: 'TypeScript' } },
  { id: '3', type: 'card', position: { x: 400, y: 100 }, data: { label: 'Next.js' } },
  { id: '4', type: 'card', position: { x: 100, y: 250 }, data: { label: 'Tailwind' } },
  { id: '5', type: 'card', position: { x: 250, y: 250 }, data: { label: 'Zustand' } },
  { id: '6', type: 'card', position: { x: 400, y: 250 }, data: { label: 'React Query' } },

  // Content Creation cluster (right side)
  { id: '7', type: 'card', position: { x: 700, y: 100 }, data: { label: 'Notion' } },
  { id: '8', type: 'card', position: { x: 850, y: 100 }, data: { label: 'WordPress' } },
  { id: '9', type: 'card', position: { x: 775, y: 220 }, data: { label: 'Figma' } },

  // Devops cluster (right bottom)
  { id: '10', type: 'card', position: { x: 700, y: 400 }, data: { label: 'Docker' } },
  { id: '11', type: 'card', position: { x: 850, y: 400 }, data: { label: 'Kubernetes' } },
  { id: '12', type: 'card', position: { x: 700, y: 530 }, data: { label: 'AWS' } },
  { id: '13', type: 'card', position: { x: 850, y: 530 }, data: { label: 'GitHub' } },

  // Orphan nodes (no connections)
  { id: '14', type: 'card', position: { x: 500, y: 450 }, data: { label: 'PostgreSQL' } },
  { id: '15', type: 'card', position: { x: 300, y: 450 }, data: { label: 'Redis' } },
];

// Tech Stack edges - React <-> TypeScript <-> Next.js, etc
const sampleEdges: GraphEdge[] = [
  // Tech Stack internal
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e2-3', source: '2', target: '3' },
  { id: 'e1-5', source: '1', target: '5' },
  { id: 'e1-6', source: '1', target: '6' },
  { id: 'e3-4', source: '3', target: '4' },
  { id: 'e5-6', source: '5', target: '6' },

  // Content Creation internal
  { id: 'e7-8', source: '7', target: '8' },
  { id: 'e7-9', source: '7', target: '9' },

  // Devops internal
  { id: 'e10-11', source: '10', target: '11' },
  { id: 'e10-12', source: '10', target: '12' },
  { id: 'e12-13', source: '12', target: '13' },

  // No edges to orphans (14, 15) - intentionally disconnected
];

export function useSampleData() {
  const { setNodes, setEdges } = useGraphStore();

  useEffect(() => {
    setNodes(sampleNodes);
    setEdges(sampleEdges);
  }, [setNodes, setEdges]);
}