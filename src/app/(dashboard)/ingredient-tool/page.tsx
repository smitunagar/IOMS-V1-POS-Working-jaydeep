"use client";

import React, { useState, useTransition, useEffect } from 'react';
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/shared/components/ui/card";
import { Progress } from "@/shared/components/ui/progress";
import { Badge } from "@/shared/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { useToast } from "@/shared/hooks/use-toast";
import { Sparkles, Loader2, ChefHat, PackagePlus, ClipboardPlus, Edit3, Zap, Play, Pause, RotateCcw, CheckCircle2, AlertCircle } from "lucide-react";
import { z } from 'genkit';
import { generateIngredientsList } from '@/ai/flows/generate-ingredients-list';
import { GenerateIngredientsListInput, GenerateIngredientsListOutput, IngredientSchema } from '@/ai/flows/ingredient-types';
import { addIngredientToInventoryIfNotExists, InventoryItem } from '@/server/lib/inventoryService';
import { addDishToMenu, getDishes } from '@/server/lib/menuService';
import { useAuth } from '@/features/auth/AuthContext';

type AiIngredient = z.infer<typeof IngredientSchema>;

interface EditableIngredient extends AiIngredient {
  // Optionally add extra fields if needed
}

interface BatchProcessingState {
  isProcessing: boolean;
  isPaused: boolean;
  currentBatch: number;
  totalBatches: number;
  currentDishIndex: number;
  totalDishes: number;
  processedDishes: string[];
  failedDishes: { name: string; error: string }[];
  batchSize: number;
  progress: number;
}

interface DishBatch {
  dishes: Array<{ id: string; name: string }>;
  batchNumber: number;
  totalBatches: number;
}

export default function IngredientToolPage() {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  
  // Single dish generation state
  const [dishName, setDishName] = useState<string>("");
  const [servings, setServings] = useState<number>(1);
  const [editableIngredients, setEditableIngredients] = useState<EditableIngredient[] | null>(null);
  const [isGenerating, startGeneratingTransition] = useTransition();
  const [isAddingToMenu, startAddingToMenuTransition] = useTransition();
  const [isAddingToInventory, startAddingToInventoryTransition] = useTransition();

  // Batch processing state
  const [batchState, setBatchState] = useState<BatchProcessingState>({
    isProcessing: false,
    isPaused: false,
    currentBatch: 0,
    totalBatches: 0,
    currentDishIndex: 0,
    totalDishes: 0,
    processedDishes: [],
    failedDishes: [],
    batchSize: 10,
    progress: 0
  });
  
  const [availableDishes, setAvailableDishes] = useState<Array<{ id: string; name: string }>>([]);

  // Load available dishes on component mount
  useEffect(() => {
    if (currentUser) {
      const dishes = getDishes(currentUser.id);
      // Filter dishes that don't have ingredients yet
      const dishesWithoutIngredients = dishes.filter(dish => 
        !dish.ingredients || 
        dish.ingredients.length === 0 || 
        (Array.isArray(dish.ingredients) && dish.ingredients.every(ing => typeof ing === 'string'))
      );
      setAvailableDishes(dishesWithoutIngredients.map(dish => ({ id: dish.id, name: dish.name })));
    }
  }, [currentUser]);

  // Create batches from dishes
  const createBatches = (dishes: Array<{ id: string; name: string }>, batchSize: number): DishBatch[] => {
    const batches: DishBatch[] = [];
    const totalBatches = Math.ceil(dishes.length / batchSize);
    
    for (let i = 0; i < dishes.length; i += batchSize) {
      const batchDishes = dishes.slice(i, i + batchSize);
      batches.push({
        dishes: batchDishes,
        batchNumber: Math.floor(i / batchSize) + 1,
        totalBatches
      });
    }
    
    return batches;
  };

  // Start batch processing
  const startBatchProcessing = async () => {
    if (!currentUser || availableDishes.length === 0) {
      toast({
        title: "Error",
        description: "No dishes available for batch processing or not logged in.",
        variant: "destructive"
      });
      return;
    }

    const batches = createBatches(availableDishes, batchState.batchSize);
    
    setBatchState(prev => ({
      ...prev,
      isProcessing: true,
      isPaused: false,
      currentBatch: 1,
      totalBatches: batches.length,
      currentDishIndex: 0,
      totalDishes: availableDishes.length,
      processedDishes: [],
      failedDishes: [],
      progress: 0
    }));

    toast({
      title: "Batch Processing Started",
      description: `Processing ${availableDishes.length} dishes in ${batches.length} batches of ${batchState.batchSize}`,
    });

    // Process batches
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      
      // Check if paused
      if (batchState.isPaused) {
        break;
      }

      setBatchState(prev => ({
        ...prev,
        currentBatch: batch.batchNumber
      }));

      // Process each dish in the batch
      for (let dishIndex = 0; dishIndex < batch.dishes.length; dishIndex++) {
        const dish = batch.dishes[dishIndex];
        const globalDishIndex = batchIndex * batchState.batchSize + dishIndex;

        // Check if paused
        if (batchState.isPaused) {
          break;
        }

        setBatchState(prev => ({
          ...prev,
          currentDishIndex: globalDishIndex + 1,
          progress: ((globalDishIndex + 1) / availableDishes.length) * 100
        }));

        try {
          // Generate ingredients for the dish
          const input: GenerateIngredientsListInput = { 
            dishName: dish.name, 
            numberOfServings: 1 
          };
          
          const result: GenerateIngredientsListOutput = await generateIngredientsList(input);
          
          if (result && result.ingredients && Array.isArray(result.ingredients)) {
            // Add ingredients to the dish in menu
            const ingredientsForMenu: AiIngredient[] = result.ingredients.map(ing => ({
              name: ing.name,
              quantity: ing.quantity,
              unit: ing.unit,
            }));

            await addDishToMenu(currentUser.id, {
              name: dish.name,
              price: 0,
              ingredients: ingredientsForMenu.map(ing => ({
                inventoryItemName: ing.name,
                quantityPerDish: ing.quantity,
                unit: ing.unit,
              })),
              id: Date.now().toString(),
            });
            
            setBatchState(prev => ({
              ...prev,
              processedDishes: [...prev.processedDishes, dish.name]
            }));
          } else {
            throw new Error("Invalid ingredients returned from AI");
          }
          
          // Add a small delay between requests to avoid overwhelming the AI service
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          console.error(`Failed to process dish ${dish.name}:`, error);
          setBatchState(prev => ({
            ...prev,
            failedDishes: [...prev.failedDishes, { 
              name: dish.name, 
              error: error instanceof Error ? error.message : "Unknown error" 
            }]
          }));
        }
      }

      // Pause between batches
      if (batchIndex < batches.length - 1) {
        toast({
          title: `Batch ${batch.batchNumber} Complete`,
          description: `Starting batch ${batch.batchNumber + 1} in 2 seconds...`,
        });
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Complete processing
    setBatchState(prev => ({
      ...prev,
      isProcessing: false,
      progress: 100
    }));

    toast({
      title: "Batch Processing Complete!",
      description: `Processed ${batchState.processedDishes.length} dishes successfully. ${batchState.failedDishes.length} failed.`,
    });
  };

  // Pause batch processing
  const pauseBatchProcessing = () => {
    setBatchState(prev => ({
      ...prev,
      isPaused: !prev.isPaused
    }));
    
    toast({
      title: batchState.isPaused ? "Processing Resumed" : "Processing Paused",
      description: batchState.isPaused ? "Batch processing will continue" : "Batch processing is paused",
    });
  };

  // Reset batch processing
  const resetBatchProcessing = () => {
    setBatchState({
      isProcessing: false,
      isPaused: false,
      currentBatch: 0,
      totalBatches: 0,
      currentDishIndex: 0,
      totalDishes: 0,
      processedDishes: [],
      failedDishes: [],
      batchSize: 10,
      progress: 0
    });
    
    toast({
      title: "Batch Processing Reset",
      description: "Ready to start a new batch processing session",
    });
  };

  const handleGetIngredients = async () => {
    if (!currentUser) {
      toast({ title: "Error", description: "Please log in to use this feature.", variant: "destructive" });
      return;
    }
    if (!dishName || servings <= 0) {
      toast({ title: "Error", description: "Please enter a dish name and a valid number of servings.", variant: "destructive" });
      return;
    }

    setEditableIngredients(null);
    
    startGeneratingTransition(async () => {
      try {
        const input: GenerateIngredientsListInput = { dishName, numberOfServings: servings };
        const result: GenerateIngredientsListOutput = await generateIngredientsList(input);
        
        if (result && result.ingredients && Array.isArray(result.ingredients)) {
          setEditableIngredients(result.ingredients as EditableIngredient[]);
          toast({ title: "Ingredients Generated!", description: `Successfully generated ingredients for ${dishName}. You can edit quantities below.` });
        } else {
          throw new Error("AI did not return a valid list of ingredients.");
        }
      } catch (error) {
        console.error("Error generating ingredients:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        toast({ title: "Generation Failed", description: `Could not generate ingredients: ${errorMessage}`, variant: "destructive" });
        setEditableIngredients(null);
      }
    });
  };

  const handleIngredientQuantityChange = (index: number, newQuantity: number) => {
    if (editableIngredients) {
      const updatedIngredients = [...editableIngredients];
      updatedIngredients[index] = { ...updatedIngredients[index], quantity: Math.max(0, newQuantity) };
      setEditableIngredients(updatedIngredients);
    }
  };

  const handleAddGeneratedIngredientsToInventory = () => {
    if (!currentUser) {
      toast({ title: "Error", description: "Please log in.", variant: "destructive" });
      return;
    }
    if (!editableIngredients || editableIngredients.length === 0) {
      toast({ title: "Error", description: "No ingredients to add.", variant: "destructive" });
      return;
    }

    startAddingToInventoryTransition(async () => {
      let newItemsAddedCount = 0;
      let existingItemsSkippedCount = 0;

      for (const ingredient of editableIngredients) {
        const rawIngredient: InventoryItem = {
          id: Date.now().toString(),
          name: ingredient.name,
          quantity: ingredient.quantity, 
          unit: ingredient.unit,
        };
        const addedItem = await addIngredientToInventoryIfNotExists(currentUser.id, rawIngredient);
        if (addedItem) {
          newItemsAddedCount++;
        } else {
          existingItemsSkippedCount++;
        }
      }

      if (newItemsAddedCount > 0) {
        toast({
          title: "Inventory Updated",
          description: `${newItemsAddedCount} new ingredient(s) added to inventory with generated quantities. ${existingItemsSkippedCount} existing item(s) were not modified.`,
          action: <PackagePlus className="h-5 w-5" />
        });
      } else if (existingItemsSkippedCount > 0) {
          toast({
          title: "Inventory Check",
          description: `All ${existingItemsSkippedCount} generated ingredient(s) already exist in inventory and were not modified by this action.`,
        });
      } else {
        toast({ title: "No Changes", description: "No new ingredients to add or inventory already up-to-date."});
      }
    });
  };


  const handleAddToMenu = () => {
     if (!currentUser) {
      toast({ title: "Error", description: "Please log in to use this feature.", variant: "destructive" });
      return;
    }
    if (!dishName || !editableIngredients || editableIngredients.length === 0) {
      toast({ title: "Error", description: "No dish or ingredients to add to menu.", variant: "destructive" });
      return;
    }
    
    startAddingToMenuTransition(async () => {
      try {
        // Ensure editableIngredients conforms to the expected type for addDishToMenu
        const newDish = await addDishToMenu(currentUser.id, {
          name: dishName,
          price: 0,
          ingredients: editableIngredients.map(ing => ({
            inventoryItemName: ing.name,
            quantityPerDish: ing.quantity,
            unit: ing.unit,
          })),
          id: Date.now().toString(),
        });
        if (newDish) {
          toast({
            title: "Dish Added to Menu!",
            description: `"${dishName}" has been added to your menu with default price $${(typeof newDish.price === 'number' && !isNaN(newDish.price) ? newDish.price : parseFloat(newDish.price?.toString?.() ?? '') || 0).toFixed(2)} and category "${newDish.category}". Ingredients quantities are as specified.`,
          });
        } else {
           toast({
            title: "Menu Update Failed",
            description: `"${dishName}" might already exist or could not be added.`,
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error("Error adding dish to menu:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        toast({ title: "Failed to Add to Menu", description: errorMessage, variant: "destructive" });
      }
    });
  };

  return (
    
      <div className="max-w-4xl mx-auto space-y-8">
        <Tabs defaultValue="single" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single" className="flex items-center gap-2">
              <ChefHat className="h-4 w-4" />
              Single Dish
            </TabsTrigger>
            <TabsTrigger value="batch" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Batch Processing
            </TabsTrigger>
          </TabsList>

          {/* Single Dish Generation Tab */}
          <TabsContent value="single" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ChefHat className="mr-2 h-6 w-6 text-primary" /> 
                  Single Ingredient Generator
                </CardTitle>
                <CardDescription>
                  Use AI to generate ingredients for any dish. You can edit quantities before adding to your menu or inventory (for new items).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="dish-name">Dish Name</Label>
                  <Input
                    id="dish-name"
                    value={dishName}
                    onChange={(e) => setDishName(e.target.value)}
                    placeholder="e.g., Spaghetti Carbonara, Chocolate Cake"
                  />
                </div>
                <div>
                  <Label htmlFor="servings">Number of Servings</Label>
                  <Input
                    id="servings"
                    type="number"
                    value={servings}
                    onChange={(e) => setServings(Math.max(1, parseInt(e.target.value, 10)))}
                    min="1"
                  />
                </div>
                <Button onClick={handleGetIngredients} disabled={isGenerating || isAddingToMenu || isAddingToInventory || !currentUser} className="w-full">
                  {isGenerating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  Generate Ingredients
                </Button>
              </CardContent>
            </Card>

            {(isGenerating || editableIngredients) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Edit3 className="mr-2 h-5 w-5 text-primary" /> 
                    Generated Ingredients
                  </CardTitle>
                  <CardDescription>
                    {isGenerating ? `Generating ingredients for ${dishName} (${servings} servings)...` : 
                    editableIngredients ? `Ingredients for ${dishName} (${servings} servings). Adjust quantities as needed.` :
                    "Ingredients will appear here."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isGenerating ? (
                     <div className="flex justify-center items-center h-40">
                       <Loader2 className="h-8 w-8 animate-spin text-primary" />
                     </div>
                  ) : editableIngredients && editableIngredients.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                      {editableIngredients.map((ing, index) => (
                        <div key={index} className="grid grid-cols-[1fr_100px_80px] items-center gap-3 p-2 border rounded-md">
                          <span className="font-medium truncate" title={ing.name}>{ing.name}</span>
                          <Input
                            type="number"
                            value={ing.quantity}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value);
                              handleIngredientQuantityChange(index, isNaN(value) ? 0 : value);
                            }}
                            min="0"
                            className="text-right"
                          />
                          <span className="text-sm text-muted-foreground">{ing.unit}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No ingredients generated or an error occurred.</p>
                  )}
                </CardContent>
                {editableIngredients && editableIngredients.length > 0 && !isGenerating && (
                  <CardFooter className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
                    <Button onClick={handleAddGeneratedIngredientsToInventory} disabled={isAddingToInventory || isGenerating || isAddingToMenu || !currentUser} className="w-full sm:w-auto">
                      {isAddingToInventory ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <PackagePlus className="mr-2 h-4 w-4" />
                      )}
                      Add New to Inventory
                    </Button>
                    <Button onClick={handleAddToMenu} disabled={isAddingToMenu || isGenerating || isAddingToInventory || !currentUser} className="w-full sm:w-auto flex-grow">
                      {isAddingToMenu ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <ClipboardPlus className="mr-2 h-4 w-4" />
                      )}
                      Add "{dishName}" to Menu
                    </Button>
                  </CardFooter>
                )}
              </Card>
            )}
          </TabsContent>

          {/* Batch Processing Tab */}
          <TabsContent value="batch" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="mr-2 h-6 w-6 text-primary" /> 
                  Batch Ingredient Generation
                </CardTitle>
                <CardDescription>
                  Generate ingredients for all dishes in your menu that don't have ingredients yet. Process in configurable batches for optimal performance.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Batch Configuration */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="batch-size">Batch Size (dishes per batch)</Label>
                    <Input
                      id="batch-size"
                      type="number"
                      value={batchState.batchSize}
                      onChange={(e) => setBatchState(prev => ({ 
                        ...prev, 
                        batchSize: Math.max(1, Math.min(50, parseInt(e.target.value, 10) || 10))
                      }))}
                      min="1"
                      max="50"
                      disabled={batchState.isProcessing}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Recommended: 10-20 dishes per batch for optimal performance
                    </p>
                  </div>
                  <div>
                    <Label>Available Dishes</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-lg py-2">
                        {availableDishes.length} dishes
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        without ingredients
                      </span>
                    </div>
                  </div>
                </div>

                {/* Batch Preview */}
                {availableDishes.length > 0 && (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium mb-2">Batch Preview:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      {createBatches(availableDishes, batchState.batchSize).map((batch, index) => (
                        <div key={index} className="p-2 bg-background rounded border">
                          <div className="font-medium">Batch {batch.batchNumber}</div>
                          <div className="text-muted-foreground">
                            {batch.dishes.length} dishes
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Processing Controls */}
                <div className="flex flex-wrap gap-2">
                  <Button 
                    onClick={startBatchProcessing} 
                    disabled={batchState.isProcessing || availableDishes.length === 0 || !currentUser}
                    className="flex-1 min-w-[200px]"
                  >
                    {batchState.isProcessing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="mr-2 h-4 w-4" />
                    )}
                    Start Batch Processing
                  </Button>
                  
                  {batchState.isProcessing && (
                    <Button 
                      onClick={pauseBatchProcessing} 
                      variant="outline"
                      className="min-w-[120px]"
                    >
                      {batchState.isPaused ? (
                        <Play className="mr-2 h-4 w-4" />
                      ) : (
                        <Pause className="mr-2 h-4 w-4" />
                      )}
                      {batchState.isPaused ? "Resume" : "Pause"}
                    </Button>
                  )}
                  
                  <Button 
                    onClick={resetBatchProcessing} 
                    variant="outline"
                    disabled={batchState.isProcessing && !batchState.isPaused}
                    className="min-w-[100px]"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset
                  </Button>
                </div>

                {/* Processing Status */}
                {(batchState.isProcessing || batchState.processedDishes.length > 0) && (
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Overall Progress</span>
                        <span className="text-sm text-muted-foreground">
                          {batchState.currentDishIndex} of {batchState.totalDishes} dishes
                        </span>
                      </div>
                      <Progress value={batchState.progress} className="h-3" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <div className="font-medium mb-1">Current Batch</div>
                        <div className="text-muted-foreground">
                          {batchState.currentBatch} of {batchState.totalBatches}
                        </div>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="font-medium mb-1 flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          Completed
                        </div>
                        <div className="text-green-700">
                          {batchState.processedDishes.length} dishes
                        </div>
                      </div>
                      <div className="p-3 bg-red-50 rounded-lg">
                        <div className="font-medium mb-1 flex items-center gap-1">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          Failed
                        </div>
                        <div className="text-red-700">
                          {batchState.failedDishes.length} dishes
                        </div>
                      </div>
                    </div>

                    {/* Processing Status Details */}
                    {batchState.isProcessing && (
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="font-medium text-blue-900 mb-1">
                          {batchState.isPaused ? "⏸️ Processing Paused" : "🔄 Processing..."}
                        </div>
                        <div className="text-blue-700 text-sm">
                          {batchState.isPaused 
                            ? "Click Resume to continue processing" 
                            : `Processing dish ${batchState.currentDishIndex} of ${batchState.totalDishes}`
                          }
                        </div>
                      </div>
                    )}

                    {/* Results Summary */}
                    {batchState.processedDishes.length > 0 && (
                      <div className="space-y-3">
                        <div className="p-3 bg-green-50 rounded-lg">
                          <h4 className="font-medium text-green-900 mb-2">Successfully Processed Dishes:</h4>
                          <div className="flex flex-wrap gap-1">
                            {batchState.processedDishes.slice(-10).map((dishName, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {dishName}
                              </Badge>
                            ))}
                            {batchState.processedDishes.length > 10 && (
                              <Badge variant="outline" className="text-xs">
                                +{batchState.processedDishes.length - 10} more
                              </Badge>
                            )}
                          </div>
                        </div>

                        {batchState.failedDishes.length > 0 && (
                          <div className="p-3 bg-red-50 rounded-lg">
                            <h4 className="font-medium text-red-900 mb-2">Failed Dishes:</h4>
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                              {batchState.failedDishes.map((failure, index) => (
                                <div key={index} className="text-xs text-red-700">
                                  <span className="font-medium">{failure.name}:</span> {failure.error}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* No dishes available message */}
                {availableDishes.length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                    <h3 className="font-medium text-lg mb-1">All dishes have ingredients!</h3>
                    <p className="text-muted-foreground">
                      All dishes in your menu already have ingredients assigned. Add more dishes to use batch processing.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    
  );
}