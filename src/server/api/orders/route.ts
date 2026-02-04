import { NextRequest, NextResponse } from 'next/server';
import { getDishes } from '@/server/lib/menuService';

// Get orders from localStorage (real orders from POS)
function getOrdersFromStorage(userId: string = 'default_user'): any[] {
  try {
    // This will be handled by the client-side, server returns empty array
    // The actual data will come from the client's localStorage
    return [];
  } catch (error) {
    console.error('Error reading orders from localStorage:', error);
    return [];
  }
}

// Helper function to find inventory item by name (case-insensitive)
function findInventoryItemByName(inventory: any[], searchName: string): any | null {
  return inventory.find(item => 
    item.name.toLowerCase() === searchName.toLowerCase() ||
    item.name.toLowerCase().includes(searchName.toLowerCase()) ||
    searchName.toLowerCase().includes(item.name.toLowerCase())
  ) || null;
}

// Helper function to convert units
function convertUnits(fromAmount: number, fromUnit: string, toUnit: string): number {
  // Normalize units
  const normalizedFromUnit = fromUnit.toLowerCase().trim();
  const normalizedToUnit = toUnit.toLowerCase().trim();

  // If units are the same, no conversion needed
  if (normalizedFromUnit === normalizedToUnit) {
    return fromAmount;
  }

  // Common unit conversions
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

  // If no conversion found, assume 1:1 ratio
  console.warn(`No unit conversion found from ${fromUnit} to ${toUnit}, using 1:1 ratio`);
  return fromAmount;
}

// Helper type guard for IngredientQuantity
function isIngredientQuantity(obj: any): obj is { inventoryItemName: string; quantityPerDish: number; unit: string } {
  return (
    obj && typeof obj === 'object' &&
    typeof obj.inventoryItemName === 'string' &&
    typeof obj.quantityPerDish === 'number' &&
    typeof obj.unit === 'string'
  );
}

/**
 * Update inventory based on order items using the server-side inventory API
 */
async function updateInventoryFromOrder(order: any, userId: string) {
  console.log('🔄 Updating inventory for order:', order.id);
  
  try {
    // Get current inventory and menu
    const inventoryRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/inventory?userId=${userId}`);
    const { inventory } = await inventoryRes.json();
    const menu = getDishes(userId);
    
    console.log('📊 Current inventory items:', inventory.length);
    console.log('🍽️ Available dishes:', menu.length);
    
    // Prepare inventory updates
    const inventoryUpdates: any[] = [];
    
    // Process each order item
    for (const orderItem of order.items) {
      const dishName = orderItem.name;
      const orderQuantity = orderItem.quantity;
      
      console.log(`🍽️ Processing dish: ${dishName} (quantity: ${orderQuantity})`);
      
      // Find the dish in menu
      const dish = menu.find(d => d.name.toLowerCase() === dishName.toLowerCase());
      
      if (!dish) {
        console.warn(`⚠️ Dish not found in menu: ${dishName}`);
        continue;
      }
      
      const ingredientCount = Array.isArray(dish.ingredients) ? dish.ingredients.length : 0;
      console.log(`📋 Dish found: ${dish.name} with ${ingredientCount} ingredients`);
      
      // Process each ingredient in the dish
      if (Array.isArray(dish.ingredients)) {
        for (const ingredient of dish.ingredients) {
          if (!isIngredientQuantity(ingredient)) {
            console.warn(`⚠️ Ingredient is not a structured object:`, ingredient);
            continue;
          }
          const ingredientName = ingredient.inventoryItemName;
          const quantityPerDish = ingredient.quantityPerDish;
          const unit = ingredient.unit;
          
          // Calculate total quantity needed for this order
          const totalQuantityNeeded = quantityPerDish * orderQuantity;
          
          console.log(`🥘 Ingredient: ${ingredientName} - ${quantityPerDish} ${unit} per dish × ${orderQuantity} dishes = ${totalQuantityNeeded} ${unit} total`);
          
          // Add to inventory updates
          inventoryUpdates.push({
            ingredientName,
            quantityToReduce: totalQuantityNeeded,
            unit
          });
        }
      }
    }
    
    // Send inventory updates to the inventory API
    if (inventoryUpdates.length > 0) {
      const updateRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/inventory`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          updates: inventoryUpdates
        })
      });
      
      const updateResult = await updateRes.json();
      
      if (updateResult.success) {
        console.log(`✅ Inventory update completed: ${updateResult.updates.filter((u: any) => u.success).length} items updated`);
        return {
          success: true,
          message: updateResult.message,
          updates: updateResult.updates
        };
      } else {
        console.error('❌ Error updating inventory:', updateResult.error);
        return {
          success: false,
          message: 'Error updating inventory',
          error: updateResult.error
        };
      }
    } else {
      console.log('ℹ️ No inventory updates needed');
      return {
        success: true,
        message: 'No inventory updates needed',
        updates: []
      };
    }
    
  } catch (error) {
    console.error('❌ Error updating inventory:', error);
    return {
      success: false,
      message: 'Error updating inventory',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function GET() {
  // Return empty array - orders will be fetched from client-side localStorage
  // This ensures we don't show demo data
  return NextResponse.json({ orders: [] });
}

export async function POST(request: NextRequest) {
  try {
    const order = await request.json();
    // Just return success - the order will be stored in client-side localStorage
    // by the orders page when it calls this API
    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, status, paymentMode, tipAmount, amountPaid, userId } = await request.json();
    
    // For PATCH operations, we need to update the client-side localStorage
    // This is handled by the client-side code, we just return success
    // The actual update happens in the client's localStorage
    
    if (status === 'Completed') {
      // Update inventory when order is completed
      // We need the full order data, but since we're not storing it server-side,
      // we'll let the client handle inventory updates
      console.log(`Order ${id} marked as completed - inventory update should be handled client-side`);
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Order updated successfully',
      order: { id, status, paymentMode, tipAmount, amountPaid }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}