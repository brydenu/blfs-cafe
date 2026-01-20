'use client';

import { useCart, CartItem } from "@/providers/CartProvider";
import Link from "next/link";
import { useState } from "react";
import { placeOrder } from "./actions";
import { useRouter } from "next/navigation";
import { useToast } from "@/providers/ToastProvider";

export default function CartPage() {
  const { items, removeFromCart, clearCart, setOrderMode, updateItemName } = useCart(); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  const handleCheckout = async () => {
    setIsSubmitting(true);
    
    try {
      const result = await placeOrder(items);
      
      if (result.success && result.orderId) {
        clearCart();
        // FIX: Changed from 'order-confirmed' to 'order-confirmation' to match your folder structure
        router.push(`/order-confirmation/${result.orderId}`); 
      } else {
        alert(result.message || "Something went wrong.");
        setIsSubmitting(false);
      }
    } catch (e) {
      console.error(e);
      alert("Network error.");
      setIsSubmitting(false);
    }
  };

  const handleAddMore = () => {
    setOrderMode('multi');
    router.push('/menu');
  };

  // --- EDIT FUNCTIONALITY ---
  const handleEdit = (item: CartItem) => {
    // Construct the config object
    const config = {
        shots: item.shots,
        temperature: item.temperature,
        milkName: item.milkName,
        milkId: item.milkId,
        modifiers: item.modifiers,
        recipientName: item.recipientName,
        personalCup: item.personalCup,
        caffeineType: item.caffeineType,
        notes: item.notes
    };
    
    // Encode it
    const configStr = encodeURIComponent(JSON.stringify(config));
    
    // Navigate to Menu -> Customize with Edit ID
    router.push(`/menu/${item.productId}?editId=${item.internalId}&config=${configStr}`);
  };

  // --- EMPTY STATE ---
  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-[#004876] flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-10 text-center max-w-md w-full shadow-2xl">
          <div className="text-6xl mb-4">🛒</div>
          <h1 className="text-2xl font-extrabold text-[#004876] mb-2">Your Cart is Empty</h1>
          <p className="text-gray-500 mb-8">Looks like you haven't added any drinks yet.</p>
          <Link href="/menu">
            <button className="w-full bg-[#32A5DC] text-white font-bold py-4 rounded-xl hover:bg-[#288bba] transition-all cursor-pointer">
              Browse Menu
            </button>
          </Link>
        </div>
      </main>
    );
  }

  // --- CART LIST ---
  return (
    <main className="min-h-screen bg-gray-50 p-6 pb-32">
       <div className="max-w-2xl mx-auto">
         
         <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-extrabold text-[#004876]">Review Order</h1>
            
            {/* ADD MORE BUTTON */}
            <button 
                onClick={handleAddMore}
                className="text-gray-400 hover:text-[#32A5DC] font-bold text-sm cursor-pointer transition-colors"
            >
               + Add More
            </button>
         </div>

         <div className="space-y-4">
           {items.map((item) => (
             <div key={item.internalId} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative group overflow-hidden">
                
                {/* ACTION BUTTONS (Top Right) */}
                <div className="absolute top-4 right-4 flex gap-2 z-10">
                    
                    {/* EDIT BUTTON */}
                    <button 
                      onClick={() => handleEdit(item)}
                      className="text-gray-300 hover:text-[#32A5DC] transition-colors p-2 cursor-pointer"
                      title="Edit Item"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                      </svg>
                    </button>

                    {/* DELETE BUTTON */}
                    <button 
                      onClick={() => removeFromCart(item.internalId)}
                      className="text-gray-300 hover:text-red-500 transition-colors p-2 cursor-pointer"
                      title="Remove Item"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                </div>

                <div className="flex gap-4">
                   {/* Icon */}
                   <div className="w-16 h-16 bg-[#32A5DC]/10 rounded-xl flex items-center justify-center text-3xl shrink-0">
                      {item.productCategory === 'coffee' ? '☕' : item.productCategory === 'tea' ? '🍵' : '🥤'}
                   </div>

                   {/* Details */}
                   <div className="flex-1 pr-16">
                      <h3 className="text-xl font-extrabold text-[#004876]">{item.productName}</h3>
                      
                      {/* --- CONDITIONAL NAME INPUT --- */}
                      <div className="flex items-center gap-2 mt-1 mb-2">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">For:</span>
                        <input 
                           type="text"
                           value={item.recipientName}
                           onChange={(e) => updateItemName(item.internalId, e.target.value)}
                           className="font-bold text-[#32A5DC] tracking-wide bg-transparent border-b border-dashed border-gray-300 focus:border-[#32A5DC] outline-none w-full max-w-[200px]"
                        />
                      </div>
                      
                      <div className="text-sm text-gray-500 space-y-1 mt-1">
                        <p>{item.temperature} • {item.shots} Shots</p>
                        <p>{item.milkName}</p>
                        {item.syrupDetails.length > 0 && (
                          <p className="text-gray-400 text-xs italic">
                            {item.syrupDetails.join(", ")}
                          </p>
                        )}
                      </div>
                   </div>
                </div>
             </div>
           ))}
         </div>

         {/* Summary & Checkout */}
         <div className="mt-8 border-t border-gray-200 pt-6">
            <div className="flex justify-between items-end mb-6">
               <span className="text-gray-500 font-medium">Total Items</span>
               <span className="text-3xl font-extrabold text-[#004876]">{items.length}</span>
            </div>
            
            {/* Split Button Layout */}
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={handleAddMore}
                className="bg-white border-2 border-[#32A5DC] text-[#32A5DC] font-bold py-4 rounded-xl shadow-lg hover:bg-[#32A5DC]/5 transition-all transform hover:scale-[1.02] flex justify-center items-center gap-2 cursor-pointer"
              >
                Order More
              </button>
              
              <button 
                onClick={handleCheckout}
                disabled={isSubmitting}
                className="bg-[#004876] text-white font-bold py-4 rounded-xl shadow-xl hover:bg-[#32A5DC] transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 cursor-pointer"
              >
                {isSubmitting ? "Processing..." : "Confirm & Place Order"}
              </button>
            </div>
         </div>

       </div>
    </main>
  );
}