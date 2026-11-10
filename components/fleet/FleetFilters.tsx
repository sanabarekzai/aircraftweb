'use client';

import { useState, useCallback } from 'react';
import { Search } from 'lucide-react';

const categories = [
  { value: 'GENERAL_AVIATION', label: 'General Aviation' },
  { value: 'COMMERCIAL_AIRLINER', label: 'Commercial Airliner' },
  { value: 'MILITARY', label: 'Military' },
  { value: 'SUPERSONIC', label: 'Supersonic' },
  { value: 'EXPERIMENTAL', label: 'Experimental' },
];

const eras = [
  { value: 'PIONEER', label: 'Pioneer' },
  { value: 'WWII', label: 'WWII' },
  { value: 'JET_AGE', label: 'Jet Age' },
  { value: 'MODERN', label: 'Modern' },
];

const sortOptions = [
  { value: 'speed_desc', label: 'Speed (High-Low)' },
  { value: 'name_asc', label: 'Name (A-Z)' },
  { value: 'year_desc', label: 'Year (Newest)' },
  { value: 'range_desc', label: 'Range (High-Low)' },
  { value: 'ceiling_desc', label: 'Ceiling (High-Low)' },
];

interface FleetFiltersProps {
  search: string;
  selectedCategories: string[];
  selectedEras: string[];
  selectedTags: string[];
  sort: string;
  onSearchChange: (search: string) => void;
  onCategoryChange: (categories: string[]) => void;
  onEraChange: (eras: string[]) => void;
  onTagChange: (tags: string[]) => void;
  onSortChange: (sort: string) => void;
  allTags: string[];
}

export function FleetFilters({
  search,
  selectedCategories,
  selectedEras,
  selectedTags,
  sort,
  onSearchChange,
  onCategoryChange,
  onEraChange,
  onTagChange,
  onSortChange,
  allTags,
}: FleetFiltersProps) {
  const [tagsSearch, setTagsSearch] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showEraDropdown, setShowEraDropdown] = useState(false);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const filteredTags = allTags.filter((tag) =>
    tag.toLowerCase().includes(tagsSearch.toLowerCase())
  );

  const handleCategoryToggle = useCallback(
    (category: string) => {
      const newCategories = selectedCategories.includes(category)
        ? selectedCategories.filter((c) => c !== category)
        : [...selectedCategories, category];
      onCategoryChange(newCategories);
    },
    [selectedCategories, onCategoryChange]
  );

  const handleEraToggle = useCallback(
    (era: string) => {
      const newEras = selectedEras.includes(era)
        ? selectedEras.filter((e) => e !== era)
        : [...selectedEras, era];
      onEraChange(newEras);
    },
    [selectedEras, onEraChange]
  );

  const handleTagToggle = useCallback(
    (tag: string) => {
      const newTags = selectedTags.includes(tag)
        ? selectedTags.filter((t) => t !== tag)
        : [...selectedTags, tag];
      onTagChange(newTags);
    },
    [selectedTags, onTagChange]
  );

  const handleReset = useCallback(() => {
    onSearchChange('');
    onCategoryChange([]);
    onEraChange([]);
    onTagChange([]);
    onSortChange('speed_desc');
  }, [onSearchChange, onCategoryChange, onEraChange, onTagChange, onSortChange]);

  const hasFilters = search || selectedCategories.length > 0 || selectedEras.length > 0 || selectedTags.length > 0;

  return (
    <div className="bg-panel rounded-lg p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="relative">
          <label className="block text-sm font-medium text-slate-300 mb-1">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search aircraft..."
              className="w-full pl-10 pr-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-cyan focus:border-transparent transition-colors"
            />
          </div>
        </div>

        <div className="relative">
          <label className="block text-sm font-medium text-slate-300 mb-1">Category</label>
          <button
            onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
            className="w-full flex items-center justify-between px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md text-white hover:bg-slate-600 transition-colors focus-visible:ring-2 focus-visible:ring-accent-cyan focus-visible:outline-none"
            aria-expanded={showCategoryDropdown}
            aria-label="Toggle category filter"
          >
            <span>
              {selectedCategories.length > 0
                ? `${selectedCategories.length} selected`
                : 'All Categories'}
            </span>
            <svg
              className={`w-4 h-4 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showCategoryDropdown && (
            <div className="absolute top-full left-0 mt-1 w-full bg-panel border border-slate-600 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
              {categories.map((cat) => (
                <label
                  key={cat.value}
                  className="flex items-center px-3 py-2 hover:bg-slate-700/50 transition-colors cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(cat.value)}
                    onChange={() => handleCategoryToggle(cat.value)}
                    className="mr-2 h-4 w-4 rounded border-slate-600 text-accent-cyan focus:ring-accent-cyan"
                    aria-label={`Filter by ${cat.label}`}
                  />
                  <span className="text-slate-300">{cat.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <label className="block text-sm font-medium text-slate-300 mb-1">Era</label>
          <button
            onClick={() => setShowEraDropdown(!showEraDropdown)}
            className="w-full flex items-center justify-between px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md text-white hover:bg-slate-600 transition-colors focus-visible:ring-2 focus-visible:ring-accent-cyan focus-visible:outline-none"
            aria-expanded={showEraDropdown}
            aria-label="Toggle era filter"
          >
            <span>{selectedEras.length > 0 ? `${selectedEras.length} selected` : 'All Eras'}</span>
            <svg
              className={`w-4 h-4 transition-transform ${showEraDropdown ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showEraDropdown && (
            <div className="absolute top-full left-0 mt-1 w-full bg-panel border border-slate-600 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
              {eras.map((era) => (
                <label
                  key={era.value}
                  className="flex items-center px-3 py-2 hover:bg-slate-700/50 transition-colors cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedEras.includes(era.value)}
                    onChange={() => handleEraToggle(era.value)}
                    className="mr-2 h-4 w-4 rounded border-slate-600 text-accent-cyan focus:ring-accent-cyan"
                    aria-label={`Filter by ${era.label}`}
                  />
                  <span className="text-slate-300">{era.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <label className="block text-sm font-medium text-slate-300 mb-1">Sort By</label>
          <button
            onClick={() => setShowSortDropdown(!showSortDropdown)}
            className="w-full flex items-center justify-between px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md text-white hover:bg-slate-600 transition-colors focus-visible:ring-2 focus-visible:ring-accent-cyan focus-visible:outline-none"
            aria-expanded={showSortDropdown}
            aria-label="Toggle sort options"
          >
            <span>
              {sortOptions.find((s) => s.value === sort)?.label || 'Speed (High-Low)'}
            </span>
            <svg
              className={`w-4 h-4 transition-transform ${showSortDropdown ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showSortDropdown && (
            <div className="absolute top-full left-0 mt-1 w-full bg-panel border border-slate-600 rounded-md shadow-lg z-10">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onSortChange(option.value);
                    setShowSortDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-slate-300 hover:bg-slate-700/50 transition-colors ${
                    sort === option.value ? 'bg-accent-cyan/20 text-accent-cyan' : ''
                  }`}
                  aria-label={`Sort by ${option.label}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="relative">
        <label className="block text-sm font-medium text-slate-300 mb-1">Tags</label>
        <button
          onClick={() => setShowTagDropdown(!showTagDropdown)}
          className="w-full flex items-center justify-between px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md text-white hover:bg-slate-600 transition-colors focus-visible:ring-2 focus-visible:ring-accent-cyan focus-visible:outline-none"
          aria-expanded={showTagDropdown}
          aria-label="Toggle tag filter"
        >
          <span>{selectedTags.length > 0 ? `${selectedTags.length} selected` : 'All Tags'}</span>
          <svg
            className={`w-4 h-4 transition-transform ${showTagDropdown ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {showTagDropdown && (
          <div className="absolute top-full left-0 mt-1 w-full bg-panel border border-slate-600 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
            <div className="p-2 sticky top-0 bg-panel border-b border-slate-600">
              <input
                type="text"
                value={tagsSearch}
                onChange={(e) => setTagsSearch(e.target.value)}
                placeholder="Search tags..."
                className="w-full px-2 py-1 bg-slate-700/50 border border-slate-600 rounded text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-1 focus:ring-accent-cyan"
              />
            </div>
            {filteredTags.length > 0 ? (
              filteredTags.map((tag) => (
                <label
                  key={tag}
                  className="flex items-center px-3 py-2 hover:bg-slate-700/50 transition-colors cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedTags.includes(tag)}
                    onChange={() => handleTagToggle(tag)}
                    className="mr-2 h-4 w-4 rounded border-slate-600 text-accent-cyan focus:ring-accent-cyan"
                    aria-label={`Filter by tag ${tag}`}
                  />
                  <span className="text-slate-300">{tag}</span>
                </label>
              ))
            ) : (
              <div className="px-3 py-2 text-slate-400 text-sm">No tags found</div>
            )}
          </div>
        )}
      </div>

      {hasFilters && (
        <button
          onClick={handleReset}
          className="mt-4 px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded-md transition-colors text-sm"
          aria-label="Reset all filters"
        >
          Reset Filters
        </button>
      )}
    </div>
  );
}
