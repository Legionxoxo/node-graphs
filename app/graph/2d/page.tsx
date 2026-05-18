import type { Metadata } from 'next';
import Link from 'next/link';
import Graph2DCanvas from '@/components/2d/Graph2DCanvas';
import '@/components/2d/graph2d.css';

export const metadata: Metadata = {
  title: 'Obsidian Graph — 2D View',
  description: 'Interactive 2D force-directed graph with Obsidian-style physics and node highlighting.',
};

export default function Graph2DPage() {
  return (
    <>
      <Link href="/" className="graph2d-back">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
        Home
      </Link>
      <Graph2DCanvas />
    </>
  );
}
