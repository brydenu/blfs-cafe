'use client';

interface DeleteSuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  suggestionContent: string;
  isDeleting?: boolean;
  errorMessage?: string | null;
}

export default function DeleteSuggestionModal({
  isOpen,
  onClose,
  onConfirm,
  suggestionContent,
  isDeleting = false,
  errorMessage = null
}: DeleteSuggestionModalProps) {
  if (!isOpen) return null;

  const preview = suggestionContent && suggestionContent.length > 0
    ? (suggestionContent.length > 100 
        ? suggestionContent.substring(0, 100) + '...'
        : suggestionContent)
    : 'This suggestion';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full border border-gray-700 animate-in fade-in zoom-in duration-200">
        <div className="p-6">
          <h3 className="text-xl font-black text-white mb-2">
            Delete Suggestion
          </h3>
          <p className="text-gray-400 mb-4">
            Are you sure you want to delete this suggestion? This action cannot be undone.
          </p>
          {suggestionContent && suggestionContent.length > 0 && (
            <p className="text-sm text-gray-300 mb-4 bg-gray-900 p-3 rounded-lg border border-gray-700 whitespace-pre-wrap break-words">
              {preview}
            </p>
          )}

          {errorMessage && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg">
              <p className="text-sm text-red-300 font-bold">{errorMessage}</p>
            </div>
          )}
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-600 text-gray-300 font-bold hover:bg-gray-700 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isDeleting ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
