// Inventory Validation Service
// Validates if orders can be fulfilled based on available inventory

import { getInventory, InventoryItem } from './inventoryService';
import { getDishes } from './menuService';

export interface InventoryValidationResult {
  canFulfill: boolean;
  errors: string[];
  warnings: string[];
  requiredIngredients: RequiredIngredient[];
  insufficientItems: InsufficientItem[];
}

export interface RequiredIngredient {
  ingredientName: string;
  required: number;
  available: number;
  unit: string;
  sufficient: boolean;
}

export interface InsufficientItem {
  ingredientName: string;
  required: number;
  available: number;
  unit: string;
  shortfall: number;
}

export interface OrderItem {
  name: string;
  quantity: number;
  notes?: string;
  selectedSize?: any;
}

// Helper function to convert units
function convertUnits(fromAmount: number, fromUnit: string, toUnit: string): number {
  const normalizedFromUnit = fromUnit.toLowerCase().trim();
  const normalizedToUnit = toUnit.toLowerCase().trim();

  if (normalizedFromUnit === normalizedToUnit) {
    return fromAmount;
  }

  const conversions: Record<string, Record<string, number>> = {
    'g': { 'kg': 0.001, 'oz': 0.035274, 'lb': 0.00220462 },
    'kg': { 'g': 1000, 'oz': 35.274, 'lb': 2.20462 },
    'ml': { 'l': 0.001, 'oz': 0.033814, 'cup': 0.00422675 },
    'l': { 'ml': 1000, 'oz': 33.814, 'cup': 4.22675 },
    'oz': { 'g': 28.3495, 'kg': 0.0283495, 'ml': 29.5735, 'l': 0.0295735, 'cup': 0.125 },
    'cup': { 'ml': 236.588, 'l': 0.236588, 'oz': 8 },
    'pcs': { 'piece': 1, 'unit': 1 },
    'piece': { 'pcs': 1, 'unit': 1 },
    'unit': { 'pcs': 1, 'piece': 1 }
  };

  if (conversions[normalizedFromUnit] && conversions[normalizedFromUnit][normalizedToUnit]) {
    return fromAmount * conversions[normalizedFromUnit][normalizedToUnit];
  }

  console.warn(`No unit conversion found from ${fromUnit} to ${toUnit}, using 1:1 ratio`);
  return fromAmount;
}

// Check if ingredients are structured objects
function isIngredientQuantity(obj: any): obj is { inventoryItemName: string; quantityPerDish: number; unit: string } {
  return (
    obj && typeof obj === 'object' &&
    typeof obj.inventoryItemName === 'string' &&
    typeof obj.quantityPerDish === 'number' &&
    typeof obj.unit === 'string'
  );
}

// Find inventory item by name (case-insensitive, partial match)
function findInventoryItem(inventory: InventoryItem[], searchName: string): InventoryItem | null {
  const normalizedSearchName = searchName.toLowerCase().trim();
  
  // Exact match first
  let item = inventory.find(item => item.name.toLowerCase() === normalizedSearchName);
  if (item) return item;
  
  // Partial match
  item = inventory.find(item => 
    item.name.toLowerCase().includes(normalizedSearchName) ||
    normalizedSearchName.includes(item.name.toLowerCase())
  );
  
  return item || null;
}

/**
 * Validates if an order can be fulfilled based on current inventory
 * @param userId User ID for inventory lookup
 * @param orderItems Array of order items to validate
 * @returns InventoryValidationResult with validation details
 */
export async function validateOrderInventory(userId: string, orderItems: OrderItem[]): Promise<InventoryValidationResult> {
  const result: InventoryValidationResult = {
    canFulfill: true,
    errors: [],
    warnings: [],
    requiredIngredients: [],
    insufficientItems: []
  };

  try {
    // Debug localStorage contents
    if (typeof window !== 'undefined') {
      console.log('🔍 [INVENTORY-VALIDATION] UserId received:', userId);
      console.log('🔍 [INVENTORY-VALIDATION] LocalStorage keys:', Object.keys(localStorage));
      
      // Check for inventory keys
      const inventoryKeys = Object.keys(localStorage).filter(key => key.startsWith('inventory_'));
      console.log('🔍 [INVENTORY-VALIDATION] Inventory keys found:', inventoryKeys);
      
      // Check the specific key we're looking for
      const expectedKey = 'inventory_' + userId;
      console.log('🔍 [INVENTORY-VALIDATION] Expected key:', expectedKey);
      console.log('🔍 [INVENTORY-VALIDATION] Key exists:', localStorage.getItem(expectedKey) !== null);
      
      // Show all inventory data
      inventoryKeys.forEach(key => {
        const data = localStorage.getItem(key);
        console.log(`🔍 [INVENTORY-VALIDATION] ${key}:`, data ? JSON.parse(data).length + ' items' : 'null');
      });
    }
    
    // Get current inventory and menu
    const inventory = getInventory(userId);
    const menu = getDishes(userId);

    console.log(`🔍 [INVENTORY-VALIDATION] Got ${inventory.length} inventory items and ${menu.length} menu items`);

    if (inventory.length === 0) {
      result.canFulfill = false;
      result.errors.push('No inventory items found. Please set up inventory first.');
      return result;
    }

    if (menu.length === 0) {
      result.canFulfill = false;
      result.errors.push('No menu items found. Please set up menu first.');
      return result;
    }

    console.log(`🔍 Validating order with ${orderItems.length} items against ${inventory.length} inventory items`);

    // Calculate total required ingredients
    const requiredIngredients = new Map<string, { total: number; unit: string; available: number }>();

    // Process each order item
    for (const orderItem of orderItems) {
      const dishName = orderItem.name;
      const orderQuantity = orderItem.quantity;

      console.log(`🍽️ Processing dish: ${dishName} (quantity: ${orderQuantity})`);

      // Find the dish in menu
      const dish = menu.find(d => d.name.toLowerCase() === dishName.toLowerCase());

      if (!dish) {
        result.warnings.push(`Dish not found in menu: ${dishName}`);
        continue;
      }

      console.log(`📋 Found dish: ${dish.name} with ${Array.isArray(dish.ingredients) ? dish.ingredients.length : 0} ingredients`);

      // Process each ingredient in the dish
      if (Array.isArray(dish.ingredients)) {
        for (const ingredient of dish.ingredients) {
          let ingredientName: string;
          let quantityPerDish: number;
          let unit: string;

          // Handle different ingredient formats
          if (isIngredientQuantity(ingredient)) {
            ingredientName = ingredient.inventoryItemName;
            quantityPerDish = ingredient.quantityPerDish;
            unit = ingredient.unit;
          } else if (typeof ingredient === 'string') {
            ingredientName = ingredient;
            quantityPerDish = 1; // Default quantity
            unit = 'unit'; // Default unit
          } else {
            console.warn(`⚠️ Unknown ingredient format:`, ingredient);
            continue;
          }

          // Calculate total quantity needed for this order
          const totalQuantityNeeded = quantityPerDish * orderQuantity;

          console.log(`🥘 Ingredient: ${ingredientName} - ${quantityPerDish} ${unit} per dish × ${orderQuantity} dishes = ${totalQuantityNeeded} ${unit} total`);

          // Add to required ingredients map
          const key = ingredientName.toLowerCase();
          if (requiredIngredients.has(key)) {
            const existing = requiredIngredients.get(key)!;
            existing.total += totalQuantityNeeded;
          } else {
            // Find inventory item
            const inventoryItem = findInventoryItem(inventory, ingredientName);
            const available = inventoryItem ? inventoryItem.quantity : 0;

            requiredIngredients.set(key, {
              total: totalQuantityNeeded,
              unit: unit,
              available: available
            });
          }
        }
      }
    }

    // Validate each required ingredient against inventory
    for (const [ingredientKey, requirement] of requiredIngredients) {
      const inventoryItem = findInventoryItem(inventory, ingredientKey);

      if (!inventoryItem) {
        result.canFulfill = false;
        result.errors.push(`Ingredient not found in inventory: ${ingredientKey}`);
        result.insufficientItems.push({
          ingredientName: ingredientKey,
          required: requirement.total,
          available: 0,
          unit: requirement.unit,
          shortfall: requirement.total
        });
        continue;
      }

      // Convert units if needed
      let availableQuantity = inventoryItem.quantity;
      let requiredQuantity = requirement.total;

      if (inventoryItem.unit.toLowerCase() !== requirement.unit.toLowerCase()) {
        try {
          requiredQuantity = convertUnits(requirement.total, requirement.unit, inventoryItem.unit);
        } catch (error) {
          result.warnings.push(`Unit conversion issue for ${inventoryItem.name}: ${requirement.unit} to ${inventoryItem.unit}`);
        }
      }

      const sufficient = availableQuantity >= requiredQuantity;

      // Add to required ingredients result
      result.requiredIngredients.push({
        ingredientName: inventoryItem.name,
        required: requiredQuantity,
        available: availableQuantity,
        unit: inventoryItem.unit,
        sufficient: sufficient
      });

      // Check if sufficient
      if (!sufficient) {
        result.canFulfill = false;
        const shortfall = requiredQuantity - availableQuantity;
        result.errors.push(
          `Insufficient ${inventoryItem.name}: need ${requiredQuantity.toFixed(2)} ${inventoryItem.unit}, ` +
          `available ${availableQuantity.toFixed(2)} ${inventoryItem.unit} ` +
          `(short by ${shortfall.toFixed(2)} ${inventoryItem.unit})`
        );
        result.insufficientItems.push({
          ingredientName: inventoryItem.name,
          required: requiredQuantity,
          available: availableQuantity,
          unit: inventoryItem.unit,
          shortfall: shortfall
        });
      }

      // Low stock warning
      if (inventoryItem.lowStockThreshold && availableQuantity <= inventoryItem.lowStockThreshold) {
        result.warnings.push(`Low stock warning: ${inventoryItem.name} (${availableQuantity} ${inventoryItem.unit} remaining)`);
      }
    }

    console.log(`✅ Inventory validation complete: ${result.canFulfill ? 'CAN FULFILL' : 'CANNOT FULFILL'}`);
    console.log(`   - Errors: ${result.errors.length}`);
    console.log(`   - Warnings: ${result.warnings.length}`);
    console.log(`   - Required ingredients: ${result.requiredIngredients.length}`);

    return result;

  } catch (error) {
    console.error('❌ Error validating inventory:', error);
    result.canFulfill = false;
    result.errors.push(`Inventory validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return result;
  }
}

/**
 * Get detailed inventory impact for an order (for display purposes)
 * @param userId User ID for inventory lookup
 * @param orderItems Array of order items to analyze
 * @returns Array of inventory impact details
 */
export async function getInventoryImpact(userId: string, orderItems: OrderItem[]) {
  const validation = await validateOrderInventory(userId, orderItems);
  return {
    validation,
    impact: validation.requiredIngredients.map(ingredient => ({
      ...ingredient,
      remainingAfterOrder: ingredient.available - ingredient.required,
      percentageUsed: ingredient.available > 0 ? (ingredient.required / ingredient.available) * 100 : 0
    }))
  };
}
