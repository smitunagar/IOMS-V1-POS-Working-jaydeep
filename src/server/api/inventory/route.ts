import { NextRequest, NextResponse } from 'next/server';

// Server-side inventory storage using a Map (in production, this would be a database)
const inventoryStore = new Map<string, any[]>();

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

// GET /api/inventory - Get inventory for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const inventory = inventoryStore.get(userId) || [];
    return NextResponse.json({ inventory });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get inventory' }, { status: 500 });
  }
}

// POST /api/inventory - Sync inventory from client or update inventory items
export async function POST(request: NextRequest) {
  try {
    const { userId, inventory, action } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    if (action === 'sync') {
      // Sync inventory from client
      inventoryStore.set(userId, inventory || []);
      return NextResponse.json({ success: true, message: 'Inventory synced successfully' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to sync inventory' }, { status: 500 });
  }
}

// PATCH /api/inventory - Update inventory quantities (for order processing)
export async function PATCH(request: NextRequest) {
  try {
    const { userId, updates } = await request.json();
    
    if (!userId || !updates) {
      return NextResponse.json({ error: 'userId and updates are required' }, { status: 400 });
    }

    let inventory = inventoryStore.get(userId) || [];
    const updateResults: any[] = [];

    // Process each update
    for (const update of updates) {
      const { ingredientName, quantityToReduce, unit } = update;
      
      // Find inventory item
      const inventoryItemIndex = inventory.findIndex(item => 
        item.name.toLowerCase() === ingredientName.toLowerCase() ||
        item.name.toLowerCase().includes(ingredientName.toLowerCase()) ||
        ingredientName.toLowerCase().includes(item.name.toLowerCase())
      );
      
      if (inventoryItemIndex === -1) {
        updateResults.push({
          ingredientName,
          success: false,
          message: `Inventory item not found: ${ingredientName}`
        });
        continue;
      }

      const inventoryItem = inventory[inventoryItemIndex];
      
      // Convert units if needed
      let convertedQuantity = quantityToReduce;
      if (unit.toLowerCase() !== inventoryItem.unit.toLowerCase()) {
        convertedQuantity = convertUnits(quantityToReduce, unit, inventoryItem.unit);
      }
      
      // Check if enough stock
      if (inventoryItem.quantity < convertedQuantity) {
        updateResults.push({
          ingredientName,
          success: false,
          message: `Insufficient stock: available ${inventoryItem.quantity} ${inventoryItem.unit}, needed ${convertedQuantity} ${inventoryItem.unit}`
        });
        continue;
      }
      
      // Update inventory
      const oldQuantity = inventoryItem.quantity;
      inventoryItem.quantity -= convertedQuantity;
      inventoryItem.quantityUsed = (inventoryItem.quantityUsed || 0) + convertedQuantity;
      inventoryItem.totalUsed = (inventoryItem.totalUsed || 0) + convertedQuantity;
      
      updateResults.push({
        ingredientName,
        success: true,
        oldQuantity,
        newQuantity: inventoryItem.quantity,
        used: convertedQuantity,
        unit: inventoryItem.unit
      });
    }

    // Save updated inventory
    inventoryStore.set(userId, inventory);
    
    return NextResponse.json({ 
      success: true, 
      message: `Inventory updated: ${updateResults.filter(r => r.success).length} items modified`,
      updates: updateResults,
      inventory: inventory
    });
    
  } catch (error) {
    console.error('Error updating inventory:', error);
    return NextResponse.json({ error: 'Failed to update inventory' }, { status: 500 });
  }
}
