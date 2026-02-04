import { NextResponse } from 'next/server';
import { ai } from '@/ai/genkit';
import { getNextPending, markDone, markError, markProcessing } from '@/server/lib/wasteQueue';

export const runtime = 'nodejs';

const DEFAULT_CO2_PER_KG = 2.1;

async function analyzeImage(image: string) {
  const prompt = `
You are a food waste identification expert. Analyze the provided image and identify the food waste.

Return a JSON object with the following structure:
{
  "dishName": "Name of the dish or food item",
  "category": "Food Waste category (e.g., Prepared Food, Raw Ingredients, Vegetables, Meat, Dairy, Bakery, etc.)",
  "estimatedWeight": "Estimated weight in kg (e.g., 0.5 kg, 1.2 kg)",
  "confidence": 85
}

RULES:
1. Be specific about the dish name (e.g., "Pasta Carbonara", "Grilled Chicken", "Caesar Salad")
2. If you can't identify the exact dish, describe what you see (e.g., "Mixed Cooked Vegetables")
3. Estimate weight based on visual size (typical portion sizes)
4. Confidence should be 0-100 based on how certain you are
5. Return ONLY the JSON object, no additional text

Analyze the image now:
`;

  const result = await ai.generate([
    { text: prompt },
    { media: { url: image } }
  ]);

  const text = result?.text || '';
  let cleanText = text.trim();
  cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in response');
  }
  return JSON.parse(jsonMatch[0]);
}

function parseWeightKg(weightText: string | number | undefined) {
  if (!weightText) return 0.5;
  if (typeof weightText === 'number') return weightText;
  const match = weightText.match(/([0-9]+(?:\.[0-9]+)?)/);
  return match ? Number(match[1]) : 0.5;
}

export async function POST() {
  const item = getNextPending();
  if (!item) {
    return NextResponse.json({ status: 'idle' });
  }

  try {
    markProcessing(item.id);

    const analysis = await analyzeImage(item.imageData);
    const weightKg = typeof item.weightKg === 'number'
      ? item.weightKg
      : parseWeightKg(analysis.estimatedWeight);

    const result = {
      dishName: analysis.dishName || 'Unknown Dish',
      category: analysis.category || 'Food Waste',
      weightKg: Number(weightKg.toFixed(3)),
      confidence: analysis.confidence || 80,
      co2Kg: Number((weightKg * DEFAULT_CO2_PER_KG).toFixed(3)),
    };

    markDone(item.id, result);
    return NextResponse.json({ status: 'processed', itemId: item.id, result });
  } catch (error: any) {
    markError(item.id, error?.message || 'Analysis failed');
    return NextResponse.json({ status: 'error', itemId: item.id, error: error?.message || 'Analysis failed' }, { status: 500 });
  }
}
