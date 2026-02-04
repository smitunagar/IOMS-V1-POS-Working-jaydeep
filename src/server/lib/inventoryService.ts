// Inventory Service
// Provides functions to manage inventory in localStorage

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category?: string;
  lowStockThreshold?: number;
  expiryDate?: string;
  image?: string;
  aiHint?: string;
  quantityUsed?: number;
  totalUsed?: number;
}

const INVENTORY_KEY_PREFIX = 'inventory_';

export function getInventory(userId: string): InventoryItem[] {
  if (typeof window === 'undefined') return [];
  
  // Try the provided userId first
  let data = localStorage.getItem(INVENTORY_KEY_PREFIX + userId);
  
  // If no data found, try common fallback user IDs
  if (!data) {
    const fallbackIds = ['default_user', 'admin', 'user'];
    for (const fallbackId of fallbackIds) {
      data = localStorage.getItem(INVENTORY_KEY_PREFIX + fallbackId);
      if (data) {
        console.log(`🔄 [INVENTORY-SERVICE] Using fallback inventory from userId: ${fallbackId}`);
        break;
      }
    }
  }
  
  // If still no data, check if there's any inventory data with any key
  if (!data) {
    const allKeys = Object.keys(localStorage);
    const inventoryKeys = allKeys.filter(key => key.startsWith(INVENTORY_KEY_PREFIX));
    if (inventoryKeys.length > 0) {
      data = localStorage.getItem(inventoryKeys[0]);
      console.log(`🔄 [INVENTORY-SERVICE] Using inventory from first available key: ${inventoryKeys[0]}`);
    }
  }
  
  if (!data) return [];
  try {
    return JSON.parse(data) as InventoryItem[];
  } catch {
    return [];
  }
}

export function addInventoryItem(userId: string, item: InventoryItem): InventoryItem | null {
  if (typeof window === 'undefined') return null;
  const inventory = getInventory(userId);
  const newItem = { ...item, id: item.id || Date.now().toString(), quantityUsed: item.quantityUsed || 0, totalUsed: item.totalUsed || 0 };
  inventory.push(newItem);
  localStorage.setItem(INVENTORY_KEY_PREFIX + userId, JSON.stringify(inventory));
  return newItem;
}

export function updateInventoryItem(userId: string, item: InventoryItem): boolean {
  if (typeof window === 'undefined') return false;
  const inventory = getInventory(userId);
  const idx = inventory.findIndex(i => i.id === item.id);
  if (idx === -1) return false;
  inventory[idx] = item;
  // Always persist the updated inventory array
  localStorage.setItem(INVENTORY_KEY_PREFIX + userId, JSON.stringify(inventory));
  return true;
}

export function removeInventoryItem(userId: string, itemId: string): boolean {
  if (typeof window === 'undefined') return false;
  const inventory = getInventory(userId);
  const newInventory = inventory.filter(i => i.id !== itemId);
  if (newInventory.length === inventory.length) return false;
  localStorage.setItem(INVENTORY_KEY_PREFIX + userId, JSON.stringify(newInventory));
  return true;
}

export function addOrUpdateIngredientInInventory(userId: string, ingredient: InventoryItem): InventoryItem {
  const inventory = getInventory(userId);
  const idx = inventory.findIndex(i => i.name.toLowerCase() === ingredient.name.toLowerCase());
  if (idx !== -1) {
    // PRESERVE existing user data - only update if new data has meaningful values
    const existingItem = inventory[idx];
    const updatedItem = { 
      ...existingItem, 
      ...ingredient,
      // Only update quantity/unit if the new values are meaningful (not defaults)
      quantity: (ingredient.quantity && ingredient.quantity > 0) ? ingredient.quantity : existingItem.quantity,
      unit: (ingredient.unit && ingredient.unit !== 'pieces' && ingredient.unit !== 'g') ? ingredient.unit : existingItem.unit,
      quantityUsed: existingItem.quantityUsed || 0, 
      totalUsed: existingItem.totalUsed || 0 
    };
    inventory[idx] = updatedItem;
    console.log(`🔄 [INVENTORY-SERVICE] Updated existing item preserving user data: ${ingredient.name}`);
  } else {
    inventory.push({ ...ingredient, id: ingredient.id || Date.now().toString(), quantityUsed: ingredient.quantityUsed || 0, totalUsed: ingredient.totalUsed || 0 });
    console.log(`➕ [INVENTORY-SERVICE] Added new item: ${ingredient.name}`);
  }
  localStorage.setItem(INVENTORY_KEY_PREFIX + userId, JSON.stringify(inventory));
  return ingredient;
}

export function addIngredientToInventoryIfNotExists(userId: string, ingredient: InventoryItem): boolean {
  const inventory = getInventory(userId);
  const exists = inventory.some(i => i.name.toLowerCase() === ingredient.name.toLowerCase());
  if (!exists) {
    addInventoryItem(userId, ingredient);
    return true;
  }
  return false;
}

export function getInventoryAlerts(userId: string): string[] {
  const inventory = getInventory(userId);
  return inventory.filter(i => i.lowStockThreshold && i.quantity <= i.lowStockThreshold)
    .map(i => `Low stock: ${i.name} (${i.quantity} ${i.unit})`);
}

export function updateInventoryAlerts(userId: string): void {
  if (typeof window === 'undefined') return;
  // Placeholder: In a real app, this would update alert state in a DB or context
  // For now, just triggers a localStorage event
  localStorage.setItem('inventory_alerts_' + userId, Date.now().toString());
}

export function saveInventory(userId: string, inventory: InventoryItem[]): void {
  localStorage.setItem(INVENTORY_KEY_PREFIX + userId, JSON.stringify(inventory));
}

// Inventory alert type for low stock notifications
export interface InventoryAlert {
  itemId: string;
  itemName: string;
  quantity: number;
  unit: string;
  message: string;
}

// Generate inventory alerts for low stock items
export function getInventoryAlertsDetailed(userId: string): InventoryAlert[] {
  const inventory = getInventory(userId);
  return inventory
    .filter(i => i.lowStockThreshold !== undefined && i.quantity <= (i.lowStockThreshold ?? 0))
    .map(i => ({
      itemId: i.id,
      itemName: i.name,
      quantity: i.quantity,
      unit: i.unit,
      message: `Low stock: ${i.name} (${i.quantity} ${i.unit})`,
    }));
}

// Placeholder for recordIngredientUsage to resolve import in posInventoryIntegration
export function recordIngredientUsage(userId: string, dish: any, quantity: number): void {
  // No-op placeholder
}

// Deduct inventory based on completed order
export function deductInventoryForOrder(userId: string, orderItems: any[], menu: any[]): {
  success: boolean;
  message: string;
  deductions: any[];
  errors: string[];
} {
  if (typeof window === 'undefined') {
    return { success: false, message: 'Server-side operation not supported', deductions: [], errors: ['Server-side operation not supported'] };
  }

  const inventory = getInventory(userId);
  const deductions: any[] = [];
  const errors: string[] = [];

  console.log('🔄 [INVENTORY-SERVICE] Starting inventory deduction for order');
  console.log(`📊 Processing ${orderItems.length} order items with ${inventory.length} inventory items`);

  // Helper function to convert units
  const convertUnits = (fromAmount: number, fromUnit: string, toUnit: string): number => {
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
  };

  // Helper function to find inventory item by name
  const findInventoryItem = (searchName: string): InventoryItem | null => {
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
  };

  // Helper function to check if ingredient is structured object
  const isIngredientQuantity = (obj: any): obj is { inventoryItemName: string; quantityPerDish: number; unit: string } => {
    return (
      obj && typeof obj === 'object' &&
      typeof obj.inventoryItemName === 'string' &&
      typeof obj.quantityPerDish === 'number' &&
      typeof obj.unit === 'string'
    );
  };

  // Process each order item
  for (const orderItem of orderItems) {
    const dishName = orderItem.name;
    const orderQuantity = orderItem.quantity;

    console.log(`🍽️ Processing dish: ${dishName} (quantity: ${orderQuantity})`);

    // Find the dish in menu
    const dish = menu.find(d => d.name.toLowerCase() === dishName.toLowerCase());

    if (!dish) {
      errors.push(`Dish not found in menu: ${dishName}`);
      console.warn(`⚠️ Dish not found in menu: ${dishName}`);
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

        // Find inventory item
        const inventoryItem = findInventoryItem(ingredientName);

        if (!inventoryItem) {
          errors.push(`Ingredient not found in inventory: ${ingredientName}`);
          console.warn(`⚠️ Ingredient not found in inventory: ${ingredientName}`);
          continue;
        }

        // Convert units if needed
        let requiredQuantity = totalQuantityNeeded;
        if (inventoryItem.unit.toLowerCase() !== unit.toLowerCase()) {
          try {
            requiredQuantity = convertUnits(totalQuantityNeeded, unit, inventoryItem.unit);
            console.log(`🔄 Converted ${totalQuantityNeeded} ${unit} to ${requiredQuantity} ${inventoryItem.unit}`);
          } catch (error) {
            errors.push(`Unit conversion error for ${inventoryItem.name}: ${unit} to ${inventoryItem.unit}`);
            continue;
          }
        }

        // Check if sufficient stock
        if (inventoryItem.quantity < requiredQuantity) {
          errors.push(`Insufficient ${inventoryItem.name}: need ${requiredQuantity.toFixed(2)} ${inventoryItem.unit}, available ${inventoryItem.quantity.toFixed(2)} ${inventoryItem.unit}`);
          console.warn(`⚠️ Insufficient stock for ${inventoryItem.name}`);
          continue;
        }

        // Deduct from inventory
        const oldQuantity = inventoryItem.quantity;
        inventoryItem.quantity -= requiredQuantity;
        inventoryItem.quantityUsed = (inventoryItem.quantityUsed || 0) + requiredQuantity;
        inventoryItem.totalUsed = (inventoryItem.totalUsed || 0) + requiredQuantity;

        deductions.push({
          ingredientName: inventoryItem.name,
          oldQuantity,
          newQuantity: inventoryItem.quantity,
          deducted: requiredQuantity,
          unit: inventoryItem.unit,
          dish: dishName
        });

        console.log(`✅ Deducted ${requiredQuantity} ${inventoryItem.unit} of ${inventoryItem.name} (${oldQuantity} → ${inventoryItem.quantity})`);
      }
    }
  }

  // Save updated inventory
  localStorage.setItem(INVENTORY_KEY_PREFIX + userId, JSON.stringify(inventory));

  const successMessage = deductions.length > 0 
    ? `✅ Inventory updated successfully! Deducted ${deductions.length} ingredients.`
    : 'ℹ️ No inventory deductions needed.';

  console.log(`🎉 Inventory deduction completed: ${deductions.length} successful, ${errors.length} errors`);

  return {
    success: errors.length === 0,
    message: successMessage,
    deductions,
    errors
  };
} 