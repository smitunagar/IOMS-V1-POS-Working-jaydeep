// Smart Inventory Integration Service
// This service checks ingredients against inventory and suggests additions

import { getInventory, addInventoryItem, InventoryItem } from './inventoryService';

export interface IngredientCheckResult {
  ingredientName: string;
  requiredQuantity: number;
  requiredUnit: string;
  status: 'found' | 'missing' | 'insufficient';
  inventoryItem?: InventoryItem;
  suggestion?: string;
  autoAddRecommendation?: {
    name: string;
    quantity: number;
    unit: string;
    category: string;
    lowStockThreshold: number;
  };
}

export interface DishInventoryAnalysis {
  dishName: string;
  totalIngredients: number;
  foundIngredients: number;
  missingIngredients: number;
  insufficientIngredients: number;
  results: IngredientCheckResult[];
  canMakeServings: number;
  recommendedInventoryAdditions: any[];
}

export interface MenuInventoryReport {
  totalDishes: number;
  dishesWithAllIngredients: number;
  dishesWithMissingIngredients: number;
  uniqueMissingIngredients: Set<string>;
  recommendations: any[];
  detailedAnalysis: DishInventoryAnalysis[];
}

function findInventoryMatch(inventory: InventoryItem[], ingredientName: string): InventoryItem | null {
  const searchName = ingredientName.toLowerCase().trim();
  let match = inventory.find(item => item.name.toLowerCase().trim() === searchName);
  if (match) return match;
  // Partial matching
  match = inventory.find(item => {
    const itemName = item.name.toLowerCase().trim();
    return itemName.includes(searchName) || searchName.includes(itemName);
  });
  if (match) return match;
  return null;
}

function suggestCategory(ingredientName: string): string {
  const name = ingredientName.toLowerCase();
  if (name.includes('chicken') || name.includes('beef') || name.includes('mutton') || name.includes('lamb') || name.includes('fish') || name.includes('meat')) {
    return 'Meat';
  }
  if (name.includes('rice') || name.includes('flour') || name.includes('bread') || name.includes('pasta') || name.includes('quinoa')) {
    return 'Grains';
  }
  if (name.includes('onion') || name.includes('tomato') || name.includes('potato') || name.includes('carrot') || name.includes('capsicum') || name.includes('spinach') || name.includes('coriander') || name.includes('mint') || name.includes('chili')) {
    return 'Produce';
  }
  if (name.includes('milk') || name.includes('cheese') || name.includes('yogurt') || name.includes('butter') || name.includes('cream') || name.includes('paneer')) {
    return 'Dairy';
  }
  if (name.includes('powder') || name.includes('masala') || name.includes('seeds') || name.includes('turmeric') || name.includes('cumin') || name.includes('pepper') || name.includes('cardamom') || name.includes('cinnamon') || name.includes('cloves')) {
    return 'Spices';
  }
  if (name.includes('oil') || name.includes('ghee') || name.includes('vinegar')) {
    return 'Oils & Condiments';
  }
  return 'Pantry';
}

function suggestQuantity(ingredientName: string, requiredQuantity: number): number {
  const name = ingredientName.toLowerCase();
  if (name.includes('chicken') || name.includes('beef') || name.includes('mutton')) {
    return Math.max(requiredQuantity * 12, 1000);
  }
  if (name.includes('rice') || name.includes('flour')) {
    return Math.max(requiredQuantity * 20, 2000);
  }
  if (name.includes('onion') || name.includes('tomato') || name.includes('potato')) {
    return Math.max(requiredQuantity * 15, 500);
  }
  if (name.includes('powder') || name.includes('masala') || name.includes('seeds')) {
    return Math.max(requiredQuantity * 25, 50);
  }
  if (name.includes('oil') || name.includes('milk')) {
    return Math.max(requiredQuantity * 10, 500);
  }
  return Math.max(requiredQuantity * 10, 100);
}

export function analyzeDishIngredients(
  userId: string,
  dishName: string,
  ingredients: any[]
): DishInventoryAnalysis {
  const inventory = getInventory(userId);
  const results: IngredientCheckResult[] = [];
  const recommendations: any[] = [];
  let foundCount = 0;
  let missingCount = 0;
  let insufficientCount = 0;
  let minServings = Infinity;
  for (const ingredient of ingredients) {
    const ingredientName = ingredient.inventoryItemName || ingredient.name;
    const requiredQty = ingredient.quantityPerDish || ingredient.quantity || 0;
    const requiredUnit = ingredient.unit || 'g';
    const inventoryMatch = findInventoryMatch(inventory, ingredientName);
    if (!inventoryMatch) {
      missingCount++;
      minServings = 0;
      const suggestion = suggestQuantity(ingredientName, requiredQty);
      const category = suggestCategory(ingredientName);
      results.push({
        ingredientName,
        requiredQuantity: requiredQty,
        requiredUnit: requiredUnit,
        status: 'missing',
        suggestion: `Add ${suggestion} ${requiredUnit} to inventory`,
        autoAddRecommendation: {
          name: ingredientName,
          quantity: suggestion,
          unit: requiredUnit,
          category: category,
          lowStockThreshold: Math.max(Math.floor(suggestion * 0.2), 1)
        }
      });
      recommendations.push({
        type: 'missing',
        ingredientName,
        suggestion: `Add ${suggestion} ${requiredUnit} of ${ingredientName}`,
        autoAdd: true,
        name: ingredientName,
        quantity: suggestion,
        unit: requiredUnit,
        category: category,
        lowStockThreshold: Math.max(Math.floor(suggestion * 0.2), 1)
      });
    } else {
      const availableQty = inventoryMatch.quantity;
      const possibleServings = Math.floor(availableQty / requiredQty);
      if (possibleServings === 0) {
        insufficientCount++;
        minServings = 0;
        results.push({
          ingredientName,
          requiredQuantity: requiredQty,
          requiredUnit: requiredUnit,
          status: 'insufficient',
          inventoryItem: inventoryMatch,
          suggestion: `Need ${requiredQty} ${requiredUnit}, but only ${availableQty} ${inventoryMatch.unit} available`
        });
      } else {
        foundCount++;
        minServings = Math.min(minServings, possibleServings);
        results.push({
          ingredientName,
          requiredQuantity: requiredQty,
          requiredUnit: requiredUnit,
          status: 'found',
          inventoryItem: inventoryMatch,
          suggestion: `Available (${possibleServings} servings possible)`
        });
      }
    }
  }
  const analysis = {
    dishName,
    totalIngredients: ingredients.length,
    foundIngredients: foundCount,
    missingIngredients: missingCount,
    insufficientIngredients: insufficientCount,
    results,
    canMakeServings: minServings === Infinity ? 0 : minServings,
    recommendedInventoryAdditions: recommendations
  };
  return analysis;
}

export function analyzeMenuInventory(userId: string, menu: any[]): MenuInventoryReport {
  const detailedAnalysis: DishInventoryAnalysis[] = [];
  const allMissingIngredients = new Set<string>();
  const allRecommendations: any[] = [];
  let dishesWithAllIngredients = 0;
  let dishesWithMissingIngredients = 0;
  for (const dish of menu) {
    if (!dish.ingredients || dish.ingredients.length === 0) {
      continue;
    }
    const analysis = analyzeDishIngredients(userId, dish.name, dish.ingredients);
    detailedAnalysis.push(analysis);
    if (analysis.missingIngredients === 0 && analysis.insufficientIngredients === 0) {
      dishesWithAllIngredients++;
    } else {
      dishesWithMissingIngredients++;
    }
    analysis.results.forEach(result => {
      if (result.status === 'missing') {
        allMissingIngredients.add(result.ingredientName);
        if (result.autoAddRecommendation) {
          const existing = allRecommendations.find(r => r.name === result.autoAddRecommendation!.name);
          if (!existing) {
            allRecommendations.push(result.autoAddRecommendation);
          }
        }
      }
    });
  }
  const report = {
    totalDishes: menu.length,
    dishesWithAllIngredients,
    dishesWithMissingIngredients,
    uniqueMissingIngredients: allMissingIngredients,
    recommendations: allRecommendations,
    detailedAnalysis
  };
  return report;
}

export function autoAddRecommendedIngredients(userId: string, recommendations: any[]): {
  added: number;
  failed: number;
  details: string[];
} {
  let added = 0;
  let failed = 0;
  const details: string[] = [];
  for (const rec of recommendations) {
    try {
      const newItem = addInventoryItem(userId, {
        id: Date.now().toString(),
        name: rec.name,
        quantity: rec.quantity,
        unit: rec.unit,
        category: rec.category,
        lowStockThreshold: rec.lowStockThreshold,
        expiryDate: undefined,
        image: 'https://placehold.co/60x60.png',
        aiHint: rec.name.toLowerCase()
      });
      if (newItem) {
        added++;
        details.push(`Added ${rec.name}: ${rec.quantity} ${rec.unit}`);
      } else {
        failed++;
        details.push(`Failed to add ${rec.name}`);
      }
    } catch (error) {
      failed++;
      details.push(`Error adding ${rec.name}: ${error}`);
    }
  }
  return { added, failed, details };
} 