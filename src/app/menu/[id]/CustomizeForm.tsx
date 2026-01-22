'use client';

import { useState, useEffect } from "react";
import { Ingredient, Product } from "@prisma/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart, CartItem } from "@/providers/CartProvider";
import { useToast } from "@/providers/ToastProvider";
import { placeOrder } from "@/app/cart/actions";
import ErrorModal from "@/components/ErrorModal";

interface CustomizeFormProps {
  product: Product;
  ingredients: Ingredient[];
  defaultName: string;
  defaultDisplayName?: string;
  userLastName?: string | null;
  onConfigChange?: (config: any) => void; // Optional callback for configuration changes
  hideNameField?: boolean; // Hide the name/recipient field
  hideOrderButtons?: boolean; // Hide the order action buttons
}

export default function CustomizeForm({ product, ingredients, defaultName, defaultDisplayName, userLastName, onConfigChange, hideNameField = false, hideOrderButtons = false }: CustomizeFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToCart, removeFromCart, clearCart, setOrderMode } = useCart();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorModal, setErrorModal] = useState<{ isOpen: boolean; message: string }>({ isOpen: false, message: '' });

  // --- QUERY PARAMS ---
  const configParam = searchParams.get('config');
  const editId = searchParams.get('editId'); // If present, we are editing this cart item
  const mode = searchParams.get('mode');

  // Parse Initial Configuration (From URL or Default)
  let initialConfig: any = {};
  if (configParam) {
    try {
        initialConfig = JSON.parse(decodeURIComponent(configParam));
    } catch (e) {
        console.error("Failed to parse config", e);
    }
  }

  // --- DRINK RULES ---
  const getProductRules = () => {
    const name = product.name.toLowerCase();
    const cat = product.category;
    let rules = { defaultShots: 0, requiresMilk: false, shotLabel: "Add Espresso Shot(s)" };
    if (cat === 'coffee') { rules.defaultShots = 2; rules.shotLabel = "Espresso Shots"; }
    if (name.includes('latte') || name.includes('cappuccino') || name.includes('macchiato') || name.includes('steamer')) rules.requiresMilk = true;
    if (name.includes('americano')) rules.requiresMilk = false;
    return rules;
  };
  const rules = getProductRules();

  // --- PRESET LOGIC ---
  // Get preset modifiers based on product name (only if no initialConfig)
  const getPresetModifiers = (): Record<number, number> => {
    if (initialConfig?.modifiers) return {}; // Don't override if editing
    const name = product.name.toLowerCase();
    const presetModifiers: Record<number, number> = {};
    
    // Find ingredient IDs
    const vanilla = ingredients.find(i => i.name === 'Vanilla');
    const caramelDrizzle = ingredients.find(i => i.name === 'Caramel Drizzle');
    const matchaScoops = ingredients.find(i => i.name === 'Matcha Scoops');
    
    // Caramel Macchiato: 3 vanilla + caramel drizzle
    if (name.includes('caramel macchiato')) {
      if (vanilla) presetModifiers[vanilla.id] = 3;
      if (caramelDrizzle) presetModifiers[caramelDrizzle.id] = 2; // Medium drizzle (2 = Medium in quantity selector)
    }
    
    // London Fog: 4 vanilla
    if (name.includes('london fog')) {
      if (vanilla) presetModifiers[vanilla.id] = 4;
    }
    
    // Matcha Latte: 2 scoops matcha
    if (name.includes('matcha latte')) {
      if (matchaScoops) presetModifiers[matchaScoops.id] = 2;
    }
    
    return presetModifiers;
  };

  // --- INGREDIENTS FILTER ---
  const milks = ingredients
    .filter(i => i.category === 'milk')
    .sort((a, b) => {
      // Put "Whole" first
      if (a.name === "Whole") return -1;
      if (b.name === "Whole") return 1;
      // Keep other milks in original order
      return 0;
    });
  const sweeteners = ingredients.filter(i => i.category === 'sweetener');
  const toppings = ingredients.filter(i => i.category === 'topping');
  const allSyrups = ingredients.filter(i => i.category === 'syrup');
  const otherIngredients = ingredients.filter(i => i.category === 'other');
  
  // Separate other ingredients by measurement type
  const matchaScoops = otherIngredients.find(i => i.name === 'Matcha Scoops');
  const chaiConcentrate = otherIngredients.find(i => i.name === 'Chai Concentrate');
  
  const featuredSyrups = allSyrups.filter(i => i.rank > 0).sort((a, b) => a.rank - b.rank);
  const otherSyrups = allSyrups.filter(i => i.rank === 0).sort((a, b) => a.name.localeCompare(b.name));

  // --- STATE ---
  // Determine if guest user
  const isGuest = defaultName === "Guest";
  // Determine order mode
  const orderMode = mode || 'single';
  const isGroupOrder = orderMode === 'multi';
  const isSoloOrder = !isGroupOrder;
  
  // Name field logic: Guest always empty, Group always empty, Single locked with user name
  const shouldLockName = !isGuest && !isGroupOrder;
  const [isNameEditable, setIsNameEditable] = useState(!shouldLockName);
  const [nameError, setNameError] = useState("");
  
  // Name defaults based on mode - use defaultDisplayName for solo orders
  const displayName = defaultDisplayName || defaultName;
  const [recipientName, setRecipientName] = useState(() => {
      if (initialConfig.recipientName) return initialConfig.recipientName;
      // Guest or group: start empty
      if (isGuest || isGroupOrder) return "";
      // Single order: use formatted display name (firstName + lastInitial)
      return displayName;
  });
  
  const [baseTemp, setBaseTemp] = useState<"Hot" | "Iced">(() => {
    if (initialConfig?.temperature) return initialConfig.temperature.startsWith("Iced") ? "Iced" : "Hot";
    return (product.forceTemperature as "Hot" | "Iced") || "Hot";
  });

  const [tempLevel, setTempLevel] = useState(() => {
      if (initialConfig?.temperature && initialConfig.temperature.includes(" - ")) {
          const parts = initialConfig.temperature.split(" - ");
          if (parts.length > 1) {
              return parts[1].trim();
          }
      }
      return "Standard";
  });

  const [shots, setShots] = useState(initialConfig?.shots ?? product.defaultShots);
  
  const [selectedMilk, setSelectedMilk] = useState<number | null>(() => {
    if (initialConfig?.milkId !== undefined) {
      // If editing, check if the selected milk is still available
      const milk = milks.find(m => m.id === initialConfig.milkId);
      if (milk && milk.isAvailable) return initialConfig.milkId;
      // If unavailable, try to find an available milk
      const availableMilk = milks.find(m => m.isAvailable);
      return availableMilk ? availableMilk.id : null;
    }
    // Check if we can infer milk from name if editing from cart (legacy support)
    if (initialConfig?.milkName && initialConfig.milkName !== "No Milk") {
        const found = milks.find(m => m.name === initialConfig.milkName);
        if (found && found.isAvailable) return found.id;
        // If found but unavailable, try to find an available milk
        if (found) {
          const availableMilk = milks.find(m => m.isAvailable);
          return availableMilk ? availableMilk.id : null;
        }
    }
    // London Fog preset: whole milk
    const name = product.name.toLowerCase();
    if (name.includes('london fog') && !initialConfig?.milkId) {
      const wholeMilk = milks.find(m => m.name === 'Whole' && m.isAvailable);
      if (wholeMilk) return wholeMilk.id;
    }
    // For new orders, prefer available milks
    if (product.requiresMilk && milks.length > 0) {
      const availableMilk = milks.find(m => m.isAvailable);
      return availableMilk ? availableMilk.id : null;
    }
    return null;
  });

  // Get preset modifiers
  const presetModifiers = getPresetModifiers();
  const initialModifiers = initialConfig?.modifiers || presetModifiers;
  
  const [modifiers, setModifiers] = useState<Record<number, number>>(initialModifiers);
  
  // Determine initial open section based on presets (after variables are defined)
  const getInitialOpenSection = (): string | null => {
    if (initialModifiers && Object.keys(initialModifiers).length > 0) {
      // Check if matcha scoops or chai concentrate are preset
      if (matchaScoops && initialModifiers[matchaScoops.id]) {
        return 'other';
      }
      if (chaiConcentrate && initialModifiers[chaiConcentrate.id]) {
        return 'other';
      }
      return 'syrups';
    }
    return null;
  };
  
  const [openSection, setOpenSection] = useState<string | null>(getInitialOpenSection());
  
  // New customization fields
  const [personalCup, setPersonalCup] = useState(initialConfig?.personalCup || false);
  const [caffeineType, setCaffeineType] = useState(initialConfig?.caffeineType || "Normal");
  
  // London Fog preset: steamed whole milk
  const getPresetMilkSteamed = (): boolean => {
    if (initialConfig?.milkSteamed !== undefined) return initialConfig.milkSteamed;
    const name = product.name.toLowerCase();
    if (name.includes('london fog')) return true;
    return false;
  };
  
  const [milkSteamed, setMilkSteamed] = useState(getPresetMilkSteamed());
  const [foamLevel, setFoamLevel] = useState(initialConfig?.foamLevel || "Normal");
  const [milkAmount, setMilkAmount] = useState(initialConfig?.milkAmount || "Normal");
  const [notes, setNotes] = useState(initialConfig?.notes || initialConfig?.specialInstructions || "");

  // --- HANDLERS ---
  const handleModifierChange = (id: number, increment: boolean) => {
    // Prevent adding unavailable ingredients
    const ingredient = ingredients.find(i => i.id === id);
    if (increment && ingredient && !ingredient.isAvailable) {
      return; // Don't allow adding unavailable ingredients
    }
    
    setModifiers(prev => {
      const current = prev[id] || 0;
      const next = increment ? current + 1 : Math.max(0, current - 1);
      if (next === 0) { const copy = { ...prev }; delete copy[id]; return copy; }
      return { ...prev, [id]: next };
    });
  };

  const buildConfiguration = () => {
    return {
      shots: shots,
      temperature: `${baseTemp}${tempLevel !== 'Standard' ? ` - ${tempLevel}` : ''}`,
      milkId: selectedMilk !== null && selectedMilk !== -1 ? selectedMilk : null,
      modifiers: modifiers,
      personalCup: personalCup,
      caffeineType: shots > 0 ? caffeineType : undefined,
      milkSteamed: (baseTemp === "Hot" && !product.requiresMilk && selectedMilk !== null && selectedMilk !== -1) ? milkSteamed : undefined,
      foamLevel: (baseTemp === "Hot" && (milkSteamed || product.requiresMilk)) ? foamLevel : undefined,
      milkAmount: (!product.requiresMilk && selectedMilk !== null && selectedMilk !== -1) ? milkAmount : undefined,
      notes: notes,
    };
  };

  // Call onConfigChange whenever relevant state changes
  useEffect(() => {
    if (onConfigChange) {
      onConfigChange(buildConfiguration());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shots, baseTemp, tempLevel, selectedMilk, modifiers, personalCup, caffeineType, milkSteamed, foamLevel, milkAmount, notes]);

  const createCartItem = (): CartItem => {
    let milkName = "No Milk";
    if (selectedMilk !== -1 && selectedMilk !== null) {
      const m = milks.find(x => x.id === selectedMilk);
      if (m) milkName = m.name;
    }

    const syrupDetails: string[] = [];
    Object.entries(modifiers).forEach(([idStr, count]) => {
      if (count > 0) {
         const ing = ingredients.find(i => i.id === parseInt(idStr));
         if (ing) syrupDetails.push(`${ing.name} (${count})`);
      }
    });

    // Get basePrice from product (serialized as number in page.tsx)
    const productWithPrice = product as Product & { basePrice?: number };

    const config = buildConfiguration();

    return {
      internalId: editId ? editId : Date.now().toString(), // Keep ID if editing
      productId: product.id,
      productName: product.name,
      productCategory: product.category,
      recipientName: recipientName || (shouldLockName ? defaultName : ""), 
      shots: config.shots,
      temperature: config.temperature,
      milkName: milkName,
      syrupDetails: syrupDetails,
      modifiers: config.modifiers,
      // Pass config back so it can be re-edited later
      milkId: config.milkId || undefined,
      personalCup: config.personalCup,
      caffeineType: config.caffeineType,
      milkSteamed: config.milkSteamed,
      foamLevel: config.foamLevel,
      milkAmount: config.milkAmount,
      notes: config.notes,
      basePrice: productWithPrice.basePrice || 0
    };
  };

  const processOrder = (redirectPath: string) => {
    // Validate name field - always required
    if (!recipientName.trim()) {
      setNameError("Please add a name to the order");
      return;
    }

    const newItem = createCartItem();

    if (editId) {
        // EDIT MODE: Remove old, add new (Updates in place effectively)
        removeFromCart(editId);
        addToCart(newItem);
        showToast("Order Updated");
    } else {
        // ADD MODE
        addToCart(newItem);
        if (redirectPath === '/menu') showToast(`${product.name} added`);
    }

    router.push(redirectPath);
  };

  const handleSoloOrder = async () => {
    // Validate name field - always required
    if (!recipientName.trim()) {
      setNameError("Please add a name to the order");
      return;
    }

    setIsSubmitting(true);

    try {
      const newItem = createCartItem();
      const result = await placeOrder([newItem]);

      if (result.success && result.orderId) {
        clearCart();
        router.push(`/order-confirmation/${result.orderId}`);
      } else {
        setErrorModal({ isOpen: true, message: result.message || "Something went wrong." });
        setIsSubmitting(false);
      }
    } catch (e) {
      console.error(e);
      setErrorModal({ isOpen: true, message: "Network error. Please try again." });
      setIsSubmitting(false);
    }
  };

  const handleSwitchToGroupOrder = () => {
    // Validate name field - always required
    if (!recipientName.trim()) {
      setNameError("Please add a name to the order");
      return;
    }

    const newItem = createCartItem();
    addToCart(newItem);
    setOrderMode('multi');
    router.push('/menu');
  };

  const Counter = ({ count, onMinus, onPlus, colorClass = "text-[#32A5DC]", disabled = false }: any) => (
    <div className={`flex items-center gap-3 bg-white rounded-full border border-gray-200 px-1 py-1 shadow-sm ${disabled ? 'opacity-50' : ''}`}>
      <button onClick={onMinus} disabled={count === 0 || disabled} className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 disabled:opacity-30 flex items-center justify-center hover:bg-gray-200 font-bold transition-colors cursor-pointer disabled:cursor-not-allowed">-</button>
      <span className={`w-6 text-center font-extrabold ${colorClass} ${disabled ? 'text-gray-400' : ''}`}>{count}</span>
      <button onClick={onPlus} disabled={disabled} className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white transition-colors ${disabled ? 'bg-gray-400 cursor-not-allowed' : colorClass.includes('32A5DC') ? 'bg-[#32A5DC] hover:bg-[#288bba] cursor-pointer' : 'bg-[#004876] hover:bg-[#003355] cursor-pointer'}`}>+</button>
    </div>
  );

  // Quantity Selector for Toppings (None, Light, Medium, Extra)
  const QuantitySelector = ({ currentValue, onChange, ingredientId, disabled = false }: { currentValue: number, onChange: (value: number) => void, ingredientId: number, disabled?: boolean }) => {
    const options = [
      { label: "None", value: 0 },
      { label: "Light", value: 1 },
      { label: "Medium", value: 2 },
      { label: "Extra", value: 3 }
    ];

    return (
      <div className={`flex bg-gray-100 p-1 rounded-lg gap-1 ${disabled ? 'opacity-50' : ''}`}>
        {options.map((opt) => {
          const isDisabled = disabled && opt.value !== 0;
          return (
            <button
              key={opt.value}
              onClick={() => !isDisabled && onChange(opt.value)}
              disabled={isDisabled}
              className={`flex-1 py-1.5 px-2 rounded text-xs font-bold transition-all ${
                isDisabled
                  ? 'text-gray-400 cursor-not-allowed'
                  : currentValue === opt.value
                    ? 'bg-white text-[#004876] shadow-sm'
                    : 'text-gray-600 hover:text-gray-800 cursor-pointer'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    );
  };

  // Check if product is inactive
  const isProductActive = (product as any).isActive !== false; // Default to true if not specified

  // If product is inactive, show disabled message
  if (!isProductActive) {
    return (
      <div className="w-full max-w-3xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden mb-20 relative z-10">
        <div className="p-8 text-center">
          <div className="bg-red-100 border-2 border-red-500 rounded-xl p-6 mb-6">
            <h2 className="text-2xl font-bold text-red-600 mb-2">This item is currently unavailable</h2>
            <p className="text-gray-600">{product.name} is temporarily unavailable for ordering.</p>
          </div>
          <Link 
            href="/menu" 
            className="inline-block bg-[#32A5DC] text-white font-bold py-3 px-6 rounded-xl hover:bg-[#288bba] transition-colors"
          >
            Back to Menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden mb-20 relative z-10">
      
      {/* Header */}
      <div className="bg-gray-50 p-8 flex flex-col items-center justify-center border-b border-gray-100">
        {product.imageUrl ? (
          <img 
            src={product.imageUrl} 
            alt={product.name}
            className="w-24 h-24 mb-4 object-cover rounded-lg drop-shadow-md"
          />
        ) : (
          <span className="text-6xl mb-4 filter drop-shadow-md">{product.category === 'coffee' ? '☕' : product.category === 'tea' ? '🍵' : '🥤'}</span>
        )}
        <h1 className="text-3xl font-extrabold text-[#004876] text-center">
            {editId ? `Edit ${product.name}` : product.name}
        </h1>
        <p className="text-gray-500 text-center mt-2 max-w-md text-sm">{product.description}</p>
      </div>

      <div className="p-6 md:p-8 space-y-8">
        
        {/* Name Input */}
        {!hideNameField && (
          <section className="animate-fade-in">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">
                  Who is this drink for?<span className="text-red-500 ml-1">*</span>
              </label>
              <input 
                  type="text" 
                  value={recipientName} 
                  onChange={(e) => {
                      setRecipientName(e.target.value);
                      if (nameError) setNameError(""); // Clear error when typing
                  }}
                  disabled={!isNameEditable}
                  required
                  className={`w-full p-4 rounded-xl border-2 text-lg font-bold text-[#004876] focus:border-[#32A5DC] outline-none transition-all placeholder-gray-300 ${
                      nameError 
                          ? 'border-red-300 bg-red-50' 
                          : isNameEditable 
                              ? 'border-gray-200 bg-gray-50 focus:bg-white' 
                              : 'border-gray-100 bg-gray-100 cursor-not-allowed opacity-75'
                  }`}
                  placeholder="Please enter a name"
              />
              {shouldLockName && !isNameEditable && (
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                      <span>Ordering for someone else?</span>
                      <button
                          onClick={() => setIsNameEditable(!isNameEditable)}
                          className="text-xs font-bold text-[#32A5DC] hover:text-[#288bba] transition-colors cursor-pointer underline"
                      >
                          Change Name
                      </button>
                  </p>
              )}
              {nameError && (
                  <p className="text-red-500 text-sm font-medium mt-1">{nameError}</p>
              )}
          </section>
        )}

        {/* Temperature & Shots */}
        <div className="grid md:grid-cols-2 gap-8">
            <section>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Temperature</h3>
                {product.forceTemperature && <span className="text-xs font-bold text-[#32A5DC] bg-[#32A5DC]/10 px-2 py-1 rounded">{product.forceTemperature} Only</span>}
              </div>
              <div className="space-y-3">
                  <div className="flex bg-gray-100 p-1 rounded-xl">
                    {(['Hot', 'Iced'] as const).map((opt) => {
                      const isDisabled = product.forceTemperature ? product.forceTemperature !== opt : false;
                      return (
                        <button key={opt} onClick={() => { if(!product.forceTemperature) { setBaseTemp(opt); setTempLevel("Standard"); } }} disabled={isDisabled}
                          className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${baseTemp === opt ? 'bg-white text-[#004876] shadow-md' : isDisabled ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-gray-700 cursor-pointer'}`}>
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  <select value={tempLevel} onChange={(e) => setTempLevel(e.target.value)} className="w-full p-3 pl-3 pr-10 rounded-xl border border-gray-200 bg-white text-gray-700 font-medium focus:ring-2 focus:ring-[#32A5DC] outline-none cursor-pointer">
                    {baseTemp === "Hot" ? <><option value="Standard">Standard Temp</option><option value="Warm">Warm (Kids Temp)</option><option value="Extra Hot">Extra Hot</option></> : <><option value="Standard">Standard Ice</option><option value="Light Ice">Light Ice</option><option value="Extra Ice">Extra Ice</option><option value="No Ice">No Ice</option></>}
                  </select>
              </div>
            </section>
            <section>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{rules.shotLabel}</h3>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 mb-3">
                    <span className="font-bold text-[#004876]">Total Shots</span>
                    <Counter count={shots} onMinus={() => setShots(Math.max(0, shots - 1))} onPlus={() => setShots(shots + 1)} colorClass="text-[#004876]" />
                </div>
                {/* Caffeine Type Selector */}
                <div className="space-y-2">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Caffeine Type</h4>
                    <div className="flex bg-gray-100 p-1 rounded-xl">
                        {(['Normal', 'Decaf', 'Half-Caff'] as const).map((opt) => (
                            <button 
                                key={opt}
                                onClick={() => setCaffeineType(opt)}
                                disabled={shots === 0}
                                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                                    caffeineType === opt 
                                        ? 'bg-white text-[#004876] shadow-md' 
                                        : shots === 0
                                            ? 'text-gray-300 cursor-not-allowed opacity-50'
                                            : 'text-gray-500 hover:text-gray-700 cursor-pointer'
                                }`}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>
            </section>
        </div>

        <hr className="border-gray-100" />
        
        {/* Personal Cup Checkbox */}
        <section>
            <label className="flex items-center gap-3 cursor-pointer">
                <input
                    type="checkbox"
                    checked={personalCup}
                    onChange={(e) => setPersonalCup(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-[#32A5DC] focus:ring-[#32A5DC] cursor-pointer"
                />
                <span className="text-sm font-bold text-[#004876]">Personal Cup</span>
            </label>
        </section>

        <hr className="border-gray-100" />
        
        {/* Milk */}
        <section>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Choice of Milk</h3>
            {product.requiresMilk && <span className="text-xs font-bold text-[#32A5DC] bg-[#32A5DC]/10 px-2 py-1 rounded">Required</span>}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <button onClick={() => setSelectedMilk(-1)} disabled={product.requiresMilk} className={`px-3 py-3 rounded-xl border-2 text-center text-sm font-bold transition-all ${product.requiresMilk ? 'opacity-40 cursor-not-allowed bg-gray-50 border-gray-100 text-gray-400' : selectedMilk === -1 ? 'border-gray-500 bg-gray-100 text-gray-800' : 'border-gray-100 text-gray-600 hover:border-gray-200 cursor-pointer'}`}>No Milk</button>
            {milks.map((milk) => {
              const isUnavailable = !milk.isAvailable;
              return (
                <button 
                  key={milk.id} 
                  onClick={() => !isUnavailable && setSelectedMilk(milk.id)} 
                  disabled={isUnavailable}
                  className={`px-3 py-3 rounded-xl border-2 text-center text-sm font-bold transition-all ${
                    isUnavailable 
                      ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-200 text-gray-400' 
                      : selectedMilk === milk.id 
                        ? 'border-[#32A5DC] bg-[#32A5DC]/5 text-[#004876] cursor-pointer' 
                        : 'border-gray-100 text-gray-600 hover:border-gray-200 cursor-pointer'
                  }`}
                  title={isUnavailable ? 'Out of stock' : undefined}
                >
                  {milk.name}{isUnavailable && <span className="text-xs text-gray-400 ml-1">(Out of Stock)</span>}
                </button>
              );
            })}
          </div>
        </section>

        {/* Milk Amount & Milk Steamed - For drinks with optional milk */}
        {!product.requiresMilk && selectedMilk !== null && selectedMilk !== -1 && (
          <section>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              {/* Milk Amount - Always shown for optional milk drinks */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 md:flex-1 md:max-w-[50%]">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest sm:min-w-[120px]">Milk Amount</h3>
                <select 
                  value={milkAmount} 
                  onChange={(e) => setMilkAmount(e.target.value)}
                  className="flex-1 sm:max-w-[200px] p-3 pl-3 pr-10 rounded-xl border border-gray-200 bg-white text-gray-700 font-medium focus:ring-2 focus:ring-[#32A5DC] outline-none cursor-pointer"
                >
                  <option value="Light">Light</option>
                  <option value="Normal">Normal</option>
                  <option value="Extra">Extra</option>
                </select>
              </div>
              
              {/* Milk Steamed Checkbox - Only for hot drinks */}
              {baseTemp === "Hot" && (
                <div className="flex items-center md:justify-center md:flex-1">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={milkSteamed}
                      onChange={(e) => {
                        setMilkSteamed(e.target.checked);
                        if (!e.target.checked) {
                          setFoamLevel("Normal"); // Reset foam level when unchecking
                        }
                      }}
                      disabled={selectedMilk === null || selectedMilk === -1}
                      className="w-5 h-5 rounded border-gray-300 text-[#32A5DC] focus:ring-[#32A5DC] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <span className={`text-sm font-bold ${selectedMilk === null || selectedMilk === -1 ? 'text-gray-400' : 'text-[#004876]'}`}>
                      Milk steamed?
                    </span>
                  </label>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Foam Level - Only for hot drinks */}
        {baseTemp === "Hot" && (
          <>

            {/* Foam Level Dropdown - Show when milk is steamed OR drink requires milk */}
            {(milkSteamed || product.requiresMilk) && (
              <section>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Foam Level</h3>
                <select 
                  value={foamLevel} 
                  onChange={(e) => setFoamLevel(e.target.value)}
                  className="w-full p-3 pl-3 pr-10 rounded-xl border border-gray-200 bg-white text-gray-700 font-medium focus:ring-2 focus:ring-[#32A5DC] outline-none cursor-pointer"
                >
                  {product.name.toLowerCase().includes('cappuccino') ? (
                    <>
                      <option value="Normal">Normal</option>
                      <option value="Extra">Extra</option>
                    </>
                  ) : (
                    <>
                      <option value="No foam">No foam</option>
                      <option value="Light">Light</option>
                      <option value="Normal">Normal</option>
                      <option value="Extra">Extra</option>
                    </>
                  )}
                </select>
              </section>
            )}
          </>
        )}

        <hr className="border-gray-100" />
        
        {/* Customizations */}
        <section className="space-y-3">
            {/* ... (Existing code for Accordions - No changes needed here, assuming previous file content) ... */}
            {/* For brevity, using the same accordion logic as before. It just works. */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
                <button onClick={() => setOpenSection(openSection === 'syrups' ? null : 'syrups')} className="w-full flex justify-between items-center p-4 bg-white hover:bg-gray-50 transition-colors cursor-pointer">
                    <span className="font-bold text-[#004876]">Add Syrups / Flavors</span>
                    <span className="text-gray-400 text-xl transition-transform duration-200">{openSection === 'syrups' ? '−' : '+'}</span>
                </button>
                {openSection === 'syrups' && (
                    <div className="px-4 pt-4 pb-12 bg-gray-50 border-t border-gray-100 space-y-4 accordion-expand">
                        {/* Featured */}
                        {featuredSyrups.length > 0 && (
                            <>
                                <h4 className="text-sm font-bold text-[#004876] uppercase tracking-wide">Featured</h4>
                                <div className="grid md:grid-cols-2 gap-3">
                                    {featuredSyrups.map((item) => {
                                      const isUnavailable = !item.isAvailable;
                                      return (
                                        <div key={item.id} className={`flex justify-between items-center bg-[#32A5DC]/5 border border-[#32A5DC]/20 p-2 px-3 rounded-lg shadow-sm ${isUnavailable ? 'opacity-60' : ''}`}>
                                            <span className={`text-sm font-bold ${isUnavailable ? 'text-gray-500' : 'text-[#004876]'}`}>
                                              {item.name}
                                              {isUnavailable && <span className="text-xs text-gray-400 ml-1">(Out of Stock)</span>}
                                            </span>
                                            <Counter 
                                              count={modifiers[item.id] || 0} 
                                              onMinus={() => handleModifierChange(item.id, false)} 
                                              onPlus={() => handleModifierChange(item.id, true)} 
                                              disabled={isUnavailable}
                                            />
                                        </div>
                                      );
                                    })}
                                </div>
                            </>
                        )}
                        {/* Other */}
                        {otherSyrups.length > 0 && (
                            <div className="grid md:grid-cols-2 gap-3 mt-2">
                              {otherSyrups.map((item) => {
                                const isUnavailable = !item.isAvailable;
                                return (
                                  <div key={item.id} className={`flex justify-between items-center bg-white p-2 px-3 rounded-lg shadow-sm border border-gray-100 ${isUnavailable ? 'opacity-60' : ''}`}>
                                      <span className={`text-sm font-medium ${isUnavailable ? 'text-gray-400' : 'text-gray-700'}`}>
                                        {item.name}
                                        {isUnavailable && <span className="text-xs text-gray-400 ml-1">(Out of Stock)</span>}
                                      </span>
                                      <Counter 
                                        count={modifiers[item.id] || 0} 
                                        onMinus={() => handleModifierChange(item.id, false)} 
                                        onPlus={() => handleModifierChange(item.id, true)} 
                                        colorClass="text-gray-600"
                                        disabled={isUnavailable}
                                      />
                                  </div>
                                );
                              })}
                            </div>
                        )}
                    </div>
                )}
            </div>
            {/* Toppings & Sweeteners (Same Loop as before) */}
             {['Toppings / Drizzle', 'Sweeteners (Packets)'].map((label, idx) => {
               const list = idx === 0 ? toppings : sweeteners;
               const key = idx === 0 ? 'toppings' : 'sweeteners';
               return (
                <div key={key} className="border border-gray-200 rounded-xl overflow-hidden">
                    <button onClick={() => setOpenSection(openSection === key ? null : key)} className="w-full flex justify-between items-center p-4 bg-white hover:bg-gray-50 transition-colors cursor-pointer">
                        <span className="font-bold text-[#004876]">Add {label}</span>
                        <span className={`text-gray-400 text-xl transition-transform duration-200 ${openSection === key ? 'rotate-180' : ''}`}>{openSection === key ? '−' : '+'}</span>
                    </button>
                    {openSection === key && (
                        <div className="p-4 bg-gray-50 border-t border-gray-100 grid md:grid-cols-2 gap-3 accordion-expand">
                            {list.map((item) => {
                              const isUnavailable = !item.isAvailable;
                              return (
                                idx === 0 ? (
                                    // Toppings: Use QuantitySelector with vertical layout
                                    <div key={item.id} className={`flex flex-col gap-2 bg-white p-3 rounded-lg shadow-sm border border-gray-100 ${isUnavailable ? 'opacity-60' : ''}`}>
                                        <span className={`text-sm font-medium ${isUnavailable ? 'text-gray-400' : 'text-gray-700'}`}>
                                          {item.name}
                                          {isUnavailable && <span className="text-xs text-gray-400 ml-1">(Out of Stock)</span>}
                                        </span>
                                        <QuantitySelector
                                            currentValue={modifiers[item.id] || 0}
                                            onChange={(value) => {
                                                if (value === 0) {
                                                    setModifiers(prev => {
                                                        const copy = { ...prev };
                                                        delete copy[item.id];
                                                        return copy;
                                                    });
                                                } else {
                                                    setModifiers(prev => ({ ...prev, [item.id]: value }));
                                                }
                                            }}
                                            ingredientId={item.id}
                                            disabled={isUnavailable}
                                        />
                                    </div>
                                ) : (
                                    // Sweeteners: Use Counter with same layout as syrups
                                    <div key={item.id} className={`flex justify-between items-center bg-white p-2 px-3 rounded-lg shadow-sm border border-gray-100 ${isUnavailable ? 'opacity-60' : ''}`}>
                                        <span className={`text-sm font-medium ${isUnavailable ? 'text-gray-400' : 'text-gray-700'}`}>
                                          {item.name}
                                          {isUnavailable && <span className="text-xs text-gray-400 ml-1">(Out of Stock)</span>}
                                        </span>
                                        <Counter 
                                          count={modifiers[item.id] || 0} 
                                          onMinus={() => handleModifierChange(item.id, false)} 
                                          onPlus={() => handleModifierChange(item.id, true)} 
                                          disabled={isUnavailable}
                                        />
                                    </div>
                                )
                              );
                            })}
                        </div>
                    )}
                </div>
               );
            })}
            {/* Other Ingredients (Matcha Scoops, Chai Concentrate, etc.) */}
            {otherIngredients.length > 0 && (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
                <button onClick={() => setOpenSection(openSection === 'other' ? null : 'other')} className="w-full flex justify-between items-center p-4 bg-white hover:bg-gray-50 transition-colors cursor-pointer">
                    <span className="font-bold text-[#004876]">Add Other Ingredients</span>
                    <span className="text-gray-400 text-xl transition-transform duration-200">{openSection === 'other' ? '−' : '+'}</span>
                </button>
                {openSection === 'other' && (
                    <div className="px-4 pt-4 pb-12 bg-gray-50 border-t border-gray-100 accordion-expand">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Matcha Scoops - Counter */}
                            {matchaScoops && (
                                <div className={`flex justify-between items-center bg-white p-2 px-3 rounded-lg shadow-sm border border-gray-100 ${!matchaScoops.isAvailable ? 'opacity-60' : ''}`}>
                                    <span className={`text-sm font-medium ${!matchaScoops.isAvailable ? 'text-gray-400' : 'text-gray-700'}`}>
                                      {matchaScoops.name}
                                      {!matchaScoops.isAvailable && <span className="text-xs text-gray-400 ml-1">(Out of Stock)</span>}
                                    </span>
                                    <Counter 
                                      count={modifiers[matchaScoops.id] || 0} 
                                      onMinus={() => handleModifierChange(matchaScoops.id, false)} 
                                      onPlus={() => handleModifierChange(matchaScoops.id, true)} 
                                      disabled={!matchaScoops.isAvailable}
                                    />
                                </div>
                            )}
                            
                            {/* Chai Concentrate - Quantity Selector */}
                            {chaiConcentrate && (
                                <div className={`flex flex-col gap-2 bg-white p-3 rounded-lg shadow-sm border border-gray-100 ${!chaiConcentrate.isAvailable ? 'opacity-60' : ''}`}>
                                    <span className={`text-sm font-medium ${!chaiConcentrate.isAvailable ? 'text-gray-400' : 'text-gray-700'}`}>
                                      {chaiConcentrate.name}
                                      {!chaiConcentrate.isAvailable && <span className="text-xs text-gray-400 ml-1">(Out of Stock)</span>}
                                    </span>
                                    <QuantitySelector
                                        currentValue={modifiers[chaiConcentrate.id] || 0}
                                        onChange={(value) => {
                                            if (value === 0) {
                                                setModifiers(prev => {
                                                    const copy = { ...prev };
                                                    delete copy[chaiConcentrate.id];
                                                    return copy;
                                                });
                                            } else {
                                                setModifiers(prev => ({ ...prev, [chaiConcentrate.id]: value }));
                                            }
                                        }}
                                        ingredientId={chaiConcentrate.id}
                                        disabled={!chaiConcentrate.isAvailable}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            )}
        </section>

        {/* Notes Field */}
        <section>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">
                Special Instructions / Notes
            </label>
            <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full p-4 rounded-xl border-2 border-gray-200 text-sm font-medium text-[#004876] focus:border-[#32A5DC] outline-none bg-gray-50 focus:bg-white transition-all placeholder-gray-300 resize-none"
                placeholder="Add any special instructions or notes here..."
            />
        </section>

        {/* --- ACTIONS --- */}
        {!hideOrderButtons && (
          <>
            {nameError && (
              <p className="text-red-500 text-sm font-medium text-center mb-2">{nameError}</p>
            )}
            <div className={`flex flex-col sm:flex-row gap-4 ${nameError ? 'pt-2' : 'pt-6'}`}>
              <Link href="/menu" className="py-4 px-6 rounded-xl border-2 border-gray-200 text-gray-500 font-bold text-center hover:bg-gray-50 hover:text-gray-700 transition-all cursor-pointer">
                Cancel
              </Link>
              
              {isSoloOrder && !editId ? (
                <>
                  <button 
                    onClick={handleSwitchToGroupOrder}
                    className="flex-1 bg-[#32A5DC] text-white font-bold py-4 rounded-xl shadow-lg hover:bg-[#288bba] transition-all transform hover:scale-[1.02] cursor-pointer"
                  >
                    Add to Group Order
                  </button>
                  <button 
                    onClick={handleSoloOrder} 
                    disabled={isSubmitting}
                    className="flex-1 bg-[#004876] text-white font-bold py-4 rounded-xl shadow-lg hover:bg-[#32A5DC] transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isSubmitting ? "Processing..." : "Place Order"}
                  </button>
                </>
              ) : (
                <button onClick={() => processOrder('/cart')} className="flex-1 bg-[#004876] text-white font-bold py-4 rounded-xl shadow-lg hover:bg-[#32A5DC] transition-all transform hover:scale-[1.02] cursor-pointer">
                  {editId ? "Update Order" : "Add to Order"}
                </button>
              )}
            </div>
          </>
        )}

      </div>
      
      {/* Error Modal */}
      <ErrorModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal({ isOpen: false, message: '' })}
        message={errorModal.message}
      />
    </div>
  );
}