'use client';

import { memo } from 'react';
import { EdgeProps, getStraightPath } from '@xyflow/react';
import type { GraphEdge } from '@/types/graph';

const CustomEdge = memo((props: EdgeProps<GraphEdge>) => {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    markerEnd,
    data,
  } = props;

  const [edgePath] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  const edgeType = (data as { edgeType?: string } | null)?.edgeType ?? 'semantic';
  const isSequential = edgeType === 'sequential';

  return (
    <path
      id={id}
      d={edgePath}
      fill="none"
      stroke={isSequential ? '#3b82f6' : '#9ca3af'}
      strokeWidth={2}
      strokeDasharray={isSequential ? undefined : '5 5'}
      markerEnd={markerEnd}
      className="dark:stroke-[#4a5568] dark:data-[sequential]:stroke-[#00d9ff]"
    />
  );
});

CustomEdge.displayName = 'CustomEdge';

export default CustomEdge;