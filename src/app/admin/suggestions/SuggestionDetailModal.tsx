'use client';

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

interface SuggestionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  suggestion: Suggestion | null;
  onMarkAsRead: (id: number) => void;
  onMarkAsUnread: (id: number) => void;
  onArchive: (id: number) => void;
  onUnarchive: (id: number) => void;
  onPin: (id: number) => void;
  onUnpin: (id: number) => void;
  onDelete: (suggestion: Suggestion) => void;
  isUpdating: boolean;
  isArchivedTab?: boolean;
}

export default function SuggestionDetailModal({
  isOpen,
  onClose,
  suggestion,
  onMarkAsRead,
  onMarkAsUnread,
  onArchive,
  onUnarchive,
  onPin,
  onUnpin,
  onDelete,
  isUpdating,
  isArchivedTab = false,
}: SuggestionDetailModalProps) {
  if (!isOpen || !suggestion) return null;

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] border border-gray-700 animate-in fade-in zoom-in duration-200 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-700 shrink-0">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                {suggestion.isPinned && (
                  <span className="text-yellow-400 shrink-0" title="Pinned">
                    📌
                  </span>
                )}
                <h3 className="text-xl font-black text-white">
                  {getUserName(suggestion)}
                </h3>
                {!suggestion.isRead && (
                  <span className="bg-[#32A5DC] text-white text-xs font-bold px-2 py-1 rounded-full">
                    New
                  </span>
                )}
                {suggestion.isRead && (
                  <span className="bg-gray-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                    Read
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-400 space-y-1">
                <p>
                  <strong>Submitted:</strong> {formatDate(suggestion.createdAt)}
                </p>
                {suggestion.isRead && suggestion.readAt && (
                  <p>
                    <strong>Read:</strong> {formatDate(suggestion.readAt)}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors ml-4 shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          <div className="text-gray-300 whitespace-pre-wrap break-words">
            {suggestion.content}
          </div>
        </div>

        {/* Actions - Fixed at bottom */}
        <div className="p-6 border-t border-gray-700 shrink-0">
          <div className="flex gap-3 flex-wrap">
            {suggestion.isRead ? (
              <button
                onClick={() => {
                  onMarkAsUnread(suggestion.id);
                  onClose();
                }}
                disabled={isUpdating}
                className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-xl transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? 'Updating...' : 'Mark Unread'}
              </button>
            ) : (
              <button
                onClick={() => {
                  onMarkAsRead(suggestion.id);
                  onClose();
                }}
                disabled={isUpdating}
                className="bg-[#32A5DC] hover:bg-[#288bba] text-white font-bold py-2 px-4 rounded-xl transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? 'Updating...' : 'Mark Read'}
              </button>
            )}
            
            {suggestion.isPinned ? (
              <button
                onClick={() => {
                  onUnpin(suggestion.id);
                  onClose();
                }}
                disabled={isUpdating}
                className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-xl transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? 'Updating...' : 'Unpin'}
              </button>
            ) : (
              <button
                onClick={() => {
                  onPin(suggestion.id);
                  onClose();
                }}
                disabled={isUpdating}
                className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-xl transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? 'Updating...' : 'Pin'}
              </button>
            )}

            {isArchivedTab ? (
              <button
                onClick={() => {
                  onUnarchive(suggestion.id);
                  onClose();
                }}
                disabled={isUpdating}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? 'Updating...' : 'Unarchive'}
              </button>
            ) : (
              <button
                onClick={() => {
                  onArchive(suggestion.id);
                  onClose();
                }}
                disabled={isUpdating}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? 'Updating...' : 'Archive'}
              </button>
            )}

            <button
              onClick={() => {
                onDelete(suggestion);
              }}
              disabled={isUpdating}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-xl transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Delete
            </button>
            
            <button
              onClick={onClose}
              className="ml-auto bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-xl transition-colors text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
