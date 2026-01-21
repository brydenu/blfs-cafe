'use client';

interface Communication {
  id: number;
  title: string;
}

interface DeleteCommunicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  communication: Communication | null;
}

export default function DeleteCommunicationModal({
  isOpen,
  onClose,
  onConfirm,
  communication,
}: DeleteCommunicationModalProps) {
  if (!isOpen || !communication) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full border border-gray-700">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Delete Communication</h2>
          
          <div className="space-y-4">
            <p className="text-gray-300">
              Are you sure you want to delete <span className="font-semibold text-white">{communication.title}</span>?
            </p>
            
            <p className="text-sm text-red-400">
              This action cannot be undone. The communication will be permanently deleted.
            </p>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
