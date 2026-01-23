'use client';

import { useState } from 'react';
import { 
  markSuggestionAsRead, 
  markSuggestionAsUnread,
  archiveSuggestion,
  unarchiveSuggestion,
  pinSuggestion,
  unpinSuggestion,
  deleteSuggestion
} from './actions';
import { useRouter } from 'next/navigation';
import SuggestionDetailModal from './SuggestionDetailModal';
import DeleteSuggestionModal from './DeleteSuggestionModal';

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

interface SuggestionListProps {
  suggestions: Suggestion[];
  isArchivedTab?: boolean;
}

export default function SuggestionList({ suggestions, isArchivedTab = false }: SuggestionListProps) {
  const router = useRouter();
  const [updatingIds, setUpdatingIds] = useState<Set<number>>(new Set());
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [suggestionToDelete, setSuggestionToDelete] = useState<Suggestion | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRefresh = () => {
    router.refresh();
  };

  const handleMarkAsRead = async (id: number) => {
    setUpdatingIds(prev => new Set(prev).add(id));
    try {
      await markSuggestionAsRead(id);
      handleRefresh();
    } catch (error) {
      console.error("Error marking as read:", error);
    } finally {
      setUpdatingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleMarkAsUnread = async (id: number) => {
    setUpdatingIds(prev => new Set(prev).add(id));
    try {
      await markSuggestionAsUnread(id);
      handleRefresh();
    } catch (error) {
      console.error("Error marking as unread:", error);
    } finally {
      setUpdatingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleArchive = async (id: number) => {
    setUpdatingIds(prev => new Set(prev).add(id));
    try {
      await archiveSuggestion(id);
      handleRefresh();
    } catch (error) {
      console.error("Error archiving suggestion:", error);
    } finally {
      setUpdatingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleUnarchive = async (id: number) => {
    setUpdatingIds(prev => new Set(prev).add(id));
    try {
      await unarchiveSuggestion(id);
      handleRefresh();
    } catch (error) {
      console.error("Error unarchiving suggestion:", error);
    } finally {
      setUpdatingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handlePin = async (id: number) => {
    setUpdatingIds(prev => new Set(prev).add(id));
    try {
      await pinSuggestion(id);
      handleRefresh();
    } catch (error) {
      console.error("Error pinning suggestion:", error);
    } finally {
      setUpdatingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleUnpin = async (id: number) => {
    setUpdatingIds(prev => new Set(prev).add(id));
    try {
      await unpinSuggestion(id);
      handleRefresh();
    } catch (error) {
      console.error("Error unpinning suggestion:", error);
    } finally {
      setUpdatingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleDeleteClick = (suggestion: Suggestion) => {
    setSuggestionToDelete(suggestion);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!suggestionToDelete) return;

    const id = suggestionToDelete.id;
    
    // Validate id before proceeding
    if (!id || typeof id !== 'number') {
      console.error("Invalid suggestion ID:", id, suggestionToDelete);
      setErrorMessage("Invalid suggestion ID. Please try again.");
      return;
    }
    
    setErrorMessage(null);
    setUpdatingIds(prev => new Set(prev).add(id));
    try {
      const result = await deleteSuggestion(id);
      if (result.success) {
        setDeleteModalOpen(false);
        setSuggestionToDelete(null);
        if (selectedSuggestion?.id === id) {
          setIsModalOpen(false);
          setSelectedSuggestion(null);
        }
        handleRefresh();
      } else {
        console.error("Delete failed:", result.message);
        setErrorMessage(result.message || "Failed to delete suggestion");
      }
    } catch (error) {
      console.error("Error deleting suggestion:", error);
      setErrorMessage("An error occurred while deleting the suggestion");
    } finally {
      setUpdatingIds(prev => {
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

  const getUserName = (suggestion: Suggestion) => {
    if (suggestion.user) {
      const firstName = suggestion.user.firstName || '';
      const lastName = suggestion.user.lastName || '';
      if (firstName || lastName) {
        return `${firstName} ${lastName}`.trim();
      }
      return suggestion.user.email || 'User';
    }
    return 'Anonymous';
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    setSelectedSuggestion(suggestion);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSuggestion(null);
  };

  const getContentPreview = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) {
      return content;
    }
    return content.substring(0, maxLength) + '...';
  };

  if (suggestions.length === 0) {
    return (
      <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 text-center">
        <p className="text-gray-400">
          {isArchivedTab ? 'No archived suggestions.' : 'No suggestions yet.'}
        </p>
      </div>
    );
  }

  return (
    <>
      <SuggestionDetailModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        suggestion={selectedSuggestion}
        onMarkAsRead={handleMarkAsRead}
        onMarkAsUnread={handleMarkAsUnread}
        onArchive={handleArchive}
        onUnarchive={handleUnarchive}
        onPin={handlePin}
        onUnpin={handleUnpin}
        onDelete={handleDeleteClick}
        isUpdating={selectedSuggestion ? updatingIds.has(selectedSuggestion.id) : false}
        isArchivedTab={isArchivedTab}
      />

      <DeleteSuggestionModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSuggestionToDelete(null);
          setErrorMessage(null);
        }}
        onConfirm={handleDeleteConfirm}
        suggestionContent={suggestionToDelete?.content || ''}
        isDeleting={suggestionToDelete ? updatingIds.has(suggestionToDelete.id) : false}
        errorMessage={errorMessage}
      />

      <div className="space-y-3">
        {suggestions.map((suggestion) => {
          return (
            <div
              key={suggestion.id}
              onClick={() => handleSuggestionClick(suggestion)}
              className={`bg-gray-800 p-4 rounded-xl border cursor-pointer hover:bg-gray-700 transition-all ${
                suggestion.isRead ? 'border-gray-700 hover:border-gray-600' : 'border-[#32A5DC] border-2 hover:border-[#288bba]'
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    {suggestion.isPinned && (
                      <span className="text-yellow-400 shrink-0" title="Pinned">
                        📌
                      </span>
                    )}
                    <h3 className="text-base font-black text-white truncate">
                      {getUserName(suggestion)}
                    </h3>
                    {!suggestion.isRead && (
                      <span className="bg-[#32A5DC] text-white text-xs font-bold px-2 py-0.5 rounded-full shrink-0">
                        New
                      </span>
                    )}
                    {suggestion.isRead && (
                      <span className="bg-gray-600 text-white text-xs font-bold px-2 py-0.5 rounded-full shrink-0">
                        Read
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 mb-1 truncate">
                    {getContentPreview(suggestion.content)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(suggestion.createdAt)}
                  </p>
                </div>
                <div className="shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-gray-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
