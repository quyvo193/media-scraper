import { useState, useEffect } from 'react';

interface FiltersProps {
  onTypeChange: (type: 'all' | 'image' | 'video') => void;
  onSearchChange: (search: string) => void;
  currentType?: 'all' | 'image' | 'video';
  currentSearch?: string;
}

/**
 * Filters Component
 * Filter controls for media gallery
 */
export function Filters({
  onTypeChange,
  onSearchChange,
  currentType = 'all',
  currentSearch = '',
}: FiltersProps) {
  const [searchInput, setSearchInput] = useState(currentSearch);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(searchInput);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput, onSearchChange]);

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      {/* Type Filter */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">Type:</label>
        <div className="flex gap-2">
          <button
            onClick={() => onTypeChange('all')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              currentType === 'all'
                ? 'bg-blue-600 text-white'
                : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            All
          </button>
          <button
            onClick={() => onTypeChange('image')}
            className={`flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              currentType === 'image'
                ? 'bg-blue-600 text-white'
                : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            Images
          </button>
          <button
            onClick={() => onTypeChange('video')}
            className={`flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              currentType === 'video'
                ? 'bg-blue-600 text-white'
                : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            Videos
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="flex-1 sm:max-w-xs">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by title or URL..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <svg
            className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {searchInput && (
            <button
              onClick={() => setSearchInput('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

