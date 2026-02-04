import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'nodejs';

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  description?: string;
  extractionMethod: string;
}

export async function POST(request: NextRequest) {
  try {
    console.log('==> /api/uploadInventory POST received');
    
    const body = await request.json();
    const { file, userId, type } = body;
    
    console.log('Upload type:', type);
    console.log('User ID:', userId);
    
    if (!file || typeof file !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'No file provided'
      }, { status: 400 });
    }

    if (type === 'pdf') {
      return await handlePDFExtraction(file, userId);
    } else {
      return NextResponse.json({
        success: false,
        error: 'Only PDF extraction is supported for now'
      }, { status: 400 });
    }
    
  } catch (error: any) {
    console.error('Inventory upload error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Upload failed'
    }, { status: 500 });
  }
}

async function handlePDFExtraction(file: string, userId: string) {
  try {
    console.log('🤖 Starting PDF inventory extraction...');
    
    // Parse the data URL and extract base64 content
    const base64Data = file.includes(',') ? file.split(',')[1] : file;
    const pdfBuffer = Buffer.from(base64Data, 'base64');
    
    console.log('📊 PDF buffer size:', pdfBuffer.length, 'bytes');
    
    // Initialize Gemini
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error('Gemini API key not found');
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const modelName = process.env.AI_MODEL || 'gemini-2.5-flash';
    const model = genAI.getGenerativeModel({ 
      model: modelName,
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
      }
    });
    
    console.log('🤖 Using model:', modelName);
    
    // Create prompt for inventory extraction
    const prompt = createInventoryExtractionPrompt();
    
    console.log('🚀 Sending request to Gemini...');
    
    // Generate content using Gemini with PDF
    const result = await model.generateContent([
      {
        text: prompt
      },
      {
        inlineData: {
          mimeType: 'application/pdf',
          data: base64Data
        }
      }
    ]);

    const response = await result.response;
    const text = response.text();
    
    console.log('📄 Gemini response received');
    console.log('📊 Response length:', text.length, 'characters');
    
    // Parse the JSON response from Gemini
    const extractedData = parseInventoryResponse(text);
    
    console.log(`✅ Inventory extraction successful: ${extractedData.items.length} items found`);
    
    return NextResponse.json({
      success: true,
      count: extractedData.items.length,
      items: extractedData.items,
      message: `Successfully extracted ${extractedData.items.length} inventory items`
    });
    
  } catch (error: any) {
    console.error('❌ PDF inventory extraction error:', error);
    
    if (error.message?.includes('429') || error.message?.toLowerCase().includes('quota')) {
      return NextResponse.json({
        success: false,
        error: 'Gemini API quota exceeded. Please try again later.',
        quotaStatus: 'EXCEEDED'
      }, { status: 429 });
    }
    
    return NextResponse.json({
      success: false,
      error: `PDF extraction failed: ${error.message || 'Unknown error'}`,
      quotaStatus: 'ERROR'
    }, { status: 500 });
  }
}

function createInventoryExtractionPrompt(): string {
  return `
You are an inventory management expert. Analyze the provided PDF and extract all inventory items in the following JSON format:

{
  "items": [
    {
      "name": "Item Name",
      "quantity": 10.5,
      "unit": "kg",
      "category": "Meat & Poultry",
      "description": "Brief description if available"
    }
  ]
}

EXTRACTION RULES:
1. Extract ALL inventory items with quantities
2. Identify appropriate categories for each item
3. Use realistic quantities and units
4. Clean item names (remove numbers, extra spaces, special characters)
5. If no quantity is visible, use 0
6. If no category is clear, use "Other"

CATEGORY DETECTION:
- Meat & Poultry: Chicken, beef, pork, lamb, turkey, etc.
- Seafood: Fish, shrimp, crab, lobster, etc.
- Vegetables: Onions, tomatoes, carrots, lettuce, etc.
- Fruits: Apples, bananas, oranges, berries, etc.
- Dairy & Eggs: Milk, cheese, yogurt, eggs, butter, etc.
- Grains & Rice: Rice, pasta, bread, flour, etc.
- Spices & Seasonings: Salt, pepper, herbs, spices, etc.
- Oils & Fats: Olive oil, vegetable oil, butter, etc.
- Beverages: Water, juice, soda, coffee, tea, etc.
- Frozen Foods: Frozen vegetables, ice cream, etc.
- Canned Goods: Canned tomatoes, beans, etc.
- Bakery: Bread, pastries, cakes, etc.

UNIT GUIDELINES:
- Use appropriate units for each item type:
  - MEAT/POULTRY: kg or g
  - VEGETABLES/FRUITS: kg, g, or pieces
  - LIQUIDS: l or ml
  - SPICES: g, tbsp, or tsp
  - DAIRY: kg, g, l, or ml
  - GRAINS: kg or g
  - FROZEN/CANNED: boxes, bags, pieces

Return ONLY the JSON response, no additional text or formatting.
`;
}

function parseInventoryResponse(responseText: string): { items: InventoryItem[] } {
  try {
    console.log('🔍 Parsing inventory response...');
    
    // Clean the response text
    let cleanText = responseText.trim();
    cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // Try to find JSON object in the response
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    
    const jsonData = JSON.parse(jsonMatch[0]);
    
    if (!jsonData.items || !Array.isArray(jsonData.items)) {
      throw new Error('Invalid JSON structure - missing items array');
    }
    
    console.log(`📋 Found ${jsonData.items.length} items in response`);
    
    // Convert to InventoryItem format
    const items: InventoryItem[] = jsonData.items.map((item: any, index: number) => {
      console.log(`📝 Processing item ${index + 1}:`, item);
      
      return {
        id: `pdf-${Date.now()}-${index}`,
        name: cleanItemName(item.name || ''),
        quantity: parseFloat(item.quantity) || 0,
        unit: item.unit || 'kg',
        category: item.category || 'Other',
        description: item.description || '',
        extractionMethod: 'pdf-extraction'
      };
    });
    
    console.log(`✅ Successfully parsed ${items.length} inventory items`);
    return { items };
    
  } catch (error) {
    console.error('❌ Error parsing inventory response:', error);
    console.log('📄 Raw response text:', responseText);
    return { items: [] };
  }
}

function cleanItemName(name: string): string {
  return name
    .replace(/[^\w\s-]/g, '') // Remove special characters except hyphens
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}
