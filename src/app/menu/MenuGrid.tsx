'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/providers/CartProvider";
import { useToast } from "@/providers/ToastProvider";
import { CoffeeIcon, TeaIcon, DrinkIcon } from "@/components/icons";

type AnyProduct = { id: number; name: string; description?: string | null; category: string; isActive?: boolean; imageUrl?: string | null };

interface MenuGridProps {
  products: AnyProduct[];
  favorites: any[];
  featuredDrinks?: any[];
  ingredients: any[];
  userName?: string; // Added to support "My Name" default
}

export default function MenuGrid({ products = [], favorites = [], featuredDrinks = [], ingredients = [], userName = "Guest" }: MenuGridProps) {
  const { cartCount, orderMode, setOrderMode, addToCart } = useCart();
  const { showToast } = useToast();
  const router = useRouter();

  // --- STATE ---
  const [activeQuickAddId, setActiveQuickAddId] = useState<number | null>(null);
  const [quickAddName, setQuickAddName] = useState("");
  const [favoritesExpanded, setFavoritesExpanded] = useState(true);
  const [featuredExpanded, setFeaturedExpanded] = useState(true);

  // --- CONSTANT: LOGIC LOCK ---
  const isMultiForced = cartCount > 0;

  // --- EFFECT: FORCE MULTI MODE ---
  useEffect(() => {
    if (isMultiForced && orderMode !== 'multi') {
      setOrderMode('multi');
    }
  }, [isMultiForced, orderMode, setOrderMode]);

  // Categories - Explicit order: All, Coffee, Tea, Other
  const allCategories = Array.from(new Set(products.map((p) => p.category)));
  const orderedCategories = ["all", "coffee", "tea", "other"].filter(
    (cat) => cat === "all" || allCategories.includes(cat)
  );
  const categories = [
    ...orderedCategories,
    ...allCategories.filter((c) => !["coffee", "tea", "other"].includes(c)),
  ];
  const [activeCategory, setActiveCategory] = useState("all");

  const filteredProducts = activeCategory === "all" 
    ? products 
    : products.filter((p) => p.category === activeCategory);

  // Filter favorites and featured drinks by category
  const filteredFavorites = activeCategory === "all"
    ? favorites
    : favorites.filter((fav) => fav.product.category === activeCategory);

  const filteredFeaturedDrinks = activeCategory === "all"
    ? (featuredDrinks || [])
    : (featuredDrinks || []).filter((fd) => fd.product.category === activeCategory);


  // --- HELPER: CREATE ITEM FROM FAVORITE OR FEATURED CONFIG ---
  const createItemFromFavorite = (fav: any, nameOverride?: string) => {
    const config = typeof fav.configuration === 'string' ? JSON.parse(fav.configuration) : fav.configuration; 
    
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

  // Helper function for category icon
  const getCategoryIcon = (category: string, size: number = 48) => {
    switch (category.toLowerCase()) {
      case 'coffee':
        return <CoffeeIcon size={size} className="drop-shadow-sm" />;
      case 'tea':
        return <TeaIcon size={size} className="drop-shadow-sm" />;
      default:
        return <DrinkIcon size={size} className="drop-shadow-sm" />;
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto pb-20 relative">
      
      {/* ORDER MODE TOGGLE */}
      <div className="flex justify-center mb-8">
        <div className="bg-white/10 p-1 rounded-full flex relative backdrop-blur-md border border-white/20">
          <button
            onClick={() => setOrderMode('single')}
            disabled={isMultiForced} 
            className={`px-6 py-3 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-2 cursor-pointer active:scale-95 ${
              orderMode === 'single' 
                ? 'bg-white text-[#004876] shadow-lg scale-105' 
                : isMultiForced 
                    ? 'text-gray-400 cursor-not-allowed opacity-50 disabled:active:scale-100' 
                    : 'text-blue-100 hover:text-white'
            }`}
          >
            Just Me
          </button>
          <button
            onClick={() => setOrderMode('multi')}
            className={`px-6 py-3 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-2 cursor-pointer active:scale-95 ${
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
        <div className="md:bg-white/5 md:backdrop-blur-sm md:border md:border-white/10 md:rounded-full md:p-1 flex gap-2 md:gap-1 flex-wrap justify-center">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 md:px-6 rounded-full text-sm font-bold uppercase tracking-wide transition-all duration-200 cursor-pointer ${
                activeCategory === cat
                  ? "bg-[#32A5DC] text-white shadow-sm md:bg-white md:text-[#004876]"
                  : "text-blue-100 hover:text-white bg-white/5 border border-white/10 md:bg-transparent md:border-0 hover:bg-white/10"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* FEATURED DRINKS */}
      {filteredFeaturedDrinks.length > 0 && (
        <div className="mb-12 animate-fade-in">
            <button
              onClick={() => setFeaturedExpanded(!featuredExpanded)}
              className="text-blue-200 text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 hover:text-blue-100 transition-colors cursor-pointer w-full text-left"
            >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  strokeWidth={2.5} 
                  stroke="currentColor" 
                  className={`w-4 h-4 transition-transform duration-300 ${featuredExpanded ? 'rotate-90' : ''}`}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
                FEATURED DRINKS
            </button>
            <div 
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                featuredExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredFeaturedDrinks.map((featured) => {
                  const configStr = encodeURIComponent(JSON.stringify(featured.configuration));

                  return (
                    <Link 
                      key={featured.id}
                      href={`/menu/${featured.product.id}?config=${configStr}&mode=${orderMode}`}
                      className="block group"
                    >
                      <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden flex transform hover:-translate-y-1 min-h-[120px] cursor-pointer">
                        <div className="w-24 sm:w-32 bg-gray-50 flex items-center justify-center shrink-0 border-r border-gray-100 group-hover:bg-[#32A5DC]/10 transition-colors">
                          {featured.product.imageUrl ? (
                            <img 
                              src={featured.product.imageUrl} 
                              alt={featured.product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-gray-400 group-hover:text-gray-600 transition-all duration-300">
                              {getCategoryIcon(featured.product.category, 48)}
                            </div>
                          )}
                        </div>

                        <div className="flex-1 p-5 flex flex-col justify-center">
                          <h3 className="text-xl font-extrabold text-[#004876] mb-2 group-hover:text-[#32A5DC] transition-colors">
                            {featured.customName}
                          </h3>
                          <p className="text-gray-500 text-sm leading-relaxed line-clamp-2">
                            {featured.description || featured.product.name}
                          </p>
                          <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-xs font-bold text-[#32A5DC] uppercase tracking-wider flex items-center gap-1">
                            Customize <span className="text-lg">→</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
                </div>
              </div>
            </div>
        </div>
      )}

      {/* FAVORITES */}
      {filteredFavorites.length > 0 && (
        <div className="mb-12 animate-fade-in">
            <button
              onClick={() => setFavoritesExpanded(!favoritesExpanded)}
              className="text-blue-200 text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 hover:text-blue-100 transition-all active:scale-95 cursor-pointer w-full text-left"
            >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  strokeWidth={2.5} 
                  stroke="currentColor" 
                  className={`w-4 h-4 transition-transform duration-300 ${favoritesExpanded ? 'rotate-90' : ''}`}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
                YOUR FAVORITES
            </button>
            <div 
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                favoritesExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredFavorites.map((fav) => {
                  const configStr = encodeURIComponent(JSON.stringify(fav.configuration));

                  return (
                    <Link 
                      key={fav.id}
                      href={`/menu/${fav.product.id}?config=${configStr}&mode=${orderMode}`}
                      className="block group"
                    >
                      <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden flex transform hover:-translate-y-1 min-h-[120px] cursor-pointer">
                        <div className="w-24 sm:w-32 bg-gray-50 flex items-center justify-center shrink-0 border-r border-gray-100 group-hover:bg-[#32A5DC]/10 transition-colors">
                          {fav.product.imageUrl ? (
                            <img 
                              src={fav.product.imageUrl} 
                              alt={fav.product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-gray-400 group-hover:text-gray-600 transition-all duration-300">
                              {getCategoryIcon(fav.product.category, 48)}
                            </div>
                          )}
                        </div>

                        <div className="flex-1 p-5 flex flex-col justify-center">
                          <h3 className="text-xl font-extrabold text-[#004876] mb-2 group-hover:text-[#32A5DC] transition-colors">
                            {fav.customName}
                          </h3>
                          <p className="text-gray-500 text-sm leading-relaxed line-clamp-2">
                            {fav.product.name}
                          </p>
                          <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-xs font-bold text-[#32A5DC] uppercase tracking-wider flex items-center gap-1">
                            Customize <span className="text-lg">→</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
                </div>
              </div>
            </div>
        </div>
      )}

      {/* GRID - Grouped by Category */}
      {(() => {
        // Group products by category
        const productsByCategory: Record<string, typeof filteredProducts> = {};
        filteredProducts.forEach((product) => {
          const category = product.category.toLowerCase();
          if (!productsByCategory[category]) {
            productsByCategory[category] = [];
          }
          productsByCategory[category].push(product);
        });

        // Define category order and labels
        const categoryOrder = ['coffee', 'tea', 'other'];
        const categoryLabels: Record<string, string> = {
          coffee: 'COFFEE',
          tea: 'TEA',
          other: 'OTHER'
        };

        return (
          <>
            {categoryOrder.map((catKey) => {
              const categoryProducts = productsByCategory[catKey] || [];
              if (categoryProducts.length === 0) return null;

              return (
                <div key={catKey} className="mb-12">
                  <h2 className="text-blue-200 text-sm font-bold uppercase tracking-wider mb-4">
                    {categoryLabels[catKey]}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {categoryProducts.map((product) => {
                      const isActive = product.isActive !== false; // Default to true if not specified

                      if (!isActive) {
                        // Disabled product - not clickable
                        return (
                          <div key={product.id} className="block group">
                            <div className="bg-white/60 rounded-xl shadow-lg overflow-hidden flex min-h-[120px] relative opacity-60 cursor-not-allowed">
                              {/* Disabled Badge */}
                              <div className="absolute top-2 right-2 z-10 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                                Unavailable
                              </div>
                              
                              <div className="w-24 sm:w-32 bg-gray-50 flex items-center justify-center shrink-0 border-r border-gray-100">
                                {product.imageUrl ? (
                                  <img 
                                    src={product.imageUrl} 
                                    alt={product.name}
                                    className="w-full h-full object-cover grayscale"
                                  />
                                ) : (
                                  <div className="text-gray-400">
                                    {getCategoryIcon(product.category, 48)}
                                  </div>
                                )}
                              </div>

                              <div className="flex-1 p-5 flex flex-col justify-center">
                                <h3 className="text-xl font-extrabold text-gray-500 mb-2">
                                  {product.name}
                                </h3>
                                <p className="text-gray-400 text-sm leading-relaxed line-clamp-2">
                                  {product.description || "No description available."}
                                </p>
                                {/* Spacer to match active card height - same structure as active card */}
                                <div className="mt-3 opacity-0 text-xs font-bold text-[#32A5DC] uppercase tracking-wider flex items-center gap-1">
                                  <span>Customize</span> <span className="text-lg">→</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      // Active product - clickable
                      return (
                        <Link href={`/menu/${product.id}?mode=${orderMode}`} key={product.id} className="block group">
                          <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden flex transform hover:-translate-y-1 min-h-[120px] cursor-pointer">
                            <div className="w-24 sm:w-32 bg-gray-50 flex items-center justify-center shrink-0 border-r border-gray-100 group-hover:bg-[#32A5DC]/10 transition-colors">
                              {product.imageUrl ? (
                                <img 
                                  src={product.imageUrl} 
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="text-gray-400 group-hover:text-gray-600 transition-all duration-300">
                                  {getCategoryIcon(product.category, 48)}
                                </div>
                              )}
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
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {/* Handle any other categories not in the standard list */}
            {Object.keys(productsByCategory).filter(cat => !categoryOrder.includes(cat)).map((catKey) => {
              const categoryProducts = productsByCategory[catKey] || [];
              if (categoryProducts.length === 0) return null;

              return (
                <div key={catKey} className="mb-12">
                  <h2 className="text-blue-200 text-sm font-bold uppercase tracking-wider mb-4">
                    {catKey.toUpperCase()}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {categoryProducts.map((product) => {
                      const isActive = product.isActive !== false;

                      if (!isActive) {
                        return (
                          <div key={product.id} className="block group">
                            <div className="bg-white/60 rounded-xl shadow-lg overflow-hidden flex min-h-[120px] relative opacity-60 cursor-not-allowed">
                              <div className="absolute top-2 right-2 z-10 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                                Unavailable
                              </div>
                              <div className="w-24 sm:w-32 bg-gray-50 flex items-center justify-center shrink-0 border-r border-gray-100">
                                {product.imageUrl ? (
                                  <img 
                                    src={product.imageUrl} 
                                    alt={product.name}
                                    className="w-full h-full object-cover grayscale"
                                  />
                                ) : (
                                  <div className="text-gray-400">
                                    {getCategoryIcon(product.category, 48)}
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 p-5 flex flex-col justify-center">
                                <h3 className="text-xl font-extrabold text-gray-500 mb-2">
                                  {product.name}
                                </h3>
                                <p className="text-gray-400 text-sm leading-relaxed line-clamp-2">
                                  {product.description || "No description available."}
                                </p>
                                <div className="mt-3 opacity-0 text-xs font-bold text-[#32A5DC] uppercase tracking-wider flex items-center gap-1">
                                  <span>Customize</span> <span className="text-lg">→</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <Link href={`/menu/${product.id}?mode=${orderMode}`} key={product.id} className="block group">
                          <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden flex transform hover:-translate-y-1 min-h-[120px] cursor-pointer">
                            <div className="w-24 sm:w-32 bg-gray-50 flex items-center justify-center shrink-0 border-r border-gray-100 group-hover:bg-[#32A5DC]/10 transition-colors">
                              {product.imageUrl ? (
                                <img 
                                  src={product.imageUrl} 
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="text-gray-400 group-hover:text-gray-600 transition-all duration-300">
                                  {getCategoryIcon(product.category, 48)}
                                </div>
                              )}
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
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </>
        );
      })()}

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