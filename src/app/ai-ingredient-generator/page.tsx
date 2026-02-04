"use client";

import React, { useState, useTransition, useEffect } from 'react';
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { useToast } from "@/shared/hooks/use-toast";
import { 
  Sparkles, Loader2, ChefHat, PackagePlus, ClipboardPlus, Edit3, Zap, Brain, Calculator, Scale, Clock, TrendingUp,
  Camera, Upload, ShoppingCart, Utensils, Users, Filter, Plus, Minus, Trash2, RefreshCw, Search, Home
} from "lucide-react";

interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
  category?: string;
}

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  lastUpdated: Date;
}

interface Recipe {
  id: string;
  name: string;
  ingredients: Ingredient[];
  instructions: string[];
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  dietaryTags: string[];
  canMake: boolean;
  missingIngredients: Ingredient[];
}

interface ScannedBill {
  items: Array<{
    name: string;
    quantity: number;
    unit: string;
  }>;
  total: number;
  date: Date;
}

export default function IOMSIndividualPage() {
  const { toast } = useToast();
  
  // State management
  const [activeTab, setActiveTab] = useState<string>("inventory");
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [scannedBills, setScannedBills] = useState<ScannedBill[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isGeneratingRecipes, setIsGeneratingRecipes] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showRecipeModal, setShowRecipeModal] = useState(false);

  // Load initial data
  useEffect(() => {
    loadInventory();
    loadScannedBills();
  }, []);

  // Load inventory from localStorage
  const loadInventory = () => {
    const saved = localStorage.getItem('ioms-individual-inventory');
    if (saved) {
      setInventory(JSON.parse(saved));
    }
  };

  // Save inventory to localStorage
  const saveInventory = (newInventory: InventoryItem[]) => {
    localStorage.setItem('ioms-individual-inventory', JSON.stringify(newInventory));
    setInventory(newInventory);
  };

  // Load scanned bills from localStorage
  const loadScannedBills = () => {
    const saved = localStorage.getItem('ioms-individual-bills');
    if (saved) {
      setScannedBills(JSON.parse(saved));
    }
  };

  // Save scanned bills to localStorage
  const saveScannedBills = (newBills: ScannedBill[]) => {
    localStorage.setItem('ioms-individual-bills', JSON.stringify(newBills));
    setScannedBills(newBills);
  };

  // Simulate bill scanning with OCR
  const handleScanBill = async () => {
    setIsScanning(true);
    
    try {
      // Simulate OCR processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock scanned bill data
      const mockScannedBill: ScannedBill = {
        items: [
          { name: 'Chicken Breast', quantity: 500, unit: 'g' },
          { name: 'Tomatoes', quantity: 6, unit: 'pcs' },
          { name: 'Onions', quantity: 4, unit: 'pcs' },
          { name: 'Garlic', quantity: 8, unit: 'cloves' },
          { name: 'Rice', quantity: 1, unit: 'kg' },
          { name: 'Olive Oil', quantity: 500, unit: 'ml' },
          { name: 'Spices', quantity: 100, unit: 'g' }
        ],
        total: 45.50,
        date: new Date()
      };

      // Update inventory with scanned items
      const updatedInventory = [...inventory];
      
      mockScannedBill.items.forEach(scannedItem => {
        const existingIndex = updatedInventory.findIndex(
          item => item.name.toLowerCase() === scannedItem.name.toLowerCase()
        );
        
        if (existingIndex >= 0) {
          updatedInventory[existingIndex].quantity += scannedItem.quantity;
          updatedInventory[existingIndex].lastUpdated = new Date();
        } else {
          updatedInventory.push({
            id: Date.now().toString() + Math.random(),
            name: scannedItem.name,
            quantity: scannedItem.quantity,
            unit: scannedItem.unit,
            category: 'General',
            lastUpdated: new Date()
          });
        }
      });

      saveInventory(updatedInventory);
      saveScannedBills([...scannedBills, mockScannedBill]);

      toast({
        title: "Bill Scanned Successfully!",
        description: `Added ${mockScannedBill.items.length} items to inventory`,
      });

    } catch (error) {
      toast({
        title: "Scanning Failed",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  // Generate recipe suggestions based on inventory
  const generateRecipeSuggestions = async () => {
    setIsGeneratingRecipes(true);
    
    try {
      // Simulate AI recipe generation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockRecipes: Recipe[] = [
        {
          id: '1',
          name: 'Chicken Stir Fry',
          ingredients: [
            { name: 'Chicken Breast', quantity: 300, unit: 'g' },
            { name: 'Onions', quantity: 2, unit: 'pcs' },
            { name: 'Garlic', quantity: 4, unit: 'cloves' },
            { name: 'Olive Oil', quantity: 30, unit: 'ml' }
          ],
          instructions: [
            'Cut chicken into bite-sized pieces',
            'Chop onions and mince garlic',
            'Heat oil in a pan',
            'Cook chicken until golden',
            'Add vegetables and stir fry'
          ],
          prepTime: 15,
          cookTime: 20,
          servings: 4,
          difficulty: 'Easy',
          dietaryTags: ['High Protein', 'Low Carb'],
          canMake: true,
          missingIngredients: []
        },
        {
          id: '2',
          name: 'Tomato Rice',
          ingredients: [
            { name: 'Rice', quantity: 200, unit: 'g' },
            { name: 'Tomatoes', quantity: 4, unit: 'pcs' },
            { name: 'Onions', quantity: 2, unit: 'pcs' },
            { name: 'Garlic', quantity: 3, unit: 'cloves' },
            { name: 'Olive Oil', quantity: 20, unit: 'ml' }
          ],
          instructions: [
            'Cook rice according to package instructions',
            'Chop tomatoes and onions',
            'Sauté onions and garlic',
            'Add tomatoes and cook until soft',
            'Mix with cooked rice'
          ],
          prepTime: 10,
          cookTime: 25,
          servings: 3,
          difficulty: 'Easy',
          dietaryTags: ['Vegetarian', 'Gluten Free'],
          canMake: true,
          missingIngredients: []
        },
        {
          id: '3',
          name: 'Spicy Chicken Curry',
          ingredients: [
            { name: 'Chicken Breast', quantity: 400, unit: 'g' },
            { name: 'Tomatoes', quantity: 3, unit: 'pcs' },
            { name: 'Onions', quantity: 2, unit: 'pcs' },
            { name: 'Garlic', quantity: 6, unit: 'cloves' },
            { name: 'Spices', quantity: 50, unit: 'g' },
            { name: 'Olive Oil', quantity: 40, unit: 'ml' }
          ],
          instructions: [
            'Marinate chicken with spices',
            'Sauté onions and garlic',
            'Add chicken and cook',
            'Add tomatoes and simmer',
            'Serve hot with rice'
          ],
          prepTime: 20,
          cookTime: 30,
          servings: 4,
          difficulty: 'Medium',
          dietaryTags: ['High Protein', 'Spicy'],
          canMake: true,
          missingIngredients: []
        }
      ];

      setRecipes(mockRecipes);
      
      toast({
        title: "Recipes Generated!",
        description: `Found ${mockRecipes.length} recipes you can make`,
      });

    } catch (error) {
      toast({
        title: "Recipe Generation Failed",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingRecipes(false);
    }
  };

  // Update inventory when cooking a recipe
  const cookRecipe = (recipe: Recipe) => {
    const updatedInventory = [...inventory];
    
    recipe.ingredients.forEach(recipeIngredient => {
      const inventoryIndex = updatedInventory.findIndex(
        item => item.name.toLowerCase() === recipeIngredient.name.toLowerCase()
      );
      
      if (inventoryIndex >= 0) {
        updatedInventory[inventoryIndex].quantity -= recipeIngredient.quantity;
        
        // Remove item if quantity becomes 0 or negative
        if (updatedInventory[inventoryIndex].quantity <= 0) {
          updatedInventory.splice(inventoryIndex, 1);
        }
      }
    });

    saveInventory(updatedInventory);
    setShowRecipeModal(false);
    setSelectedRecipe(null);

    toast({
      title: "Recipe Cooked!",
      description: `Inventory updated for ${recipe.name}`,
    });
  };

  // Add item to inventory manually
  const addToInventory = (name: string, quantity: number, unit: string) => {
    const newItem: InventoryItem = {
      id: Date.now().toString(),
      name,
      quantity,
      unit,
      category: 'General',
      lastUpdated: new Date()
    };

    saveInventory([...inventory, newItem]);
  };

  // Remove item from inventory
  const removeFromInventory = (id: string) => {
    saveInventory(inventory.filter(item => item.id !== id));
  };

  // Update item quantity
  const updateQuantity = (id: string, newQuantity: number) => {
    const updatedInventory = inventory.map(item =>
      item.id === id ? { ...item, quantity: newQuantity, lastUpdated: new Date() } : item
    );
    saveInventory(updatedInventory);
  };

  // Filter recipes based on search and dietary restrictions
  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDietary = dietaryRestrictions.length === 0 || 
      dietaryRestrictions.some(restriction => 
        recipe.dietaryTags.some(tag => tag.toLowerCase().includes(restriction.toLowerCase()))
      );
    return matchesSearch && matchesDietary;
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg">
            <Home className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">IOMS Individual</h1>
            <p className="text-gray-600">Personal inventory management with AI-powered recipe suggestions</p>
          </div>
        </div>
        
        {/* Feature badges */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Camera className="h-3 w-3" />
            Bill Scanning & OCR
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <ShoppingCart className="h-3 w-3" />
            Smart Inventory
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Brain className="h-3 w-3" />
            AI Recipe Suggestions
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Filter className="h-3 w-3" />
            Dietary Restrictions
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <RefreshCw className="h-3 w-3" />
            Auto Updates
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="scan" className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Scan Bill
          </TabsTrigger>
          <TabsTrigger value="recipes" className="flex items-center gap-2">
            <Utensils className="h-4 w-4" />
            Recipes
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Inventory Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ShoppingCart className="mr-2 h-5 w-5 text-primary" />
                  Inventory Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{inventory.length}</div>
                    <div className="text-sm text-gray-600">Total Items</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {inventory.reduce((sum, item) => sum + item.quantity, 0)}
                    </div>
                    <div className="text-sm text-gray-600">Total Quantity</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Add Item */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Plus className="mr-2 h-5 w-5 text-primary" />
                  Add Item
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="item-name">Item Name</Label>
                    <Input id="item-name" placeholder="e.g., Chicken Breast" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="item-quantity">Quantity</Label>
                      <Input id="item-quantity" type="number" placeholder="500" />
                    </div>
                    <div>
                      <Label htmlFor="item-unit">Unit</Label>
                      <Input id="item-unit" placeholder="g" />
                    </div>
                  </div>
                  <Button className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Add to Inventory
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="mr-2 h-5 w-5 text-primary" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full" onClick={generateRecipeSuggestions}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Recipes
                  </Button>
                  <Button variant="outline" className="w-full" onClick={handleScanBill}>
                    <Camera className="mr-2 h-4 w-4" />
                    Scan Bill
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Inventory List */}
          <Card>
            <CardHeader>
              <CardTitle>Current Inventory</CardTitle>
              <CardDescription>
                Manage your kitchen inventory items
              </CardDescription>
            </CardHeader>
            <CardContent>
              {inventory.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No items in inventory</p>
                  <p className="text-sm text-gray-400">Scan a bill or add items manually to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {inventory.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-gray-500">{item.category}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="font-medium">{item.quantity} {item.unit}</div>
                          <div className="text-xs text-gray-500">
                            Updated {new Date(item.lastUpdated).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeFromInventory(item.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scan Bill Tab */}
        <TabsContent value="scan" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Camera className="mr-2 h-5 w-5 text-primary" />
                Scan Bill
              </CardTitle>
              <CardDescription>
                Upload a photo of your grocery bill to automatically add items to inventory
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">Upload bill photo or use camera</p>
                  <p className="text-sm text-gray-500">Supports JPG, PNG, PDF formats</p>
                  <div className="mt-4 space-x-2">
                    <Button variant="outline">
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Photo
                    </Button>
                    <Button onClick={handleScanBill} disabled={isScanning}>
                      {isScanning ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Camera className="mr-2 h-4 w-4" />
                      )}
                      {isScanning ? 'Scanning...' : 'Use Camera'}
                    </Button>
                  </div>
                </div>

                {/* Recent Scans */}
                {scannedBills.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Recent Scans</h3>
                    <div className="space-y-2">
                      {scannedBills.slice(-3).reverse().map((bill, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">{bill.items.length} items</p>
                              <p className="text-sm text-gray-500">
                                {new Date(bill.date).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">€{bill.total.toFixed(2)}</p>
                              <p className="text-sm text-gray-500">Total</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recipes Tab */}
        <TabsContent value="recipes" className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="recipe-search">Search Recipes</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="recipe-search"
                  placeholder="Search recipes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex-1">
              <Label>Dietary Restrictions</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {['Vegetarian', 'Vegan', 'Gluten Free', 'Low Carb', 'High Protein'].map((restriction) => (
                  <Badge
                    key={restriction}
                    variant={dietaryRestrictions.includes(restriction) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      if (dietaryRestrictions.includes(restriction)) {
                        setDietaryRestrictions(dietaryRestrictions.filter(r => r !== restriction));
                      } else {
                        setDietaryRestrictions([...dietaryRestrictions, restriction]);
                      }
                    }}
                  >
                    {restriction}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Recipe Suggestions</h2>
            <Button onClick={generateRecipeSuggestions} disabled={isGeneratingRecipes}>
              {isGeneratingRecipes ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              {isGeneratingRecipes ? 'Generating...' : 'Generate Recipes'}
            </Button>
          </div>

          {recipes.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Utensils className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No recipes generated yet</p>
                <p className="text-sm text-gray-400">Click "Generate Recipes" to get AI-powered suggestions</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRecipes.map((recipe) => (
                <Card key={recipe.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{recipe.name}</CardTitle>
                        <CardDescription>
                          {recipe.prepTime + recipe.cookTime} mins • {recipe.servings} servings
                        </CardDescription>
                      </div>
                      <Badge variant={recipe.canMake ? "default" : "secondary"}>
                        {recipe.canMake ? "Can Make" : "Missing Items"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium mb-1">Ingredients:</p>
                        <div className="text-sm text-gray-600">
                          {recipe.ingredients.slice(0, 3).map(ing => `${ing.name} (${ing.quantity}${ing.unit})`).join(', ')}
                          {recipe.ingredients.length > 3 && '...'}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {recipe.dietaryTags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full" 
                      onClick={() => {
                        setSelectedRecipe(recipe);
                        setShowRecipeModal(true);
                      }}
                      disabled={!recipe.canMake}
                    >
                      <ChefHat className="mr-2 h-4 w-4" />
                      {recipe.canMake ? 'Cook Recipe' : 'Missing Ingredients'}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="mr-2 h-5 w-5 text-primary" />
                Activity History
              </CardTitle>
              <CardDescription>
                Track your inventory changes and recipe cooking history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scannedBills.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No activity yet</p>
                    <p className="text-sm text-gray-400">Start by scanning bills or cooking recipes</p>
                  </div>
                ) : (
                  scannedBills.map((bill, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">Bill Scan #{scannedBills.length - index}</h4>
                          <p className="text-sm text-gray-500">
                            {new Date(bill.date).toLocaleDateString()} at {new Date(bill.date).toLocaleTimeString()}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            Added {bill.items.length} items to inventory
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">€{bill.total.toFixed(2)}</p>
                          <p className="text-sm text-gray-500">Total Spent</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recipe Modal */}
      {showRecipeModal && selectedRecipe && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">{selectedRecipe.name}</h2>
                <Button variant="outline" onClick={() => setShowRecipeModal(false)}>
                  ×
                </Button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Ingredients</h3>
                  <div className="space-y-2">
                    {selectedRecipe.ingredients.map((ingredient, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span>{ingredient.name}</span>
                        <span className="font-medium">{ingredient.quantity} {ingredient.unit}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Instructions</h3>
                  <ol className="list-decimal list-inside space-y-2">
                    {selectedRecipe.instructions.map((instruction, index) => (
                      <li key={index} className="text-gray-700">{instruction}</li>
                    ))}
                  </ol>
                </div>

                <div className="flex gap-2">
                  <Button 
                    className="flex-1" 
                    onClick={() => cookRecipe(selectedRecipe)}
                  >
                    <ChefHat className="mr-2 h-4 w-4" />
                    Cook Recipe
                  </Button>
                  <Button variant="outline" onClick={() => setShowRecipeModal(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 