'use client';

import { useState, useEffect, useRef } from 'react';
import { searchUsersForQueue } from './actions';

interface User {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  name: string | null;
  displayName: string;
}

interface UserSearchProps {
  onUserSelect: (user: User | null) => void;
  selectedUser: User | null;
}

export default function UserSearch({ onUserSelect, selectedUser }: UserSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length === 0) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      const result = await searchUsersForQueue(searchQuery);
      if (result.success && result.data) {
        setSearchResults(result.data);
      } else {
        setSearchResults([]);
      }
      setIsSearching(false);
    }, 300); // 300ms debounce

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleUserSelect = (user: User) => {
    onUserSelect(user);
    setSearchQuery(user.displayName);
    setShowResults(false);
  };

  const handleClear = () => {
    onUserSelect(null);
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
        Link to User (Optional)
      </label>
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowResults(true);
            if (!e.target.value) {
              onUserSelect(null);
            }
          }}
          onFocus={() => setShowResults(true)}
          placeholder="Search by name or email..."
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#32A5DC] transition-colors"
        />
        {selectedUser && (
          <button
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
            aria-label="Clear selection"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        {isSearching && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-[#32A5DC] border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && searchResults.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
          {searchResults.map((user) => (
            <button
              key={user.id}
              onClick={() => handleUserSelect(user)}
              className="w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-b-0"
            >
              <div className="font-bold text-white">{user.displayName}</div>
              {user.email && (
                <div className="text-sm text-gray-400">{user.email}</div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Selected User Display */}
      {selectedUser && !showResults && (
        <div className="mt-2 px-4 py-2 bg-[#32A5DC]/10 border border-[#32A5DC]/30 rounded-lg">
          <div className="text-sm font-bold text-[#32A5DC]">
            Linked to: {selectedUser.displayName}
          </div>
          {selectedUser.email && (
            <div className="text-xs text-gray-400">{selectedUser.email}</div>
          )}
        </div>
      )}

      {/* No User Selected State */}
      {!selectedUser && searchQuery.length === 0 && (
        <p className="mt-2 text-xs text-gray-500 italic">
          Leave empty for guest order
        </p>
      )}
    </div>
  );
}
