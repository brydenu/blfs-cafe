'use client';

import { useState } from "react";
import Link from "next/link";
import { deleteFavorite } from "./actions";
import { useToast } from "@/providers/ToastProvider";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { CoffeeIcon, TeaIcon, DrinkIcon, StarIcon } from "@/components/icons";

interface Favorite {
  id: number;
  name: string;
  description: string | null;
  product: {
    id: number;
    name: string;
    category: string;
    imageUrl: string | null;
  };
}

interface FavoritesListProps {
  favorites: Favorite[];
}

export default function FavoritesList({ favorites }: FavoritesListProps) {
  const { showToast } = useToast();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: number; name: string } | null>(null);

  const handleDeleteClick = (id: number, name: string) => {
    setItemToDelete({ id, name });
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    setDeletingId(itemToDelete.id);
    const result = await deleteFavorite(itemToDelete.id);
    
    if (result.success) {
      showToast("Favorite deleted");
      setDeleteModalOpen(false);
      setItemToDelete(null);
      // Refresh the page to update the list
      window.location.reload();
    } else {
      showToast(result.message || "Failed to delete favorite");
      setDeletingId(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setItemToDelete(null);
    setDeletingId(null);
  };

  if (favorites.length === 0) {
    return (
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-12 text-center">
        <div className="mb-4"><StarIcon size={64} className="text-yellow-400" /></div>
        <h3 className="text-xl font-bold text-white mb-2">No favorites yet</h3>
        <p className="text-blue-200 text-sm mb-6">
          Create your first favorite drink to get started!
        </p>
        <Link href="/dashboard/favorites/new">
          <button className="bg-[#32A5DC] hover:bg-[#288bba] text-white px-6 py-3 rounded-xl font-bold transition-all cursor-pointer">
            Create Your First Favorite
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {favorites.map((favorite) => (
        <div
          key={favorite.id}
          className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 hover:bg-white/20 transition-all"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-xl shadow-lg shrink-0">
                  {favorite.product.category === 'coffee' ? <CoffeeIcon size={32} className="text-gray-400" /> : favorite.product.category === 'tea' ? <TeaIcon size={32} className="text-gray-400" /> : <DrinkIcon size={32} className="text-gray-400" />}
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">{favorite.name}</h3>
                  <p className="text-blue-200 text-sm">{favorite.product.name}</p>
                </div>
              </div>
              {favorite.description && (
                <p className="text-blue-100 text-sm mt-2 ml-16">{favorite.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/dashboard/favorites/edit?id=${favorite.id}`}>
                <button
                  className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
                  title="Edit"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                </button>
              </Link>
              <button
                onClick={() => handleDeleteClick(favorite.id, favorite.name)}
                disabled={deletingId === favorite.id}
                className="w-10 h-10 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-200 hover:text-red-100 flex items-center justify-center transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                title="Delete"
              >
                {deletingId === favorite.id ? (
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-1.037-2.09-2.693-2.201a51.964 51.964 0 00-3.32 0c-1.656.11-2.693 1.022-2.693 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      ))}
      
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Favorite"
        message="Are you sure you want to delete this favorite? This action cannot be undone."
        itemName={itemToDelete?.name || ""}
        isDeleting={deletingId !== null}
      />
    </div>
  );
}
