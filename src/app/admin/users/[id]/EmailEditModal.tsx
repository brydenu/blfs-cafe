'use client';

import { useState } from "react";

interface EmailEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (email: string) => void;
  currentEmail: string;
  loading?: boolean;
  error?: string | null;
}

export default function EmailEditModal({
  isOpen,
  onClose,
  onConfirm,
  currentEmail,
  loading = false,
  error
}: EmailEditModalProps) {
  const [email, setEmail] = useState(currentEmail);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && email !== currentEmail) {
      onConfirm(email);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl">
        <h3 className="text-xl font-black text-white mb-2">Change Email Address</h3>
        <p className="text-gray-400 mb-4">Enter the new email address for this user.</p>
        
        {error && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-700 rounded-xl">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-400 mb-2">
              New Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#32A5DC] transition-colors disabled:opacity-50"
              placeholder="user@example.com"
            />
          </div>
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !email || email === currentEmail}
              className="flex-1 px-4 py-2 bg-[#32A5DC] hover:bg-[#288bba] text-white rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update Email'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
