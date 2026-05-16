'use client';

import { memo } from 'react';
import { EdgeProps, getBezierPath } from '@xyflow/react';

const CustomEdge = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
}: EdgeProps) => {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <defs>
        <linearGradient id={`gradient-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#4a5568" />
          <stop offset="100%" stopColor="#00d9ff" />
        </linearGradient>
      </defs>
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke={`url(#gradient-${id})`}
        strokeWidth={2}
        style={style}
        className="animated-edge"
      />
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        markerEnd={markerEnd}
        style={{ cursor: 'pointer' }}
      />
    </>
  );
});

CustomEdge.displayName = 'CustomEdge';

export default CustomEdge;