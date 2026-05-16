import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center min-h-screen bg-[#0a0a0f]">
      <main className="flex flex-col items-center gap-8 text-center">
        <h1 className="text-4xl font-semibold text-white tracking-tight">
          Obsidian Graph
        </h1>
        <p className="text-lg text-zinc-400 max-w-md">
          Visual canvas for exploring interconnected ideas, notes, and relationships.
        </p>
        <Link
          href="/graph"
          className="flex h-12 items-center justify-center gap-2 rounded-full bg-[#00d9ff] px-6 text-[#0a0a0f] font-medium transition-colors hover:bg-[#00b8d9]"
        >
          Open Graph View
        </Link>
      </main>
    </div>
  );
}