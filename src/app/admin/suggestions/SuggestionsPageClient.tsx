'use client';

import { useState } from 'react';
import SuggestionList from './SuggestionList';

interface SuggestionUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
}

interface Suggestion {
  id: number;
  userId: string | null;
  user: SuggestionUser | null;
  content: string;
  isRead: boolean;
  readAt: Date | null;
  readBy: string | null;
  isArchived: boolean;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface SuggestionsPageClientProps {
  activeSuggestions: Suggestion[];
  archivedSuggestions: Suggestion[];
}

export default function SuggestionsPageClient({
  activeSuggestions,
  archivedSuggestions,
}: SuggestionsPageClientProps) {
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');

  return (
    <div className="space-y-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-end justify-between border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-3xl font-black text-white">Suggestions</h1>
          <p className="text-gray-400 font-medium">View and manage user suggestions</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-800">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-6 py-3 font-bold text-sm transition-colors border-b-2 ${
            activeTab === 'active'
              ? 'border-[#32A5DC] text-white'
              : 'border-transparent text-gray-400 hover:text-gray-300'
          }`}
        >
          Active ({activeSuggestions.length})
        </button>
        <button
          onClick={() => setActiveTab('archived')}
          className={`px-6 py-3 font-bold text-sm transition-colors border-b-2 ${
            activeTab === 'archived'
              ? 'border-[#32A5DC] text-white'
              : 'border-transparent text-gray-400 hover:text-gray-300'
          }`}
        >
          Archived ({archivedSuggestions.length})
        </button>
      </div>

      {/* Suggestions List */}
      <SuggestionList
        suggestions={activeTab === 'active' ? activeSuggestions : archivedSuggestions}
        isArchivedTab={activeTab === 'archived'}
      />
    </div>
  );
}
