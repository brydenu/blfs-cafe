'use client';

import { useState } from 'react';
import { deleteCommunication } from './actions';
import { useRouter } from 'next/navigation';
import CommunicationForm from './CommunicationForm';
import DeleteCommunicationModal from './DeleteCommunicationModal';

interface Communication {
  id: number;
  title: string;
  content: string;
  startDate: Date;
  endDate: Date;
  visibilityLocations: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface CommunicationListProps {
  communications: Communication[];
}

export default function CommunicationList({ communications }: CommunicationListProps) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [communicationToDelete, setCommunicationToDelete] = useState<Communication | null>(null);

  const handleRefresh = () => {
    router.refresh();
  };

  const handleDeleteClick = (comm: Communication) => {
    setCommunicationToDelete(comm);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!communicationToDelete) return;

    setDeletingId(communicationToDelete.id);
    try {
      const result = await deleteCommunication(communicationToDelete.id);
      if (result.success) {
        handleRefresh();
      }
    } catch (error) {
      // Silent fail - just refresh
    } finally {
      setDeletingId(null);
      setDeleteModalOpen(false);
      setCommunicationToDelete(null);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isActive = (startDate: Date, endDate: Date) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    return now >= start && now <= end;
  };

  const isUpcoming = (startDate: Date) => {
    return new Date(startDate) > new Date();
  };

  if (editingId) {
    const communication = communications.find(c => c.id === editingId);
    if (communication) {
      return (
        <CommunicationForm
          communication={communication}
          onClose={() => setEditingId(null)}
          onSuccess={() => {
            setEditingId(null);
            handleRefresh();
          }}
        />
      );
    }
  }

  if (showCreateForm) {
    return (
      <CommunicationForm
        onClose={() => setShowCreateForm(false)}
        onSuccess={() => {
          setShowCreateForm(false);
          handleRefresh();
        }}
      />
    );
  }

  return (
    <>
      <DeleteCommunicationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setCommunicationToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        communication={communicationToDelete}
      />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-white">Communications</h2>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-[#32A5DC] hover:bg-[#288bba] text-white font-bold py-2 px-6 rounded-xl transition-colors"
          >
            + Create New
          </button>
        </div>

      {communications.length === 0 ? (
        <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 text-center">
          <p className="text-gray-400">No communications yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {communications.map((comm) => {
            const active = isActive(comm.startDate, comm.endDate);
            const upcoming = isUpcoming(comm.startDate);
            
            return (
              <div
                key={comm.id}
                className="bg-gray-800 p-6 rounded-2xl border border-gray-700"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-black text-white">{comm.title}</h3>
                      {active && (
                        <span className="bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                          Active
                        </span>
                      )}
                      {upcoming && !active && (
                        <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                          Upcoming
                        </span>
                      )}
                      {!active && !upcoming && (
                        <span className="bg-gray-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                          Expired
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-400 space-y-1">
                      <p>
                        <strong>Start:</strong> {formatDate(comm.startDate)}
                      </p>
                      <p>
                        <strong>End:</strong> {formatDate(comm.endDate)}
                      </p>
                      <p>
                        <strong>Visible on:</strong>{' '}
                        {comm.visibilityLocations
                          .map((loc) =>
                            loc === 'landing'
                              ? 'Landing Page'
                              : loc === 'dashboard'
                              ? 'User Dashboard'
                              : 'Menu Page'
                          )
                          .join(', ')}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => setEditingId(comm.id)}
                      className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-xl transition-colors text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(comm)}
                      disabled={deletingId === comm.id}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-xl transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deletingId === comm.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
                <div
                  className="text-gray-300 prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: comm.content }}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
    </>
  );
}
