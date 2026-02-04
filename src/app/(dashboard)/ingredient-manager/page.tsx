'use client';

import React, { useState } from 'react';

// Mocked inventory (replace with Firestore if needed)
const MOCK_INVENTORY = [
  { name: 'Flour', quantity: 1000, unit: 'g' },
  { name: 'Tomato Sauce', quantity: 500, unit: 'g' },
  { name: 'Mozzarella', quantity: 300, unit: 'g' },
  { name: 'Eggs', quantity: 12, unit: 'pcs' }
];

type Dish = { id: string; name: string; category: string; price: number };
type Ingredient = { name: string; quantity: number; unit: string };

// Gemini AI Ingredient Generator (mocked for demo)
async function fetchIngredientsFromGemini(dishName: string): Promise<Ingredient[]> {
  if (dishName.toLowerCase().includes('pizza')) {
    return [
      { name: 'Flour', quantity: 200, unit: 'g' },
      { name: 'Tomato Sauce', quantity: 100, unit: 'g' },
      { name: 'Mozzarella', quantity: 100, unit: 'g' }
    ];
  }
  return [
    { name: 'Sugar', quantity: 50, unit: 'g' },
    { name: 'Eggs', quantity: 2, unit: 'pcs' }
  ];
}

// Only allow CSV parsing
function parseMenuCsv(csv: string): Dish[] {
  const lines = csv.trim().split('\n');
  const [header, ...rows] = lines;
  const headers = header.split(',').map(h => h.trim().toLowerCase());
  return rows.map((row, idx) => {
    const cols = row.split(',');
    return {
      id: String(idx + 1),
      name: cols[headers.indexOf('dish name')] || '',
      category: cols[headers.indexOf('category')] || '',
      price: parseFloat(cols[headers.indexOf('price')] || '0')
    };
  });
}

function checkIngredient(ingredient: Ingredient) {
  const inv = MOCK_INVENTORY.find(i => i.name.toLowerCase() === ingredient.name.toLowerCase());
  if (!inv) return 'missing';
  if (inv.quantity < ingredient.quantity) return 'insufficient';
  return 'ok';
}

export default function IngredientManager() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [ingredients, setIngredients] = useState<Record<string, Ingredient[]>>({});
  const [loading, setLoading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    let parsed: Dish[] = [];
    if (file.type === 'text/csv') {
      const text = await file.text();
      parsed = parseMenuCsv(text);
    } else {
      alert('Only CSV files are supported.');
      setLoading(false);
      return;
    }
    setDishes(parsed);
    const allIngredients: Record<string, Ingredient[]> = {};
    for (const dish of parsed) {
      allIngredients[dish.id] = await fetchIngredientsFromGemini(dish.name);
    }
    setIngredients(allIngredients);
    setLoading(false);
  }

  function updateIngredient(dishId: string, idx: number, field: keyof Ingredient, value: string) {
    setIngredients(prev => ({
      ...prev,
      [dishId]: prev[dishId].map((ing, i) =>
        i === idx ? { ...ing, [field]: field === 'quantity' ? parseFloat(value) : value } : ing
      )
    }));
  }
  function addIngredient(dishId: string) {
    setIngredients(prev => ({
      ...prev,
      [dishId]: [...(prev[dishId] || []), { name: '', quantity: 0, unit: '' }]
    }));
  }
  function removeIngredient(dishId: string, idx: number) {
    setIngredients(prev => ({
      ...prev,
      [dishId]: prev[dishId].filter((_, i) => i !== idx)
    }));
  }

  function handleSave() {
    localStorage.setItem('ingredientManagerDishes', JSON.stringify(dishes));
    localStorage.setItem('ingredientManagerMappings', JSON.stringify(ingredients));
    alert('Mappings saved!');
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Ingredient Manager</h1>
      <input
        type="file"
        accept=".csv"
        className="mb-4"
        onChange={handleFile}
      />
      {loading && <div className="text-blue-600">Processing...</div>}
      {dishes.map(dish => (
        <div key={dish.id} className="mb-6 border rounded p-4 bg-white shadow">
          <div className="font-semibold text-lg mb-1">{dish.name} <span className="text-sm text-gray-500">({dish.category})</span> <span className="text-green-700">${dish.price}</span></div>
          <div className="mb-2">
            <span className="font-medium">Ingredients:</span>
            <button
              className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
              onClick={() => addIngredient(dish.id)}
            >+ Add Ingredient</button>
          </div>
          <ul>
            {(ingredients[dish.id] || []).map((ing, idx) => {
              const status = checkIngredient(ing);
              return (
                <li key={idx} className="flex items-center gap-2 mb-1">
                  <input
                    className="border rounded px-1 w-32"
                    value={ing.name}
                    onChange={e => updateIngredient(dish.id, idx, 'name', e.target.value)}
                    placeholder="Name"
                  />
                  <input
                    className="border rounded px-1 w-20"
                    type="number"
                    value={ing.quantity}
                    onChange={e => updateIngredient(dish.id, idx, 'quantity', e.target.value)}
                    placeholder="Qty"
                  />
                  <input
                    className="border rounded px-1 w-16"
                    value={ing.unit}
                    onChange={e => updateIngredient(dish.id, idx, 'unit', e.target.value)}
                    placeholder="Unit"
                  />
                  <span className={
                    status === 'ok'
                      ? 'text-green-600'
                      : status === 'insufficient'
                        ? 'text-yellow-600'
                        : 'text-red-600'
                  }>
                    {status === 'ok' ? '✔' : status === 'insufficient' ? 'Low' : 'Missing'}
                  </span>
                  <button
                    className="ml-2 px-2 py-1 bg-red-100 text-red-700 rounded text-xs"
                    onClick={() => removeIngredient(dish.id, idx)}
                  >Remove</button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      {dishes.length > 0 && (
        <button
          className="px-4 py-2 bg-green-600 text-white rounded font-semibold"
          onClick={handleSave}
        >
          Save Mappings
        </button>
      )}
      <style>{`
        body { background: #f7fafc; }
      `}</style>
    </div>
  );
} 