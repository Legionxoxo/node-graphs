'use client';

import { useCallback, useState } from 'react';

interface GraphControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  onSearch: (query: string) => void;
  nodeCount: number;
  linkCount: number;
}

export default function GraphControls({
  onZoomIn,
  onZoomOut,
  onFitView,
  onSearch,
  nodeCount,
  linkCount,
}: GraphControlsProps) {
  const [query, setQuery] = useState('');

  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setQuery(val);
      onSearch(val);
    },
    [onSearch],
  );

  return (
    <>
      {/* Top-left: back/home */}
      <a
        href="/"
        className="
          fixed top-3 left-3 z-20
          flex items-center gap-1.5
          rounded-lg border border-black/10
          bg-white/90 px-2.5 py-1.5
          text-[11px] text-neutral-600
          backdrop-blur-xl
          shadow-md
          transition hover:bg-white hover:text-black
          sm:top-5 sm:left-5 sm:text-xs
        "
      >
        Home
      </a>

      {/* Search */}
      <div
        className="
    fixed top-3 z-20
    flex items-center gap-2
    rounded-xl border border-black/10
    bg-white/90 px-3 py-2
    backdrop-blur-xl
    shadow-lg

    left-[92px] right-3
    sm:left-1/2 sm:right-auto
    sm:w-[260px]
    sm:-translate-x-1/2
  "
      >
        <div className="shrink-0 opacity-50">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>

        <input
          className="
            flex-1 bg-transparent
            text-xs text-[#1a1a2e]
            outline-none
            placeholder:text-neutral-400
            caret-[#7c6af7]
            sm:text-[13px]
          "
          placeholder="Search nodes…"
          value={query}
          onChange={handleSearch}
        />

        {query && (
          <button
            className="
              shrink-0 text-base leading-none
              text-neutral-400 transition
              hover:text-black
            "
            onClick={() => {
              setQuery('');
              onSearch('');
            }}
          >
            ×
          </button>
        )}
      </div>

      {/* Zoom controls */}
      <div
        className="
          fixed bottom-5 right-5 z-20
          flex flex-col gap-1
          rounded-xl border border-black/10
          bg-white/90 p-1.5
          backdrop-blur-xl
          shadow-lg
        "
      >
        <button
          className="
            flex h-8 w-8 items-center justify-center
            rounded-md text-[#5a5a7a]
            transition hover:bg-black/5 hover:text-black
          "
          onClick={onZoomIn}
        >
          +
        </button>

        <div className="mx-auto h-px w-4 bg-black/10" />

        <button
          className="
            flex h-8 w-8 items-center justify-center
            rounded-md text-[#5a5a7a]
            transition hover:bg-black/5 hover:text-black
          "
          onClick={onFitView}
        >
          ⛶
        </button>

        <div className="mx-auto h-px w-4 bg-black/10" />

        <button
          className="
            flex h-8 w-8 items-center justify-center
            rounded-md text-[#5a5a7a]
            transition hover:bg-black/5 hover:text-black
          "
          onClick={onZoomOut}
        >
          −
        </button>
      </div>

      {/* Stats */}
      <div
        className="
    fixed bottom-5 left-5 z-20
    flex items-center gap-3
    rounded-xl border border-black/10
    bg-white/90 px-3 py-2
    text-[11px] text-neutral-500
    backdrop-blur-xl
    shadow-lg
  "
      >
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
          {nodeCount} nodes
        </span>

        <span className="opacity-30">·</span>

        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.8)]" />
          {linkCount} links
        </span>
      </div>
    </>
  );
}