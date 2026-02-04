'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { useToast } from '@/shared/hooks/use-toast';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { ArrowLeft, Save, CheckCircle, XCircle, Package } from 'lucide-react';
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
    name: string;
    price: string;
    description?: string;
  }>;
  description?: string;
  extractionMethod: string;
}

interface InventoryItem {
  id: string;
  name: string;
  currentQuantity: number;
  unit: string;
  isPresent: boolean;
  requiredQuantity: number;
  menuItems: string[];
}

export default function InventoryUpdatePage() {
  const { currentUser, isLoading, isInitialized } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load menu items and extract unique ingredients
  useEffect(() => {
    const loadMenuData = () => {
      try {
        const storedItems = sessionStorage.getItem('extractedMenuItems');
        if (storedItems) {
          const parsedItems = JSON.parse(storedItems);
          setMenuItems(parsedItems);
          
          // Extract unique ingredients
          const uniqueIngredients = extractUniqueIngredients(parsedItems);
          
          // Check existing inventory and create inventory items
          checkInventoryAndCreateItems(uniqueIngredients);
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

  const extractUniqueIngredients = (items: MenuItem[]): Array<{
    name: string;
    unit: string;
    requiredQuantity: number;
    menuItems: string[];
  }> => {
    const ingredientMap = new Map<string, {
      name: string;
      unit: string;
      requiredQuantity: number;
      menuItems: string[];
    }>();

    items.forEach(item => {
      item.ingredients.forEach(ingredient => {
        const key = ingredient.name.toLowerCase().trim();
        if (ingredientMap.has(key)) {
          const existing = ingredientMap.get(key)!;
          existing.requiredQuantity += parseFloat(ingredient.quantity) || 0;
          existing.menuItems.push(item.name);
        } else {
          ingredientMap.set(key, {
            name: ingredient.name,
            unit: ingredient.unit,
            requiredQuantity: parseFloat(ingredient.quantity) || 0,
            menuItems: [item.name]
          });
        }
      });
    });

    return Array.from(ingredientMap.values());
  };

  const checkInventoryAndCreateItems = async (ingredients: Array<{
    name: string;
    unit: string;
    requiredQuantity: number;
    menuItems: string[];
  }>) => {
    try {
      // Load existing inventory from API first, then fallback to sessionStorage
      let existingInventory: Array<{ name: string; quantity: number; unit: string }> = [];
      
      // Try to load from API if user is authenticated
      if (currentUser?.id) {
        try {
          const response = await fetch(`/api/inventory?userId=${currentUser.id}`);
          if (response.ok) {
            const data = await response.json();
            if (data.inventory && Array.isArray(data.inventory)) {
              existingInventory = data.inventory.map((item: any) => ({
                name: item.name.toLowerCase(),
                quantity: item.quantity,
                unit: item.unit
              }));
              console.log('📦 Loaded existing inventory from API for inventory update:', existingInventory.length, 'items');
            }
          }
        } catch (apiError) {
          console.warn('Failed to load from API, falling back to sessionStorage:', apiError);
        }
      }
      
      // Fallback to sessionStorage if API didn't work or no user
      if (existingInventory.length === 0) {
        const storedInventory = sessionStorage.getItem('inventoryItems');
        if (storedInventory) {
          const parsedInventory = JSON.parse(storedInventory);
          existingInventory = parsedInventory.map((item: any) => ({
            name: item.name.toLowerCase(),
            quantity: item.quantity,
            unit: item.unit
          }));
          console.log('📦 Loaded existing inventory from sessionStorage for inventory update:', existingInventory.length, 'items');
        }
      }

      const inventoryItems: InventoryItem[] = ingredients.map(ingredient => {
        const existingItem = existingInventory.find(
          item => item.name === ingredient.name.toLowerCase()
        );
        
        return {
          id: `inv-${Date.now()}-${Math.random()}`,
          name: ingredient.name,
          currentQuantity: existingItem ? existingItem.quantity : 0,
          unit: ingredient.unit,
          isPresent: existingItem ? existingItem.quantity > 0 : false,
          requiredQuantity: ingredient.requiredQuantity,
          menuItems: ingredient.menuItems
        };
      });

      setInventoryItems(inventoryItems);
    } catch (error) {
      console.error('Error checking inventory:', error);
      toast({
        title: 'Error',
        description: 'Failed to check existing inventory',
        variant: 'destructive'
      });
    }
  };

  const updateInventoryQuantity = (itemId: string, quantity: number) => {
    setInventoryItems(prev => prev.map(item => 
      item.id === itemId 
        ? { 
            ...item, 
            currentQuantity: quantity,
            isPresent: quantity > 0
          }
        : item
    ));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const userId = currentUser?.id || 'default_user';
      
      // Convert inventory items to the format expected by the inventory system
      const inventoryData = inventoryItems.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.currentQuantity,
        unit: item.unit,
        category: 'Other', // Default category, could be enhanced
        description: `Updated from menu analysis - used in: ${item.menuItems.join(', ')}`,
        extractionMethod: 'menu-analysis',
        lowStockThreshold: 5,
        expiryDate: '',
        lastUpdated: new Date().toISOString()
      }));
      
      console.log('💾 [INVENTORY-UPDATE] Saving inventory items:', inventoryData.length, 'items');
      console.log('💾 [INVENTORY-UPDATE] Sample items being saved:', inventoryData.slice(0, 3));
      
      // Save to both localStorage and sessionStorage for consistency
      localStorage.setItem(`inventory_${userId}`, JSON.stringify(inventoryData));
      sessionStorage.setItem('inventoryItems', JSON.stringify(inventoryData));
      
      console.log('✅ [INVENTORY-UPDATE] Inventory saved to both localStorage and sessionStorage for userId:', userId);
      
      // Also sync with API if user is authenticated
      if (currentUser?.id) {
        try {
          const response = await fetch('/api/inventory', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: currentUser.id,
              inventory: inventoryData,
              action: 'sync'
            }),
          });
          
          if (response.ok) {
            console.log('✅ [INVENTORY-UPDATE] Inventory synced with API successfully');
          } else {
            console.warn('⚠️ [INVENTORY-UPDATE] Failed to sync inventory with API');
          }
        } catch (apiError) {
          console.warn('⚠️ [INVENTORY-UPDATE] API sync failed, but continuing with localStorage:', apiError);
        }
      }
      
      toast({
        title: 'Success',
        description: `Inventory updated with ${inventoryItems.length} items. Quantities and units have been saved.`
      });
      
      // Clear session storage
      sessionStorage.removeItem('extractedMenuItems');
      sessionStorage.removeItem('extractionResult');
      
      // Stay on current page - inventory has been saved successfully
    } catch (error) {
      console.error('Error saving inventory:', error);
      toast({
        title: 'Error',
        description: 'Failed to save inventory',
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
            <span className="ml-2 text-gray-600">Loading inventory data...</span>
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
            <p className="text-yellow-700">Please log in to access the inventory update feature.</p>
          </div>
        </div>
      
    );
  }

  const presentItems = inventoryItems.filter(item => item.isPresent);
  const missingItems = inventoryItems.filter(item => !item.isPresent);

  return (
    
      <div className="max-w-6xl mx-auto p-6">
        {/* Header with Centered Title and Action Buttons */}
        <div className="mb-6">
          {/* Back Button */}
          <div className="mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/menu-edit')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Edit Menu
            </Button>
          </div>
          
          {/* Centered Title */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold">Update Inventory</h1>
            <p className="text-gray-600">Review and update inventory based on extracted menu ingredients</p>
          </div>
          
          {/* Action Button */}
          <div className="flex justify-center">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSaving ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Save Inventory
                </div>
              )}
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Ingredients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inventoryItems.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-600">In Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{presentItems.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-600">Missing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{missingItems.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Inventory Items */}
        <div className="space-y-4">
          {inventoryItems.map((item, index) => (
            <Card key={item.id} className={`border-2 ${item.isPresent ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${item.isPresent ? 'bg-green-100' : 'bg-red-100'}`}>
                      {item.isPresent ? (
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      ) : (
                        <XCircle className="h-6 w-6 text-red-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{item.name}</h3>
                      <p className="text-sm text-gray-600">
                        Used in: {item.menuItems.join(', ')}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <Badge variant={item.isPresent ? 'default' : 'destructive'}>
                          {item.isPresent ? 'In Stock' : 'Missing'}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          Required: {item.requiredQuantity} {item.unit}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <Label htmlFor={`quantity-${item.id}`} className="text-sm font-medium">
                        Current Stock
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id={`quantity-${item.id}`}
                          type="number"
                          value={item.currentQuantity}
                          onChange={(e) => updateInventoryQuantity(item.id, parseFloat(e.target.value) || 0)}
                          className="w-24"
                          min="0"
                          step="0.1"
                        />
                        <span className="text-sm text-gray-500">{item.unit}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Summary Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Inventory Update Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <div className="font-medium text-blue-800">Total Items</div>
              <div className="text-2xl font-bold text-blue-600">{inventoryItems.length}</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <div className="font-medium text-blue-800">In Stock</div>
              <div className="text-2xl font-bold text-green-600">
                {inventoryItems.filter(item => item.isPresent).length}
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <div className="font-medium text-blue-800">Missing</div>
              <div className="text-2xl font-bold text-red-600">
                {inventoryItems.filter(item => !item.isPresent).length}
              </div>
            </div>
          </div>
          <p className="text-sm text-blue-700 mt-4">
            Click "Save Inventory" to update your inventory with the quantities and units shown above.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('/menu-edit')}
            className="px-8"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Edit Menu
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-green-600 hover:bg-green-700 px-8"
          >
            {isSaving ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving Inventory...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Save Inventory
              </div>
            )}
          </Button>
          <Button
            onClick={() => router.push('/inventory')}
            className="bg-blue-600 hover:bg-blue-700 px-8"
          >
            <Package className="h-4 w-4 mr-2" />
            View Inventory
          </Button>
        </div>
      </div>
    
  );
}
