// Client-side proxy for menu service
// This file provides client-side access to menu functionality
// by calling the server-side API endpoints

export interface Dish {
  id: string;
  name: string;
  price: string | number;
  category: string;
  description?: string;
  image?: string;
  ingredients?: string[];
  addons?: Array<{
    id: string;
    name: string;
    price: number;
    type: 'extra' | 'remove' | 'custom';
  }>;
  sizes?: Array<{
    size: string;
    price: string | number;
  }>;
}

export async function getDishes(): Promise<Dish[]> {
  try {
    const response = await fetch('/api/menu');
    if (!response.ok) {
      throw new Error('Failed to fetch dishes');
    }
    const data = await response.json();
    return data.dishes || [];
  } catch (error) {
    console.error('Error fetching dishes:', error);
    return [];
  }
}

export async function addDishToMenu(dish: Omit<Dish, 'id'>): Promise<Dish | null> {
  try {
    const response = await fetch('/api/menu', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dish),
    });
    if (!response.ok) {
      throw new Error('Failed to add dish to menu');
    }
    const data = await response.json();
    return data.dish;
  } catch (error) {
    console.error('Error adding dish to menu:', error);
    return null;
  }
}

export async function updateDish(id: string, updates: Partial<Dish>): Promise<Dish | null> {
  try {
    const response = await fetch('/api/menu', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, ...updates }),
    });
    if (!response.ok) {
      throw new Error('Failed to update dish');
    }
    const data = await response.json();
    return data.dish;
  } catch (error) {
    console.error('Error updating dish:', error);
    return null;
  }
}

export async function deleteDish(id: string): Promise<boolean> {
  try {
    const response = await fetch('/api/menu', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id }),
    });
    return response.ok;
  } catch (error) {
    console.error('Error deleting dish:', error);
    return false;
  }
}











