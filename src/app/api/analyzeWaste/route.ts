import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { ai } from '@/ai/genkit';
import { query } from '@/lib/database/lib/connection';
import { uploadToObjectStorage } from '@/server/lib/objectStorage';
import { calculateCo2FromIngredients } from '@/server/lib/ifeuCo2';

export const runtime = 'nodejs';

const buildFallbackResponse = () => ({
  dishName: 'Mixed Food Waste',
  category: 'Food Waste',
  estimatedWeight: '0.5 kg',
  confidence: 60,
  fallback: true,
});

const getExtension = (contentType: string) => {
  if (contentType.includes('png')) return 'png';
  if (contentType.includes('webp')) return 'webp';
  if (contentType.includes('heic')) return 'heic';
  return 'jpg';
};

const parseDataUrl = (image: string) => {
  const hasHeader = image.startsWith('data:');
  const contentType = hasHeader ? image.substring(5, image.indexOf(';')) : 'image/jpeg';
  const base64Data = image.includes(',') ? image.split(',')[1] : image;
  const buffer = Buffer.from(base64Data, 'base64');
  return { buffer, contentType, base64Size: base64Data.length };
};

const parseWeightKg = (weightText: string | number | undefined) => {
  if (!weightText) return null;
  if (typeof weightText === 'number') return Number.isFinite(weightText) ? weightText : null;
  const match = weightText.match(/([0-9]+(?:\.[0-9]+)?)/);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
};

const getMenuIngredientsForDish = async (dishName?: string | null) => {
  if (!dishName) return null;
  try {
    const exact = await query(
      `SELECT item_id, name FROM menu_item WHERE LOWER(name) = LOWER($1) LIMIT 1`,
      [dishName]
    );

    const row = exact.rows?.[0] || null;
    let itemId = row?.item_id ?? null;

    if (!itemId) {
      const fuzzy = await query(
        `SELECT item_id, name FROM menu_item WHERE name ILIKE $1 ORDER BY name ASC LIMIT 1`,
        [`%${dishName}%`]
      );
      itemId = fuzzy.rows?.[0]?.item_id ?? null;
    }

    if (!itemId) return null;

    const ingredients = await query(
      `SELECT i.name
       FROM menu_item_ingredient mii
       JOIN ingredient i ON i.ingredient_id = mii.ingredient_id
       WHERE mii.item_id = $1
       ORDER BY i.name ASC`,
      [itemId]
    );

    return ingredients.rows?.map((row: any) => row.name).filter(Boolean) || [];
  } catch (error) {
    console.error('❌ Failed to load menu ingredients:', error);
    return null;
  }
};

const uploadIfConfigured = async (buffer: Buffer, contentType: string) => {
  try {
    return await uploadToObjectStorage(
      buffer,
      `waste-images/${new Date().toISOString().slice(0, 10).replace(/-/g, '/')}/${randomUUID()}.${getExtension(contentType)}`,
      contentType
    );
  } catch (error) {
    console.error('❌ Failed to upload waste image:', error);
    return null;
  }
};

const storeCapture = async (payload: {
  source?: string | null;
  station?: string | null;
  analysis: Record<string, unknown>;
  fallback: boolean;
  storage?: {
    url: string;
    key: string;
    bucket: string;
    contentType: string;
    sizeBytes: number;
  } | null;
}) => {
  try {
    await query(
      `INSERT INTO waste_captures (
        source,
        station,
        image_url,
        image_key,
        image_bucket,
        image_mime_type,
        image_size_bytes,
        analysis,
        fallback
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9)`
      , [
        payload.source ?? null,
        payload.station ?? null,
        payload.storage?.url ?? null,
        payload.storage?.key ?? null,
        payload.storage?.bucket ?? null,
        payload.storage?.contentType ?? null,
        payload.storage?.sizeBytes ?? null,
        JSON.stringify(payload.analysis),
        payload.fallback,
      ]
    );
  } catch (error) {
    console.error('❌ Failed to store waste capture:', error);
  }
};

export async function POST(request: NextRequest) {
  let parsedImage: ReturnType<typeof parseDataUrl> | null = null;
  let source: string | null = null;
  let station: string | null = null;
  let weightKgFromBody: number | null = null;
  try {
    console.log('==> /api/analyzeWaste POST received');
    
    const body = await request.json();
    ({ source = null, station = null } = body || {});
    weightKgFromBody = typeof body?.weightKg === 'number' && Number.isFinite(body.weightKg)
      ? body.weightKg
      : null;
    const { image } = body;
    
    if (!image || typeof image !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'No image provided'
      }, { status: 400 });
    }

    // Log image metadata for debugging
    parsedImage = parseDataUrl(image);
    console.log('📸 Image data received, size:', parsedImage.base64Size, 'characters');
    
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      const fallback = buildFallbackResponse();
      const uploadResult = await uploadIfConfigured(parsedImage.buffer, parsedImage.contentType);
      await storeCapture({
        source,
        station,
        analysis: fallback,
        fallback: true,
        storage: uploadResult,
      });
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

    const resolvedWeightKg = weightKgFromBody ?? parseWeightKg(analysisData?.estimatedWeight);
    const recipeIngredients = await getMenuIngredientsForDish(analysisData?.dishName);
    const co2Result = recipeIngredients && resolvedWeightKg
      ? await calculateCo2FromIngredients(recipeIngredients, resolvedWeightKg)
      : null;

    const responsePayload = {
      success: true,
      dishName: analysisData.dishName || 'Unknown Dish',
      category: analysisData.category || 'Food Waste',
      estimatedWeight: analysisData.estimatedWeight || '0.5 kg',
      confidence: analysisData.confidence || 80,
      weightKg: resolvedWeightKg ?? undefined,
      recipeIngredients: recipeIngredients || undefined,
      co2Kg: co2Result?.co2Kg ?? undefined,
      co2ePerKg: co2Result?.co2ePerKg ?? undefined,
      co2Matches: co2Result?.matches ?? undefined,
    };

    const uploadResult = await uploadIfConfigured(parsedImage.buffer, parsedImage.contentType);

    await storeCapture({
      source,
      station,
      analysis: responsePayload,
      fallback: false,
      storage: uploadResult,
    });

    return NextResponse.json(responsePayload);
    
  } catch (error: any) {
    console.error('❌ Waste analysis error:', error);
    
    if (error.message?.includes('429') || error.message?.toLowerCase().includes('quota')) {
      return NextResponse.json({
        success: false,
        error: 'Gemini API quota exceeded. Please try again later.',
      }, { status: 429 });
    }

    const fallback = buildFallbackResponse();

    if (parsedImage) {
      const uploadResult = await uploadIfConfigured(parsedImage.buffer, parsedImage.contentType);
      await storeCapture({
        source,
        station,
        analysis: fallback,
        fallback: true,
        storage: uploadResult,
      });
    }

    return NextResponse.json({
      success: true,
      ...fallback,
    });
  }
}

