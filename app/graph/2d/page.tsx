import type { Metadata } from 'next';
import Graph2DCanvas from '@/components/2d/Graph2DCanvas';

export const metadata: Metadata = {
  title: 'Obsidian Graph — 2D View',
  description: 'Interactive 2D force-directed graph with Obsidian-style physics and node highlighting.',
};

export default function Graph2DPage() {
  return (
    <>
      <Graph2DCanvas />
    </>
  );
}
