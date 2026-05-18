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
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/graph"
            className="flex h-12 items-center justify-center gap-2 rounded-full border border-zinc-700 px-6 text-zinc-300 font-medium transition-colors hover:border-zinc-500 hover:text-white"
          >
            React Flow View
          </Link>
          <Link
            href="/graph/2d"
            className="flex h-12 items-center justify-center gap-2 rounded-full bg-[#7c6af7] px-6 text-white font-medium transition-colors hover:bg-[#6a58e6]"
          >
            ✦ 2D Graph View
          </Link>
        </div>
      </main>
    </div>
  );
}