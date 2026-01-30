'use client';

import { useState, useEffect } from 'react';
import { createWalkUpOrder, getProductsAndIngredients } from './actions';
import UserSearch from './UserSearch';

interface Product {
  id: number;
  name: string;
  description?: string | null;
  category: string;
  basePrice: number;
  requiresMilk: boolean;
  allowsShots: boolean;
  defaultShots: number;
  forceTemperature?: string | null;
  isActive: boolean;
}

interface Ingredient {
  id: number;
  name: string;
  category: string;
  isAvailable: boolean;
  rank: number;
}

interface User {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  name: string | null;
  displayName: string;
}

interface CreateOrderFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function CreateOrderForm({ onSuccess, onCancel }: CreateOrderFormProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [recipientName, setRecipientName] = useState('');
  const [nameError, setNameError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Customization state
  const [baseTemp, setBaseTemp] = useState<"Hot" | "Iced">("Hot");
  const [tempLevel, setTempLevel] = useState("Standard");
  const [shots, setShots] = useState(0);
  const [selectedMilk, setSelectedMilk] = useState<number | null>(null);
  const [modifiers, setModifiers] = useState<Record<number, number>>({});
  const [cupType, setCupType] = useState('to-go');
  const [caffeineType, setCaffeineType] = useState("Normal");
  const [milkSteamed, setMilkSteamed] = useState(false);
  const [foamLevel, setFoamLevel] = useState("Normal");
  const [milkAmount, setMilkAmount] = useState("Normal");
  const [notes, setNotes] = useState("");
  const [openSection, setOpenSection] = useState<string | null>(null);

  // Fetch products and ingredients on mount
  useEffect(() => {
    async function fetchData() {
      const result = await getProductsAndIngredients();
      if (result.success && result.data) {
        setProducts(result.data.products);
        setIngredients(result.data.ingredients);
      }
      setIsLoading(false);
    }
    fetchData();
  }, []);

  // Update shots when product changes
  useEffect(() => {
    if (selectedProduct) {
      setShots(selectedProduct.defaultShots);
      if (selectedProduct.forceTemperature) {
        setBaseTemp(selectedProduct.forceTemperature as "Hot" | "Iced");
      }
      // Reset milk selection
      if (selectedProduct.requiresMilk) {
        const milks = ingredients.filter(i => i.category === 'milk' && i.isAvailable);
        if (milks.length > 0) {
          const wholeMilk = milks.find(m => m.name === 'Whole');
          setSelectedMilk(wholeMilk ? wholeMilk.id : milks[0].id);
        }
      } else {
        setSelectedMilk(null);
      }
    }
  }, [selectedProduct, ingredients]);

  // Get product rules
  const getProductRules = () => {
    if (!selectedProduct) return { defaultShots: 0, requiresMilk: false, shotLabel: "Add Espresso Shot(s)" };
    const name = selectedProduct.name.toLowerCase();
    const cat = selectedProduct.category;
    let rules = { defaultShots: 0, requiresMilk: false, shotLabel: "Add Espresso Shot(s)" };
    if (cat === 'coffee') { rules.defaultShots = 2; rules.shotLabel = "Espresso Shots"; }
    if (name.includes('latte') || name.includes('cappuccino') || name.includes('macchiato') || name.includes('steamer')) rules.requiresMilk = true;
    if (name.includes('americano')) rules.requiresMilk = false;
    return rules;
  };
  const rules = getProductRules();

  // Filter ingredients
  const milks = ingredients
    .filter(i => i.category === 'milk')
    .sort((a, b) => {
      if (a.name === "Whole") return -1;
      if (b.name === "Whole") return 1;
      return 0;
    });
  const sweeteners = ingredients.filter(i => i.category === 'sweetener');
  const toppings = ingredients.filter(i => i.category === 'topping');
  const allSyrups = ingredients.filter(i => i.category === 'syrup');
  const otherIngredients = ingredients.filter(i => i.category === 'other');
  const featuredSyrups = allSyrups.filter(i => i.rank > 0).sort((a, b) => a.rank - b.rank);
  const otherSyrups = allSyrups.filter(i => i.rank === 0).sort((a, b) => a.name.localeCompare(b.name));
  
  // Separate other ingredients by measurement type
  const matchaScoops = otherIngredients.find(i => i.name === 'Matcha Scoops');
  const chaiConcentrate = otherIngredients.find(i => i.name === 'Chai Concentrate');

  const handleModifierChange = (id: number, increment: boolean) => {
    const ingredient = ingredients.find(i => i.id === id);
    if (increment && ingredient && !ingredient.isAvailable) {
      return;
    }
    
    setModifiers(prev => {
      const current = prev[id] || 0;
      const next = increment ? current + 1 : Math.max(0, current - 1);
      if (next === 0) { const copy = { ...prev }; delete copy[id]; return copy; }
      return { ...prev, [id]: next };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNameError('');

    if (!selectedProduct) {
      setError("Please select a product");
      return;
    }

    if (!recipientName.trim()) {
      setNameError("Please enter a recipient name");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createWalkUpOrder({
        productId: selectedProduct.id,
        recipientName: recipientName.trim(),
        userId: selectedUser?.id || null,
        shots,
        temperature: `${baseTemp}${tempLevel !== 'Standard' ? ` - ${tempLevel}` : ''}`,
        milkId: selectedMilk !== null && selectedMilk !== -1 ? selectedMilk : null,
        modifiers,
        cupType,
        caffeineType: shots > 0 ? caffeineType : null,
        milkSteamed: (baseTemp === "Hot" && !selectedProduct.requiresMilk && selectedMilk !== null && selectedMilk !== -1) ? milkSteamed : null,
        foamLevel: (baseTemp === "Hot" && (milkSteamed || selectedProduct.requiresMilk)) ? foamLevel : null,
        milkAmount: (!selectedProduct.requiresMilk && selectedMilk !== null && selectedMilk !== -1) ? milkAmount : null,
        notes: notes || undefined,
      });

      if (result.success) {
        onSuccess();
      } else {
        setError(result.message || "Failed to create order");
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error("Error creating order:", err);
      setError("An unexpected error occurred");
      setIsSubmitting(false);
    }
  };

  const Counter = ({ count, onMinus, onPlus, disabled = false }: { count: number; onMinus: () => void; onPlus: () => void; disabled?: boolean }) => (
    <div className={`flex items-center gap-3 bg-gray-800 rounded-full border border-gray-700 px-1 py-1 ${disabled ? 'opacity-50' : ''}`}>
      <button type="button" onClick={onMinus} disabled={count === 0 || disabled} className="w-8 h-8 rounded-full bg-gray-700 text-gray-300 disabled:opacity-30 flex items-center justify-center hover:bg-gray-600 font-bold transition-colors cursor-pointer disabled:cursor-not-allowed">-</button>
      <span className={`w-6 text-center font-extrabold text-white ${disabled ? 'text-gray-400' : ''}`}>{count}</span>
      <button type="button" onClick={onPlus} disabled={disabled} className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white bg-[#32A5DC] hover:bg-[#288bba] transition-colors cursor-pointer disabled:cursor-not-allowed disabled:bg-gray-600">+</button>
    </div>
  );

  const QuantitySelector = ({ currentValue, onChange, disabled = false }: { currentValue: number; onChange: (value: number) => void; disabled?: boolean }) => {
    const options = [
      { label: "None", value: 0 },
      { label: "Light", value: 1 },
      { label: "Medium", value: 2 },
      { label: "Extra", value: 3 }
    ];

    return (
      <div className={`flex bg-gray-800 p-1 rounded-lg gap-1 border border-gray-700 ${disabled ? 'opacity-50' : ''}`}>
        {options.map((opt) => {
          const isDisabled = disabled && opt.value !== 0;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => !isDisabled && onChange(opt.value)}
              disabled={isDisabled}
              className={`flex-1 py-1.5 px-2 rounded text-xs font-bold transition-all ${
                isDisabled
                  ? 'text-gray-500 cursor-not-allowed'
                  : currentValue === opt.value
                    ? 'bg-[#32A5DC] text-white shadow-sm'
                    : 'text-gray-400 hover:text-white cursor-pointer'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-[#32A5DC] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Product Selection */}
      <div>
        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
          Select Product <span className="text-red-500">*</span>
        </label>
        <select
          value={selectedProduct?.id || ''}
          onChange={(e) => {
            const product = products.find(p => p.id === parseInt(e.target.value));
            setSelectedProduct(product || null);
          }}
          required
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-[#32A5DC] transition-colors cursor-pointer"
        >
          <option value="">Choose a product...</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name} {!product.isActive && '(Unavailable)'}
            </option>
          ))}
        </select>
      </div>

      {/* User Search */}
      <UserSearch onUserSelect={setSelectedUser} selectedUser={selectedUser} />

      {/* Recipient Name */}
      <div>
        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
          Recipient Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={recipientName}
          onChange={(e) => {
            setRecipientName(e.target.value);
            if (nameError) setNameError('');
          }}
          required
          className={`w-full px-4 py-3 bg-gray-800 border rounded-xl text-white placeholder-gray-500 focus:outline-none transition-colors ${
            nameError ? 'border-red-500' : 'border-gray-700 focus:border-[#32A5DC]'
          }`}
          placeholder="Enter recipient name"
        />
        {nameError && <p className="mt-1 text-sm text-red-400">{nameError}</p>}
      </div>

      {/* Customization - Only show if product is selected */}
      {selectedProduct && (
        <div className="space-y-6 border-t border-gray-700 pt-6">
          {/* Temperature & Shots */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Temperature</h3>
              <div className="space-y-3">
                <div className="flex bg-gray-800 p-1 rounded-xl border border-gray-700">
                  {(['Hot', 'Iced'] as const).map((opt) => {
                    const isDisabled = selectedProduct.forceTemperature ? selectedProduct.forceTemperature !== opt : false;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => { if (!selectedProduct.forceTemperature) { setBaseTemp(opt); setTempLevel("Standard"); } }}
                        disabled={isDisabled}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                          baseTemp === opt
                            ? 'bg-[#32A5DC] text-white'
                            : isDisabled
                              ? 'text-gray-600 cursor-not-allowed'
                              : 'text-gray-400 hover:text-white cursor-pointer'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
                <select
                  value={tempLevel}
                  onChange={(e) => setTempLevel(e.target.value)}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-[#32A5DC] outline-none cursor-pointer"
                >
                  {baseTemp === "Hot" ? (
                    <>
                      <option value="Standard">Standard Temp</option>
                      <option value="Warm">Warm (Kids Temp)</option>
                      <option value="Extra Hot">Extra Hot</option>
                    </>
                  ) : (
                    <>
                      <option value="Standard">Standard Ice</option>
                      <option value="Light Ice">Light Ice</option>
                      <option value="Extra Ice">Extra Ice</option>
                      <option value="No Ice">No Ice</option>
                    </>
                  )}
                </select>
              </div>
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{rules.shotLabel}</h3>
              <div className="flex items-center justify-between p-4 bg-gray-800 rounded-xl border border-gray-700">
                <span className="font-bold text-white">Total Shots</span>
                <Counter count={shots} onMinus={() => setShots(Math.max(0, shots - 1))} onPlus={() => setShots(shots + 1)} />
              </div>
              {shots > 0 && (
                <div className="mt-3">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Caffeine Type</h4>
                  <div className="flex bg-gray-800 p-1 rounded-xl border border-gray-700">
                    {(['Normal', 'Decaf', 'Half-Caff'] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setCaffeineType(opt)}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                          caffeineType === opt
                            ? 'bg-[#32A5DC] text-white'
                            : 'text-gray-400 hover:text-white cursor-pointer'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Cup Type */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Cup Type</label>
            <select
              value={cupType}
              onChange={(e) => setCupType(e.target.value)}
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-[#32A5DC] outline-none cursor-pointer"
            >
              <option value="to-go">To-Go Cup</option>
              <option value="for-here">For-Here {baseTemp === "Hot" ? "Mug" : "Glass"}</option>
              <option value="personal">Personal Cup</option>
            </select>
          </div>

          {/* Milk */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Choice of Milk</h3>
              {selectedProduct.requiresMilk && <span className="text-xs font-bold text-[#32A5DC] bg-[#32A5DC]/10 px-2 py-1 rounded">Required</span>}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setSelectedMilk(-1)}
                disabled={selectedProduct.requiresMilk}
                className={`px-3 py-3 rounded-xl border-2 text-center text-sm font-bold transition-all ${
                  selectedProduct.requiresMilk
                    ? 'opacity-40 cursor-not-allowed bg-gray-800 border-gray-700 text-gray-500'
                    : selectedMilk === -1
                      ? 'border-[#32A5DC] bg-[#32A5DC]/10 text-[#32A5DC]'
                      : 'border-gray-700 text-gray-400 hover:border-gray-600 cursor-pointer'
                }`}
              >
                No Milk
              </button>
              {milks.map((milk) => {
                const isUnavailable = !milk.isAvailable;
                return (
                  <button
                    key={milk.id}
                    type="button"
                    onClick={() => !isUnavailable && setSelectedMilk(milk.id)}
                    disabled={isUnavailable}
                    className={`px-3 py-3 rounded-xl border-2 text-center text-sm font-bold transition-all ${
                      isUnavailable
                        ? 'opacity-50 cursor-not-allowed bg-gray-800 border-gray-700 text-gray-500'
                        : selectedMilk === milk.id
                          ? 'border-[#32A5DC] bg-[#32A5DC]/10 text-[#32A5DC] cursor-pointer'
                          : 'border-gray-700 text-gray-400 hover:border-gray-600 cursor-pointer'
                    }`}
                    title={isUnavailable ? 'Out of stock' : undefined}
                  >
                    {milk.name}{isUnavailable && <span className="text-xs text-gray-500 ml-1">(Out)</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Milk Amount & Steamed - For optional milk drinks */}
          {!selectedProduct.requiresMilk && selectedMilk !== null && selectedMilk !== -1 && (
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 md:flex-1 md:max-w-[50%]">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest sm:min-w-[120px]">Milk Amount</h3>
                <select
                  value={milkAmount}
                  onChange={(e) => setMilkAmount(e.target.value)}
                  className="flex-1 sm:max-w-[200px] p-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-[#32A5DC] outline-none cursor-pointer"
                >
                  <option value="Light">Light</option>
                  <option value="Normal">Normal</option>
                  <option value="Extra">Extra</option>
                </select>
              </div>
              {baseTemp === "Hot" && (
                <div className="flex items-center">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={milkSteamed}
                      onChange={(e) => {
                        setMilkSteamed(e.target.checked);
                        if (!e.target.checked) {
                          setFoamLevel("Normal");
                        }
                      }}
                      className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-[#32A5DC] focus:ring-[#32A5DC] cursor-pointer"
                    />
                    <span className="text-sm font-bold text-white">Milk steamed?</span>
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Foam Level - Only for hot drinks */}
          {baseTemp === "Hot" && (milkSteamed || selectedProduct.requiresMilk) && (
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Foam Level</h3>
              <select
                value={foamLevel}
                onChange={(e) => setFoamLevel(e.target.value)}
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-[#32A5DC] outline-none cursor-pointer"
              >
                {selectedProduct.name.toLowerCase().includes('cappuccino') ? (
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
            </div>
          )}

          {/* Syrups */}
          <div className="border border-gray-700 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setOpenSection(openSection === 'syrups' ? null : 'syrups')}
              className="w-full flex justify-between items-center p-4 bg-gray-800 hover:bg-gray-750 transition-colors cursor-pointer"
            >
              <span className="font-bold text-white">Add Syrups / Flavors</span>
              <span className="text-gray-400 text-xl transition-transform duration-200">{openSection === 'syrups' ? '−' : '+'}</span>
            </button>
            {openSection === 'syrups' && (
              <div className="px-4 pt-4 pb-12 bg-gray-800/50 border-t border-gray-700 space-y-4">
                {featuredSyrups.length > 0 && (
                  <>
                    <h4 className="text-sm font-bold text-white uppercase tracking-wide">Featured</h4>
                    <div className="grid md:grid-cols-2 gap-3">
                      {featuredSyrups.map((item) => {
                        const isUnavailable = !item.isAvailable;
                        return (
                          <div key={item.id} className={`flex justify-between items-center bg-[#32A5DC]/10 border border-[#32A5DC]/20 p-2 px-3 rounded-lg ${isUnavailable ? 'opacity-60' : ''}`}>
                            <span className={`text-sm font-bold ${isUnavailable ? 'text-gray-500' : 'text-white'}`}>
                              {item.name}
                              {isUnavailable && <span className="text-xs text-gray-400 ml-1">(Out)</span>}
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
                {otherSyrups.length > 0 && (
                  <div className="grid md:grid-cols-2 gap-3 mt-2">
                    {otherSyrups.map((item) => {
                      const isUnavailable = !item.isAvailable;
                      return (
                        <div key={item.id} className={`flex justify-between items-center bg-gray-800 p-2 px-3 rounded-lg border border-gray-700 ${isUnavailable ? 'opacity-60' : ''}`}>
                          <span className={`text-sm font-medium ${isUnavailable ? 'text-gray-500' : 'text-gray-300'}`}>
                            {item.name}
                            {isUnavailable && <span className="text-xs text-gray-400 ml-1">(Out)</span>}
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
                )}
              </div>
            )}
          </div>

          {/* Toppings */}
          {toppings.length > 0 && (
            <div className="border border-gray-700 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenSection(openSection === 'toppings' ? null : 'toppings')}
                className="w-full flex justify-between items-center p-4 bg-gray-800 hover:bg-gray-750 transition-colors cursor-pointer"
              >
                <span className="font-bold text-white">Add Toppings / Drizzle</span>
                <span className="text-gray-400 text-xl transition-transform duration-200">{openSection === 'toppings' ? '−' : '+'}</span>
              </button>
              {openSection === 'toppings' && (
                <div className="p-4 bg-gray-800/50 border-t border-gray-700 grid md:grid-cols-2 gap-3">
                  {toppings.map((item) => {
                    const isUnavailable = !item.isAvailable;
                    return (
                      <div key={item.id} className={`flex flex-col gap-2 bg-gray-800 p-3 rounded-lg border border-gray-700 ${isUnavailable ? 'opacity-60' : ''}`}>
                        <span className={`text-sm font-medium ${isUnavailable ? 'text-gray-500' : 'text-gray-300'}`}>
                          {item.name}
                          {isUnavailable && <span className="text-xs text-gray-400 ml-1">(Out)</span>}
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
                          disabled={isUnavailable}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Other Ingredients (Matcha Scoops, Chai Concentrate, etc.) */}
          {otherIngredients.length > 0 && (
            <div className="border border-gray-700 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenSection(openSection === 'other' ? null : 'other')}
                className="w-full flex justify-between items-center p-4 bg-gray-800 hover:bg-gray-750 transition-colors cursor-pointer"
              >
                <span className="font-bold text-white">Add Other Ingredients</span>
                <span className="text-gray-400 text-xl transition-transform duration-200">{openSection === 'other' ? '−' : '+'}</span>
              </button>
              {openSection === 'other' && (
                <div className="px-4 pt-4 pb-12 bg-gray-800/50 border-t border-gray-700">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Matcha Scoops - Counter */}
                    {matchaScoops && (
                      <div className={`flex justify-between items-center bg-gray-800 p-2 px-3 rounded-lg border border-gray-700 ${!matchaScoops.isAvailable ? 'opacity-60' : ''}`}>
                        <span className={`text-sm font-medium ${!matchaScoops.isAvailable ? 'text-gray-500' : 'text-gray-300'}`}>
                          {matchaScoops.name}
                          {!matchaScoops.isAvailable && <span className="text-xs text-gray-400 ml-1">(Out)</span>}
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
                      <div className={`flex flex-col gap-2 bg-gray-800 p-3 rounded-lg border border-gray-700 ${!chaiConcentrate.isAvailable ? 'opacity-60' : ''}`}>
                        <span className={`text-sm font-medium ${!chaiConcentrate.isAvailable ? 'text-gray-500' : 'text-gray-300'}`}>
                          {chaiConcentrate.name}
                          {!chaiConcentrate.isAvailable && <span className="text-xs text-gray-400 ml-1">(Out)</span>}
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
                          disabled={!chaiConcentrate.isAvailable}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
              Special Instructions / Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full p-4 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-[#32A5DC] outline-none resize-none"
              placeholder="Add any special instructions or notes here..."
            />
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/20 border border-red-700 p-4 rounded-xl">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Submit Buttons */}
      <div className="flex gap-4 pt-4 border-t border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 px-6 rounded-xl border-2 border-gray-700 text-gray-400 font-bold hover:bg-gray-800 hover:text-white transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !selectedProduct}
          className="flex-1 py-3 px-6 rounded-xl bg-[#32A5DC] hover:bg-[#288bba] text-white font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Creating Order...' : 'Create Order'}
        </button>
      </div>
    </form>
  );
}
