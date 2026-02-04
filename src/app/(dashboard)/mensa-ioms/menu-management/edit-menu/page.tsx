"use client";

import { AppLayout } from "@/shared/components/layout/AppLayout";
import { useState, useEffect } from "react";
import { 
  ArrowLeft,
  Edit,
  Save,
  Plus,
  Trash2,
  Search,
  Filter,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/features/auth/AuthContext";

interface Ingredient {
  name: string;
  quantity?: string;
  unit?: string;
}

interface MenuItem {
  id?: string;
  name: string;
  price?: string;
  category?: string;
  ingredients?: string[] | Ingredient[];
  description?: string;
  sizes?: Array<{ size: string; price: string }>;
}

export default function EditMenuPage() {
  const { currentUser } = useAuth();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [newIngredient, setNewIngredient] = useState<{name: string, quantity: string, unit: string}>({name: '', quantity: '', unit: ''});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  const normalizeIngredients = (ingredients?: string[] | Ingredient[]): Ingredient[] => {
    return (ingredients || []).map((ingredient) =>
      typeof ingredient === 'string' ? { name: ingredient } : ingredient
    );
  };

  // Load menu items from localStorage
  useEffect(() => {
    loadMenuItems();
  }, []);

  // Reload when page becomes visible (handles navigation from repository page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadMenuItems();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', loadMenuItems);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', loadMenuItems);
    };
  }, []);

  // Filter items based on search and category
  useEffect(() => {
    let filtered = menuItems;

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    setFilteredItems(filtered);
  }, [menuItems, searchQuery, selectedCategory]);

  const loadMenuItems = () => {
    try {
      setLoading(true);
      const userId = currentUser?.id || 'default_user';
      
      // Try menu_data_${userId} first (new format with metadata)
      const menuDataKey = `menu_data_${userId}`;
      const storedMenuData = localStorage.getItem(menuDataKey);
      
      let items: MenuItem[] = [];
      
      if (storedMenuData) {
        const menuData = JSON.parse(storedMenuData);
        items = menuData.menuItems || [];
        console.log('📋 Loaded menu items from menu_data:', items.length, 'items');
      } else {
        // Try menu_${userId} as fallback (legacy format)
        const menuKey = `menu_${userId}`;
        const storedMenu = localStorage.getItem(menuKey);
        
        if (storedMenu) {
          items = JSON.parse(storedMenu);
          console.log('📋 Loaded menu items from menu_ (legacy):', items.length, 'items');
        }
      }
      
      // Normalize ingredients structure - ensure all ingredients are in object format
      const normalizedItems = items.map((item: any) => {
        if (!item.ingredients || !Array.isArray(item.ingredients)) {
          return { ...item, ingredients: [] };
        }
        
        // Convert ingredients to consistent object format
        const normalizedIngredients = item.ingredients.map((ing: any) => {
          if (typeof ing === 'string') {
            // String format: convert to object
            return {
              name: ing,
              quantity: '',
              unit: ''
            };
          } else if (ing && typeof ing === 'object') {
            // Object format: ensure all fields exist
            return {
              name: ing.name || ing.inventoryItemName || 'Unknown',
              quantity: ing.quantity || ing.quantityPerDish || '',
              unit: ing.unit || ''
            };
          }
          return {
            name: 'Unknown',
            quantity: '',
            unit: ''
          };
        });
        
        return {
          ...item,
          ingredients: normalizedIngredients
        };
      });
      
      setMenuItems(normalizedItems);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(normalizedItems.map((item: MenuItem) => item.category).filter(Boolean))] as string[];
      setCategories(uniqueCategories);
      
      console.log('✅ Menu items loaded and normalized:', normalizedItems.length, 'items with ingredients');
    } catch (error) {
      console.error('❌ Error loading menu items:', error);
      setMenuItems([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const saveMenuItems = async () => {
    try {
      setSaveStatus('saving');
      const userId = currentUser?.id || 'default_user';
      const menuDataKey = `menu_data_${userId}`;
      
      // Save to localStorage
      const menuData = {
        menuItems: menuItems,
        categories: categories,
        lastUpdated: new Date().toISOString()
      };
      
      localStorage.setItem(menuDataKey, JSON.stringify(menuData));
      
      // Also save to menu_${userId} for backward compatibility
      localStorage.setItem(`menu_${userId}`, JSON.stringify(menuItems));
      
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Error saving menu items:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  // Editing functions
  const startEditingItem = (itemId: string) => {
    setEditingItemId(itemId);
  };

  const cancelEditing = () => {
    setEditingItemId(null);
    setNewIngredient({name: '', quantity: '', unit: ''});
  };

  const saveItem = (itemId: string) => {
    setEditingItemId(null);
    // Update categories if new category was added
    const item = menuItems.find(i => i.id === itemId);
    if (item?.category && !categories.includes(item.category)) {
      setCategories([...categories, item.category]);
    }
  };

  const updateItemField = (itemId: string, field: keyof MenuItem, value: any) => {
    setMenuItems(items => items.map(item => 
      item.id === itemId ? { ...item, [field]: value } : item
    ));
  };

  const addNewItem = () => {
    const newItem: MenuItem = {
      id: `new-item-${Date.now()}`,
      name: '',
      price: '',
      category: '',
      ingredients: [],
      description: ''
    };
    setMenuItems([...menuItems, newItem]);
    setEditingItemId(newItem.id!);
  };

  const deleteItem = (itemId: string) => {
    if (confirm('Are you sure you want to delete this menu item?')) {
      setMenuItems(items => items.filter(item => item.id !== itemId));
    }
  };

  const addIngredientToItem = (itemId: string) => {
    if (!newIngredient.name.trim()) return;
    
    const ingredientToAdd: Ingredient = {
      name: newIngredient.name.trim(),
      quantity: newIngredient.quantity.trim() || undefined,
      unit: newIngredient.unit.trim() || undefined
    };

    setMenuItems(items => items.map(item => {
      if (item.id === itemId) {
        const currentIngredients = normalizeIngredients(item.ingredients);
        return {
          ...item,
          ingredients: [...currentIngredients, ingredientToAdd]
        };
      }
      return item;
    }));

    setNewIngredient({name: '', quantity: '', unit: ''});
  };

  const removeIngredient = (itemId: string, index: number) => {
    setMenuItems(items => items.map(item => {
      if (item.id === itemId) {
        const updatedIngredients = normalizeIngredients(item.ingredients);
        updatedIngredients.splice(index, 1);
        return {
          ...item,
          ingredients: updatedIngredients
        };
      }
      return item;
    }));
  };

  const updateIngredient = (itemId: string, index: number, field: 'name' | 'quantity' | 'unit', value: string) => {
    setMenuItems(items => items.map(item => {
      if (item.id === itemId) {
        const updatedIngredients = normalizeIngredients(item.ingredients);
        const ingredient = updatedIngredients[index];
        if (!ingredient) {
          return item;
        }
        updatedIngredients[index] = { ...ingredient, [field]: value };
        return {
          ...item,
          ingredients: updatedIngredients
        };
      }
      return item;
    }));
  };

  if (loading) {
    return (
      <AppLayout pageTitle="Edit Menu">
        <div className="min-h-screen bg-[#F5F5F7] p-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-wm-blue" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout pageTitle="Edit Menu">
      <div className="min-h-screen bg-[#F5F5F7] p-6">
        {/* Header */}
        <div className="mb-6">
          <Link 
            href="/mensa-ioms/menu-management/repository"
            className="inline-flex items-center gap-2 text-wm-blue hover:text-wm-teal mb-4 font-bold text-sm transition-colors"
          >
            <ArrowLeft size={18} />
            Back to Menu Repository
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-headline font-black text-wm-blue mb-2">
                Edit Menu
              </h1>
              <p className="text-gray-600">
                Manage and edit your existing menu items
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={addNewItem}
                className="px-4 py-2 bg-wm-blue hover:bg-[#23294a] text-white font-bold rounded-xl transition-colors text-sm flex items-center gap-2"
              >
                <Plus size={16} />
                Add New Item
              </button>
              <button
                onClick={saveMenuItems}
                disabled={saveStatus === 'saving'}
                className="px-6 py-2 bg-wm-teal hover:bg-[#238b7e] text-white font-bold rounded-xl transition-colors text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saveStatus === 'saving' ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Saving...
                  </>
                ) : saveStatus === 'success' ? (
                  <>
                    <CheckCircle2 size={16} />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full md:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search menu items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-wm-blue focus:border-transparent text-sm"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-wm-blue focus:border-transparent text-sm font-bold"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Menu Items List */}
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-enterprise p-12 text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-headline font-black text-gray-700 mb-2">
              {menuItems.length === 0 ? 'No Menu Items Found' : 'No Items Match Your Search'}
            </h3>
            <p className="text-gray-500 mb-6">
              {menuItems.length === 0 
                ? 'Start by adding menu items or upload a menu from the repository.'
                : 'Try adjusting your search or filter criteria.'}
            </p>
            {menuItems.length === 0 && (
              <button
                onClick={addNewItem}
                className="px-6 py-3 bg-wm-blue hover:bg-[#23294a] text-white font-bold rounded-xl transition-colors flex items-center gap-2 mx-auto"
              >
                <Plus size={18} />
                Add Your First Menu Item
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((item) => {
              const isEditing = editingItemId === item.id;
              const itemIngredients = item.ingredients || [];
              
              return (
                <div
                  key={item.id}
                  className="p-5 bg-white rounded-xl border-2 border-gray-200 hover:border-wm-blue transition-colors"
                >
                  {!isEditing ? (
                    // View Mode
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-headline font-black text-lg text-wm-blue">
                            {item.name || 'Unnamed Item'}
                          </h3>
                          {item.category && (
                            <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full">
                              {item.category}
                            </span>
                          )}
                        </div>
                        
                        {item.description && (
                          <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                        )}
                        
                        {itemIngredients.length > 0 && (
                          <div className="mb-2">
                            <p className="text-xs font-bold text-gray-500 mb-1">Ingredients:</p>
                            <div className="flex flex-wrap gap-1.5">
                              {itemIngredients.map((ingredient, idx) => {
                                const ingredientName = typeof ingredient === 'string' 
                                  ? ingredient 
                                  : ingredient.name || 'Unknown';
                                const ingredientDisplay = typeof ingredient === 'string'
                                  ? ingredientName
                                  : ingredient.quantity && ingredient.unit
                                    ? `${ingredientName} (${ingredient.quantity} ${ingredient.unit})`
                                    : ingredientName;
                                
                                return (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded-md"
                                  >
                                    {ingredientDisplay}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        
                        {item.sizes && item.sizes.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {item.sizes.map((size, idx) => (
                              <div
                                key={idx}
                                className="px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-lg"
                              >
                                <span className="text-xs font-medium text-gray-600">{size.size}</span>
                                <span className="ml-2 font-bold text-sm text-wm-blue">{size.price}</span>
                              </div>
                            ))}
                          </div>
                        ) : item.price && (
                          <p className="font-bold text-lg text-wm-blue">{item.price}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startEditingItem(item.id!)}
                          className="p-2 text-wm-blue hover:bg-wm-blue/10 rounded-lg transition-colors"
                          title="Edit Item"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => deleteItem(item.id!)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Item"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Edit Mode
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">Item Name *</label>
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => updateItemField(item.id!, 'name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wm-blue focus:border-wm-blue text-sm"
                            placeholder="Enter item name"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">Category</label>
                          <input
                            type="text"
                            value={item.category || ''}
                            onChange={(e) => updateItemField(item.id!, 'category', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wm-blue focus:border-wm-blue text-sm"
                            placeholder="e.g., Main Course, Appetizer"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Description</label>
                        <textarea
                          value={item.description || ''}
                          onChange={(e) => updateItemField(item.id!, 'description', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wm-blue focus:border-wm-blue text-sm"
                          rows={2}
                          placeholder="Item description"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Price</label>
                        <input
                          type="text"
                          value={item.price || ''}
                          onChange={(e) => updateItemField(item.id!, 'price', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wm-blue focus:border-wm-blue text-sm"
                          placeholder="e.g., €12.99"
                        />
                      </div>
                      
                      {/* Ingredients Section */}
                      <div className="border-t border-gray-200 pt-4">
                        <label className="block text-xs font-bold text-gray-700 mb-3">Ingredients</label>
                        
                        {/* Existing Ingredients */}
                        {itemIngredients.length > 0 && (
                          <div className="space-y-2 mb-4">
                            {itemIngredients.map((ingredient, idx) => {
                              const ingName = typeof ingredient === 'string' ? ingredient : ingredient.name;
                              const ingQty = typeof ingredient === 'object' ? ingredient.quantity || '' : '';
                              const ingUnit = typeof ingredient === 'object' ? ingredient.unit || '' : '';
                              
                              return (
                                <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-lg">
                                  <input
                                    type="text"
                                    value={ingName}
                                    onChange={(e) => updateIngredient(item.id!, idx, 'name', e.target.value)}
                                    className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm"
                                    placeholder="Ingredient name"
                                  />
                                  <input
                                    type="text"
                                    value={ingQty}
                                    onChange={(e) => updateIngredient(item.id!, idx, 'quantity', e.target.value)}
                                    className="w-20 px-2 py-1.5 border border-gray-300 rounded text-sm"
                                    placeholder="Qty"
                                  />
                                  <input
                                    type="text"
                                    value={ingUnit}
                                    onChange={(e) => updateIngredient(item.id!, idx, 'unit', e.target.value)}
                                    className="w-20 px-2 py-1.5 border border-gray-300 rounded text-sm"
                                    placeholder="Unit"
                                  />
                                  <button
                                    onClick={() => removeIngredient(item.id!, idx)}
                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                                    title="Remove ingredient"
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        
                        {/* Add New Ingredient */}
                        <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                          <input
                            type="text"
                            value={newIngredient.name}
                            onChange={(e) => setNewIngredient({...newIngredient, name: e.target.value})}
                            className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm"
                            placeholder="Ingredient name"
                          />
                          <input
                            type="text"
                            value={newIngredient.quantity}
                            onChange={(e) => setNewIngredient({...newIngredient, quantity: e.target.value})}
                            className="w-20 px-2 py-1.5 border border-gray-300 rounded text-sm"
                            placeholder="Qty"
                          />
                          <input
                            type="text"
                            value={newIngredient.unit}
                            onChange={(e) => setNewIngredient({...newIngredient, unit: e.target.value})}
                            className="w-20 px-2 py-1.5 border border-gray-300 rounded text-sm"
                            placeholder="Unit"
                          />
                          <button
                            onClick={() => addIngredientToItem(item.id!)}
                            className="px-3 py-1.5 bg-wm-teal hover:bg-[#238b7e] text-white rounded text-sm font-bold transition-colors flex items-center gap-1"
                          >
                            <Plus size={14} />
                            Add
                          </button>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200">
                        <button
                          onClick={cancelEditing}
                          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg transition-colors text-sm"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => saveItem(item.id!)}
                          className="px-4 py-2 bg-wm-teal hover:bg-[#238b7e] text-white font-bold rounded-lg transition-colors text-sm flex items-center gap-2"
                        >
                          <Save size={16} />
                          Save
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

