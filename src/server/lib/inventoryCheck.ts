import { Ingredient } from './types';

const inventory = [
  { name: 'Flour', quantity: 1000, unit: 'grams' },
  { name: 'Tomato Sauce', quantity: 500, unit: 'grams' },
  { name: 'Mozzarella', quantity: 300, unit: 'grams' },
  { name: 'Eggs', quantity: 12, unit: 'pcs' }
];

export function checkIngredientStock(ingredient: Ingredient) {
  const item = inventory.find(i => i.name.toLowerCase() === ingredient.name.toLowerCase());
  if (!item) return { status: 'missing', available: 0 };
  if (item.quantity < ingredient.quantity) return { status: 'insufficient', available: item.quantity };
  return { status: 'ok', available: item.quantity };
} 