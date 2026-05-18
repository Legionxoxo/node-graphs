// ─── Types ────────────────────────────────────────────────────────────────────
export interface GraphNode {
  id: string;
  label: string;
  group: string;
  val?: number; // controls node size (weight)
}

export interface GraphLink {
  source: string;
  target: string;
  strength?: number; // 1 = strong/direct, 0.5 = medium, 0.2 = weak/semantic
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

// ─── Group color palette ──────────────────────────────────────────────────────
export const GROUP_COLORS: Record<string, string> = {
  frontend:   '#7c6af7', // violet
  backend:    '#f97316', // orange
  database:   '#22d3ee', // cyan
  ai:         '#4ade80', // green
  research:   '#facc15', // yellow
  blockchain: '#ec4899', // pink
  networking: '#a78bfa', // purple
  security:   '#f87171', // red
  ideas:      '#e879a0', // rose
  default:    '#a1a1aa', // zinc
};

// ─── Sample data ──────────────────────────────────────────────────────────────
const obsidianGraphData: GraphData = {
  nodes: [
    { id: 'react',            label: 'React',             group: 'frontend',   val: 3 },
    { id: 'nextjs',           label: 'Next.js',           group: 'frontend',   val: 3 },
    { id: 'tailwind',         label: 'Tailwind CSS',      group: 'frontend',   val: 2 },
    { id: 'typescript',       label: 'TypeScript',        group: 'frontend',   val: 2 },
    { id: 'nodejs',           label: 'Node.js',           group: 'backend',    val: 3 },
    { id: 'express',          label: 'Express',           group: 'backend',    val: 2 },
    { id: 'graphql',          label: 'GraphQL',           group: 'backend',    val: 2 },
    { id: 'mongodb',          label: 'MongoDB',           group: 'database',   val: 2 },
    { id: 'firebase',         label: 'Firebase',          group: 'database',   val: 2 },
    { id: 'redis',            label: 'Redis',             group: 'database',   val: 1 },
    { id: 'ai-notes',         label: 'AI Notes',          group: 'ai',         val: 3 },
    { id: 'vector-db',        label: 'Vector DB',         group: 'ai',         val: 2 },
    { id: 'llm',              label: 'LLMs',              group: 'ai',         val: 2 },
    { id: 'embeddings',       label: 'Embeddings',        group: 'ai',         val: 1 },
    { id: 'seo-research',     label: 'SEO Research',      group: 'research',   val: 2 },
    { id: 'common-crawl',     label: 'Common Crawl',      group: 'research',   val: 1 },
    { id: 'web3',             label: 'Web3',              group: 'blockchain', val: 2 },
    { id: 'nft-marketplace',  label: 'NFT Marketplace',   group: 'blockchain', val: 2 },
    { id: 'smart-contracts',  label: 'Smart Contracts',   group: 'blockchain', val: 1 },
    { id: 'udp-hole',         label: 'UDP Hole Punching', group: 'networking', val: 1 },
    { id: 'e2ee',             label: 'End-to-End Encrypt',group: 'security',   val: 2 },
    { id: 'zero-trust',       label: 'Zero Trust',        group: 'security',   val: 1 },
    { id: 'obsidian-clone',   label: 'Obsidian Clone',    group: 'ideas',      val: 4 },
    { id: 'graph-view',       label: 'Graph View',        group: 'ideas',      val: 3 },
    { id: 'knowledge-graph',  label: 'Knowledge Graph',   group: 'ideas',      val: 2 },
  ],

  links: [
    // Frontend cluster
    { source: 'react',          target: 'nextjs',          strength: 1   },
    { source: 'react',          target: 'tailwind',        strength: 0.8 },
    { source: 'nextjs',         target: 'typescript',      strength: 0.9 },
    { source: 'react',          target: 'typescript',      strength: 0.8 },

    // Backend cluster
    { source: 'nextjs',         target: 'nodejs',          strength: 0.9 },
    { source: 'nodejs',         target: 'express',         strength: 1   },
    { source: 'nodejs',         target: 'graphql',         strength: 0.8 },

    // Database cluster
    { source: 'nodejs',         target: 'mongodb',         strength: 0.9 },
    { source: 'nodejs',         target: 'firebase',        strength: 0.7 },
    { source: 'mongodb',        target: 'redis',           strength: 0.5 },

    // AI cluster
    { source: 'ai-notes',       target: 'vector-db',       strength: 1   },
    { source: 'ai-notes',       target: 'llm',             strength: 0.9 },
    { source: 'llm',            target: 'embeddings',      strength: 1   },
    { source: 'vector-db',      target: 'embeddings',      strength: 0.8 },

    // Research cluster
    { source: 'seo-research',   target: 'common-crawl',    strength: 0.9 },
    { source: 'seo-research',   target: 'ai-notes',        strength: 0.6 },

    // Blockchain cluster
    { source: 'web3',           target: 'nft-marketplace', strength: 1   },
    { source: 'web3',           target: 'smart-contracts', strength: 1   },
    { source: 'nft-marketplace',target: 'smart-contracts', strength: 0.8 },

    // Security / Networking
    { source: 'udp-hole',       target: 'e2ee',            strength: 0.7 },
    { source: 'e2ee',           target: 'zero-trust',      strength: 0.8 },

    // Ideas cluster
    { source: 'obsidian-clone', target: 'graph-view',      strength: 1   },
    { source: 'obsidian-clone', target: 'knowledge-graph', strength: 1   },
    { source: 'graph-view',     target: 'knowledge-graph', strength: 0.9 },

    // Cross-cluster (weak/semantic links)
    { source: 'obsidian-clone', target: 'react',           strength: 0.4 },
    { source: 'obsidian-clone', target: 'vector-db',       strength: 0.4 },
    { source: 'obsidian-clone', target: 'ai-notes',        strength: 0.5 },
    { source: 'knowledge-graph',target: 'ai-notes',        strength: 0.4 },
    { source: 'knowledge-graph',target: 'vector-db',       strength: 0.4 },
    { source: 'llm',            target: 'seo-research',    strength: 0.3 },
    { source: 'graphql',        target: 'vector-db',       strength: 0.3 },
    { source: 'e2ee',           target: 'web3',            strength: 0.3 },
    { source: 'firebase',       target: 'ai-notes',        strength: 0.3 },
  ],
};

export default obsidianGraphData;
