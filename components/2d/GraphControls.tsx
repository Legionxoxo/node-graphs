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
      {/* Top-left: search */}
      <div className="graph2d-panel graph2d-search-panel">
        <div className="graph2d-search-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <input
          className="graph2d-search-input"
          placeholder="Search nodes…"
          value={query}
          onChange={handleSearch}
        />
        {query && (
          <button
            className="graph2d-search-clear"
            onClick={() => { setQuery(''); onSearch(''); }}
          >
            ×
          </button>
        )}
      </div>

      {/* Bottom-right: zoom controls */}
      <div className="graph2d-panel graph2d-zoom-panel">
        <button className="graph2d-icon-btn" onClick={onZoomIn} title="Zoom in">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" />
          </svg>
        </button>
        <div className="graph2d-divider" />
        <button className="graph2d-icon-btn" onClick={onFitView} title="Fit view">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
          </svg>
        </button>
        <div className="graph2d-divider" />
        <button className="graph2d-icon-btn" onClick={onZoomOut} title="Zoom out">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
        </button>
      </div>

      {/* Bottom-left: stats */}
      <div className="graph2d-panel graph2d-stats-panel">
        <span className="graph2d-stat">
          <span className="graph2d-stat-dot" style={{ background: '#7c6af7' }} />
          {nodeCount} nodes
        </span>
        <span className="graph2d-stat-sep">·</span>
        <span className="graph2d-stat">{linkCount} links</span>
      </div>
    </>
  );
}
