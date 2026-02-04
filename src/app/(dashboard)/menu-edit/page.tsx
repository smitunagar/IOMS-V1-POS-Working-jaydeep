'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { useToast } from '@/shared/hooks/use-toast';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Plus, Trash2, Save, ArrowLeft, Package } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface MenuItem {
  id: string;
  name: string;
  price: string;
  category: string;
  image: string;
  ingredients: Array<{
    name: string;
    quantity: string;
    unit: string;
  }>;
  addons?: Array<{
    id: string;
    name: string;
    price: string;
    description?: string;
  }>;
  description?: string;
  extractionMethod: string;
}

const CATEGORIES = [
  'Appetizers',
  'Main Course',
  'Pizza',
  'Pasta',
  'Salads',
  'Soups',
  'Desserts',
  'Beverages',
  'Beer',
  'Wine',
  'Coffee',
  'Sides & Rice',
  'Other'
];

const UNITS = [
  'g', 'kg', 'ml', 'l', 'cups', 'tbsp', 'tsp', 'pieces', 'slices', 'cloves', 'bunches'
];

export default function MenuEditPage() {
  const { currentUser, isLoading, isInitialized } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load menu items from sessionStorage on component mount
  useEffect(() => {
    const loadMenuData = () => {
      try {
        const storedItems = sessionStorage.getItem('extractedMenuItems');
        if (storedItems) {
          const parsedItems = JSON.parse(storedItems);
          // Convert ingredients to the new format if needed
          const convertedItems = parsedItems.map((item: any) => ({
            ...item,
            ingredients: Array.isArray(item.ingredients) 
              ? item.ingredients.map((ing: any) => {
                  if (typeof ing === 'string') {
                    // Old format: convert string to object with default values
                    return {
                      name: ing,
                      quantity: '1',
                      unit: 'pieces'
                    };
                  } else if (ing && typeof ing === 'object' && ing.name) {
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
                      name: ing.name || '',
                      quantity: cleanQuantity,
                      unit: cleanUnit
                    };
                  } else {
                    // Fallback
                    return {
                      name: 'Unknown ingredient',
                      quantity: '1',
                      unit: 'pieces'
                    };
                  }
                })
              : []
          }));
          setMenuItems(convertedItems);
        } else {
          // No menu data found, redirect back to upload
          router.push('/menu-upload');
        }
      } catch (error) {
        console.error('Error loading menu data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load menu data',
          variant: 'destructive'
        });
        router.push('/menu-upload');
      } finally {
        setIsLoadingData(false);
      }
    };

    loadMenuData();
  }, [router, toast]);

  const updateMenuItem = (index: number, field: keyof MenuItem, value: any) => {
    setMenuItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const updateIngredient = (itemIndex: number, ingredientIndex: number, field: string, value: string) => {
    setMenuItems(prev => prev.map((item, i) => 
      i === itemIndex 
        ? {
            ...item,
            ingredients: item.ingredients.map((ing, j) => 
              j === ingredientIndex ? { ...ing, [field]: value } : ing
            )
          }
        : item
    ));
  };

  const addIngredient = (itemIndex: number) => {
    setMenuItems(prev => prev.map((item, i) => 
      i === itemIndex 
        ? {
            ...item,
            ingredients: [...item.ingredients, { name: '', quantity: '1', unit: 'pieces' }]
          }
        : item
    ));
  };

  const removeIngredient = (itemIndex: number, ingredientIndex: number) => {
    setMenuItems(prev => prev.map((item, i) => 
      i === itemIndex 
        ? {
            ...item,
            ingredients: item.ingredients.filter((_, j) => j !== ingredientIndex)
          }
        : item
    ));
  };

  // Add-ons management functions
  const updateAddon = (itemIndex: number, addonIndex: number, field: string, value: string) => {
    setMenuItems(prev => prev.map((item, i) => 
      i === itemIndex 
        ? {
            ...item,
            addons: item.addons?.map((addon, j) => 
              j === addonIndex ? { ...addon, [field]: value } : addon
            ) || []
          }
        : item
    ));
  };

  const addAddon = (itemIndex: number) => {
    setMenuItems(prev => prev.map((item, i) => 
      i === itemIndex 
        ? {
            ...item,
            addons: [...(item.addons || []), { 
              id: `addon_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              name: '', 
              price: '0.00', 
              description: '' 
            }]
          }
        : item
    ));
  };

  const removeAddon = (itemIndex: number, addonIndex: number) => {
    setMenuItems(prev => prev.map((item, i) => 
      i === itemIndex 
        ? {
            ...item,
            addons: item.addons?.filter((_, j) => j !== addonIndex) || []
          }
        : item
    ));
  };

  const removeMenuItem = (index: number) => {
    setMenuItems(prev => prev.filter((_, i) => i !== index));
  };


  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Convert menu items to the format expected by the POS system
      const convertedMenuItems = menuItems.map(item => ({
        ...item,
        price: typeof item.price === 'string' ? 
          parseFloat(item.price.replace(/[^\d.,]/g, '').replace(',', '.')) : 
          parseFloat(item.price),
        // Ensure ingredients are in the correct format
        ingredients: item.ingredients?.map(ing => 
          typeof ing === 'string' ? ing : ing.name
        ) || []
      }));

      // Save to localStorage in the format expected by the POS
      const userId = currentUser?.id || 'default_user';
      const menuDataKey = `menu_data_${userId}`;
      const menuData = {
        menuItems: convertedMenuItems,
        categories: [...new Set(convertedMenuItems.map(item => item.category))],
        lastUpdated: new Date().toISOString()
      };
      
      localStorage.setItem(menuDataKey, JSON.stringify(menuData));
      
      // Also save using the menu service for compatibility
      if (typeof window !== 'undefined') {
        const { saveDishes } = await import('@/server/lib/menuService');
        saveDishes(userId, convertedMenuItems);
      }

      toast({
        title: 'Success',
        description: `Menu saved with ${menuItems.length} items. You can now use it in the POS system.`
      });
      
      // Clear session storage
      sessionStorage.removeItem('extractedMenuItems');
      sessionStorage.removeItem('extractionResult');
    } catch (error) {
      console.error('Error saving menu:', error);
      toast({
        title: 'Error',
        description: 'Failed to save menu',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading state while auth is initializing or data is loading
  if (isLoading || !isInitialized || isLoadingData) {
    return (
      
        <div className="max-w-6xl mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading menu...</span>
          </div>
        </div>
      
    );
  }

  // Show login prompt if not authenticated
  if (!currentUser) {
    return (
      
        <div className="max-w-6xl mx-auto p-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-6 text-center">
            <h2 className="text-xl font-semibold text-yellow-800 mb-2">Authentication Required</h2>
            <p className="text-yellow-700">Please log in to access the menu editing feature.</p>
          </div>
        </div>
      
    );
  }

  return (
    
      <div className="max-w-6xl mx-auto p-6">
        {/* Header with Centered Title and Action Buttons */}
        <div className="mb-6">
          {/* Back Button */}
          <div className="mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Clear session storage and go back to upload
                sessionStorage.removeItem('extractedMenuItems');
                sessionStorage.removeItem('extractionResult');
                router.push('/menu-upload');
              }}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Upload
            </Button>
          </div>
          
          {/* Centered Title */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold">Edit Menu Items</h1>
            <p className="text-gray-600">Review and edit the extracted menu items</p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                // Clear session storage and go back to upload
                sessionStorage.removeItem('extractedMenuItems');
                sessionStorage.removeItem('extractionResult');
                router.push('/menu-upload');
              }}
            >
              Upload Different Menu
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                // Store current menu items and go to inventory update
                sessionStorage.setItem('extractedMenuItems', JSON.stringify(menuItems));
                router.push('/inventory-update');
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Next: Update Inventory →
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSaving ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving Menu...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Save Menu
                </div>
              )}
            </Button>
          </div>
        </div>

        {/* Menu Summary */}
        {menuItems.length > 0 && (
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Package className="h-5 w-5" />
                Menu Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-blue-700">
                <p className="mb-2">
                  <strong>Your menu contains the following ingredients that can be managed in inventory:</strong>
                </p>
                <div className="bg-white rounded-md p-3 border border-blue-200">
                  {(() => {
                    const ingredientSet = new Set<string>();
                    menuItems.forEach(item => {
                      if (item.ingredients && Array.isArray(item.ingredients)) {
                        item.ingredients.forEach(ingredient => {
                          if (ingredient && typeof ingredient === 'object' && ingredient.name) {
                            ingredientSet.add(`${ingredient.name} (${ingredient.unit || 'pieces'})`);
                          }
                        });
                      }
                    });
                    const uniqueIngredients = Array.from(ingredientSet);
                    
                    if (uniqueIngredients.length === 0) {
                      return <p className="text-gray-600 italic">No ingredients found in menu items.</p>;
                    }
                    
                    return (
                      <div>
                        <p className="font-medium mb-2">
                          {uniqueIngredients.length} unique ingredients identified:
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                          {uniqueIngredients.slice(0, 12).map((ingredient, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {ingredient}
                            </Badge>
                          ))}
                          {uniqueIngredients.length > 12 && (
                            <Badge variant="outline" className="text-xs">
                              +{uniqueIngredients.length - 12} more...
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
                <p className="mt-2 text-xs text-blue-600">
                  💡 <strong>Next Step:</strong> After saving the menu, you can update your inventory with these ingredients.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Menu Items */}
        <div className="space-y-6">
          {menuItems.map((item, itemIndex) => (
            <Card key={item.id} className="border-2">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">Menu Item #{itemIndex + 1}</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeMenuItem(itemIndex)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`name-${itemIndex}`}>Item Name</Label>
                    <Input
                      id={`name-${itemIndex}`}
                      value={item.name}
                      onChange={(e) => updateMenuItem(itemIndex, 'name', e.target.value)}
                      placeholder="Enter item name"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`price-${itemIndex}`}>Price</Label>
                    <Input
                      id={`price-${itemIndex}`}
                      value={item.price}
                      onChange={(e) => updateMenuItem(itemIndex, 'price', e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`category-${itemIndex}`}>Category</Label>
                    <Select
                      value={item.category}
                      onValueChange={(value) => updateMenuItem(itemIndex, 'category', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
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
                  <div>
                    <Label htmlFor={`image-${itemIndex}`}>Image URL</Label>
                    <Input
                      id={`image-${itemIndex}`}
                      value={item.image}
                      onChange={(e) => updateMenuItem(itemIndex, 'image', e.target.value)}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor={`description-${itemIndex}`}>Description (Optional)</Label>
                  <Textarea
                    id={`description-${itemIndex}`}
                    value={item.description || ''}
                    onChange={(e) => updateMenuItem(itemIndex, 'description', e.target.value)}
                    placeholder="Enter item description"
                    rows={2}
                  />
                </div>

                {/* Ingredients Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-base font-semibold">Ingredients</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addIngredient(itemIndex)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Ingredient
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {item.ingredients.map((ingredient, ingredientIndex) => (
                      <div key={ingredientIndex} className="flex gap-2 items-end">
                        <div className="flex-1">
                          <Label htmlFor={`ingredient-name-${itemIndex}-${ingredientIndex}`}>
                            Ingredient Name
                          </Label>
                          <Input
                            id={`ingredient-name-${itemIndex}-${ingredientIndex}`}
                            value={ingredient.name}
                            onChange={(e) => updateIngredient(itemIndex, ingredientIndex, 'name', e.target.value)}
                            placeholder="e.g., Chicken Breast"
                          />
                        </div>
                        <div className="w-24">
                          <Label htmlFor={`ingredient-quantity-${itemIndex}-${ingredientIndex}`}>
                            Quantity
                          </Label>
                          <Input
                            id={`ingredient-quantity-${itemIndex}-${ingredientIndex}`}
                            value={ingredient.quantity}
                            onChange={(e) => updateIngredient(itemIndex, ingredientIndex, 'quantity', e.target.value)}
                            placeholder="1"
                          />
                        </div>
                        <div className="w-32">
                          <Label htmlFor={`ingredient-unit-${itemIndex}-${ingredientIndex}`}>
                            Unit
                          </Label>
                          <Select
                            value={ingredient.unit}
                            onValueChange={(value) => updateIngredient(itemIndex, ingredientIndex, 'unit', value)}
                          >
                            <SelectTrigger>
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
                          onClick={() => removeIngredient(itemIndex, ingredientIndex)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add-ons Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-base font-semibold">Add-ons (Optional)</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addAddon(itemIndex)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Add-on
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {(item.addons || []).map((addon, addonIndex) => (
                      <div key={addonIndex} className="flex gap-2 items-end">
                        <div className="flex-1">
                          <Label htmlFor={`addon-name-${itemIndex}-${addonIndex}`}>
                            Add-on Name
                          </Label>
                          <Input
                            id={`addon-name-${itemIndex}-${addonIndex}`}
                            value={addon.name}
                            onChange={(e) => updateAddon(itemIndex, addonIndex, 'name', e.target.value)}
                            placeholder="e.g., Extra Cheese, Extra Olives"
                          />
                        </div>
                        <div className="w-24">
                          <Label htmlFor={`addon-price-${itemIndex}-${addonIndex}`}>
                            Price
                          </Label>
                          <Input
                            id={`addon-price-${itemIndex}-${addonIndex}`}
                            value={addon.price}
                            onChange={(e) => updateAddon(itemIndex, addonIndex, 'price', e.target.value)}
                            placeholder="2.50"
                          />
                        </div>
                        <div className="flex-1">
                          <Label htmlFor={`addon-description-${itemIndex}-${addonIndex}`}>
                            Description (Optional)
                          </Label>
                          <Input
                            id={`addon-description-${itemIndex}-${addonIndex}`}
                            value={addon.description || ''}
                            onChange={(e) => updateAddon(itemIndex, addonIndex, 'description', e.target.value)}
                            placeholder="e.g., Fresh mozzarella cheese"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeAddon(itemIndex, addonIndex)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  {(!item.addons || item.addons.length === 0) && (
                    <div className="text-sm text-gray-500 italic">
                      No add-ons added yet. Click "Add Add-on" to add optional extras for this dish.
                    </div>
                  )}
                </div>

              </CardContent>
            </Card>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Menu Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium">Total Items:</span> {menuItems.length}
            </div>
            <div>
              <span className="font-medium">Categories:</span> {new Set(menuItems.map(item => item.category)).size}
            </div>
            <div>
              <span className="font-medium">Total Ingredients:</span> {menuItems.reduce((sum, item) => sum + item.ingredients.length, 0)}
            </div>
            <div>
              <span className="font-medium">Total Add-ons:</span> {menuItems.reduce((sum, item) => sum + (item.addons?.length || 0), 0)}
            </div>
          </div>
        </div>
      </div>
    
  );
}
