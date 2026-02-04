/*
  Resets menu tables by clearing menu_items and categories,
  then reinserting the default categories used by the app.
*/
const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = path.join(process.cwd(), 'database', 'ioms.db');
const db = new Database(DB_PATH);

db.pragma('foreign_keys = ON');

function run() {
  console.log('DB:', DB_PATH);
  const tx = db.transaction(() => {
    // Clear menu data
    db.prepare('DELETE FROM menu_items').run();
    db.prepare('DELETE FROM categories').run();
  });
  tx();

  // Default categories copied from src/lib/database.ts
  const defaultCategories = [
    { name: 'Tea', description: 'Various types of tea products' },
    { name: 'Sweets and Snacks', description: 'Candies, cookies, and snack items' },
    { name: 'Spices', description: 'Cooking spices and seasonings' },
    { name: 'Pre Mix', description: 'Pre-mixed food products' },
    { name: 'Coffee', description: 'Coffee products' },
    { name: 'Juices', description: 'Fruit and vegetable juices' },

    { name: 'Cocktails', description: 'Mixed alcoholic drinks and cocktails' },
    { name: 'Wines', description: 'Red, white, and rose wines' },
    { name: 'German Wines', description: 'German wine varieties' },
    { name: 'International Wines', description: 'Italian, French, and other international wines' },
    { name: 'Spirits', description: 'Vodka, Rum, Gin, Whiskey, etc.' },
    { name: 'Liqueurs', description: 'Sweet alcoholic beverages' },
    { name: 'Digestifs', description: 'After-dinner drinks' },

    { name: 'Soft Drinks', description: 'Cola, lemonade, and carbonated drinks' },
    { name: 'Fresh Juices', description: 'Fresh fruit and vegetable juices' },
    { name: 'Mocktails', description: 'Non-alcoholic cocktails' },
    { name: 'Hot Beverages', description: 'Tea, coffee, and hot drinks' },
    { name: 'Non-Alcoholic Wine/Sekt', description: 'Non-alcoholic wine and sparkling drinks' },

    { name: 'Chicken Dishes', description: 'Chicken curry and chicken-based dishes' },
    { name: 'Lamb Dishes', description: 'Lamb curry and lamb-based dishes' },
    { name: 'Fish Dishes', description: 'Fish curry and fish-based dishes' },
    { name: 'Vegetarian Dishes', description: 'Vegetable curry and vegetarian dishes' },
    { name: 'Rice Dishes', description: 'Basmati rice and rice-based dishes' },
    { name: 'Breads', description: 'Naan, roti, and Indian breads' },

    { name: 'Appetizers', description: 'Starter dishes and appetizers' },
    { name: 'Salads', description: 'Fresh salads and vegetable dishes' },
    { name: 'Desserts', description: 'Sweet dessert items' },
    { name: 'Side Dishes', description: 'Rice, bread, and side accompaniments' }
  ];

  const insertCategory = db.prepare('INSERT OR IGNORE INTO categories (name, description) VALUES (?, ?)');
  for (const c of defaultCategories) insertCategory.run(c.name, c.description);

  const counts = db.prepare(`SELECT 
    (SELECT COUNT(*) FROM categories) AS categoryCount,
    (SELECT COUNT(*) FROM menu_items) AS menuItemCount
  `).get();

  console.log('Reset complete:', counts);
}

try {
  run();
  process.exit(0);
} catch (e) {
  console.error('Reset failed:', e);
  process.exit(1);
}
