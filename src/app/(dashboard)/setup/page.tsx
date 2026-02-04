'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { useToast } from '@/shared/hooks/use-toast';
import {
  Package,
  Table as TableIcon,
  ArrowLeft,
  Settings,
  Upload,
  Edit3,
  Save,
  Plus,
  Trash2,
  FileText,
  ChefHat,
  X,
  Users,
  Network,
  Sparkles,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface MenuItem {
  id: string;
  name: string;
  price: string | number;
  category: string;
  image?: string;
  ingredients?: Array<{
    name: string;
    quantity: string;
    unit: string;
  }>;
  extractionMethod?: string;
}

const UNITS = [
  'g', 'kg', 'ml', 'l', 'cups', 'tbsp', 'tsp', 'pieces', 'slices', 'cloves', 'bunches'
];

const CATEGORIES = [
  'Appetizers',
  'Main Course', 
  'Pizza',
  'Pasta',
  'Salads',
  'Soups',
  'Desserts',
  'Beverages',
  'Sides',
  'Other'
];

export default function SetupPage() {
  const { currentUser, isLoading, isInitialized } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  
  // State for menu management
  const [existingMenuItems, setExistingMenuItems] = useState<MenuItem[]>([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [showMenuSection, setShowMenuSection] = useState(false);
  const [currentView, setCurrentView] = useState<'setup' | 'menu-edit'>('setup');

  // Load existing menu data on component mount
  useEffect(() => {
    if (isInitialized && currentUser) {
      loadExistingMenu();
    }
  }, [isInitialized, currentUser]);

  const loadExistingMenu = async () => {
    setIsLoadingMenu(true);
    try {
      const userId = currentUser?.id || 'default_user';
      const menuDataKey = `menu_data_${userId}`;
      const storedMenuData = localStorage.getItem(menuDataKey);
      
      if (storedMenuData) {
        const menuData = JSON.parse(storedMenuData);
        console.log('📋 [SETUP] Loading saved menu data:', menuData);
        
        // Convert number prices back to strings for display and normalize ingredients
        const convertedMenuItems = (menuData.menuItems || []).map((item: any) => ({
          ...item,
          price: typeof item.price === 'number' ? item.price.toString() : item.price,
          ingredients: Array.isArray(item.ingredients) 
            ? item.ingredients.map((ing: any) => {
                if (typeof ing === 'string') {
                  // Old format: convert string to object with default values
                  return { name: ing, quantity: '1', unit: 'pieces' };
                } else if (ing && typeof ing === 'object') {
                  // New format: preserve existing values, with intelligent fallbacks
                  const quantity = ing.quantity || '1';
                  const unit = ing.unit || 'pieces';
                  
                  // Handle cases where quantity might contain unit (e.g., "0.2kg")
                  const quantityMatch = quantity.toString().match(/^([\d.]+)\s*(kg|g|ml|l|tbsp|tsp|cups|pieces|slices|cloves|bunches)?$/i);
                  
                  let cleanQuantity, cleanUnit;
                  if (quantityMatch) {
                    cleanQuantity = quantityMatch[1]; // Just the number
                    cleanUnit = quantityMatch[2] || unit; // Use unit from quantity or fallback to unit field
                  } else {
                    cleanQuantity = quantity;
                    cleanUnit = unit;
                  }
                  
                  return {
                    name: ing.name || ing.inventoryItemName || 'Unknown',
                    quantity: cleanQuantity,
                    unit: cleanUnit
                  };
                }
                return { name: 'Unknown', quantity: '1', unit: 'pieces' };
              })
            : [],
          sizes: item.sizes?.map((size: any) => ({
            ...size,
            price: typeof size.price === 'number' ? size.price.toString() : size.price
          }))
        }));
        
        setExistingMenuItems(convertedMenuItems);
        if (convertedMenuItems.length > 0) {
          setShowMenuSection(true);
        }
      } else {
        // Try to load from menu service as fallback
        try {
          const { getDishes } = await import('@/server/lib/menuService');
          const savedDishes = getDishes(userId);
          if (savedDishes && savedDishes.length > 0) {
            console.log('📋 [SETUP] Loading menu from menu service:', savedDishes.length, 'items');
            
            // Convert number prices to strings for display and normalize ingredients
            const convertedDishes = savedDishes.map((item: any) => ({
              ...item,
              price: typeof item.price === 'number' ? item.price.toString() : item.price,
              ingredients: Array.isArray(item.ingredients) 
                ? item.ingredients.map((ing: any) => {
                    if (typeof ing === 'string') {
                      // Old format: convert string to object with default values
                      return { name: ing, quantity: '1', unit: 'pieces' };
                    } else if (ing && typeof ing === 'object') {
                      // New format: preserve existing values, with intelligent fallbacks
                      const quantity = ing.quantity || '1';
                      const unit = ing.unit || 'pieces';
                      
                      // Handle cases where quantity might contain unit (e.g., "0.2kg")
                      const quantityMatch = quantity.toString().match(/^([\d.]+)\s*(kg|g|ml|l|tbsp|tsp|cups|pieces|slices|cloves|bunches)?$/i);
                      
                      let cleanQuantity, cleanUnit;
                      if (quantityMatch) {
                        cleanQuantity = quantityMatch[1]; // Just the number
                        cleanUnit = quantityMatch[2] || unit; // Use unit from quantity or fallback to unit field
                      } else {
                        cleanQuantity = quantity;
                        cleanUnit = unit;
                      }
                      
                      return {
                        name: ing.name || ing.inventoryItemName || 'Unknown',
                        quantity: cleanQuantity,
                        unit: cleanUnit
                      };
                    }
                    return { name: 'Unknown', quantity: '1', unit: 'pieces' };
                  })
                : [],
              sizes: item.sizes?.map((size: any) => ({
                ...size,
                price: typeof size.price === 'number' ? size.price.toString() : size.price
              }))
            }));
            
            setExistingMenuItems(convertedDishes);
            if (convertedDishes.length > 0) {
              setShowMenuSection(true);
            }
          }
        } catch (serviceError) {
          console.error('Error loading from menu service:', serviceError);
        }
      }
    } catch (error) {
      console.error('Error loading menu data:', error);
    } finally {
      setIsLoadingMenu(false);
    }
  };

  const updateInventoryFromIngredients = async (menuItems: MenuItem[]) => {
    try {
      const userId = currentUser?.id || 'default_user';
      
      // Get current inventory
      const currentInventoryKey = `inventory_${userId}`;
      const currentInventoryData = localStorage.getItem(currentInventoryKey);
      const currentInventory = currentInventoryData ? JSON.parse(currentInventoryData) : [];
      
      // Extract all unique ingredients from menu items
      const ingredientMap = new Map();
      
      menuItems.forEach(item => {
        if (item.ingredients && Array.isArray(item.ingredients)) {
          item.ingredients.forEach(ingredient => {
            if (ingredient && ingredient.name) {
              const key = ingredient.name.toLowerCase().trim();
              if (!ingredientMap.has(key)) {
                // Check if this ingredient already exists in current inventory
                const existingItem = currentInventory.find((item: any) => 
                  item.name.toLowerCase().trim() === key
                );
                
                // Categorize ingredient based on name
                const category = categorizeIngredient(ingredient.name);
                
                // CRITICAL FIX: Only create new inventory items if they don't exist
                // If they exist with user-entered data, DON'T overwrite them
                if (!existingItem) {
                  // New item - create with default values
                  ingredientMap.set(key, {
                    id: `menu-ingredient-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    name: ingredient.name,
                    quantity: 0, // Start with 0 for new items
                    unit: ingredient.unit || 'pieces',
                    category: category,
                    description: `Added from menu: ${item.name}`,
                    extractionMethod: 'menu-extraction',
                    lowStockThreshold: 5,
                    expiryDate: '',
                    lastUpdated: new Date().toISOString()
                  });
                } else {
                  // Existing item - PRESERVE ALL user data, only update metadata
                  ingredientMap.set(key, {
                    ...existingItem, // Keep ALL existing data
                    lastUpdated: new Date().toISOString() // Only update timestamp
                  });
                }
              }
            }
          });
        }
      });
      
      // Separate existing items from new items
      const existingIngredientNames = new Set(
        currentInventory.map((item: any) => item.name.toLowerCase().trim())
      );
      
      const newIngredients = [];
      const updatedExistingItems = [];
      
      Array.from(ingredientMap.values()).forEach(ingredient => {
        if (existingIngredientNames.has(ingredient.name.toLowerCase().trim())) {
          // This is an existing item, update it
          updatedExistingItems.push(ingredient);
        } else {
          // This is a new item, add it
          newIngredients.push(ingredient);
        }
      });
      
      // Create the final inventory by updating existing items and adding new ones
      const finalInventory = currentInventory.map((existingItem: any) => {
        const updatedItem = updatedExistingItems.find(item => 
          item.name.toLowerCase().trim() === existingItem.name.toLowerCase().trim()
        );
        return updatedItem || existingItem; // Use updated item if found, otherwise keep existing
      });
      
      // Add completely new ingredients
      finalInventory.push(...newIngredients);
      
      // Save to both localStorage and sessionStorage for consistency
      localStorage.setItem(currentInventoryKey, JSON.stringify(finalInventory));
      sessionStorage.setItem('inventoryItems', JSON.stringify(finalInventory));
      
      console.log(`✅ Updated ${updatedExistingItems.length} existing ingredients and added ${newIngredients.length} new ingredients to inventory`);
      
      return {
        success: true,
        addedCount: newIngredients.length,
        updatedCount: updatedExistingItems.length,
        totalIngredients: ingredientMap.size
      };
    } catch (error) {
      console.error('Error updating inventory from ingredients:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  const categorizeIngredient = (ingredientName: string): string => {
    const name = ingredientName.toLowerCase();
    
    // Meat & Poultry
    if (name.includes('chicken') || name.includes('beef') || name.includes('pork') || 
        name.includes('lamb') || name.includes('turkey') || name.includes('duck') ||
        name.includes('meat') || name.includes('bacon') || name.includes('ham')) {
      return 'Meat & Poultry';
    }
    
    // Seafood
    if (name.includes('fish') || name.includes('salmon') || name.includes('tuna') ||
        name.includes('shrimp') || name.includes('crab') || name.includes('lobster') ||
        name.includes('seafood') || name.includes('prawn')) {
      return 'Seafood';
    }
    
    // Vegetables
    if (name.includes('onion') || name.includes('tomato') || name.includes('carrot') ||
        name.includes('potato') || name.includes('pepper') || name.includes('garlic') ||
        name.includes('ginger') || name.includes('lettuce') || name.includes('spinach') ||
        name.includes('broccoli') || name.includes('mushroom') || name.includes('celery') ||
        name.includes('cucumber') || name.includes('cabbage')) {
      return 'Vegetables';
    }
    
    // Dairy & Eggs
    if (name.includes('milk') || name.includes('cheese') || name.includes('butter') ||
        name.includes('cream') || name.includes('yogurt') || name.includes('egg') ||
        name.includes('dairy')) {
      return 'Dairy & Eggs';
    }
    
    // Grains & Rice
    if (name.includes('rice') || name.includes('pasta') || name.includes('bread') ||
        name.includes('flour') || name.includes('grain') || name.includes('wheat') ||
        name.includes('noodle') || name.includes('quinoa') || name.includes('barley')) {
      return 'Grains & Rice';
    }
    
    // Spices & Seasonings
    if (name.includes('salt') || name.includes('pepper') || name.includes('spice') ||
        name.includes('herb') || name.includes('basil') || name.includes('oregano') ||
        name.includes('thyme') || name.includes('cumin') || name.includes('paprika') ||
        name.includes('curry') || name.includes('chili') || name.includes('cinnamon')) {
      return 'Spices & Seasonings';
    }
    
    // Oils & Fats
    if (name.includes('oil') || name.includes('olive') || name.includes('coconut') ||
        name.includes('fat') || name.includes('lard')) {
      return 'Oils & Fats';
    }
    
    // Beverages
    if (name.includes('water') || name.includes('juice') || name.includes('wine') ||
        name.includes('beer') || name.includes('soda') || name.includes('coffee') ||
        name.includes('tea') || name.includes('broth') || name.includes('stock')) {
      return 'Beverages';
    }
    
    // Default category
    return 'Other';
  };

  const saveMenuData = async () => {
    try {
      const userId = currentUser?.id || 'default_user';
      const menuDataKey = `menu_data_${userId}`;
      const menuData = {
        menuItems: existingMenuItems,
        lastUpdated: new Date().toISOString()
      };
      
      localStorage.setItem(menuDataKey, JSON.stringify(menuData));
      
      // Update inventory with ingredients from menu items
      console.log('🔄 Updating inventory with menu ingredients...');
      const inventoryUpdateResult = await updateInventoryFromIngredients(existingMenuItems);
      
      let successMessage = "Menu items saved successfully!";
      if (inventoryUpdateResult.success) {
        if (inventoryUpdateResult.addedCount > 0 && inventoryUpdateResult.updatedCount > 0) {
          successMessage += ` Added ${inventoryUpdateResult.addedCount} new ingredients and updated ${inventoryUpdateResult.updatedCount} existing ingredients in inventory.`;
        } else if (inventoryUpdateResult.addedCount > 0) {
          successMessage += ` Added ${inventoryUpdateResult.addedCount} new ingredients to inventory.`;
        } else if (inventoryUpdateResult.updatedCount > 0) {
          successMessage += ` Updated ${inventoryUpdateResult.updatedCount} existing ingredients in inventory.`;
        } else {
          successMessage += ` All ingredients already exist in inventory with current values.`;
        }
      }
      
      toast({
        title: "Success",
        description: successMessage,
      });
    } catch (error) {
      console.error('Error saving menu data:', error);
      toast({
        title: "Error",
        description: "Failed to save menu items. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateMenuItem = (id: string, field: string, value: string) => {
    setExistingMenuItems(prev => 
      prev.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const deleteMenuItem = (id: string) => {
    setExistingMenuItems(prev => prev.filter(item => item.id !== id));
    toast({
      title: "Success",
      description: "Menu item deleted successfully!",
    });
  };

  const addNewMenuItem = () => {
    const newItem: MenuItem = {
      id: `manual-${Date.now()}`,
      name: 'New Menu Item',
      price: '0.00',
      category: 'Main Course',
      ingredients: [],
      extractionMethod: 'manual'
    };
    
    setExistingMenuItems(prev => [...prev, newItem]);
    setEditingItem(newItem.id);
  };

  // Ingredient manipulation functions
  const updateIngredient = (itemId: string, ingredientIndex: number, field: string, value: string) => {
    setExistingMenuItems(prev => 
      prev.map(item => 
        item.id === itemId 
          ? {
              ...item,
              ingredients: item.ingredients?.map((ing, j) => 
                j === ingredientIndex ? { ...ing, [field]: value } : ing
              ) || []
            }
          : item
      )
    );
  };

  const addIngredient = (itemId: string) => {
    setExistingMenuItems(prev => 
      prev.map(item => 
        item.id === itemId 
          ? {
              ...item,
              ingredients: [...(item.ingredients || []), { name: '', quantity: '1', unit: 'pieces' }]
            }
          : item
      )
    );
  };

  const removeIngredient = (itemId: string, ingredientIndex: number) => {
    setExistingMenuItems(prev => 
      prev.map(item => 
        item.id === itemId 
          ? {
              ...item,
              ingredients: item.ingredients?.filter((_, j) => j !== ingredientIndex) || []
            }
          : item
      )
    );
  };

  const getIngredientDisplay = (ingredients?: MenuItem['ingredients']) => {
    if (!ingredients || ingredients.length === 0) return 'No ingredients';
    
    const ingredientNames = ingredients.map(ing => ing.name).filter(Boolean);
    
    return ingredientNames.slice(0, 3).join(', ') + (ingredientNames.length > 3 ? '...' : '');
  };

  // Show loading state while auth is initializing
  if (isLoading || !isInitialized) {
    return (
      
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading setup...</p>
            </div>
          </div>
        </div>
      
    );
  }

  // Redirect to login if not authenticated
  if (!currentUser) {
    router.push('/login');
    return null;
  }

  const handleInventoryMenuClick = () => {
    router.push('/inventory-management');
  };

  const handleTableManagementClick = () => {
    router.push('/pos/table-management');
  };

  const handleUserManagementClick = () => {
    router.push('/user-management');
  };

const handleDeliveryIntegrationClick = () => {
  router.push('/integrations/delivery');
};

  const handleMenuUpload = () => {
    router.push('/menu-upload');
  };

  const handleMenuEdit = () => {
    setCurrentView('menu-edit');
  };

  const handleBackToSetup = () => {
    setCurrentView('setup');
    setEditingItem(null);
  };

  return (
    
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          {currentView === 'menu-edit' && (
            <div className="mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBackToSetup}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Setup
              </Button>
            </div>
          )}
          
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold">
              {currentView === 'setup' ? 'Setup' : 'Edit Menu Items'}
            </h1>
            <p className="text-gray-600">
              {currentView === 'setup' 
                ? 'Configure your restaurant system' 
                : `Edit your menu items and ingredients (${existingMenuItems.length} items)`
              }
            </p>
          </div>
        </div>

        {currentView === 'setup' ? (
          <>
            {/* Main Setup Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Inventory & Menu Management */}
              <Card className="h-full flex flex-col bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all">
                <CardHeader className="pb-0">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                      <Package className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-gray-900">Inventory & Menu Management</CardTitle>
                      <p className="text-xs text-gray-500 mt-1">Keep stock, recipes, and pricing aligned</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col space-y-5 pt-4">
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Upload menus, link ingredients, track live stock, and sync changes automatically with your POS.
                  </p>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                      Menu extraction with ingredient linking
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                      Automated inventory adjustment per order
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                      Waste and yield analytics dashboard
                    </li>
                  </ul>
                  <div className="mt-auto space-y-3">
                    <Button 
                      onClick={handleInventoryMenuClick}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Package className="h-5 w-5 mr-2" />
                      Configure Inventory
                    </Button>
                    {existingMenuItems.length > 0 ? (
                      <div className="grid grid-cols-1 gap-2">
                        <Button 
                          onClick={handleMenuEdit}
                          variant="outline"
                          className="w-full"
                          size="sm"
                        >
                          <Edit3 className="h-4 w-4 mr-2" />
                          Edit Existing Menu ({existingMenuItems.length})
                        </Button>
                        <Button 
                          onClick={handleMenuUpload}
                          variant="outline"
                          className="w-full"
                          size="sm"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Upload New Menu
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-2">
                        <Button 
                          onClick={() => router.push('/menu-workflow')}
                          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                          size="sm"
                        >
                          <ChefHat className="h-4 w-4 mr-2" />
                          Complete Menu Workflow
                        </Button>
                        <Button 
                          onClick={handleMenuUpload}
                          variant="outline"
                          className="w-full"
                          size="sm"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Quick Upload Menu
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Table Management */}
              <Card className="h-full flex flex-col bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all">
                <CardHeader className="pb-0">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center">
                      <TableIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-gray-900">Table Management</CardTitle>
                      <p className="text-xs text-gray-500 mt-1">Layout designer & reservation control</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col space-y-5 pt-4">
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Build 2D/3D floor plans, manage sections, turn times, and coordinate walk-ins with reservations in real time.
                  </p>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-green-500"></span>
                      Drag-and-drop layout editor for rooms, tables, and bar counters
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-green-500"></span>
                      Reservation, waitlist, and walk-in tracking on one screen
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-green-500"></span>
                      Covers analytics and staff assignment suggestions
                    </li>
                  </ul>
                  <Button 
                    onClick={handleTableManagementClick}
                    className="mt-auto w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    <TableIcon className="h-5 w-5 mr-2" />
                    Configure Tables
                  </Button>
                </CardContent>
              </Card>

              {/* User Management */}
              <Card className="h-full flex flex-col bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all">
                <CardHeader className="pb-0">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                      <Users className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-gray-900">User Management</CardTitle>
                      <p className="text-xs text-gray-500 mt-1">Roles, permissions, and training</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col space-y-5 pt-4">
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Onboard staff, assign POS and back-office permissions, track onboarding progress, and automate access to hardware.
                  </p>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-purple-500"></span>
                      Role templates for managers, kitchen, front of house, and finance
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-purple-500"></span>
                      Hardware access provisioning and audit logging
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-purple-500"></span>
                      Training checklists and acknowledgment tracking
                    </li>
                  </ul>
                  <Button 
                    onClick={handleUserManagementClick}
                    className="mt-auto w-full bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Users className="h-5 w-5 mr-2" />
                    Manage Users
                  </Button>
                </CardContent>
              </Card>

              {/* Third-Party Delivery Integrations */}
              <Card className="h-full flex flex-col bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all">
                <CardHeader className="pb-0">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                      <Network className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-gray-900">Delivery Integrations</CardTitle>
                      <p className="text-xs text-gray-500 mt-1">Wolt, Lieferando, Uber Eats</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col space-y-5 pt-4">
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Sync menus, pricing, and tickets with third-party marketplaces while receiving orders directly inside SmartChef POS.
                  </p>
                  <div className="flex flex-wrap justify-start gap-2">
                    {['Wolt', 'Lieferando', 'Uber Eats'].map((partner) => (
                      <Badge
                        key={partner}
                        variant="outline"
                        className="px-3 py-1 border-orange-200 text-orange-700 bg-orange-50"
                      >
                        {partner}
                      </Badge>
                    ))}
                  </div>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-orange-500"></span>
                      Auto-accept orders with prep routing and kitchen screen updates
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-orange-500"></span>
                      Unified menu management with partner-specific overrides
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-orange-500"></span>
                      Delivery status sync back to marketplaces in real time
                    </li>
                  </ul>
                  <Button
                    onClick={handleDeliveryIntegrationClick}
                    className="mt-auto w-full bg-orange-600 hover:bg-orange-700 text-white"
                    size="lg"
                  >
                    <Sparkles className="h-5 w-5 mr-2" />
                    Configure Delivery Integrations
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Setup Information */}
            <Card className="bg-gray-50 border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-800">
                  <Settings className="h-5 w-5" />
                  Setup Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="font-medium text-gray-900">Inventory & Menu Management</h4>
                      <p className="text-sm text-gray-600">
                        Upload your restaurant menu, manage ingredient inventory, track stock levels, and edit existing menu items directly.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="font-medium text-gray-900">Table Management</h4>
                      <p className="text-sm text-gray-600">
                        Design your restaurant layout, configure table arrangements, set up reservation systems, and manage dining area operations.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="font-medium text-gray-900">User Management</h4>
                      <p className="text-sm text-gray-600">
                        Add and manage restaurant staff members, assign roles (Manager, Kitchen Staff, Waiter, etc.), set permissions, and control access levels.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="font-medium text-gray-900">Delivery Integrations</h4>
                      <p className="text-sm text-gray-600">
                        Connect marketplaces like Wolt, Lieferando, and Uber Eats to sync menus, accept online orders in real time, and keep preparation statuses aligned without manual entry.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>Tip:</strong> You can edit existing menu items directly here without re-uploading your menu PDF. Changes are saved automatically.
                  </p>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          /* Menu Editing View */
          <div className="space-y-6">
            {/* Action Bar */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <ChefHat className="h-5 w-5" />
                    Menu Items ({existingMenuItems.length})
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      onClick={addNewMenuItem}
                      variant="outline"
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                    <Button
                      onClick={saveMenuData}
                      variant="default"
                      size="sm"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Menu & Update Inventory
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Menu Items Grid */}
            {isLoadingMenu ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading menu items...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {existingMenuItems.map((item) => (
                  <Card key={item.id} className="border border-gray-200">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{item.category}</Badge>
                          <Badge variant="secondary">€{item.price}</Badge>
                        </div>
                        <Button
                          onClick={() => deleteMenuItem(item.id)}
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Basic Info */}
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor={`name-${item.id}`}>Dish Name</Label>
                          <Input
                            id={`name-${item.id}`}
                            value={item.name}
                            onChange={(e) => updateMenuItem(item.id, 'name', e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor={`price-${item.id}`}>Price (€)</Label>
                            <Input
                              id={`price-${item.id}`}
                              type="number"
                              step="0.01"
                              value={item.price}
                              onChange={(e) => updateMenuItem(item.id, 'price', e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`category-${item.id}`}>Category</Label>
                            <Select
                              value={item.category}
                              onValueChange={(value) => updateMenuItem(item.id, 'category', value)}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {CATEGORIES.map((category) => (
                                  <SelectItem key={category} value={category}>
                                    {category}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      {/* Ingredients Section */}
                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <Label className="text-sm font-semibold">Ingredients ({(item.ingredients || []).length})</Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addIngredient(item.id)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add
                          </Button>
                        </div>
                        
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {(item.ingredients || []).map((ingredient, ingredientIndex) => (
                            <div key={ingredientIndex} className="flex gap-2 items-center bg-gray-50 p-2 rounded">
                              <div className="flex-1">
                                <Input
                                  value={ingredient.name}
                                  onChange={(e) => updateIngredient(item.id, ingredientIndex, 'name', e.target.value)}
                                  placeholder="Ingredient name"
                                  className="text-sm h-8"
                                />
                              </div>
                              <div className="w-20">
                                <Input
                                  value={ingredient.quantity}
                                  onChange={(e) => updateIngredient(item.id, ingredientIndex, 'quantity', e.target.value)}
                                  placeholder="1"
                                  className="text-sm h-8"
                                />
                              </div>
                              <div className="w-24">
                                <Select
                                  value={ingredient.unit}
                                  onValueChange={(value) => updateIngredient(item.id, ingredientIndex, 'unit', value)}
                                >
                                  <SelectTrigger className="text-sm h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {UNITS.map((unit) => (
                                      <SelectItem key={unit} value={unit}>
                                        {unit}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeIngredient(item.id, ingredientIndex)}
                                className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                        
                        {(item.ingredients || []).length === 0 && (
                          <div className="text-center py-4 text-gray-500">
                            <p className="text-sm">No ingredients added yet</p>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addIngredient(item.id)}
                              className="mt-2"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add First Ingredient
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {existingMenuItems.length === 0 && !isLoadingMenu && (
              <Card>
                <CardContent className="text-center py-12">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Menu Items Found</h3>
                  <p className="text-gray-600 mb-6">Upload a menu to get started with editing.</p>
                  <Button onClick={handleMenuUpload} variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Menu
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    
  );
}