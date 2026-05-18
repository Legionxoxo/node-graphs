'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { useGraphStore } from '@/store/graphStore';

const EllipsisNode = memo(({ id, data, selected }: NodeProps) => {
  const { paginateChain, chainPagination, openChainSidebar } = useGraphStore();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.chainId) {
      const chainId = data.chainId as string;
      const currentPage = chainPagination[chainId] ?? -1;
      const nextPage = data.nextPage !== undefined ? (data.nextPage as number) : (currentPage === -1 ? 0 : currentPage + 1);
      paginateChain(chainId, nextPage);
      openChainSidebar(chainId);
    }
  };

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={false}
        style={{ visibility: 'hidden' }}
      />
      <div
        onClick={handleClick}
        className={`
          flex items-center justify-center w-12 h-12 rounded-full cursor-pointer transition-all duration-200
          border
          ${selected
            ? 'border-2 border-blue-500 shadow-lg shadow-blue-500/20'
            : 'border-gray-300 shadow-sm hover:bg-gray-50'
          }
          bg-white
          text-gray-600
          dark:bg-gradient-to-br dark:from-[#252540] dark:to-[#1a1a2e]
          dark:border-[#4a4a6c]
          dark:text-gray-300
          dark:hover:border-[#00d9ff]
          dark:shadow-[0_2px_8px_rgba(0,0,0,0.3)]
        `}
        title="Click to expand more nodes"
      >
        <span className="text-xl font-bold tracking-widest leading-none" style={{ marginTop: '-8px' }}>...</span>
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

EllipsisNode.displayName = 'EllipsisNode';

export default EllipsisNode;