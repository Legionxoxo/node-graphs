'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';

const CardNode = memo(({ data, selected }: NodeProps) => {
  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={false}
        style={{ visibility: 'hidden' }}
      />
      <div
        style={{
          minWidth: '120px',
          maxWidth: '160px',
          padding: '12px 16px',
          borderRadius: '12px',
          background: selected
            ? 'linear-gradient(135deg, #1a2a4a 0%, #1a1a3e 100%)'
            : 'linear-gradient(135deg, #252540 0%, #1a1a2e 100%)',
          border: selected ? '2px solid #00d9ff' : '1px solid #3a3a5c',
          boxShadow: selected
            ? '0 0 24px rgba(0, 217, 255, 0.3), 0 4px 12px rgba(0,0,0,0.4)'
            : '0 2px 8px rgba(0,0,0,0.3)',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        <div
          style={{
            color: '#fff',
            fontSize: '14px',
            fontWeight: 600,
            textAlign: 'center',
            lineHeight: 1.3,
          }}
        >
          {String(data.label)}
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={false}
        style={{ visibility: 'hidden' }}
      />
    </>
  );
});

CardNode.displayName = 'CardNode';

export default CardNode;