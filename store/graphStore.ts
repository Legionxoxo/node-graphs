import { create } from 'zustand';
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';
import type { GraphState, GraphNode, GraphEdge } from '@/types/graph';



export const useGraphStore = create<GraphState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  chainPagination: {},
  sidebarChainId: null,

  setNodes: (nodes: GraphNode[]) => set({ nodes }),
  setEdges: (edges: GraphEdge[]) => set({ edges }),
  selectNode: (id: string | null) => set({ selectedNodeId: id }),

  toggleChain: (chainId: string) => set((state) => ({
    chainPagination: { ...state.chainPagination, [chainId]: -1 }
  })),

  paginateChain: (chainId: string, pageIndex: number) => set((state) => ({
    chainPagination: { ...state.chainPagination, [chainId]: pageIndex }
  })),

  openChainSidebar: (chainId: string) => set({ sidebarChainId: chainId }),
  closeChainSidebar: () => set({ sidebarChainId: null }),

  onNodesChange: (changes: any[]) => {
    const currentNodes = get().nodes;
    const currentEdges = get().edges;

    const getGroup = (nodeId: string) => {
      const groupIds = new Set<string>([nodeId]);
      const queue = [nodeId];
      while (queue.length > 0) {
        const id = queue.shift()!;
        currentEdges.forEach(edge => {
          if (edge.data?.edgeType !== 'sequential') return;
          if (edge.source === id && !groupIds.has(edge.target)) {
            groupIds.add(edge.target);
            queue.push(edge.target);
          } else if (edge.target === id && !groupIds.has(edge.source)) {
            groupIds.add(edge.source);
            queue.push(edge.source);
          }
        });
      }
      return Array.from(groupIds);
    };

    const newChanges: any[] = [];
    const processedGroups = new Set<string>();

    for (const change of changes) {
      if (change.type === 'position' && (change.position || change.positionAbsolute)) {
        const group = getGroup(change.id);
        const groupKey = group.slice().sort().join(',');

        if (processedGroups.has(groupKey)) continue;
        processedGroups.add(groupKey);

        const node = currentNodes.find(n => n.id === change.id);
        if (node && (change.position || change.positionAbsolute)) {
          const dx = change.position ? change.position.x - node.position.x : 0;
          const dy = change.position ? change.position.y - node.position.y : 0;

          for (const groupId of group) {
            if (groupId === change.id) {
              newChanges.push(change);
            } else {
              const gNode = currentNodes.find(n => n.id === groupId);
              if (gNode) {
                const newChange: any = {
                  type: 'position',
                  id: groupId,
                };
                if (change.position) {
                  newChange.position = {
                    x: gNode.position.x + dx,
                    y: gNode.position.y + dy,
                  };
                }
                if (change.positionAbsolute) {
                  const gNodeAbsX = (gNode as any).positionAbsolute?.x ?? gNode.position.x;
                  const gNodeAbsY = (gNode as any).positionAbsolute?.y ?? gNode.position.y;
                  const nodeAbsX = (node as any).positionAbsolute?.x ?? node.position.x;
                  const nodeAbsY = (node as any).positionAbsolute?.y ?? node.position.y;

                  newChange.positionAbsolute = {
                    x: gNodeAbsX + (change.positionAbsolute.x - nodeAbsX),
                    y: gNodeAbsY + (change.positionAbsolute.y - nodeAbsY),
                  };
                }
                if (change.dragging !== undefined) {
                  newChange.dragging = change.dragging;
                }
                newChanges.push(newChange);
              }
            }
          }
        } else {
          newChanges.push(change);
        }
      } else if (change.type === 'position' && change.dragging !== undefined) {
        const group = getGroup(change.id);
        const groupKey = group.slice().sort().join(',');

        if (!processedGroups.has(groupKey)) {
          processedGroups.add(groupKey);
          for (const groupId of group) {
            newChanges.push({ ...change, id: groupId });
          }
        }
      } else {
        newChanges.push(change);
      }
    }

    let nextNodes = applyNodeChanges(newChanges, currentNodes);

    const isAnyNodeDragging = nextNodes.some(n => n.dragging);

    if (!isAnyNodeDragging) {
      // Find dropped groups to make them infinitely heavy
      const droppedGroups = new Set<string>();
      newChanges.forEach(change => {
        if (change.type === 'position' && change.dragging === false) {
          const g = getGroup(change.id);
          g.forEach(id => droppedGroups.add(id));
        }
      });

      // Collision Resolution
      const iterations = 50;
      const padding = 20;

      const groupCache = new Map<string, string[]>();
      const getCachedGroup = (id: string) => {
        if (!groupCache.has(id)) {
          const g = getGroup(id);
          g.forEach(gId => groupCache.set(gId, g));
        }
        return groupCache.get(id)!;
      };

      for (let iter = 0; iter < iterations; iter++) {
        let needsUpdate = false;

        // Edge length constraints moved to run before collisions so overlaps are strictly resolved at the end of the pass
        const maxEdgeLength = 400;
        currentEdges.forEach(edge => {
          if (edge.data?.edgeType === 'semantic') {
            const n1 = nextNodes.find(n => n.id === edge.source);
            const n2 = nextNodes.find(n => n.id === edge.target);
            if (n1 && n2) {
              const w1 = ((n1 as any).measured?.width || 160) / 2;
              const h1 = ((n1 as any).measured?.height || 60) / 2;
              const cx1 = n1.position.x + w1;
              const cy1 = n1.position.y + h1;

              const w2 = ((n2 as any).measured?.width || 160) / 2;
              const h2 = ((n2 as any).measured?.height || 60) / 2;
              const cx2 = n2.position.x + w2;
              const cy2 = n2.position.y + h2;

              const dx = cx2 - cx1;
              const dy = cy2 - cy1;
              const distance = Math.sqrt(dx * dx + dy * dy);

              if (distance > maxEdgeLength) {
                needsUpdate = true;

                const pullFactor = (distance - maxEdgeLength) / 2;
                const pullX = (dx / distance) * pullFactor;
                const pullY = (dy / distance) * pullFactor;

                const g1 = getCachedGroup(n1.id)[0];
                const g2 = getCachedGroup(n2.id)[0];

                if (g1 !== g2) {
                  const isG1Dropped = droppedGroups.has(g1);
                  const isG2Dropped = droppedGroups.has(g2);
                  let weight1 = 1, weight2 = 1; // using 1 and 1 instead of 0.5 because pullFactor is already / 2
                  if (isG1Dropped && !isG2Dropped) {
                    weight1 = 0; weight2 = 2;
                  } else if (!isG1Dropped && isG2Dropped) {
                    weight1 = 2; weight2 = 0;
                  }

                  const dx1 = pullX * weight1;
                  const dy1 = pullY * weight1;
                  const dx2 = -pullX * weight2;
                  const dy2 = -pullY * weight2;

                  nextNodes = nextNodes.map(node => {
                    const nodeGId = getCachedGroup(node.id)[0];
                    if (nodeGId === g1) {
                      return { ...node, position: { x: node.position.x + dx1, y: node.position.y + dy1 } };
                    }
                    if (nodeGId === g2) {
                      return { ...node, position: { x: node.position.x + dx2, y: node.position.y + dy2 } };
                    }
                    return node;
                  });
                }
              }
            }
          }
        });

        // Keep resolving collisions until no more found in this iteration
        let collisionFound = true;
        let collisionIters = 0;
        while (collisionFound && collisionIters < 10) {
          collisionFound = false;
          collisionIters++;

          const groupsMap = new Map<string, string[]>();
          nextNodes.forEach(n => {
            const g = getCachedGroup(n.id);
            const gId = g[0];
            if (!groupsMap.has(gId)) groupsMap.set(gId, g);
          });

          const groupRects = new Map<string, { left: number, right: number, top: number, bottom: number }>();
          groupsMap.forEach((nodeIds, gId) => {
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            nodeIds.forEach(id => {
              const n = nextNodes.find(x => x.id === id)!;
              const w = ((n as any).measured?.width || 160);
              const h = ((n as any).measured?.height || 60);
              minX = Math.min(minX, n.position.x - padding);
              maxX = Math.max(maxX, n.position.x + w + padding);
              minY = Math.min(minY, n.position.y - padding);
              maxY = Math.max(maxY, n.position.y + h + padding);
            });
            groupRects.set(gId, { left: minX, right: maxX, top: minY, bottom: maxY });
          });

          const groupIds = Array.from(groupsMap.keys());
          let localUpdate = false;

          for (let j = 0; j < groupIds.length; j++) {
            for (let k = j + 1; k < groupIds.length; k++) {
              const g1 = groupIds[j];
              const g2 = groupIds[k];

              const r1 = groupRects.get(g1)!;
              const r2 = groupRects.get(g2)!;

              if (r1.left < r2.right && r1.right > r2.left && r1.top < r2.bottom && r1.bottom > r2.top) {
                localUpdate = true;
                collisionFound = true;

                const pushLeft = r2.right - r1.left;
                const pushRight = r1.right - r2.left;
                const pushTop = r2.bottom - r1.top;
                const pushBottom = r1.bottom - r2.top;

                const minPush = Math.min(pushLeft, pushRight, pushTop, pushBottom);
                let pushX = 0, pushY = 0;
                if (minPush === pushLeft) pushX = pushLeft + 1;
                else if (minPush === pushRight) pushX = -pushRight - 1;
                else if (minPush === pushTop) pushY = pushTop + 1;
                else if (minPush === pushBottom) pushY = -pushBottom - 1;

                const isG1Dropped = droppedGroups.has(g1);
                const isG2Dropped = droppedGroups.has(g2);

                let w1 = 0.5, w2 = 0.5;
                if (isG1Dropped && !isG2Dropped) {
                  w1 = 0; w2 = 1;
                } else if (!isG1Dropped && isG2Dropped) {
                  w1 = 1; w2 = 0;
                }

                const dx1 = pushX * w1;
                const dy1 = pushY * w1;
                const dx2 = -pushX * w2;
                const dy2 = -pushY * w2;

                nextNodes = nextNodes.map(node => {
                  const nodeGId = getCachedGroup(node.id)[0];
                  if (nodeGId === g1) {
                    return { ...node, position: { x: node.position.x + dx1, y: node.position.y + dy1 } };
                  }
                  if (nodeGId === g2) {
                    return { ...node, position: { x: node.position.x + dx2, y: node.position.y + dy2 } };
                  }
                  return node;
                });

                r1.left += dx1; r1.right += dx1; r1.top += dy1; r1.bottom += dy1;
                r2.left += dx2; r2.right += dx2; r2.top += dy2; r2.bottom += dy2;
              }
            }
          }

          if (localUpdate) {
            needsUpdate = true;
          }
        }

        if (!needsUpdate) break;
      }
    } // End if (!isAnyNodeDragging)

    set({ nodes: nextNodes });
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
          data: { edgeType: 'semantic' },
        },
        get().edges
      ),
    });
  },
}));