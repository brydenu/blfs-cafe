'use client';

import { useState } from 'react';
import Link from 'next/link';
import { deleteUserSuggestion } from '../actions';
import { useRouter } from 'next/navigation';
import DeleteSuggestionModal from './DeleteSuggestionModal';

interface Suggestion {
  id: number;
  content: string;
  createdAt: Date;
}

interface SuggestionsHistoryClientProps {
  suggestions: Suggestion[];
}

export default function SuggestionsHistoryClient({ suggestions }: SuggestionsHistoryClientProps) {
  const router = useRouter();
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());
  const [showOlderGroup, setShowOlderGroup] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [suggestionToDelete, setSuggestionToDelete] = useState<Suggestion | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Calculate one week ago
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  // Separate recent (last week) and older suggestions
  const recentSuggestions = suggestions.filter(
    (s) => new Date(s.createdAt) >= oneWeekAgo
  );
  const olderSuggestions = suggestions.filter(
    (s) => new Date(s.createdAt) < oneWeekAgo
  );

  const handleDeleteClick = (suggestion: Suggestion) => {
    setSuggestionToDelete(suggestion);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!suggestionToDelete) return;

    const id = suggestionToDelete.id;
    setErrorMessage(null);
    setDeletingIds(prev => new Set(prev).add(id));
    try {
      const result = await deleteUserSuggestion(id);
      if (result.success) {
        setDeleteModalOpen(false);
        setSuggestionToDelete(null);
        router.refresh();
      } else {
        console.error("Delete failed:", result.message);
        setErrorMessage(result.message || "Failed to delete suggestion");
      }
    } catch (error) {
      console.error("Error deleting suggestion:", error);
      setErrorMessage("An error occurred while deleting the suggestion");
    } finally {
      setDeletingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getContentPreview = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) {
      return content;
    }
    return content.substring(0, maxLength) + '...';
  };

  return (
    <>
      <DeleteSuggestionModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSuggestionToDelete(null);
          setErrorMessage(null);
        }}
        onConfirm={handleDeleteConfirm}
        suggestionContent={suggestionToDelete?.content || ''}
        isDeleting={suggestionToDelete ? deletingIds.has(suggestionToDelete.id) : false}
        errorMessage={errorMessage}
      />

    <div className="min-h-screen relative overflow-hidden flex justify-center p-4">
      
      {/* --- BACKGROUND --- */}
      <div className="absolute inset-0 z-0 bg-[#004876] fixed">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#32A5DC] rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#32A5DC] rounded-full mix-blend-multiply filter blur-[128px] opacity-20"></div>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
      </div>

      {/* --- CONTENT CONTAINER --- */}
      <div className="relative z-10 w-full max-w-3xl space-y-6 pt-8 pb-12">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-black text-white drop-shadow-md">My Suggestions</h1>
            <div className="flex gap-3">
              <Link href="/dashboard/suggestions">
                <button className="bg-[#32A5DC] hover:bg-[#288bba] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all hover:scale-[1.02]">
                  + New Suggestion
                </button>
              </Link>
              <Link href="/dashboard">
                <button className="bg-[#003355] hover:bg-[#002a4d] border border-white/10 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all hover:scale-[1.02] flex items-center gap-2">
                  <span>←</span> Back
                </button>
              </Link>
            </div>
        </div>

        {suggestions.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-2xl p-8 border border-white/10 text-center">
            <p className="text-gray-600 mb-4">You haven't submitted any suggestions yet.</p>
            <Link href="/dashboard/suggestions">
              <button className="bg-[#32A5DC] hover:bg-[#288bba] text-white font-bold py-3 px-6 rounded-xl transition-all">
                Submit Your First Suggestion
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Recent Suggestions (Last Week) */}
            {recentSuggestions.length > 0 && (
              <div>
                <h2 className="text-xl font-black text-white mb-4">Recent Suggestions</h2>
                <div className="space-y-3">
                  {recentSuggestions.map((suggestion) => {
                    const isDeleting = deletingIds.has(suggestion.id);
                    return (
                      <div
                        key={suggestion.id}
                        className="bg-white rounded-2xl shadow-lg p-5 border border-white/10"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className="text-xs text-gray-500 mb-2">
                              {formatDate(suggestion.createdAt)}
                            </p>
                            <p className="text-gray-900 whitespace-pre-wrap break-words">
                              {suggestion.content}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(suggestion);
                            }}
                            disabled={isDeleting}
                            className="text-red-500 hover:text-red-700 transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete suggestion"
                          >
                            {isDeleting ? (
                              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Older Suggestions (Grouped) */}
            {olderSuggestions.length > 0 && (
              <div>
                <button
                  onClick={() => setShowOlderGroup(!showOlderGroup)}
                  className="w-full bg-white rounded-2xl shadow-lg p-5 border border-white/10 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-black text-[#004876] mb-1">
                        Older Suggestions
                      </h2>
                      <p className="text-sm text-gray-600">
                        {olderSuggestions.length} suggestion{olderSuggestions.length !== 1 ? 's' : ''} from more than a week ago
                      </p>
                    </div>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className={`w-6 h-6 text-gray-400 transition-transform ${showOlderGroup ? 'rotate-180' : ''}`}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </div>
                </button>

                {showOlderGroup && (
                  <div className="mt-3 space-y-3">
                    {olderSuggestions.map((suggestion) => {
                      const isDeleting = deletingIds.has(suggestion.id);
                      return (
                        <div
                          key={suggestion.id}
                          className="bg-white rounded-2xl shadow-lg p-5 border border-white/10"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <p className="text-xs text-gray-500 mb-2">
                                {formatDate(suggestion.createdAt)}
                              </p>
                              <p className="text-gray-900 whitespace-pre-wrap break-words">
                                {suggestion.content}
                              </p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(suggestion);
                              }}
                              disabled={isDeleting}
                              className="text-red-500 hover:text-red-700 transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Delete suggestion"
                            >
                              {isDeleting ? (
                                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
    </>
  );
}
