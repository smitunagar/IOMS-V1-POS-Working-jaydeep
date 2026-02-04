// Menu Service
// Provides functions to manage menu items in localStorage

export interface IngredientQuantity {
  inventoryItemName: string;
  quantityPerDish: number;
  unit: string;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category?: string;
  ingredients?: (string | IngredientQuantity)[];
  image?: string;
  aiHint?: string;
}

export interface Dish {
  id: string;
  name: string;
  price: number;
  category?: string;
  ingredients?: (string | IngredientQuantity)[];
  image?: string;
  aiHint?: string;
}

const MENU_KEY_PREFIX = 'menu_';

export function getDishes(userId: string): MenuItem[] {
  if (typeof window === 'undefined') return [];
  
  // Try the provided userId first
  let data = localStorage.getItem(MENU_KEY_PREFIX + userId);
  
  // If no data found, try common fallback user IDs
  if (!data) {
    const fallbackIds = ['default_user', 'admin', 'user'];
    for (const fallbackId of fallbackIds) {
      data = localStorage.getItem(MENU_KEY_PREFIX + fallbackId);
      if (data) {
        console.log(`🔄 [MENU-SERVICE] Using fallback menu from userId: ${fallbackId}`);
        break;
      }
    }
  }
  
  // If still no data, check if there's any menu data with any key
  if (!data) {
    const allKeys = Object.keys(localStorage);
    const menuKeys = allKeys.filter(key => key.startsWith(MENU_KEY_PREFIX));
    if (menuKeys.length > 0) {
      data = localStorage.getItem(menuKeys[0]);
      console.log(`🔄 [MENU-SERVICE] Using menu from first available key: ${menuKeys[0]}`);
    }
  }
  
  if (!data) return [];
  try {
    return JSON.parse(data) as MenuItem[];
  } catch {
    return [];
  }
}

export function saveDishes(userId: string, dishes: MenuItem[]): void {
  localStorage.setItem(MENU_KEY_PREFIX + userId, JSON.stringify(dishes));
}

export function addDish(userId: string, dish: MenuItem): MenuItem | null {
  if (typeof window === 'undefined') return null;
  const dishes = getDishes(userId);
  const newDish = { ...dish, id: dish.id || Date.now().toString() };
  dishes.push(newDish);
  saveDishes(userId, dishes);
  return newDish;
}

export function updateDish(userId: string, dish: MenuItem): boolean {
  if (typeof window === 'undefined') return false;
  const dishes = getDishes(userId);
  const idx = dishes.findIndex(d => d.id === dish.id);
  if (idx === -1) return false;
  dishes[idx] = dish;
  saveDishes(userId, dishes);
  return true;
}

export function removeDish(userId: string, dishId: string): boolean {
  if (typeof window === 'undefined') return false;
  const dishes = getDishes(userId);
  const newDishes = dishes.filter(d => d.id !== dishId);
  if (newDishes.length === dishes.length) return false;
  saveDishes(userId, newDishes);
  return true;
}

export const addDishToMenu = addDish; 