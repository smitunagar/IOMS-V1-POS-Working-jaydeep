'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { AppLayout } from '@/shared/components/layout/AppLayout';
import { useToast } from '@/shared/hooks/use-toast';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { 
  Plus, 
  Trash2, 
  Save, 
  ArrowLeft, 
  ArrowRight, 
  Package, 
  CheckCircle, 
  AlertCircle,
  Upload,
  FileText,
  ChefHat,
  ShoppingCart,
  Warehouse,
  Check,
  X
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface MenuItem {
  id: string;
  name: string;
  price: string;
  category: string;
  image: string;
  description?: string;
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
  extractionMethod: string;
}

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  description?: string;
  extractionMethod?: string;
  lowStockThreshold?: number;
  expiryDate?: string;
  lastUpdated?: string;
}

interface IngredientComparison {
  name: string;
  unit: string;
  requiredQuantity: string;
  existingQuantity: number;
  isAvailable: boolean;
  inventoryId?: string;
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

const WORKFLOW_STEPS = [
  { id: 1, title: 'Upload Menu', description: 'Upload PDF and extract menu items', icon: Upload },
  { id: 2, title: 'AI Ingredient Prediction', description: 'AI predicts ingredients for each dish', icon: ChefHat },
  { id: 3, title: 'Add-ons Management', description: 'Add optional add-ons for dishes', icon: Plus },
  { id: 4, title: 'Save Menu', description: 'Save menu for order entry', icon: Save },
  { id: 5, title: 'Inventory Comparison', description: 'Compare ingredients with existing inventory', icon: Package },
  { id: 6, title: 'Update Inventory', description: 'Update quantities and add missing items', icon: Warehouse },
  { id: 7, title: 'Complete Setup', description: 'Finalize and activate system', icon: CheckCircle }
];

export default function MenuWorkflowPage() {
  const { currentUser, isLoading, isInitialized } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [existingInventory, setExistingInventory] = useState<InventoryItem[]>([]);
  const [ingredientComparisons, setIngredientComparisons] = useState<IngredientComparison[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Load existing inventory on mount
  useEffect(() => {
    if (isInitialized && currentUser) {
      loadExistingInventory();
      loadMenuFromSession();
    }
  }, [isInitialized, currentUser]);

  const loadExistingInventory = () => {
    try {
      const userId = currentUser?.id || 'default_user';
      const inventoryKey = `inventory_${userId}`;
      const storedInventory = localStorage.getItem(inventoryKey);
      
      if (storedInventory) {
        const inventory = JSON.parse(storedInventory);
        setExistingInventory(inventory);
        console.log('📦 Loaded existing inventory:', inventory.length, 'items');
      }
    } catch (error) {
      console.error('Error loading existing inventory:', error);
    }
  };

  const loadMenuFromSession = () => {
    try {
      const storedItems = sessionStorage.getItem('extractedMenuItems');
      if (storedItems) {
        const parsedItems = JSON.parse(storedItems);
        setMenuItems(parsedItems);
        if (parsedItems.length > 0) {
          setCurrentStep(2); // Skip to AI prediction step if menu already loaded
        }
      }
    } catch (error) {
      console.error('Error loading menu from session:', error);
    }
  };

  // Step 1: Upload Menu
  const handleFileUpload = async () => {
    if (!selectedFile || !currentUser) {
      toast({
        title: 'Error',
        description: 'Please select a file and ensure you are logged in',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);
    try {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const base64 = e.target?.result as string;
          
          const response = await fetch('/api/uploadMenu', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              file: base64,
              userId: currentUser.id
            })
          });

          const result = await response.json();
          
          if (response.ok && result.menu) {
            setMenuItems(result.menu);
            sessionStorage.setItem('extractedMenuItems', JSON.stringify(result.menu));
            
            toast({
              title: 'Success',
              description: `Extracted ${result.menu.length} menu items successfully!`
            });
            
            setCurrentStep(2); // Move to AI prediction step
          } else {
            throw new Error(result.error || 'Menu extraction failed');
          }
        } catch (error) {
          console.error('Upload error:', error);
          toast({
            title: 'Error',
            description: 'Failed to extract menu from PDF',
            variant: 'destructive'
          });
        }
      };
      
      reader.readAsDataURL(selectedFile);
    } catch (error) {
      console.error('File upload error:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload file',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Step 2: AI Ingredient Prediction (already handled by Gemini)
  const proceedToAddons = () => {
    setCurrentStep(3);
  };

  // Step 3: Add-ons Management
  const addAddonToItem = (itemIndex: number) => {
    const newAddon = {
      id: `addon-${Date.now()}`,
      name: '',
      price: '0.00',
      description: ''
    };
    
    setMenuItems(prev => prev.map((item, index) => 
      index === itemIndex 
        ? { ...item, addons: [...(item.addons || []), newAddon] }
        : item
    ));
  };

  const updateAddon = (itemIndex: number, addonIndex: number, field: string, value: string) => {
    setMenuItems(prev => prev.map((item, index) => 
      index === itemIndex 
        ? {
            ...item,
            addons: item.addons?.map((addon, aIndex) => 
              aIndex === addonIndex ? { ...addon, [field]: value } : addon
            )
          }
        : item
    ));
  };

  const removeAddon = (itemIndex: number, addonIndex: number) => {
    setMenuItems(prev => prev.map((item, index) => 
      index === itemIndex 
        ? { ...item, addons: item.addons?.filter((_, aIndex) => aIndex !== addonIndex) }
        : item
    ));
  };

  // Step 4: Save Menu
  const saveMenuForOrderEntry = async () => {
    try {
      setIsProcessing(true);
      
      // Convert menu items to the format expected by the POS system
      const convertedMenuItems = menuItems.map(item => ({
        ...item,
        price: typeof item.price === 'string' ? 
          parseFloat(item.price.replace(/[^\d.,]/g, '').replace(',', '.')) : 
          parseFloat(item.price),
        ingredients: item.ingredients?.map(ing => ing.name) || []
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
        description: `Menu saved with ${menuItems.length} items. Ready for order entry!`
      });
      
      setCurrentStep(5); // Move to inventory comparison
      compareWithInventory();
      
    } catch (error) {
      console.error('Error saving menu:', error);
      toast({
        title: 'Error',
        description: 'Failed to save menu',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Step 5: Inventory Comparison
  const compareWithInventory = () => {
    const comparisons: IngredientComparison[] = [];
    const existingIngredientMap = new Map(
      existingInventory.map(item => [item.name.toLowerCase().trim(), item])
    );

    // Extract all unique ingredients from menu items
    const ingredientMap = new Map();
    
    menuItems.forEach(item => {
      if (item.ingredients && Array.isArray(item.ingredients)) {
        item.ingredients.forEach(ingredient => {
          const key = ingredient.name.toLowerCase().trim();
          if (!ingredientMap.has(key)) {
            ingredientMap.set(key, ingredient);
          }
        });
      }
    });

    // Compare each ingredient with existing inventory
    Array.from(ingredientMap.values()).forEach(ingredient => {
      const existingItem = existingIngredientMap.get(ingredient.name.toLowerCase().trim());
      
      comparisons.push({
        name: ingredient.name,
        unit: ingredient.unit,
        requiredQuantity: ingredient.quantity,
        existingQuantity: existingItem?.quantity || 0,
        isAvailable: !!existingItem && existingItem.quantity > 0,
        inventoryId: existingItem?.id
      });
    });

    setIngredientComparisons(comparisons);
  };

  // Step 6: Update Inventory
  const updateIngredientQuantity = (index: number, newQuantity: string) => {
    setIngredientComparisons(prev => prev.map((item, i) => 
      i === index ? { ...item, existingQuantity: parseFloat(newQuantity) || 0 } : item
    ));
  };

  const saveInventoryUpdates = async () => {
    try {
      setIsProcessing(true);
      const userId = currentUser?.id || 'default_user';
      
      // Create updated inventory
      const updatedInventory = [...existingInventory];
      const newItems: InventoryItem[] = [];

      ingredientComparisons.forEach(comparison => {
        if (comparison.inventoryId) {
          // Update existing item
          const existingIndex = updatedInventory.findIndex(item => item.id === comparison.inventoryId);
          if (existingIndex !== -1) {
            updatedInventory[existingIndex].quantity = comparison.existingQuantity;
            updatedInventory[existingIndex].lastUpdated = new Date().toISOString();
          }
        } else {
          // Add new item
          newItems.push({
            id: `menu-ingredient-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: comparison.name,
            quantity: comparison.existingQuantity,
            unit: comparison.unit,
            category: categorizeIngredient(comparison.name),
            description: 'Added from menu workflow',
            extractionMethod: 'menu-workflow',
            lowStockThreshold: 5,
            expiryDate: '',
            lastUpdated: new Date().toISOString()
          });
        }
      });

      const finalInventory = [...updatedInventory, ...newItems];
      
      // Save to both localStorage and sessionStorage
      const inventoryKey = `inventory_${userId}`;
      localStorage.setItem(inventoryKey, JSON.stringify(finalInventory));
      sessionStorage.setItem('inventoryItems', JSON.stringify(finalInventory));
      
      toast({
        title: 'Success',
        description: `Inventory updated with ${newItems.length} new items and ${updatedInventory.length - existingInventory.length} updates!`
      });
      
      setCurrentStep(7); // Move to completion step
      
    } catch (error) {
      console.error('Error updating inventory:', error);
      toast({
        title: 'Error',
        description: 'Failed to update inventory',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const categorizeIngredient = (ingredientName: string): string => {
    const name = ingredientName.toLowerCase();
    
    if (name.includes('chicken') || name.includes('beef') || name.includes('pork') || 
        name.includes('lamb') || name.includes('turkey') || name.includes('meat')) {
      return 'Meat & Poultry';
    }
    if (name.includes('fish') || name.includes('salmon') || name.includes('seafood')) {
      return 'Seafood';
    }
    if (name.includes('onion') || name.includes('tomato') || name.includes('carrot') ||
        name.includes('potato') || name.includes('pepper') || name.includes('garlic')) {
      return 'Vegetables';
    }
    if (name.includes('milk') || name.includes('cheese') || name.includes('butter') ||
        name.includes('cream') || name.includes('egg')) {
      return 'Dairy & Eggs';
    }
    if (name.includes('rice') || name.includes('pasta') || name.includes('bread') ||
        name.includes('flour') || name.includes('grain')) {
      return 'Grains & Rice';
    }
    if (name.includes('salt') || name.includes('pepper') || name.includes('spice') ||
        name.includes('herb') || name.includes('basil') || name.includes('oregano')) {
      return 'Spices & Seasonings';
    }
    if (name.includes('oil') || name.includes('olive') || name.includes('coconut')) {
      return 'Oils & Fats';
    }
    if (name.includes('water') || name.includes('juice') || name.includes('broth')) {
      return 'Beverages';
    }
    
    return 'Other';
  };

  // Step 7: Complete Setup
  const completeSetup = () => {
    // Clear session storage
    sessionStorage.removeItem('extractedMenuItems');
    sessionStorage.removeItem('extractionResult');
    
    toast({
      title: 'Setup Complete!',
      description: 'Your menu and inventory are now ready. Redirecting to order entry...'
    });
    
    // Redirect to orders
    setTimeout(() => {
      router.push('/orders');
    }, 2000);
  };

  // Navigation functions
  const goToStep = (step: number) => {
    if (step <= currentStep || step === currentStep + 1) {
      setCurrentStep(step);
    }
  };

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goNext = () => {
    if (currentStep < 7) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Show loading state while auth is initializing
  if (isLoading || !isInitialized) {
    return (
      <AppLayout pageTitle="Menu Workflow">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading workflow...</p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Redirect to login if not authenticated
  if (!currentUser) {
    router.push('/login');
    return null;
  }

  return (
    <AppLayout pageTitle="Complete Menu Workflow">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/setup')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Setup
            </Button>
          </div>
          
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold">Complete Menu Workflow</h1>
            <p className="text-gray-600">
              Follow the 7-step process to set up your menu and inventory system
            </p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {WORKFLOW_STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              const isAccessible = step.id <= currentStep || step.id === currentStep + 1;
              
              return (
                <div key={step.id} className="flex flex-col items-center flex-1">
                  <button
                    onClick={() => goToStep(step.id)}
                    disabled={!isAccessible}
                    className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-colors ${
                      isCompleted 
                        ? 'bg-green-600 text-white' 
                        : isActive 
                        ? 'bg-blue-600 text-white' 
                        : isAccessible
                        ? 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {isCompleted ? <Check className="h-6 w-6" /> : <Icon className="h-6 w-6" />}
                  </button>
                  <div className="text-center">
                    <p className={`text-sm font-medium ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'}`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-400">{step.description}</p>
                  </div>
                  {index < WORKFLOW_STEPS.length - 1 && (
                    <div className={`absolute top-6 left-1/2 w-full h-0.5 -z-10 ${
                      currentStep > step.id ? 'bg-green-600' : 'bg-gray-200'
                    }`} style={{ transform: 'translateX(50%)' }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {React.createElement(WORKFLOW_STEPS[currentStep - 1].icon, { className: "h-5 w-5" })}
              Step {currentStep}: {WORKFLOW_STEPS[currentStep - 1].title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Step 1: Upload Menu */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-semibold mb-2">Upload Your Menu PDF</h3>
                  <p className="text-gray-600 mb-6">
                    Upload your restaurant menu in PDF format. Our AI will extract all menu items with their details.
                  </p>
                </div>
                
                <div className="max-w-md mx-auto">
                  <Label htmlFor="menu-file">Select Menu PDF</Label>
                  <Input
                    id="menu-file"
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="mt-1"
                  />
                  
                  {selectedFile && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-700">
                        📄 {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    </div>
                  )}
                  
                  <Button
                    onClick={handleFileUpload}
                    disabled={!selectedFile || isProcessing}
                    className="w-full mt-4"
                  >
                    {isProcessing ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Extracting Menu...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        Extract Menu Items
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: AI Ingredient Prediction */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <ChefHat className="h-16 w-16 mx-auto mb-4 text-green-600" />
                  <h3 className="text-xl font-semibold mb-2">AI Ingredient Prediction Complete</h3>
                  <p className="text-gray-600">
                    Our AI has analyzed your menu and predicted ingredients for each dish with realistic quantities.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                  {menuItems.slice(0, 6).map((item, index) => (
                    <Card key={item.id} className="border">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{item.name}</CardTitle>
                        <Badge variant="outline">{item.category}</Badge>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-700">Predicted Ingredients:</p>
                          <div className="space-y-1">
                            {item.ingredients?.slice(0, 4).map((ingredient, i) => (
                              <div key={i} className="flex justify-between text-sm">
                                <span>{ingredient.name}</span>
                                <span className="text-gray-500">{ingredient.quantity} {ingredient.unit}</span>
                              </div>
                            ))}
                            {item.ingredients && item.ingredients.length > 4 && (
                              <p className="text-xs text-gray-500">+{item.ingredients.length - 4} more ingredients</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                {menuItems.length > 6 && (
                  <p className="text-center text-gray-500">
                    Showing 6 of {menuItems.length} menu items. All items have predicted ingredients.
                  </p>
                )}
                
                <div className="text-center">
                  <Button onClick={proceedToAddons} className="bg-green-600 hover:bg-green-700">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Proceed to Add-ons
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Add-ons Management */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <Plus className="h-16 w-16 mx-auto mb-4 text-blue-600" />
                  <h3 className="text-xl font-semibold mb-2">Manage Add-ons</h3>
                  <p className="text-gray-600">
                    Add optional add-ons for your dishes (e.g., extra cheese, bacon, etc.)
                  </p>
                </div>
                
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {menuItems.slice(0, 3).map((item, itemIndex) => (
                    <Card key={item.id} className="border">
                      <CardHeader>
                        <CardTitle className="text-lg">{item.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">Add-ons</Label>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => addAddonToItem(itemIndex)}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add Add-on
                            </Button>
                          </div>
                          
                          {item.addons && item.addons.length > 0 ? (
                            <div className="space-y-2">
                              {item.addons.map((addon, addonIndex) => (
                                <div key={addon.id} className="flex gap-2 items-center p-2 bg-gray-50 rounded">
                                  <Input
                                    placeholder="Add-on name"
                                    value={addon.name}
                                    onChange={(e) => updateAddon(itemIndex, addonIndex, 'name', e.target.value)}
                                    className="flex-1"
                                  />
                                  <Input
                                    placeholder="Price"
                                    value={addon.price}
                                    onChange={(e) => updateAddon(itemIndex, addonIndex, 'price', e.target.value)}
                                    className="w-20"
                                  />
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => removeAddon(itemIndex, addonIndex)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 italic">No add-ons added yet</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                <div className="text-center">
                  <Button onClick={() => setCurrentStep(4)} className="bg-blue-600 hover:bg-blue-700">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Continue to Save Menu
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Save Menu */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <Save className="h-16 w-16 mx-auto mb-4 text-purple-600" />
                  <h3 className="text-xl font-semibold mb-2">Save Menu for Order Entry</h3>
                  <p className="text-gray-600">
                    Your menu is ready to be saved. This will make it available in the order entry system.
                  </p>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">Menu Summary</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm text-blue-700">
                    <div>Total Items: <strong>{menuItems.length}</strong></div>
                    <div>Categories: <strong>{new Set(menuItems.map(item => item.category)).size}</strong></div>
                    <div>Items with Add-ons: <strong>{menuItems.filter(item => item.addons && item.addons.length > 0).length}</strong></div>
                    <div>Total Ingredients: <strong>{menuItems.reduce((sum, item) => sum + (item.ingredients?.length || 0), 0)}</strong></div>
                  </div>
                </div>
                
                <div className="text-center">
                  <Button 
                    onClick={saveMenuForOrderEntry}
                    disabled={isProcessing}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {isProcessing ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Saving Menu...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Save className="h-4 w-4" />
                        Save Menu & Continue
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 5: Inventory Comparison */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <Package className="h-16 w-16 mx-auto mb-4 text-orange-600" />
                  <h3 className="text-xl font-semibold mb-2">Inventory Comparison</h3>
                  <p className="text-gray-600">
                    Comparing menu ingredients with your existing inventory
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border-green-200 bg-green-50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-green-800 flex items-center gap-2">
                        <CheckCircle className="h-5 w-5" />
                        Available in Inventory
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {ingredientComparisons.filter(item => item.isAvailable).map((item, index) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-white rounded border">
                            <span className="font-medium">{item.name}</span>
                            <span className="text-green-600">
                              {item.existingQuantity} {item.unit}
                            </span>
                          </div>
                        ))}
                        {ingredientComparisons.filter(item => item.isAvailable).length === 0 && (
                          <p className="text-green-700 italic">No ingredients found in existing inventory</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-red-200 bg-red-50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-red-800 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" />
                        Missing from Inventory
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {ingredientComparisons.filter(item => !item.isAvailable).map((item, index) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-white rounded border">
                            <span className="font-medium">{item.name}</span>
                            <span className="text-red-600">
                              Need: {item.requiredQuantity} {item.unit}
                            </span>
                          </div>
                        ))}
                        {ingredientComparisons.filter(item => !item.isAvailable).length === 0 && (
                          <p className="text-red-700 italic">All ingredients available in inventory!</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="text-center">
                  <Button onClick={() => setCurrentStep(6)} className="bg-orange-600 hover:bg-orange-700">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Update Inventory
                  </Button>
                </div>
              </div>
            )}

            {/* Step 6: Update Inventory */}
            {currentStep === 6 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <Warehouse className="h-16 w-16 mx-auto mb-4 text-indigo-600" />
                  <h3 className="text-xl font-semibold mb-2">Update Inventory Quantities</h3>
                  <p className="text-gray-600">
                    Set the actual quantities for your ingredients
                  </p>
                </div>
                
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {ingredientComparisons.map((item, index) => (
                    <div key={index} className={`p-3 rounded-lg border-2 ${
                      item.isAvailable ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {item.isAvailable ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <X className="h-5 w-5 text-red-600" />
                          )}
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-gray-600">Required: {item.requiredQuantity} {item.unit}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={item.existingQuantity}
                            onChange={(e) => updateIngredientQuantity(index, e.target.value)}
                            className="w-20"
                            min="0"
                            step="0.1"
                          />
                          <span className="text-sm text-gray-600">{item.unit}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="text-center">
                  <Button 
                    onClick={saveInventoryUpdates}
                    disabled={isProcessing}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    {isProcessing ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Updating Inventory...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Warehouse className="h-4 w-4" />
                        Save Inventory Updates
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 7: Complete Setup */}
            {currentStep === 7 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-600" />
                  <h3 className="text-xl font-semibold mb-2">Setup Complete!</h3>
                  <p className="text-gray-600">
                    Your menu and inventory system is now fully configured and ready to use.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-green-200 bg-green-50">
                    <CardContent className="p-4 text-center">
                      <ShoppingCart className="h-8 w-8 mx-auto mb-2 text-green-600" />
                      <h4 className="font-medium text-green-800">Menu Ready</h4>
                      <p className="text-sm text-green-700">{menuItems.length} items available for orders</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-blue-200 bg-blue-50">
                    <CardContent className="p-4 text-center">
                      <Package className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                      <h4 className="font-medium text-blue-800">Inventory Updated</h4>
                      <p className="text-sm text-blue-700">{ingredientComparisons.length} ingredients tracked</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-purple-200 bg-purple-50">
                    <CardContent className="p-4 text-center">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                      <h4 className="font-medium text-purple-800">System Active</h4>
                      <p className="text-sm text-purple-700">Ready to take orders</p>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="text-center">
                  <Button onClick={completeSetup} className="bg-green-600 hover:bg-green-700 text-lg px-8 py-3">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Complete Setup & Start Taking Orders
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={goBack}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          
          <div className="text-sm text-gray-500">
            Step {currentStep} of {WORKFLOW_STEPS.length}
          </div>
          
          <Button
            variant="outline"
            onClick={goNext}
            disabled={currentStep === 7}
          >
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
