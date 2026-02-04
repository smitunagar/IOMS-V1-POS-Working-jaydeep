import { NextRequest, NextResponse } from 'next/server';

// Sample inventory data for testing
const sampleInventoryData = [
  {
    id: 'inv_001',
    name: 'Rice',
    quantity: 2.5,
    unit: 'kg',
    category: 'Grains',
    lowStockThreshold: 1.0,
    expiryDate: '2025-12-31',
    quantityUsed: 0,
    totalUsed: 0
  },
  {
    id: 'inv_002',
    name: 'Chicken',
    quantity: 3.0,
    unit: 'kg',
    category: 'Meat',
    lowStockThreshold: 0.5,
    expiryDate: '2025-09-15',
    quantityUsed: 0,
    totalUsed: 0
  },
  {
    id: 'inv_003',
    name: 'Onions',
    quantity: 1.5,
    unit: 'kg',
    category: 'Vegetables',
    lowStockThreshold: 0.5,
    expiryDate: '2025-09-20',
    quantityUsed: 0,
    totalUsed: 0
  },
  {
    id: 'inv_004',
    name: 'Tomatoes',
    quantity: 0.8,
    unit: 'kg',
    category: 'Vegetables',
    lowStockThreshold: 0.3,
    expiryDate: '2025-09-12',
    quantityUsed: 0,
    totalUsed: 0
  },
  {
    id: 'inv_005',
    name: 'Coconut Milk',
    quantity: 1.2,
    unit: 'l',
    category: 'Dairy',
    lowStockThreshold: 0.5,
    expiryDate: '2025-10-01',
    quantityUsed: 0,
    totalUsed: 0
  },
  {
    id: 'inv_006',
    name: 'Garlic',
    quantity: 0.3,
    unit: 'kg',
    category: 'Spices',
    lowStockThreshold: 0.1,
    expiryDate: '2025-11-01',
    quantityUsed: 0,
    totalUsed: 0
  },
  {
    id: 'inv_007',
    name: 'Ginger',
    quantity: 0.2,
    unit: 'kg',
    category: 'Spices',
    lowStockThreshold: 0.1,
    expiryDate: '2025-10-15',
    quantityUsed: 0,
    totalUsed: 0
  },
  {
    id: 'inv_008',
    name: 'Naan Bread',
    quantity: 20,
    unit: 'pcs',
    category: 'Bakery',
    lowStockThreshold: 5,
    expiryDate: '2025-09-10',
    quantityUsed: 0,
    totalUsed: 0
  },
  {
    id: 'inv_009',
    name: 'Basmati Rice',
    quantity: 1.8,
    unit: 'kg',
    category: 'Grains',
    lowStockThreshold: 0.5,
    expiryDate: '2025-12-31',
    quantityUsed: 0,
    totalUsed: 0
  },
  {
    id: 'inv_010',
    name: 'Curry Powder',
    quantity: 0.15,
    unit: 'kg',
    category: 'Spices',
    lowStockThreshold: 0.05,
    expiryDate: '2026-01-01',
    quantityUsed: 0,
    totalUsed: 0
  }
];

// Sample menu data with ingredient mappings
const sampleMenuData = [
  {
    id: 'menu_001',
    name: 'Chicken Curry',
    price: '12.50',
    category: 'Main Course',
    ingredients: [
      { inventoryItemName: 'Chicken', quantityPerDish: 0.25, unit: 'kg' },
      { inventoryItemName: 'Onions', quantityPerDish: 0.1, unit: 'kg' },
      { inventoryItemName: 'Tomatoes', quantityPerDish: 0.05, unit: 'kg' },
      { inventoryItemName: 'Coconut Milk', quantityPerDish: 0.1, unit: 'l' },
      { inventoryItemName: 'Garlic', quantityPerDish: 0.01, unit: 'kg' },
      { inventoryItemName: 'Ginger', quantityPerDish: 0.01, unit: 'kg' },
      { inventoryItemName: 'Curry Powder', quantityPerDish: 0.01, unit: 'kg' }
    ]
  },
  {
    id: 'menu_002',
    name: 'Basmati Rice',
    price: '3.50',
    category: 'Side Dish',
    ingredients: [
      { inventoryItemName: 'Basmati Rice', quantityPerDish: 0.15, unit: 'kg' }
    ]
  },
  {
    id: 'menu_003',
    name: 'Naan Bread',
    price: '2.50',
    category: 'Bread',
    ingredients: [
      { inventoryItemName: 'Naan Bread', quantityPerDish: 1, unit: 'pcs' }
    ]
  },
  {
    id: 'menu_004',
    name: 'Fish Curry',
    price: '14.00',
    category: 'Main Course',
    ingredients: [
      { inventoryItemName: 'Onions', quantityPerDish: 0.08, unit: 'kg' },
      { inventoryItemName: 'Tomatoes', quantityPerDish: 0.06, unit: 'kg' },
      { inventoryItemName: 'Coconut Milk', quantityPerDish: 0.12, unit: 'l' },
      { inventoryItemName: 'Garlic', quantityPerDish: 0.01, unit: 'kg' },
      { inventoryItemName: 'Ginger', quantityPerDish: 0.01, unit: 'kg' },
      { inventoryItemName: 'Curry Powder', quantityPerDish: 0.015, unit: 'kg' }
    ]
  }
];

export async function POST(request: NextRequest) {
  try {
    const { userId, action } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    if (action === 'setup-sample-data') {
      // Store sample inventory data
      const inventoryResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          inventory: sampleInventoryData,
          action: 'sync'
        })
      });

      // Store sample menu data in localStorage format
      if (typeof window !== 'undefined') {
        localStorage.setItem(`dishes_${userId}`, JSON.stringify(sampleMenuData));
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Sample data created successfully',
        inventoryItems: sampleInventoryData.length,
        menuItems: sampleMenuData.length
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error setting up sample data:', error);
    return NextResponse.json({ error: 'Failed to setup sample data' }, { status: 500 });
  }
}
