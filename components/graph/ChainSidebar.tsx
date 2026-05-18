'use client';

import { useGraphStore } from '@/store/graphStore';

export default function ChainSidebar() {
  const { nodes, edges, sidebarChainId, closeChainSidebar, paginateChain } = useGraphStore();

  if (!sidebarChainId) return null;

  // Build chain from sidebarChainId
  const outEdges: Record<string, string> = {};
  edges.forEach(e => {
    if (e.data?.edgeType === 'sequential') {
      outEdges[e.source] = e.target;
    }
  });

  const chain: string[] = [sidebarChainId];
  let curr = outEdges[sidebarChainId];
  while (curr) {
    chain.push(curr);
    curr = outEdges[curr];
  }

  const chainNodes = chain.map(id => nodes.find(n => n.id === id)).filter(Boolean);

  return (
    <div
      className="fixed right-0 top-0 h-full w-80 bg-white dark:bg-[#1a1a2e] border-l border-gray-200 dark:border-[#4a4a6c] shadow-xl z-50 flex flex-col"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-[#4a4a6c]">
        <h2 className="font-semibold text-gray-800 dark:text-white">Chain Nodes</h2>
        <button
          onClick={(e) => {
            e.stopPropagation();
            closeChainSidebar();
          }}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-[#2a2a4a] text-gray-500 dark:text-gray-400 text-lg leading-none"
        >
          ×
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="relative flex flex-col items-center">
          {/* Vertical line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-300 dark:bg-[#4a4a6c] -translate-x-1/2" />

          <ul className="relative space-y-3 flex flex-col items-center">
            {chainNodes.map((node, idx) => {
              if (!node) return null;
              const isFirst = idx === 0;

              return (
                <li key={node.id} className="relative flex items-center justify-center w-full">
                  {/* Node */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      const pageIndex = Math.floor((idx - 1) / 5);
                      if (idx === 0) {
                        paginateChain(sidebarChainId, 0);
                      } else {
                        paginateChain(sidebarChainId, pageIndex);
                      }
                      closeChainSidebar();
                    }}
                    className={`relative z-10 flex items-center justify-center min-w-[120px] px-4 py-2.5 rounded-xl cursor-pointer transition-all duration-200 shadow-md
                    ${isFirst
                      ? 'bg-blue-500 text-white border-2 border-blue-500'
                      : 'bg-white dark:bg-gradient-to-br dark:from-[#252540] dark:to-[#1a1a2e] text-gray-900 dark:text-white border border-gray-200 dark:border-[#3a3a5c] hover:border-blue-400 dark:hover:border-[#00d9ff]'
                    }`}
                  >
                    <span className="text-sm font-semibold text-center">{node.data.label}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}