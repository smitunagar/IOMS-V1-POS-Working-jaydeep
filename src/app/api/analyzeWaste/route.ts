import { NextRequest, NextResponse } from 'next/server';
import { ai } from '@/ai/genkit';

export const runtime = 'nodejs';

const buildFallbackResponse = () => ({
  dishName: 'Mixed Food Waste',
  category: 'Food Waste',
  estimatedWeight: '0.5 kg',
  confidence: 60,
  fallback: true,
});

export async function POST(request: NextRequest) {
  try {
    console.log('==> /api/analyzeWaste POST received');
    
    const body = await request.json();
    const { image } = body;
    
    if (!image || typeof image !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'No image provided'
      }, { status: 400 });
    }

    // Log image metadata for debugging
    const base64Data = image.includes(',') ? image.split(',')[1] : image;
    console.log('📸 Image data received, size:', base64Data.length, 'characters');
    
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      const fallback = buildFallbackResponse();
      return NextResponse.json({ success: true, ...fallback });
    }
    
    // Create prompt for waste identification
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
    
    console.log('🚀 Sending request to Gemini...');

    // Generate content using Genkit with image
    const result = await ai.generate([
      { text: prompt },
      { media: { url: image } }
    ]);

    const text = result?.text || '';
    
    console.log('📄 Gemini response received');
    console.log('📊 Response:', text);
    
    // Parse the JSON response
    let cleanText = text.trim();
    cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    
    const analysisData = JSON.parse(jsonMatch[0]);
    
    console.log(`✅ Waste analysis successful:`, analysisData);
    
    return NextResponse.json({
      success: true,
      dishName: analysisData.dishName || 'Unknown Dish',
      category: analysisData.category || 'Food Waste',
      estimatedWeight: analysisData.estimatedWeight || '0.5 kg',
      confidence: analysisData.confidence || 80,
    });
    
  } catch (error: any) {
    console.error('❌ Waste analysis error:', error);
    
    if (error.message?.includes('429') || error.message?.toLowerCase().includes('quota')) {
      return NextResponse.json({
        success: false,
        error: 'Gemini API quota exceeded. Please try again later.',
      }, { status: 429 });
    }

    const fallback = buildFallbackResponse();
    return NextResponse.json({
      success: true,
      ...fallback,
    });
  }
}

