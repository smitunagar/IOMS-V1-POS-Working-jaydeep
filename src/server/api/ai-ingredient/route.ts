import { NextRequest, NextResponse } from 'next/server';
import { ai } from '@/ai/genkit';

async function generateIngredientsList(input: { dishName: string; numberOfServings: number; aiHint?: string }) {
  const { dishName, numberOfServings, aiHint } = input;
  
  const prompt = `
You are an expert chef and nutritionist. Generate a detailed ingredient list for the dish: "${dishName}".

${aiHint ? `Additional context: ${aiHint}` : ''}

For ${numberOfServings} serving(s), provide:
- Ingredient name (be specific)
- Quantity (appropriate for the serving size)
- Unit of measurement

Return ONLY a valid JSON array of objects with this exact structure:
[
  {"name": "Ingredient Name", "quantity": number, "unit": "unit"},
  {"name": "Another Ingredient", "quantity": number, "unit": "unit"}
]

No explanations, no markdown, just the JSON array.
`;

  try {
    const result = await ai.generate([{ text: prompt }]);
    const text = typeof result.text === 'string' ? result.text : '';
    
    // Extract JSON from response
    let cleanText = text.trim();
    const jsonMatch = text.match(/```json([\s\S]*?)```/) || text.match(/```([\s\S]*?)```/);
    if (jsonMatch) {
      cleanText = jsonMatch[1].trim();
    }
    
    // Remove code fences
    cleanText = cleanText.replace(/```/g, '').trim();
    
    // Parse JSON
    const ingredients = JSON.parse(cleanText);
    
    // Validate structure
    if (!Array.isArray(ingredients)) {
      throw new Error('Invalid response format');
    }
    
    return { ingredients };
    
  } catch (error) {
    console.error('AI ingredient generation failed:', error);
    
    // Fallback to mock data
    const fallbackIngredients = [
      { name: 'Main protein', quantity: 200 * numberOfServings, unit: 'g' },
      { name: 'Vegetables', quantity: 150 * numberOfServings, unit: 'g' },
      { name: 'Starch', quantity: 100 * numberOfServings, unit: 'g' },
      { name: 'Oil', quantity: 2 * numberOfServings, unit: 'tbsp' },
      { name: 'Salt', quantity: 1 * numberOfServings, unit: 'tsp' },
      { name: 'Pepper', quantity: 1 * numberOfServings, unit: 'tsp' }
    ];
    
    return { ingredients: fallbackIngredients };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, aiHint } = body;
    
    if (!name) {
      return NextResponse.json(
        { error: 'Missing dish name' },
        { status: 400 }
      );
    }
    
    console.log('[AI-INGREDIENT] Request:', { name, aiHint });
    
    const result = await generateIngredientsList({ 
      dishName: name, 
      numberOfServings: 1,
      aiHint
    });
    
    console.log('[AI-INGREDIENT] Response:', result);
    
    return NextResponse.json({ ingredients: result.ingredients });
    
  } catch (error: any) {
    console.error('[AI-INGREDIENT] Error:', error);
    
    // Check if it's an API key error
    if (error instanceof Error && (error.message.includes('API key') || error.message.includes('FAILED_PRECONDITION'))) {
      return NextResponse.json(
        { 
          error: 'AI service unavailable. Please check your API key configuration.',
          suggestion: 'Please ensure you have a valid Gemini API key in your .env.local file'
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error?.message || 'Failed to generate ingredients' },
      { status: 500 }
    );
  }
} 