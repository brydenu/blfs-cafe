'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/providers/CartProvider";
import { useToast } from "@/providers/ToastProvider";

type AnyProduct = { id: number; name: string; description?: string | null; category: string };

interface MenuGridProps {
  products: AnyProduct[];
  favorites: any[];
  ingredients: any[];
  userName?: string; // Added to support "My Name" default
}

export default function MenuGrid({ products = [], favorites = [], ingredients = [], userName = "Guest" }: MenuGridProps) {
  const { cartCount, orderMode, setOrderMode, addToCart } = useCart();
  const { showToast } = useToast();
  const router = useRouter();

  // --- STATE ---
  const [activeQuickAddId, setActiveQuickAddId] = useState<number | null>(null);
  const [quickAddName, setQuickAddName] = useState("");

  // --- CONSTANT: LOGIC LOCK ---
  const isMultiForced = cartCount > 0;

  // --- EFFECT: FORCE MULTI MODE ---
  useEffect(() => {
    if (isMultiForced && orderMode !== 'multi') {
      setOrderMode('multi');
    }
  }, [isMultiForced, orderMode, setOrderMode]);

  // Categories
  const categories = ["all", ...Array.from(new Set(products.map((p) => p.category)))];
  const [activeCategory, setActiveCategory] = useState("all");

  const filteredProducts = activeCategory === "all" 
    ? products 
    : products.filter((p) => p.category === activeCategory);


  // --- HELPER: CREATE ITEM FROM FAVORITE CONFIG ---
  const createItemFromFavorite = (fav: any, nameOverride?: string) => {
    const config = JSON.parse(fav.configuration); 
    
    // Resolve Milk Name
    let milkName = "No Milk";
    const milks = ingredients.filter((i: any) => i.category === 'milk');
    if (config.milkId) {
        const m = milks.find((x: any) => x.id === config.milkId);
        if (m) milkName = m.name;
    }

    // Resolve Syrup Names
    const syrupDetails: string[] = [];
    if (config.modifiers) {
        Object.entries(config.modifiers).forEach(([idStr, count]: [string, any]) => {
            const ing = ingredients.find((i: any) => i.id === parseInt(idStr));
            if (ing) syrupDetails.push(`${ing.name} (${count})`);
        });
    }

    // LOGIC UPDATE: Use nameOverride -> userName -> fav.customName
    // If it's "Single Mode" or we have a User Name, prefer that over "My Morning Fuel"
    const finalRecipientName = nameOverride || (userName !== "Guest" ? userName : fav.customName);

    return {
        internalId: Date.now().toString(),
        productId: fav.product.id,
        productName: fav.product.name,
        productCategory: fav.product.category,
        recipientName: finalRecipientName, 
        shots: config.shots || 0,
        temperature: config.temperature || "Hot", // Use saved temp or default
        milkName: milkName,
        syrupDetails: syrupDetails,
        modifiers: config.modifiers || {},
        milkId: config.milkId // Pass ID for editing later
    };
  };

  // --- HANDLER: CLICK QUICK ADD (+) ---
  const handleQuickAddClick = (fav: any) => {
    if (orderMode === 'single') {
        // Solo Mode: Add immediately and go to checkout
        const item = createItemFromFavorite(fav);
        addToCart(item);
        router.push('/cart');
    } else {
        // Multi Mode: Show input field
        setActiveQuickAddId(fav.id);
        setQuickAddName(""); 
    }
  };

  // --- HANDLER: CONFIRM QUICK ADD (Multi Mode) ---
  const confirmQuickAdd = (fav: any) => {
    if (!quickAddName.trim()) return; 
    
    const item = createItemFromFavorite(fav, quickAddName);
    addToCart(item);
    
    setActiveQuickAddId(null);
    setQuickAddName("");
    
    showToast(`Added ${fav.product.name} for ${item.recipientName}`);
  };

  return (
    <div className="w-full max-w-5xl mx-auto pb-20 relative">
      
      {/* FAVORITES */}
      {favorites.length > 0 && (
        <div className="mb-12 animate-fade-in">
            <h2 className="text-white text-lg font-bold mb-4 flex items-center gap-2 opacity-90">
                <span className="text-yellow-400">★</span> Your Favorites
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {favorites.map((fav) => {
                    const isEditing = activeQuickAddId === fav.id;
                    
                    // LOGIC UPDATE: Create the config string for the Customizer Link
                    const configStr = encodeURIComponent(fav.configuration);

                    return (
                        <div 
                            key={fav.id}
                            className={`bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-xl transition-all relative overflow-hidden ${isEditing ? 'bg-white/20 ring-2 ring-[#32A5DC]' : 'hover:bg-white/20'}`}
                        >
                            {!isEditing && (
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-xl shadow-lg shrink-0">
                                        {fav.product.category === 'coffee' ? '☕' : '🥤'}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-white font-bold truncate">{fav.customName}</h3>
                                        <p className="text-blue-200 text-xs truncate">{fav.product.name}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        {/* LOGIC UPDATE: Pass 'config' so CustomizeForm loads it */}
                                        <Link href={`/menu/${fav.product.id}?config=${configStr}&mode=${orderMode}`}>
                                            <button className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white hover:text-[#004876] transition-colors cursor-pointer" title="Customize">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                                </svg>
                                            </button>
                                        </Link>
                                        <button 
                                            onClick={() => handleQuickAddClick(fav)}
                                            className="w-8 h-8 rounded-full bg-[#32A5DC] text-white flex items-center justify-center shadow-md hover:scale-110 transition-transform cursor-pointer" 
                                            title={orderMode === 'single' ? "Order Now" : "Quick Add"}
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            )}

                            {isEditing && (
                                <div className="flex items-center gap-2 w-full animate-in fade-in zoom-in duration-200">
                                    <input 
                                        type="text" 
                                        autoFocus
                                        value={quickAddName}
                                        onChange={(e) => setQuickAddName(e.target.value)}
                                        placeholder="Name?"
                                        className="flex-1 bg-white/90 text-[#004876] text-sm font-bold px-3 py-1.5 rounded-lg outline-none focus:ring-2 focus:ring-[#32A5DC]"
                                        onKeyDown={(e) => e.key === 'Enter' && confirmQuickAdd(fav)}
                                    />
                                    <button 
                                        onClick={() => confirmQuickAdd(fav)}
                                        className="w-8 h-8 rounded-lg bg-[#32A5DC] text-white flex items-center justify-center shadow-lg hover:bg-[#288bba] cursor-pointer"
                                    >
                                        ✓
                                    </button>
                                    <button 
                                        onClick={() => setActiveQuickAddId(null)}
                                        className="w-8 h-8 rounded-lg bg-red-500/20 text-red-100 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                                    >
                                        ✕
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
      )}

      {/* ORDER MODE TOGGLE */}
      <div className="flex justify-center mb-8">
        <div className="bg-white/10 p-1 rounded-full flex relative backdrop-blur-md border border-white/20">
          <button
            onClick={() => setOrderMode('single')}
            disabled={isMultiForced} 
            className={`px-6 py-3 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-2 cursor-pointer ${
              orderMode === 'single' 
                ? 'bg-white text-[#004876] shadow-lg scale-105' 
                : isMultiForced 
                    ? 'text-gray-400 cursor-not-allowed opacity-50' 
                    : 'text-blue-100 hover:text-white'
            }`}
          >
            Just Me
          </button>
          <button
            onClick={() => setOrderMode('multi')}
            className={`px-6 py-3 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-2 cursor-pointer ${
              orderMode === 'multi' 
                ? 'bg-white text-[#004876] shadow-lg scale-105' 
                : 'text-blue-100 hover:text-white'
            }`}
          >
            Group Order
          </button>
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex justify-center mb-10">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-full p-1 flex gap-1 flex-wrap justify-center">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-2 rounded-full text-sm font-bold uppercase tracking-wide transition-all duration-200 cursor-pointer ${
                activeCategory === cat
                  ? "bg-white text-[#004876] shadow-sm"
                  : "text-blue-100 hover:text-white hover:bg-white/10"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredProducts.map((product) => (
          <Link href={`/menu/${product.id}?mode=${orderMode}`} key={product.id} className="block group">
            <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden flex transform hover:-translate-y-1 min-h-[120px] cursor-pointer">
              <div className="w-24 sm:w-32 bg-gray-50 flex items-center justify-center shrink-0 border-r border-gray-100 group-hover:bg-[#32A5DC]/10 transition-colors">
                <span className="text-4xl sm:text-5xl drop-shadow-sm filter grayscale group-hover:grayscale-0 transition-all duration-300">
                  {product.category === 'coffee' ? '☕' : product.category === 'tea' ? '🍵' : '🥤'}
                </span>
              </div>

              <div className="flex-1 p-5 flex flex-col justify-center">
                <h3 className="text-xl font-extrabold text-[#004876] mb-2 group-hover:text-[#32A5DC] transition-colors">
                  {product.name}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed line-clamp-2">
                  {product.description || "No description available."}
                </p>
                <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-xs font-bold text-[#32A5DC] uppercase tracking-wider flex items-center gap-1">
                  Customize <span className="text-lg">→</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* FLOATING CART BUTTON */}
      {cartCount > 0 && (
        <div className="fixed bottom-6 right-6 z-50">
          <Link href="/cart">
            <button className="bg-[#32A5DC] text-white font-bold py-4 px-8 rounded-full shadow-2xl hover:scale-105 transition-transform flex items-center gap-3 animate-bounce-in cursor-pointer">
              <span className="bg-white text-[#004876] w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold">
                {cartCount}
              </span>
              <span>View Order</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}