'use client';

import { useState } from "react";
import { updateUserEmail, deleteUser, updateUserRole } from "../actions";
import { useRouter } from "next/navigation";
import ConfirmationModal from "./ConfirmationModal";
import EmailEditModal from "./EmailEditModal";

interface UserActionsProps {
  user: {
    id: string;
    email: string | null;
    role: string;
  };
}

export default function UserActions({ user }: UserActionsProps) {
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await deleteUser(user.id);
      if (result.success) {
        router.push('/admin/users');
        router.refresh();
      } else {
        setError(result.message || 'Failed to delete user');
        setShowDeleteModal(false);
      }
    } catch (err) {
      setError('An error occurred');
      setShowDeleteModal(false);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async () => {
    setLoading(true);
    setError(null);
    const newRole = user.role === 'admin' ? 'customer' : 'admin';
    try {
      const result = await updateUserRole(user.id, newRole);
      if (result.success) {
        router.refresh();
        setShowRoleModal(false);
      } else {
        setError(result.message || 'Failed to update role');
        setShowRoleModal(false);
      }
    } catch (err) {
      setError('An error occurred');
      setShowRoleModal(false);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailUpdate = async (newEmail: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await updateUserEmail(user.id, newEmail);
      if (result.success) {
        router.refresh();
        setShowEmailModal(false);
      } else {
        setError(result.message || 'Failed to update email');
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700">
        <h2 className="text-xl font-black text-white mb-4">Administrative Actions</h2>
        
        {error && (
          <div className="mb-4 p-4 bg-red-900/20 border border-red-700 rounded-xl">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-3">
          <button
            onClick={() => setShowEmailModal(true)}
            disabled={loading}
            className="w-full md:flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-center"
          >
            Change Email Address
          </button>

          <button
            onClick={() => setShowRoleModal(true)}
            disabled={loading}
            className={`w-full md:flex-1 px-6 py-3 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-center ${
              user.role === 'admin'
                ? 'bg-yellow-900/50 hover:bg-yellow-900/70 text-yellow-400 border border-yellow-800'
                : 'bg-[#32A5DC] hover:bg-[#288bba] text-white'
            }`}
          >
            {user.role === 'admin' ? 'Demote to Customer' : 'Promote to Admin'}
          </button>

          <button
            onClick={() => setShowDeleteModal(true)}
            disabled={loading}
            className="w-full md:flex-1 px-6 py-3 bg-red-900/50 hover:bg-red-900/70 text-red-400 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-center border border-red-800"
          >
            Delete User
          </button>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete User"
        message={`Are you sure you want to delete this user? This action will anonymize their account but preserve their order history. This action cannot be undone.`}
        confirmText="Delete"
        confirmColor="red"
        loading={loading}
      />

      <ConfirmationModal
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        onConfirm={handleRoleChange}
        title={user.role === 'admin' ? 'Demote User' : 'Promote User'}
        message={`Are you sure you want to ${user.role === 'admin' ? 'demote' : 'promote'} this user to ${user.role === 'admin' ? 'customer' : 'admin'}?`}
        confirmText={user.role === 'admin' ? 'Demote' : 'Promote'}
        confirmColor={user.role === 'admin' ? 'yellow' : 'blue'}
        loading={loading}
      />

      <EmailEditModal
        isOpen={showEmailModal}
        onClose={() => {
          setShowEmailModal(false);
          setError(null);
        }}
        onConfirm={handleEmailUpdate}
        currentEmail={user.email || ''}
        loading={loading}
        error={error}
      />
    </>
  );
}
