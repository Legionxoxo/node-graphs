'use client';

import { useEffect } from 'react';
import { useGraphStore } from '@/store/graphStore';
import type { GraphNode, GraphEdge } from '@/types/graph';

// Sequential chain - vertically stacked, locked order
// HTML -> CSS -> JS -> React -> Next.js
const sampleNodes: GraphNode[] = [
  { id: '1', type: 'card', position: { x: 400, y: 50 }, data: { label: 'HTML' } },
  { id: '2', type: 'card', position: { x: 400, y: 150 }, data: { label: 'CSS' } },
  { id: '3', type: 'card', position: { x: 400, y: 250 }, data: { label: 'JS' } },
  { id: '4', type: 'card', position: { x: 400, y: 350 }, data: { label: 'React' } },
  { id: '5', type: 'card', position: { x: 400, y: 450 }, data: { label: 'Next.js' } },

  // Semantic relations - free placement
  { id: '6', type: 'card', position: { x: 700, y: 200 }, data: { label: 'NodeJS' } },
  { id: '7', type: 'card', position: { x: 100, y: 200 }, data: { label: 'Figma' } },
  { id: '8', type: 'card', position: { x: 700, y: 400 }, data: { label: 'PostgreSQL' } },
  { id: '9', type: 'card', position: { x: 100, y: 400 }, data: { label: 'Docker' } },

  // Data Science cluster - vertically stacked, locked order
  { id: '10', type: 'card', position: { x: 900, y: 50 }, data: { label: 'Python' } },
  { id: '11', type: 'card', position: { x: 900, y: 150 }, data: { label: 'Pandas' } },
  { id: '12', type: 'card', position: { x: 900, y: 250 }, data: { label: 'Scikit-learn' } },
  { id: '13', type: 'card', position: { x: 900, y: 350 }, data: { label: 'PyTorch' } },
  { id: '14', type: 'card', position: { x: 900, y: 450 }, data: { label: 'TensorFlow' } },
];

const sampleEdges: GraphEdge[] = [
  // Sequential chain - solid lines, vertical stack, locked order
  { id: 'e1-2', source: '1', target: '2', type: 'custom', data: { edgeType: 'sequential' } },
  { id: 'e2-3', source: '2', target: '3', type: 'custom', data: { edgeType: 'sequential' } },
  { id: 'e3-4', source: '3', target: '4', type: 'custom', data: { edgeType: 'sequential' } },
  { id: 'e4-5', source: '4', target: '5', type: 'custom', data: { edgeType: 'sequential' } },

  // Semantic relations - dotted lines, free placement
  { id: 'e3-6', source: '3', target: '6', type: 'custom', data: { edgeType: 'semantic' } }, // JS -> NodeJS
  { id: 'e4-7', source: '4', target: '7', type: 'custom', data: { edgeType: 'semantic' } }, // React -> Figma
  { id: 'e5-8', source: '5', target: '8', type: 'custom', data: { edgeType: 'semantic' } }, // Next.js -> PostgreSQL
  { id: 'e3-9', source: '3', target: '9', type: 'custom', data: { edgeType: 'semantic' } }, // JS -> Docker

  // Data Science cluster - solid lines, vertical stack, locked order
  { id: 'e10-11', source: '10', target: '11', type: 'custom', data: { edgeType: 'sequential' } },
  { id: 'e11-12', source: '11', target: '12', type: 'custom', data: { edgeType: 'sequential' } },
  { id: 'e12-13', source: '12', target: '13', type: 'custom', data: { edgeType: 'sequential' } },
  { id: 'e12-14', source: '12', target: '14', type: 'custom', data: { edgeType: 'semantic' } }, // Scikit-learn branches to TensorFlow
];

// Generate 50 nodes chain
for (let i = 1; i <= 50; i++) {
  sampleNodes.push({
    id: `c_${i}`,
    type: 'card',
    position: { x: 1300, y: 50 + (i - 1) * 100 },
    data: { label: `Chain Node ${i}` }
  });
  if (i > 1) {
    sampleEdges.push({
      id: `ec_${i - 1}_${i}`,
      source: `c_${i - 1}`,
      target: `c_${i}`,
      type: 'custom',
      data: { edgeType: 'sequential' }
    });
  }
}

export function useSampleData() {
  const { setNodes, setEdges } = useGraphStore();

  useEffect(() => {
    // Set edges first so groups are built correctly when setNodes is called
    setEdges(sampleEdges);
    setNodes(sampleNodes);
  }, [setNodes, setEdges]);
}