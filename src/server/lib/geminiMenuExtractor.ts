import { GoogleGenerativeAI } from '@google/generative-ai';
import { recordAiUsage } from '@/server/lib/ai/usageTracker';

/**
 * Simple Gemini-based menu extraction using prompts
 * No complex multi-tier system - just direct AI extraction
 */

interface MenuItem {
  id: string;
  name: string;
  price: string;
  category: string;
  image: string;
  ingredients: Array<{
    name: string;
    quantity: string;
    unit: string;
  }>;
  extractionMethod: string;
}

interface ExtractionResult {
  items: MenuItem[];
  tier: string;
  error?: string;
  warning?: string;
}

export class GeminiMenuExtractor {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private modelName: string;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    console.log('🔑 Gemini API Key check:', apiKey ? 'Found' : 'Missing');
    
    if (!apiKey) {
      throw new Error('Gemini API key not found. Please set GEMINI_API_KEY or GOOGLE_API_KEY environment variable.');
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    const modelName = process.env.AI_MODEL || 'gemini-2.5-flash';
    this.modelName = modelName;
    this.model = this.genAI.getGenerativeModel({ 
      model: modelName,
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
      }
    });
    console.log('🤖 Gemini model initialized:', modelName);
  }

  /**
   * Extract menu items from PDF using Gemini with a structured prompt
   */
  async extractMenuFromPDF(pdfBuffer: Buffer): Promise<ExtractionResult> {
    try {
      console.log('🤖 Starting Gemini prompt-based extraction...');
      console.log('📊 PDF buffer size:', pdfBuffer.length, 'bytes');
      
      // Convert PDF buffer to base64 for Gemini
      const base64Data = pdfBuffer.toString('base64');
      console.log('📊 Base64 data length:', base64Data.length, 'characters');
      
      // Create the prompt for menu extraction
      const prompt = this.createMenuExtractionPrompt();
      console.log('📝 Prompt length:', prompt.length, 'characters');
      
      console.log('🚀 Sending request to Gemini...');
      
      // Generate content using Gemini with PDF
      const result = await this.model.generateContent([
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
      const usageMetadata = (response as any)?.usageMetadata;
      if (usageMetadata) {
        recordAiUsage({
          service: 'menu-extraction',
          model: this.modelName,
          inputTokens: usageMetadata.promptTokenCount,
          outputTokens: usageMetadata.candidatesTokenCount,
          totalTokens: usageMetadata.totalTokenCount,
          meta: { mode: 'pdf' },
        });
      }
      
      console.log('📄 Gemini response received');
      console.log('📊 Response length:', text.length, 'characters');
      console.log('📄 Raw response preview:', text.substring(0, 500) + '...');
      
      // Parse the JSON response from Gemini
      const extractedData = this.parseGeminiResponse(text);
      
      console.log(`✅ Gemini extraction successful: ${extractedData.items.length} items found`);
      if (extractedData.items.length > 0) {
        console.log('📋 Sample extracted item:', extractedData.items[0]);
      }
      
      return {
        items: extractedData.items,
        tier: 'GEMINI_PROMPT',
        warning: extractedData.items.length === 0 ? 'No menu items found in PDF' : undefined
      };
      
    } catch (error: any) {
      console.error('❌ Gemini extraction error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.status,
        statusText: error.statusText,
        code: error.code
      });

      const extractedText = this.extractTextFromPDF(pdfBuffer);
      if (extractedText) {
        try {
          console.log('🧾 Retrying Gemini extraction with extracted text fallback...');
          const fallbackPrompt = this.createMenuExtractionPrompt(extractedText);
          const fallbackResult = await this.model.generateContent([
            { text: fallbackPrompt }
          ]);
          const fallbackResponse = await fallbackResult.response;
          const fallbackText = fallbackResponse.text();
          const fallbackUsage = (fallbackResponse as any)?.usageMetadata;
          if (fallbackUsage) {
            recordAiUsage({
              service: 'menu-extraction',
              model: this.modelName,
              inputTokens: fallbackUsage.promptTokenCount,
              outputTokens: fallbackUsage.candidatesTokenCount,
              totalTokens: fallbackUsage.totalTokenCount,
              meta: { mode: 'text-fallback' },
            });
          }

          const extractedData = this.parseGeminiResponse(fallbackText);
          return {
            items: extractedData.items,
            tier: 'GEMINI_TEXT_FALLBACK',
            warning: 'Gemini PDF extraction failed; used extracted text fallback.'
          };
        } catch (fallbackError: any) {
          console.error('❌ Gemini text fallback error:', fallbackError);
        }

        const heuristicItems = this.heuristicExtractFromText(extractedText);
        if (heuristicItems.length > 0) {
          return {
            items: heuristicItems,
            tier: 'HEURISTIC_TEXT_FALLBACK',
            warning: 'Gemini extraction failed; used heuristic text fallback.'
          };
        }
      }
      
      const errorMessage = error.message || error.toString() || 'Unknown error';
      const lowerErrorMessage = errorMessage.toLowerCase();
      
      // Check if it's an API key error
      if (
        error.status === 401 ||
        error.status === 403 ||
        lowerErrorMessage.includes('api key') ||
        lowerErrorMessage.includes('invalid api key') ||
        lowerErrorMessage.includes('authentication') ||
        lowerErrorMessage.includes('unauthorized') ||
        error.code === '401' ||
        error.code === '403'
      ) {
        return {
          items: [],
          tier: 'GEMINI_API_KEY_ERROR',
          error: 'Invalid or expired Gemini API key. Please check your GEMINI_API_KEY or GOOGLE_API_KEY in .env.local file.',
          warning: 'The API key may be invalid, expired, or not properly configured.'
        };
      }
      
      // Check if it's a quota error
      if (error.status === 429 || lowerErrorMessage.includes('429') || lowerErrorMessage.includes('quota')) {
        return {
          items: [],
          tier: 'GEMINI_QUOTA_EXCEEDED',
          error: 'Gemini API quota exceeded. Please try again later.',
          warning: 'AI quota exceeded. Consider upgrading your API plan.'
        };
      }
      
      return {
        items: [],
        tier: 'GEMINI_ERROR',
        error: `Gemini extraction failed: ${errorMessage}`
      };
    }
  }

  /**
   * Extract text from PDF buffer using custom method
   */
  private extractTextFromPDF(pdfBuffer: Buffer): string {
    try {
      console.log('📄 Starting custom PDF text extraction...');
      
      // Convert buffer to string for text extraction
      const pdfString = pdfBuffer.toString('binary');
      
      // Look for text content between BT (Begin Text) and ET (End Text) markers
      const textMatches = pdfString.match(/BT\s*([\s\S]*?)ET/g);
      
      if (!textMatches || textMatches.length === 0) {
        console.log('📄 No BT/ET markers found, trying alternative extraction...');
        
        // Fallback: extract readable text from the entire PDF
        const readableText = pdfString
          .replace(/[^\x20-\x7E\n\r]/g, '') // Remove non-printable characters
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim();
        
        console.log('📄 Fallback extraction result length:', readableText.length);
        return readableText;
      }
      
      let extractedText = '';
      for (const match of textMatches) {
        // Remove BT and ET markers
        const textBlock = match.replace(/BT\s*/, '').replace(/\s*ET/, '');
        
        // Clean up the text content
        const textContent = textBlock
          .replace(/[^\x20-\x7E\n\r]/g, '') // Remove non-printable characters
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim();
        
        if (textContent.length > 0) {
          extractedText += textContent + '\n';
        }
      }
      
      console.log('📄 Custom PDF extraction successful, text length:', extractedText.length);
      return extractedText.trim();
      
    } catch (error) {
      console.error('❌ Custom PDF text extraction error:', error);
      return '';
    }
  }

  /**
   * Create a structured prompt for menu extraction
   */
  private createMenuExtractionPrompt(extractedText?: string): string {
    return `
You are a menu extraction expert and professional chef. Analyze the provided PDF and extract all menu items with detailed ingredient information including realistic quantities and units.

${extractedText ? `Here is extracted menu text (use this if the PDF is not readable):\n${extractedText}\n` : ''}

Return the data in this EXACT JSON format:

{
  "items": [
    {
      "name": "Item Name",
      "price": "12.99",
      "category": "Appetizers",
      "ingredients": [
        {
          "name": "ingredient name",
          "quantity": "realistic amount",
          "unit": "appropriate unit"
        }
      ],
      "description": "Brief description if available"
    }
  ]
}

EXTRACTION RULES:
1. Extract ALL food and beverage items with prices
2. Identify categories (Appetizers, Main Course, Desserts, Beverages, etc.)
3. For each item, provide 5-8 realistic ingredients with appropriate quantities and units
4. Use the exact price format from the menu
5. Clean item names (remove numbers, extra spaces, special characters)
6. If no price is visible, use "0.00"
7. If no category is clear, use "Main Menu"
8. IMPORTANT: Predict ingredients based on typical restaurant recipes and cooking methods
9. Include both main ingredients and supporting ingredients (spices, oils, garnishes)

INGREDIENT QUANTITY GUIDELINES:
- Use realistic quantities based on typical restaurant portions
- ALWAYS use appropriate units for each ingredient type:
  - MEAT/POULTRY: kg or g (e.g., 0.2kg chicken, 150g beef)
  - VEGETABLES: kg or g (e.g., 0.1kg onions, 200g tomatoes, 0.05kg garlic)
  - GRAINS/RICE: kg or g (e.g., 0.2kg rice, 100g pasta)
  - LIQUIDS: ml or l (e.g., 50ml oil, 200ml broth, 1l water)
  - SPICES/SEASONINGS: g, tbsp, tsp (e.g., 5g salt, 2tbsp curry powder, 1tsp pepper)
  - DAIRY: g or ml (e.g., 100g cheese, 200ml milk)
  - HERBS: g or tbsp (e.g., 2g fresh herbs, 1tbsp dried herbs)
  - BREAD/DOUGH: g or kg (e.g., 150g bread, 0.3kg pizza dough)

SPECIFIC EXAMPLES:
- Chicken Biryani: 0.2kg basmati rice, 0.2kg chicken breast, 0.1kg onions, 0.05kg tomatoes, 30ml olive oil, 5g biryani spice mix, 2g salt, 10g ginger-garlic paste
- Pasta Carbonara: 0.15kg pasta, 100g bacon, 2 eggs, 50g parmesan, 30ml cream, 15ml olive oil, 2g black pepper, 1g salt
- Caesar Salad: 0.1kg lettuce, 50g croutons, 30g parmesan, 30ml caesar dressing, 10ml lemon juice, 2g black pepper, 5g anchovies
- Vegetable Soup: 200ml vegetable broth, 0.05kg carrots, 0.05kg celery, 0.05kg onions, 15ml olive oil, 5g salt, 2g pepper, 3g herbs
- Margherita Pizza: 0.2kg pizza dough, 100g mozzarella, 50ml tomato sauce, 5g fresh basil, 15ml olive oil, 2g oregano, 1g salt
- Grilled Chicken: 0.25kg chicken breast, 15ml olive oil, 5g garlic powder, 3g paprika, 2g salt, 2g black pepper, 5ml lemon juice
- Fish and Chips: 0.2kg white fish, 0.15kg potatoes, 50g flour, 100ml beer batter, 200ml frying oil, 2g salt, 1g pepper

CATEGORY DETECTION:
- Appetizers: Starters, Vorspeise, Entrée
- Main Course: Main dishes, Hauptgericht, Plats
- Pizza: Any pizza items
- Pasta: Spaghetti, Linguine, Penne, etc.
- Salads: Salad items
- Soups: Soup items
- Desserts: Sweet items, Nachspeise
- Beverages: Drinks, Getränke, Boissons
- Beer: Beer items
- Wine: Wine items
- Coffee: Coffee items

Return ONLY the JSON response, no additional text or formatting.
`;
  }

  /**
   * Parse Gemini's JSON response and convert to MenuItem format
   */
  private parseGeminiResponse(responseText: string): { items: MenuItem[] } {
    try {
      console.log('🔍 Parsing Gemini response...');
      
      // Clean the response text
      let cleanText = responseText.trim();
      console.log('📝 Cleaned text length:', cleanText.length);
      
      // Remove any markdown formatting
      cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      
      // Try multiple JSON extraction patterns
      let jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        // Try to find JSON array pattern
        jsonMatch = cleanText.match(/\[[\s\S]*\]/);
      }
      
      if (!jsonMatch) {
        console.log('❌ No JSON structure found in response');
        console.log('📄 Response text:', cleanText);
        throw new Error('No JSON found in response');
      }
      
      console.log('📋 Found JSON structure, parsing...');
      const jsonData = JSON.parse(jsonMatch[0]);
      console.log('📊 Parsed JSON keys:', Object.keys(jsonData));
      
      // Handle different response structures
      let itemsArray = [];
      if (jsonData.items && Array.isArray(jsonData.items)) {
        itemsArray = jsonData.items;
      } else if (Array.isArray(jsonData)) {
        itemsArray = jsonData;
      } else {
        console.log('❌ Invalid JSON structure - no items array found');
        console.log('📊 JSON structure:', jsonData);
        throw new Error('Invalid JSON structure - missing items array');
      }
      
      console.log(`📋 Found ${itemsArray.length} items in response`);
      
      // Convert to MenuItem format
      const items: MenuItem[] = itemsArray.map((item: any, index: number) => {
        console.log(`📝 Processing item ${index + 1}:`, item);
        
        // Handle both old format (array of strings) and new format (array of objects)
        let ingredients = [];
        if (Array.isArray(item.ingredients)) {
          ingredients = item.ingredients.map((ing: any) => {
            if (typeof ing === 'string') {
              // Old format: convert string to object
              return {
                name: ing,
                quantity: '1',
                unit: 'pieces'
              };
            } else if (ing && typeof ing === 'object' && ing.name) {
              // New format: use as is, but clean up any duplicate units
              const quantity = ing.quantity || '1';
              const unit = ing.unit || 'pieces';
              
              // Remove duplicate units (e.g., "0.2kg kg" -> "0.2kg")
              // First, extract the numeric part and unit from quantity
              const quantityMatch = quantity.match(/^([\d.]+)\s*(kg|g|ml|l|tbsp|tsp|cups|pieces|slices|cloves|bunches)?\s*(kg|g|ml|l|tbsp|tsp|cups|pieces|slices|cloves|bunches)?$/i);
              
              let cleanQuantity, cleanUnit;
              if (quantityMatch) {
                cleanQuantity = quantityMatch[1]; // Just the number
                cleanUnit = quantityMatch[2] || quantityMatch[3] || unit; // Use the unit from quantity or fallback to unit field
              } else {
                cleanQuantity = quantity;
                cleanUnit = unit;
              }
              
              return {
                name: ing.name || '',
                quantity: cleanQuantity,
                unit: cleanUnit
              };
            } else {
              // Fallback
              return {
                name: 'Unknown ingredient',
                quantity: '1',
                unit: 'pieces'
              };
            }
          });
        } else {
          // Fallback for non-array ingredients
          ingredients = [
            { name: 'water', quantity: '1', unit: 'cups' },
            { name: 'salt', quantity: '1', unit: 'tsp' }
          ];
        }
        
        return {
          id: `gemini-${Date.now()}-${index}`,
          name: this.cleanItemName(item.name || ''),
          price: this.formatPrice(item.price || '0.00'),
          category: item.category || 'Main Menu',
          image: '',
          ingredients: ingredients,
          extractionMethod: 'gemini-prompt'
        };
      });
      
      console.log(`✅ Successfully parsed ${items.length} menu items`);
      return { items };
      
    } catch (error) {
      console.error('❌ Error parsing Gemini response:', error);
      console.log('📄 Raw response text:', responseText);
      
      // Fallback: try to extract items using regex if JSON parsing fails
      console.log('🔄 Attempting fallback extraction...');
      return this.fallbackExtraction(responseText);
    }
  }

  /**
   * Heuristic extraction from plain text if AI extraction fails.
   */
  private heuristicExtractFromText(text: string): MenuItem[] {
    const items: MenuItem[] = [];
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    let currentCategory = 'Main Menu';

    lines.forEach((line, idx) => {
      if (line.length < 3 || line.length > 120) return;

      if (!/\d/.test(line) && (line === line.toUpperCase() || line.endsWith(':'))) {
        currentCategory = line.replace(/[:\.\s]+$/, '').trim();
        return;
      }

      const patterns = [
        /^(.+?)\s+(\$?\d+[.,]\d{2})\s*$/,  // Name $12.99
        /^(.+?)\s+(\d+[.,]\d{2})\s*$/,     // Name 12.99
        /^(.+?)\s+(\$\d+)\s*$/,            // Name $12
        /^(.+?)\s+(\d+)\s*$/,              // Name 12
      ];

      for (const pattern of patterns) {
        const match = line.match(pattern);
        if (match) {
          let name = match[1];
          let price = match[2];

          name = this.cleanItemName(name);

          if (name.length > 2 && name.length < 80 && /[a-zA-Z]/.test(name)) {
            items.push({
              id: `heuristic-${Date.now()}-${idx}`,
              name,
              price: this.formatPrice(price),
              category: currentCategory,
              image: '',
              ingredients: [
                { name: 'water', quantity: '1', unit: 'cups' },
                { name: 'salt', quantity: '1', unit: 'tsp' }
              ],
              extractionMethod: 'heuristic'
            });
            break;
          }
        }
      }
    });

    return items;
  }

  /**
   * Fallback extraction using regex if JSON parsing fails
   */
  private fallbackExtraction(text: string): { items: MenuItem[] } {
    console.log('🔄 Using fallback extraction...');
    
    const items: MenuItem[] = [];
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    
    lines.forEach((line, index) => {
      // Simple regex to extract name and price
      const match = line.match(/(.+?)\s*[\$£€₹]?\s*(\d+(?:[.,]\d{1,2})?)\s*[\$£€₹]?/);
      if (match) {
        const name = this.cleanItemName(match[1]);
        const price = this.formatPrice(match[2]);
        
        if (name.length > 2 && parseFloat(price) > 0) {
          items.push({
            id: `gemini-fallback-${Date.now()}-${index}`,
            name,
            price,
            category: 'Main Menu',
            image: '',
            ingredients: [
              { name: 'water', quantity: '1', unit: 'cups' },
              { name: 'salt', quantity: '1', unit: 'tsp' }
            ],
            extractionMethod: 'gemini-fallback'
          });
        }
      }
    });
    
    return { items };
  }

  /**
   * Clean item name
   */
  private cleanItemName(name: string): string {
    return name
      .trim()
      .replace(/^\d+\.\s*/, '') // Remove leading numbers
      .replace(/[\.\s]+$/, '') // Remove trailing dots/spaces
      .replace(/\s{2,}/g, ' ') // Normalize spaces
      .replace(/[^\w\s&'-]/g, '') // Remove special characters except &, ', -
      .trim();
  }

  /**
   * Format price consistently
   */
  private formatPrice(price: string): string {
    const cleanPrice = price.replace(/[^\d.,]/g, '');
    const numericPrice = parseFloat(cleanPrice.replace(',', '.'));
    return isNaN(numericPrice) ? '0.00' : numericPrice.toFixed(2);
  }
}

/**
 * Export function for easy use
 */
export async function extractMenuWithGemini(pdfBuffer: Buffer): Promise<ExtractionResult> {
  const extractor = new GeminiMenuExtractor();
  return await extractor.extractMenuFromPDF(pdfBuffer);
}
