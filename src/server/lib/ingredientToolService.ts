// AI Ingredient Tool Service
// This service communicates with the AI Ingredient Tool API to fetch ingredients for a given dish

// Accepts a dish object with name and aiHint
export async function getIngredientsForDish(dish: { name: string, aiHint?: string }): Promise<any[]> {
  // Call the AI Ingredient Tool API
  const response = await fetch('/api/ai-ingredient', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: dish.name, aiHint: dish.aiHint }),
  });
  // Parse the JSON data
  const data = await response.json();
  console.log('AI Ingredient Tool response:', data); // Debug log
  // Try to handle different possible response structures
  if (Array.isArray(data.ingredients)) return data.ingredients;
  if (Array.isArray(data)) return data;
  if (data.result && Array.isArray(data.result.ingredients)) return data.result.ingredients;
  return [];
}
