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
    frontend: "#5C5C5C",
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
        {
            id: "shiv",
            label: "Re: Quick sync needed - your availability this week",
            group: "ideas",
            val: 0.5,
        },
        {
            id: "Ritu",
            label: "Project update - milestone achieved ahead of schedule",
            group: "ideas",
            val: 0.5,
        },
        {
            id: "Bishal",
            label: "Follow-up: Design review feedback and next steps",
            group: "ideas",
            val: 0.5,
        },
        {
            id: "nodejs",
            label: "Node.js Performance Best Practices for Production",
            group: "backend",
            val: 0.5,
        },
        {
            id: "express",
            label: "Setting up Express.js Middleware for Auth & Logging",
            group: "backend",
            val: 0.5,
        },
        {
            id: "graphql",
            label: "GraphQL Schema Design Patterns and Federation",
            group: "backend",
            val: 0.5,
        },
        {
            id: "mongodb",
            label: "MongoDB Atlas Search Index Configuration ",
            group: "database",
            val: 0.5,
        },
        {
            id: "firebase",
            label: "Firebase Authentication Flow with Google OAuth",
            group: "database",
            val: 0.5,
        },
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
        {
            id: "embeddings",
            label: "Understanding Text Embeddings and Vector Similarity",
            group: "ai",
            val: 0.5,
        },
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
        {
            id: "web3",
            label: "Web3 Architecture Overview and Decentralized Identity",
            group: "blockchain",
            val: 0.5,
        },
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
        {
            id: "zero-trust",
            label: "Zero Trust Security Model Implementation Guide",
            group: "security",
            val: 0.5,
        },
        {
            id: "obsidian-clone",
            label: "Obsidian Clone: Building a Knowledge Graph Note-Taking App",
            group: "ideas",
            val: 0.5,
        },
        {
            id: "graph-view",
            label: "Graph View: Interactive Visualization for Connected Notes",
            group: "ideas",
            val: 0.5,
        },
        {
            id: "knowledge-graph",
            label: "Knowledge Graph: Linking Concepts Across Your Second Brain",
            group: "ideas",
            val: 0.5,
        },
        {
            id: "nextjs",
            label: "Next.js App Router and Server Actions Explained",
            group: "frontend",
            val: 0.5,
        },
        {
            id: "tailwind",
            label: "Tailwind CSS Layout Tricks for Responsive Dashboards",
            group: "frontend",
            val: 0.5,
        },
        {
            id: "react-query",
            label: "React Query Caching and Data Synchronization Patterns",
            group: "frontend",
            val: 0.5,
        },
        {
            id: "zustand",
            label: "Global State Management with Zustand in React Apps",
            group: "frontend",
            val: 0.5,
        },
        {
            id: "figma-design",
            label: "Figma Design System Components and UI Tokens",
            group: "design",
            val: 0.5,
        },
        {
            id: "motion-ui",
            label: "Framer Motion Page Transition Experiments",
            group: "design",
            val: 0.5,
        },
        {
            id: "docker",
            label: "Docker Container Optimization for Node.js Applications",
            group: "devops",
            val: 0.5,
        },
        {
            id: "kubernetes",
            label: "Kubernetes Deployment Scaling and Resource Limits",
            group: "devops",
            val: 0.5,
        },
        {
            id: "nginx",
            label: "Nginx Reverse Proxy Setup with SSL Termination",
            group: "devops",
            val: 0.5,
        },
        {
            id: "ci-cd",
            label: "CI/CD Pipeline Setup Using GitHub Actions",
            group: "devops",
            val: 0.5,
        },
        {
            id: "typescript",
            label: "Advanced TypeScript Utility Types and Inference",
            group: "frontend",
            val: 0.5,
        },
        {
            id: "pnpm",
            label: "Monorepo Architecture Using pnpm Workspaces",
            group: "backend",
            val: 0.5,
        },
        {
            id: "vite",
            label: "Migrating Legacy React Apps to Vite",
            group: "frontend",
            val: 0.5,
        },
        {
            id: "electron",
            label: "Building Cross Platform Desktop Apps with Electron",
            group: "desktop",
            val: 0.5,
        },
        {
            id: "tauri",
            label: "Tauri vs Electron Performance Benchmarks",
            group: "desktop",
            val: 0.5,
        },
        {
            id: "python-ai",
            label: "Python AI Pipelines for NLP Workflows",
            group: "ai",
            val: 0.5,
        },
        {
            id: "rag-system",
            label: "RAG Architecture with Hybrid Search Retrieval",
            group: "ai",
            val: 0.5,
        },
        {
            id: "agent-memory",
            label: "Long-Term Memory Systems for AI Agents",
            group: "ai",
            val: 0.5,
        },
        {
            id: "vision-models",
            label: "Vision Language Models and OCR Pipelines",
            group: "ai",
            val: 0.5,
        },
        {
            id: "whisper",
            label: "Speech Recognition with Whisper Large v3",
            group: "ai",
            val: 0.5,
        },
        {
            id: "langchain",
            label: "LangChain Multi-Agent Orchestration Strategies",
            group: "ai",
            val: 0.5,
        },
        {
            id: "ollama",
            label: "Running Local LLMs Efficiently with Ollama",
            group: "ai",
            val: 0.5,
        },
        {
            id: "milvus",
            label: "Milvus Vector Database Indexing Optimization",
            group: "database",
            val: 0.5,
        },
        {
            id: "postgres",
            label: "PostgreSQL Query Planning and Performance Tuning",
            group: "database",
            val: 0.5,
        },
        {
            id: "supabase",
            label: "Supabase Authentication and Realtime Features",
            group: "database",
            val: 0.5,
        },
        {
            id: "prisma",
            label: "Prisma ORM Schema Relationships and Migrations",
            group: "database",
            val: 0.5,
        },
        {
            id: "mysql",
            label: "MySQL Replication and Backup Recovery Process",
            group: "database",
            val: 0.5,
        },
        {
            id: "rabbitmq",
            label: "RabbitMQ Message Queue Retry Architecture",
            group: "backend",
            val: 0.5,
        },
        {
            id: "kafka",
            label: "Kafka Event Streaming for Scalable Systems",
            group: "backend",
            val: 0.5,
        },
        {
            id: "grpc",
            label: "gRPC Microservices Communication Benchmark Results",
            group: "backend",
            val: 0.5,
        },
        {
            id: "rest-api",
            label: "REST API Versioning and Backward Compatibility",
            group: "backend",
            val: 0.5,
        },
        {
            id: "jwt-auth",
            label: "JWT Authentication Security Best Practices",
            group: "security",
            val: 0.5,
        },
        {
            id: "oauth-flow",
            label: "OAuth 2.0 Authorization Code Flow Deep Dive",
            group: "security",
            val: 0.5,
        },
        {
            id: "xss-guide",
            label: "Preventing XSS Attacks in Modern Web Applications",
            group: "security",
            val: 0.5,
        },
        {
            id: "csrf-guide",
            label: "CSRF Tokens and Secure Cookie Configuration",
            group: "security",
            val: 0.5,
        },
        {
            id: "rate-limit",
            label: "API Rate Limiting with Redis Sliding Window",
            group: "security",
            val: 0.5,
        },
        {
            id: "wireguard",
            label: "WireGuard VPN Mesh Network Setup",
            group: "networking",
            val: 0.5,
        },
        {
            id: "webrtc",
            label: "WebRTC Peer-to-Peer Media Streaming Architecture",
            group: "networking",
            val: 0.5,
        },
        {
            id: "dns",
            label: "DNS Propagation and CDN Caching Explained",
            group: "networking",
            val: 0.5,
        },
        {
            id: "cloudflare",
            label: "Cloudflare Workers Edge Computing Overview",
            group: "networking",
            val: 0.5,
        },
        {
            id: "seo-ai",
            label: "AI-Powered SEO Optimization Using Large Datasets",
            group: "research",
            val: 0.5,
        },
        {
            id: "crawl-pipeline",
            label: "Massive Web Crawling Pipeline Using Common Crawl",
            group: "research",
            val: 0.5,
        },
        {
            id: "search-ranking",
            label: "Search Ranking Signals and SERP Analysis",
            group: "research",
            val: 0.5,
        },
        {
            id: "data-mining",
            label: "Large Scale Data Mining and Pattern Extraction",
            group: "research",
            val: 0.5,
        },
        {
            id: "solidity",
            label: "Solidity Gas Optimization and Storage Packing",
            group: "blockchain",
            val: 0.5,
        },
        {
            id: "defi",
            label: "DeFi Liquidity Pool and Yield Farming Mechanics",
            group: "blockchain",
            val: 0.5,
        },
        {
            id: "wallet-connect",
            label: "WalletConnect Integration for DApps",
            group: "blockchain",
            val: 0.5,
        },
        {
            id: "ipfs",
            label: "IPFS Distributed Storage and Pinning Services",
            group: "blockchain",
            val: 0.5,
        },
        {
            id: "zkproofs",
            label: "Zero Knowledge Proofs for Privacy Preserving Apps",
            group: "blockchain",
            val: 0.5,
        },
        {
            id: "ai-video",
            label: "AI Video Generation Pipeline and Rendering Queue",
            group: "ideas",
            val: 0.5,
        },
        {
            id: "second-brain",
            label: "Second Brain Architecture for Personal Knowledge",
            group: "ideas",
            val: 0.5,
        },
        {
            id: "mind-map",
            label: "Interactive Mind Map UI with Dynamic Connections",
            group: "ideas",
            val: 0.5,
        },
        {
            id: "notes-sync",
            label: "Offline First Notes Synchronization Strategy",
            group: "ideas",
            val: 0.5,
        },
        {
            id: "markdown-engine",
            label: "Markdown Parsing and Live Preview Rendering",
            group: "ideas",
            val: 0.5,
        },
        {
            id: "pdf-parser",
            label: "Extracting Structured Data from PDF Documents",
            group: "ideas",
            val: 0.5,
        },
        {
            id: "search-engine",
            label: "Building a Personal Semantic Search Engine",
            group: "ideas",
            val: 0.5,
        },
        {
            id: "calendar-ai",
            label: "AI Calendar Assistant for Smart Scheduling",
            group: "ideas",
            val: 0.5,
        },
        {
            id: "startup-ideas",
            label: "100 Startup Ideas Around AI Productivity Tools",
            group: "ideas",
            val: 0.5,
        },
        {
            id: "automation",
            label: "Workflow Automation Using AI and Event Triggers",
            group: "ideas",
            val: 0.5,
        },
        {
            id: "youtube-ai",
            label: "Generating YouTube Shorts Automatically with AI",
            group: "ideas",
            val: 0.5,
        },
        {
            id: "browser-ai",
            label: "Browser Automation Agents Using Playwright",
            group: "ideas",
            val: 0.5,
        },
        {
            id: "notion-clone",
            label: "Notion Clone with Block-Based Editor Architecture",
            group: "ideas",
            val: 0.5,
        },
        {
            id: "slack-ai",
            label: "AI Slack Assistant for Team Knowledge Search",
            group: "ideas",
            val: 0.5,
        },
        {
            id: "voice-agent",
            label: "Voice Controlled AI Assistant with Real-Time Transcription",
            group: "ideas",
            val: 0.5,
        },
        {
            id: "meeting-ai",
            label: "Meeting Summarization AI Using Whisper and GPT",
            group: "ideas",
            val: 0.5,
        },
        {
            id: "chrome-extension",
            label: "Chrome Extension for Context Aware AI Suggestions",
            group: "frontend",
            val: 0.5,
        },
        {
            id: "s3-storage",
            label: "Object Storage Architecture Using Amazon S3",
            group: "cloud",
            val: 0.5,
        },
        {
            id: "vercel",
            label: "Deploying Full Stack Apps on Vercel Edge Runtime",
            group: "cloud",
            val: 0.5,
        },
        {
            id: "aws-lambda",
            label: "Serverless Function Scaling with AWS Lambda",
            group: "cloud",
            val: 0.5,
        },
        {
            id: "gcp-ai",
            label: "Using Google Vertex AI for Custom ML Workflows",
            group: "cloud",
            val: 0.5,
        },
        {
            id: "azure-openai",
            label: "Azure OpenAI Enterprise Integration Patterns",
            group: "cloud",
            val: 0.5,
        },
        {
            id: "linux",
            label: "Linux Process Management and System Monitoring",
            group: "systems",
            val: 0.5,
        },
        {
            id: "bash",
            label: "Advanced Bash Scripting for Automation Tasks",
            group: "systems",
            val: 0.5,
        },
        {
            id: "ffmpeg",
            label: "FFmpeg Video Compression and Streaming Guide",
            group: "media",
            val: 0.5,
        },
        {
            id: "obs-studio",
            label: "OBS Studio Setup for High Quality Streaming",
            group: "media",
            val: 0.5,
        },
        {
            id: "blender",
            label: "Blender 3D Workflow for Motion Graphics",
            group: "media",
            val: 0.5,
        },
        {
            id: "photoshop",
            label: "Photoshop Compositing and AI Generative Fill",
            group: "media",
            val: 0.5,
        },
        {
            id: "premiere",
            label: "Premiere Pro Editing Workflow Optimization",
            group: "media",
            val: 0.5,
        },
        {
            id: "after-effects",
            label: "After Effects Motion Tracking and Visual FX",
            group: "media",
            val: 0.5,
        },
        {
            id: "startup-funding",
            label: "Startup Funding Strategies for Technical Founders",
            group: "business",
            val: 0.5,
        },
        {
            id: "saas-growth",
            label: "SaaS Growth Loops and Product-Led Acquisition",
            group: "business",
            val: 0.5,
        },
        {
            id: "cold-email",
            label: "Cold Email Templates for Developer Outreach",
            group: "business",
            val: 0.5,
        },
        {
            id: "linkedin-growth",
            label: "Growing a Technical Audience on LinkedIn",
            group: "business",
            val: 0.5,
        },
        {
            id: "freelance",
            label: "Freelancing Strategies for Full Stack Developers",
            group: "business",
            val: 0.5,
        },
        {
            id: "interview-prep",
            label: "Software Engineering Interview Preparation Notes",
            group: "career",
            val: 0.5,
        },
        {
            id: "resume-review",
            label: "Resume Improvements for AI and Full Stack Roles",
            group: "career",
            val: 0.5,
        },
        {
            id: "system-design",
            label: "System Design Interview Case Studies",
            group: "career",
            val: 0.5,
        },
        {
            id: "leetcode",
            label: "LeetCode Dynamic Programming Problem Patterns",
            group: "career",
            val: 0.5,
        },
        {
            id: "open-source",
            label: "Open Source Contribution Workflow on GitHub",
            group: "career",
            val: 0.5,
        },
        {
            id: "daily-notes",
            label: "Daily Notes and Reflection Workflow",
            group: "personal",
            val: 0.5,
        },
        {
            id: "habit-tracker",
            label: "Building a Minimal Habit Tracking System",
            group: "personal",
            val: 0.5,
        },
        {
            id: "reading-list",
            label: "Books and Articles Worth Revisiting Later",
            group: "personal",
            val: 0.5,
        },
        {
            id: "idea-dump",
            label: "Late Night Startup Idea Brainstorm Dump",
            group: "personal",
            val: 0.5,
        },
        {
            id: "focus-mode",
            label: "Deep Work Sessions and Focus Optimization",
            group: "personal",
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
        { source: "firebase", target: "ai-notes", strength: 0.6 },
    ],
};

export default obsidianGraphData;
