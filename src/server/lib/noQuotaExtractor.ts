/**
 * Custom PDF text extraction to avoid pdf-parse library debug mode bug
 */
async function extractTextFromPDFBuffer(buffer: Buffer): Promise<string> {
  try {
    // Convert buffer to string and extract text using regex patterns
    const pdfString = buffer.toString('binary');
    
    // Look for text content between BT (Begin Text) and ET (End Text) markers
    const textMatches = pdfString.match(/BT\s*([\s\S]*?)ET/g);
    
    if (!textMatches || textMatches.length === 0) {
      // Fallback: try to extract any readable text
      const readableText = pdfString
        .replace(/[^\x20-\x7E\n\r]/g, '') // Remove non-printable characters
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
      
      return readableText;
    }
    
    // Extract text from each text block
    let extractedText = '';
    for (const match of textMatches) {
      const textBlock = match.replace(/BT\s*/, '').replace(/\s*ET/, '');
      
      // Look for text content in the block
      const textContent = textBlock
        .replace(/[^\x20-\x7E\n\r]/g, '') // Remove non-printable characters
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
      
      if (textContent.length > 0) {
        extractedText += textContent + '\n';
      }
    }
    
    return extractedText.trim();
  } catch (error) {
    console.error('❌ Custom PDF text extraction error:', error);
    return '';
  }
}

/**
 * Advanced PDF Text Extraction without AI
 * This bypasses all quota issues and works immediately
 */
export class NoQuotaPDFExtractor {
  
  /**
   * Extract menu items using only PDF parsing and regex patterns
   */
  async extractMenuFromPDF(buffer: Buffer): Promise<{ items: any[], tier: string, warning?: string }> {
    console.log('🔧 Using NO-QUOTA extraction method...');
    
    try {
      // Extract text from PDF using custom method to avoid pdf-parse debug mode bug
      const text = await extractTextFromPDFBuffer(buffer);
      
      if (!text || text.trim().length < 10) {
        return {
          items: [],
          tier: 'PDF_NO_TEXT',
          warning: '📄 Could not extract text from PDF. Please try manual entry.'
        };
      }

      console.log(`📝 Extracted ${text.length} characters from PDF`);
      
      // Use advanced pattern matching
      const extractedItems = this.extractMenuItemsFromText(text);
      
      console.log(`✅ Found ${extractedItems.length} menu items without AI`);
      
      return {
        items: extractedItems,
        tier: 'ADVANCED_PARSE',
        warning: extractedItems.length === 0 ? 
          '⚠️ No menu items detected. Try manual entry for best results.' : 
          undefined
      };
      
    } catch (error: any) {
      console.error('❌ PDF parsing error:', error.message);
      return {
        items: [],
        tier: 'PARSE_ERROR',
        warning: `PDF parsing failed: ${error.message}`
      };
    }
  }

  /**
   * Advanced text pattern matching for menu items
   */
  private extractMenuItemsFromText(text: string): any[] {
    const items: any[] = [];
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 2);
    
    // Advanced regex patterns for different menu formats
    const patterns = [
      // Pattern 1: "Pizza Margherita €12.50" or "Pizza Margherita $12.50"
      {
        regex: /^(.+?)\s*[€$£₹]\s*(\d+(?:[,\.]\d{1,2})?)/,
        nameGroup: 1,
        priceGroup: 2
      },
      // Pattern 2: "12.50 Pizza Margherita" (price first)
      {
        regex: /^[€$£₹]?\s*(\d+(?:[,\.]\d{1,2})?)\s+(.+)/,
        nameGroup: 2,
        priceGroup: 1
      },
      // Pattern 3: "Pizza Margherita ... 12.50"
      {
        regex: /^(.+?)[\s\.]{3,}[€$£₹]?\s*(\d+(?:[,\.]\d{1,2})?)/,
        nameGroup: 1,
        priceGroup: 2
      },
      // Pattern 4: "1. Pizza Margherita 12.50€"
      {
        regex: /^\d+\.\s*(.+?)\s*(\d+(?:[,\.]\d{1,2})?)\s*[€$£₹]?/,
        nameGroup: 1,
        priceGroup: 2
      },
      // Pattern 5: "Pizza Margherita - 12,50 EUR"
      {
        regex: /^(.+?)\s*[-–—]\s*(\d+(?:[,\.]\d{1,2})?)\s*(?:EUR|USD|GBP|€|$|£)?/,
        nameGroup: 1,
        priceGroup: 2
      }
    ];

    // Category detection
    let currentCategory = 'Menu Items';
    const categoryKeywords = {
      'Pizza': /pizza|pizzas/i,
      'Pasta': /pasta|spaghetti|linguine|penne|fettuccine/i,
      'Appetizers': /appetizer|starter|vorspeise|antipasti|entrée/i,
      'Main Course': /main|hauptgericht|plat principal|secondi/i,
      'Salads': /salad|salat|insalata/i,
      'Soups': /soup|suppe|zuppa/i,
      'Desserts': /dessert|dolci|nachspeise|sweet/i,
      'Beverages': /drink|beverage|getränke|boisson|bibite/i,
      'Beer': /beer|bier|birra/i,
      'Wine': /wine|wein|vino/i,
      'Coffee': /coffee|kaffee|caffè/i
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip very short lines
      if (line.length < 3) continue;
      
      // Check if this line is a category header
      let foundCategory = false;
      for (const [category, pattern] of Object.entries(categoryKeywords)) {
        if (pattern.test(line) && !patterns.some(p => p.regex.test(line))) {
          currentCategory = category;
          foundCategory = true;
          console.log(`📂 Found category: ${category}`);
          break;
        }
      }
      
      if (foundCategory) continue;
      
      // Try to extract menu item using patterns
      for (const pattern of patterns) {
        const match = line.match(pattern.regex);
        if (match) {
          let name = match[pattern.nameGroup]?.trim() || '';
          let priceStr = match[pattern.priceGroup]?.trim() || '';
          
          // Clean the name
          name = name
            .replace(/^\d+\.\s*/, '') // Remove leading numbers
            .replace(/[\.\s]+$/, '') // Remove trailing dots/spaces
            .replace(/\s{2,}/g, ' ') // Normalize spaces
            .replace(/[€$£₹]\s*\d+.*$/, '') // Remove any price that got captured in name
            .trim();
          
          // Clean the price
          const price = parseFloat(priceStr.replace(',', '.'));
          
          // Validation
          if (name.length >= 3 && 
              name.length <= 100 && 
              /[a-zA-Z]/.test(name) && 
              price > 0 && 
              price < 1000) {
            
            // Avoid duplicates
            const isDuplicate = items.some(item => 
              item.name.toLowerCase() === name.toLowerCase() && 
              Math.abs(item.price - price) < 0.01
            );
            
            if (!isDuplicate) {
              items.push({
                id: `noquota-${Date.now()}-${items.length}`,
                name: name,
                price: price,
                category: currentCategory,
                image: '',
                ingredients: this.generateBasicIngredients(name, currentCategory),
                extractionMethod: 'advanced-regex'
              });
              
              console.log(`✅ Extracted: ${name} - ${price} (${currentCategory})`);
            }
            break;
          }
        }
      }
    }
    
    return items;
  }

  /**
   * Generate basic ingredients based on dish name and category
   */
  private generateBasicIngredients(name: string, category: string): string[] {
    const lowerName = name.toLowerCase();
    const ingredients: string[] = [];
    
    // Basic ingredient mapping
    const ingredientMap = {
      'pizza': ['flour', 'tomato sauce', 'mozzarella', 'olive oil'],
      'pasta': ['pasta', 'olive oil', 'garlic'],
      'salad': ['lettuce', 'tomato', 'cucumber', 'olive oil'],
      'soup': ['broth', 'vegetables', 'herbs'],
      'coffee': ['coffee beans', 'water'],
      'beer': ['hops', 'malt', 'water'],
      'wine': ['grapes']
    };
    
    // Check category first
    const categoryKey = category.toLowerCase();
    if (categoryKey.includes('pizza')) {
      ingredients.push(...ingredientMap.pizza);
    } else if (categoryKey.includes('pasta')) {
      ingredients.push(...ingredientMap.pasta);
    } else if (categoryKey.includes('salad')) {
      ingredients.push(...ingredientMap.salad);
    } else if (categoryKey.includes('soup')) {
      ingredients.push(...ingredientMap.soup);
    } else if (categoryKey.includes('coffee')) {
      ingredients.push(...ingredientMap.coffee);
    } else if (categoryKey.includes('beer')) {
      ingredients.push(...ingredientMap.beer);
    } else if (categoryKey.includes('wine')) {
      ingredients.push(...ingredientMap.wine);
    }
    
    // Check name for specific ingredients
    if (lowerName.includes('margherita')) {
      ingredients.push('basil', 'mozzarella', 'tomato');
    } else if (lowerName.includes('pepperoni')) {
      ingredients.push('pepperoni', 'cheese');
    } else if (lowerName.includes('chicken')) {
      ingredients.push('chicken');
    } else if (lowerName.includes('beef')) {
      ingredients.push('beef');
    } else if (lowerName.includes('fish')) {
      ingredients.push('fish');
    } else if (lowerName.includes('vegetarian')) {
      ingredients.push('vegetables');
    }
    
    // Default fallback
    if (ingredients.length === 0) {
      ingredients.push('water', 'salt');
    }
    
    return [...new Set(ingredients)]; // Remove duplicates
  }
}

// Export for backward compatibility
export async function extractMenuWithoutQuota(buffer: Buffer): Promise<{ items: any[], tier: string, warning?: string }> {
  const extractor = new NoQuotaPDFExtractor();
  return await extractor.extractMenuFromPDF(buffer);
}
