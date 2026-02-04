// Client-side proxy for inventory service
// This file provides client-side access to inventory functionality
// by calling the server-side API endpoints

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  expiryDate?: string;
  supplier?: string;
  cost?: number;
  lastUpdated: string;
}

export async function getInventory(userId: string): Promise<InventoryItem[]> {
  try {
    const response = await fetch('/api/inventory');
    if (!response.ok) {
      throw new Error('Failed to fetch inventory');
    }
    const data = await response.json();
    return data.inventory || [];
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return [];
  }
}

export async function addInventoryItem(item: Omit<InventoryItem, 'id' | 'lastUpdated'>): Promise<InventoryItem | null> {
  try {
    const response = await fetch('/api/inventory', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(item),
    });
    if (!response.ok) {
      throw new Error('Failed to add inventory item');
    }
    const data = await response.json();
    return data.item;
  } catch (error) {
    console.error('Error adding inventory item:', error);
    return null;
  }
}

export async function updateInventoryItem(id: string, updates: Partial<InventoryItem>): Promise<InventoryItem | null> {
  try {
    const response = await fetch('/api/inventory', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, ...updates }),
    });
    if (!response.ok) {
      throw new Error('Failed to update inventory item');
    }
    const data = await response.json();
    return data.item;
  } catch (error) {
    console.error('Error updating inventory item:', error);
    return null;
  }
}

export async function saveInventory(inventory: InventoryItem[]): Promise<boolean> {
  try {
    const response = await fetch('/api/inventory', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inventory }),
    });
    return response.ok;
  } catch (error) {
    console.error('Error saving inventory:', error);
    return false;
  }
}

export async function addIngredientToInventoryIfNotExists(ingredient: {
  name: string;
  category: string;
  unit: string;
  quantity?: number;
}): Promise<InventoryItem | null> {
  try {
    const response = await fetch('/api/inventory/ingredient', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ingredient),
    });
    if (!response.ok) {
      throw new Error('Failed to add ingredient to inventory');
    }
    const data = await response.json();
    return data.item;
  } catch (error) {
    console.error('Error adding ingredient to inventory:', error);
    return null;
  }
}











