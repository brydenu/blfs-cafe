'use client';

import { useState } from "react";
import Link from "next/link";
import { deleteFeaturedDrink, toggleFeaturedDrinkActive } from "./actions";
import { useToast } from "@/providers/ToastProvider";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";

interface FeaturedDrink {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  product: {
    id: number;
    name: string;
    category: string;
    imageUrl: string | null;
  };
}

interface FeaturedDrinksListProps {
  featuredDrinks: FeaturedDrink[];
}

export default function FeaturedDrinksList({ featuredDrinks }: FeaturedDrinksListProps) {
  const { showToast } = useToast();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: number; name: string } | null>(null);

  const handleDeleteClick = (id: number, name: string) => {
    setItemToDelete({ id, name });
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    setDeletingId(itemToDelete.id);
    const result = await deleteFeaturedDrink(itemToDelete.id);
    
    if (result.success) {
      showToast("Featured drink deleted");
      setDeleteModalOpen(false);
      setItemToDelete(null);
      window.location.reload();
    } else {
      showToast(result.message || "Failed to delete featured drink");
      setDeletingId(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setItemToDelete(null);
    setDeletingId(null);
  };

  const handleToggle = async (id: number, currentActive: boolean) => {
    setTogglingId(id);
    const result = await toggleFeaturedDrinkActive(id, !currentActive);
    
    if (result.success) {
      showToast(currentActive ? "Featured drink deactivated" : "Featured drink activated");
      window.location.reload();
    } else {
      showToast(result.message || "Failed to update featured drink");
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Add New Button */}
      <div className="mb-6">
        <Link href="/admin/featured-drinks/new">
          <button className="bg-[#32A5DC] hover:bg-[#288bba] text-white px-6 py-3 rounded-xl font-bold transition-all cursor-pointer">
            + Create New Featured Drink
          </button>
        </Link>
      </div>

      {/* List */}
      {featuredDrinks.length === 0 ? (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-12 text-center">
          <div className="text-6xl mb-4">⭐</div>
          <h3 className="text-xl font-bold text-white mb-2">No featured drinks yet</h3>
          <p className="text-gray-400 text-sm mb-6">
            Create your first featured drink to get started!
          </p>
          <Link href="/admin/featured-drinks/new">
            <button className="bg-[#32A5DC] hover:bg-[#288bba] text-white px-6 py-3 rounded-xl font-bold transition-all cursor-pointer">
              Create Your First Featured Drink
            </button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {featuredDrinks.map((featured) => (
            <div
              key={featured.id}
              className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center text-xl shrink-0">
                      {featured.product.category === 'coffee' ? '☕' : featured.product.category === 'tea' ? '🍵' : '🥤'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-white font-bold text-lg">{featured.name}</h3>
                        {featured.isActive ? (
                          <span className="bg-green-500/20 text-green-400 text-xs font-bold px-2 py-1 rounded">Active</span>
                        ) : (
                          <span className="bg-gray-500/20 text-gray-400 text-xs font-bold px-2 py-1 rounded">Inactive</span>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm">{featured.product.name}</p>
                    </div>
                  </div>
                  {featured.description && (
                    <p className="text-gray-300 text-sm mt-2 ml-16">{featured.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggle(featured.id, featured.isActive)}
                    disabled={togglingId === featured.id}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                      featured.isActive
                        ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                        : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                    }`}
                    title={featured.isActive ? "Deactivate" : "Activate"}
                  >
                    {togglingId === featured.id ? (
                      <span className="animate-spin">⏳</span>
                    ) : featured.isActive ? (
                      "Deactivate"
                    ) : (
                      "Activate"
                    )}
                  </button>
                  <Link href={`/admin/featured-drinks/edit?id=${featured.id}`}>
                    <button
                      className="w-10 h-10 rounded-lg bg-gray-700 hover:bg-gray-600 text-white flex items-center justify-center transition-all cursor-pointer"
                      title="Edit"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                    </button>
                  </Link>
                  <button
                    onClick={() => handleDeleteClick(featured.id, featured.name)}
                    disabled={deletingId === featured.id}
                    className="w-10 h-10 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-200 hover:text-red-100 flex items-center justify-center transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Delete"
                  >
                    {deletingId === featured.id ? (
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
        </div>
      )}
      
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Featured Drink"
        message="Are you sure you want to delete this featured drink? This action cannot be undone."
        itemName={itemToDelete?.name || ""}
        isDeleting={deletingId !== null}
      />
    </div>
  );
}
