// ImprovedDataExtractor - AI-based implementation with rate limiting
import { ai } from '@/ai/genkit';

export default class ImprovedDataExtractor {
  static extract(data: any) {
    // Placeholder: Add real extraction logic here
    return { extracted: true, data };
  }

  static async extractMenuItemsFromText(text: string): Promise<any[]> {
    // Use Gemini/Genkit to extract menu items from text with retry logic
    const prompt = `Extract all menu items from the following restaurant menu text. For each item, return an object with fields: name, price, category, description, ingredients (array), preparation_time, is_vegetarian, is_vegan, is_gluten_free. Return only a valid JSON array without any markdown formatting.

Menu Text:
${text}`;

    let retries = 3;
    let delay = 1000; // Start with 1 second delay

    while (retries > 0) {
      try {
        console.log(`🤖 Attempting AI extraction (${4 - retries}/3)...`);
        
        const result = await ai.generate([{ text: prompt }]);
        
        if (result && typeof result.text === 'string') {
          let cleanText = result.text.trim();
          
          // Remove markdown code blocks if present
          cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
          
          try {
            const items = JSON.parse(cleanText);
            
            // Validate and clean the items
            const validItems = Array.isArray(items) ? items.map(item => ({
              name: item.name || 'Unknown Item',
              price: parseFloat(item.price) || 0,
              category: item.category || 'Uncategorized',
              description: item.description || '',
              ingredients: Array.isArray(item.ingredients) ? item.ingredients : [],
              preparation_time: parseInt(item.preparation_time) || 15,
              is_vegetarian: Boolean(item.is_vegetarian),
              is_vegan: Boolean(item.is_vegan),
              is_gluten_free: Boolean(item.is_gluten_free)
            })) : [];
            
            console.log(`✅ Successfully extracted ${validItems.length} menu items`);
            return validItems;
            
          } catch (parseError) {
            console.error('❌ JSON parsing failed:', parseError);
            console.log('Raw AI response:', result.text);
            throw new Error('Failed to parse AI response as JSON');
          }
        }
        
        throw new Error('Empty response from AI');
        
      } catch (error) {
        console.error(`❌ AI extraction attempt failed:`, error);
        
        // Check if it's a rate limit error
        if (error instanceof Error && error.message.includes('429')) {
          console.log(`⏳ Rate limit hit, waiting ${delay}ms before retry...`);
          retries--;
          
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2; // Exponential backoff
            continue;
          }
        }
        
        retries--;
        if (retries === 0) {
          console.error('❌ All retry attempts failed');
          return [];
        }
        
        // Wait before retry for other errors
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 1.5;
      }
    }
    
    return [];
  }
} 