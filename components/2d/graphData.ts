// ─── Types ────────────────────────────────────────────────────────────────────
export interface GraphNode {
    id: string;
    label: string;
    group: string;
    val?: number; // controls node size (weight) 0.5 default
}

export interface GraphLink {
    source: string;
    target: string;
    strength?: number; // 1= strong/direct, t0.1 - 0.3 = weak/semantic
}

export interface GraphData {
    nodes: GraphNode[];
    links: GraphLink[];
}

// ─── Group color palette  ──────────────────────────────────────────────────────
export const GROUP_COLORS: Record<string, string> = {
    frontend: "",
    backend: "#5C5C5C",
    database: "#5C5C5C",
    ai: "#5C5C5C",
    research: "#5C5C5C",
    blockchain: "#5C5C5C",
    networking: "#5C5C5C",
    security: "#5C5C5C",
    ideas: "#5C5C5C",
    default: "#5C5C5C",
};

// ─── Sample data ──────────────────────────────────────────────────────────────
const obsidianGraphData: GraphData = {
    nodes: [
        { id: "shiv", label: "Re: Quick sync needed - your availability this week", group: "ideas", val: 0.5 },
        { id: "Ritu", label: "Project update - milestone achieved ahead of schedule", group: "ideas", val: 0.5 },
        { id: "Bishal", label: "Follow-up: Design review feedback and next steps", group: "ideas", val: 0.5 },
        { id: "nodejs", label: "Node.js Performance Best Practices for Production", group: "backend", val: 0.5 },
        { id: "express", label: "Setting up Express.js Middleware for Auth & Logging", group: "backend", val: 0.5 },
        { id: "graphql", label: "GraphQL Schema Design Patterns and Federation", group: "backend", val: 0.5 },
        { id: "mongodb", label: "MongoDB Atlas Search Index Configuration Guide", group: "database", val: 0.5 },
        { id: "firebase", label: "Firebase Authentication Flow with Google OAuth", group: "database", val: 0.5 },
        {
            id: "redis",
            label: "Following Up on Our Last Conversation - Action Items",
            group: "database",
            val: 0.5,
        },
        {
            id: "ai-notes",
            label: "Quick Update Before Tomorrow's Team Sync Meeting",
            group: "ai",
            val: 0.5,
        },
        {
            id: "vector-db",
            label: "Your Access Has Been Approved to the Vector Workspace",
            group: "ai",
            val: 0.5,
        },
        {
            id: "llm",
            label: "Final Reminder: Submission Deadline Tonight at 11:59 PM",
            group: "ai",
            val: 0.5,
        },
        { id: "embeddings", label: "Understanding Text Embeddings and Vector Similarity", group: "ai", val: 0.5 },
        {
            id: "seo-research",
            label: "SEO Research: Keyword Ranking Analysis and Competitor Overview",
            group: "research",
            val: 0.5,
        },
        {
            id: "common-crawl",
            label: "Can You Review This When You Have Time? - Async Handoff",
            group: "research",
            val: 0.5,
        },
        { id: "web3", label: "Web3 Architecture Overview and Decentralized Identity", group: "blockchain", val: 0.5 },
        {
            id: "nft-marketplace",
            label: "NFT Marketplace Smart Contract Security Audit Report",
            group: "blockchain",
            val: 0.5,
        },
        {
            id: "smart-contracts",
            label: "Smart Contracts Implementation: ERC-721 Token Standard",
            group: "blockchain",
            val: 0.5,
        },
        {
            id: "udp-hole",
            label: "UDP Hole Punching for NAT Traversal in P2P Networks",
            group: "networking",
            val: 0.5,
        },
        {
            id: "e2ee",
            label: "End-to-End Encryption: Signal Protocol Deep Dive",
            group: "security",
            val: 0.5,
        },
        { id: "zero-trust", label: "Zero Trust Security Model Implementation Guide", group: "security", val: 0.5 },
        {
            id: "obsidian-clone",
            label: "Obsidian Clone: Building a Knowledge Graph Note-Taking App",
            group: "ideas",
            val: 0.5,
        },
        { id: "graph-view", label: "Graph View: Interactive Visualization for Connected Notes", group: "ideas", val: 0.5 },
        {
            id: "knowledge-graph",
            label: "Knowledge Graph: Linking Concepts Across Your Second Brain",
            group: "ideas",
            val: 0.5,
        },
    ],

    links: [
        // Backend cluster
        { source: "nodejs", target: "express", strength: 1 },
        { source: "nodejs", target: "graphql", strength: 1 },

        // Database cluster
        { source: "nodejs", target: "mongodb", strength: 1 },
        { source: "nodejs", target: "firebase", strength: 1 },
        { source: "mongodb", target: "redis", strength: 1 },

        // AI cluster
        { source: "ai-notes", target: "vector-db", strength: 1 },
        { source: "ai-notes", target: "llm", strength: 1 },
        { source: "llm", target: "embeddings", strength: 1 },
        { source: "vector-db", target: "embeddings", strength: 1 },

        // Research cluster
        { source: "seo-research", target: "common-crawl", strength: 1 },
        { source: "seo-research", target: "ai-notes", strength: 1 },

        // Blockchain cluster
        { source: "web3", target: "nft-marketplace", strength: 1 },
        { source: "web3", target: "smart-contracts", strength: 1 },
        { source: "nft-marketplace", target: "smart-contracts", strength: 1 },

        // Security / Networking
        { source: "udp-hole", target: "e2ee", strength: 1 },
        { source: "e2ee", target: "zero-trust", strength: 1 },

        // Ideas cluster
        { source: "obsidian-clone", target: "graph-view", strength: 1 },
        { source: "obsidian-clone", target: "knowledge-graph", strength: 1 },
        { source: "graph-view", target: "knowledge-graph", strength: 1 },

        // Cross-cluster (weak/semantic links)
        { source: "obsidian-clone", target: "web3", strength: 0.6 },
        { source: "obsidian-clone", target: "vector-db", strength: 0.6 },
        { source: "llm", target: "seo-research", strength: 0.6 },
        { source: "graphql", target: "vector-db", strength: 0.6 },
        { source: "e2ee", target: "web3", strength: 0.6 },
        { source: "firebase", target: "ai-notes", strength: 0.6 },
    ],
};

export default obsidianGraphData;