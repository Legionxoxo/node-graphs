'use client';

import { ReactFlowProvider } from '@xyflow/react';
import dynamic from 'next/dynamic';

const GraphCanvas = dynamic(
  () => import('@/components/graph/GraphCanvas'),
  { ssr: false }
);

export default function GraphPage() {
  return (
    <ReactFlowProvider>
      <GraphCanvas />
    </ReactFlowProvider>
  );
}