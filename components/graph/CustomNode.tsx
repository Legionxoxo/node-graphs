'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { useGraphStore } from '@/store/graphStore';

const CardNode = memo(({ data, selected }: NodeProps) => {
  const { toggleChain } = useGraphStore();
  const isExpanded = data.isExpandedChain === true;
  const chainId = data.chainId as string;
  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={false}
        style={{ visibility: 'hidden' }}
      />
      <div
        className={`
          group relative min-w-[120px] max-w-[160px] px-4 py-3 rounded-xl cursor-pointer transition-all duration-200
          border
          ${selected
            ? 'border-2 border-blue-500 shadow-lg shadow-blue-500/20'
            : 'border-gray-200 shadow-sm'
          }
          bg-white
          text-gray-900
          dark:bg-gradient-to-br dark:from-[#252540] dark:to-[#1a1a2e]
          dark:border-[#3a3a5c]
          dark:text-white
          dark:shadow-[0_2px_8px_rgba(0,0,0,0.3)]
          ${selected
            ? 'dark:border-[#00d9ff] dark:shadow-[0_0_24px_rgba(0,217,255,0.3)]'
            : ''
          }
        `}
      >
        <div
          className="text-sm font-semibold text-center leading-tight text-inherit relative"
        >
          {String(data.label)}
        </div>
        {isExpanded && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleChain(chainId);
            }}
            className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
            title="Collapse sequence"
          >
            -
          </button>
        )}
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