/**
 * Temporary PDF bypass - until we fix the pdf-parse issue
 * This will work with text input and manual entry
 */
export class BypassPDFExtractor {
  
  /**
   * Extract menu items from text (bypass PDF parsing for now)
   */
  async extractMenuFromPDF(buffer: Buffer): Promise<{ items: any[], tier: string, warning?: string }> {
    console.log('🔧 Using BYPASS extraction method (no PDF parsing)...');
    
    try {
      // For now, we'll convert buffer to string and see if it contains readable text
      const bufferString = buffer.toString('utf-8');
      
      // Enhanced PDF detection - let PDFs continue to proper parsers
      const isPDFBinary = this.isDefinitelyPDF(bufferString);
      
      if (isPDFBinary) {
        console.log('� PDF file detected - continuing to AI/PDF parsers...');
        return {
          items: [],
          tier: 'PDF_DETECTED_CONTINUE',
          warning: 'PDF detected - will try AI and PDF parsers'
        };
      }
      
      // Check if this looks like actual menu text
      const hasMenuKeywords = this.hasMenuKeywords(bufferString);
      const hasPrices = this.hasPrices(bufferString);
      
      console.log(`📊 Text analysis: hasMenuKeywords=${hasMenuKeywords}, hasPrices=${hasPrices}, isPDFBinary=${isPDFBinary}`);
      
      if (hasMenuKeywords || hasPrices) {
        console.log('📝 Found readable menu text in buffer');
        const extractedItems = this.extractMenuItemsFromText(bufferString);
        
        return {
          items: extractedItems,
          tier: 'BYPASS_SUCCESS',
          warning: extractedItems.length === 0 ? 
            '⚠️ No menu items detected in text. Please use manual entry.' : 
            undefined
        };
      } else {
        // Unknown format
        return {
          items: [],
          tier: 'UNKNOWN_FORMAT',
          warning: '❓ Could not detect menu format. Please use the text input option or manual entry.'
        };
      }
      
    } catch (error: any) {
      console.error('❌ Bypass extraction error:', error.message);
      return {
        items: [],
        tier: 'BYPASS_ERROR',
        warning: `Extraction failed: ${error.message}. Please use manual entry.`
      };
    }
  }

  /**
   * Enhanced PDF detection to avoid processing PDF binary content
   */
  private isDefinitelyPDF(text: string): boolean {
    // Check for PDF headers and content
    if (text.startsWith('%PDF-')) {
      return true;
    }
    
    // Strong PDF indicators
    const pdfIndicators = [
      'obj', 'endobj', 'stream', 'endstream', 'xref', '%%EOF',
      '/Type /Catalog', '/Type /Page', '/Filter', '/Length',
      '0 obj', 'startxref'
    ];
    
    let pdfIndicatorCount = 0;
    for (const indicator of pdfIndicators) {
      if (text.includes(indicator)) {
        pdfIndicatorCount++;
      }
    }
    
    // If we find multiple PDF indicators, it's definitely a PDF
    if (pdfIndicatorCount >= 2) {
      return true;
    }
    
    // Check for binary content patterns
    const binaryPatterns = [
      /\\u00[0-9a-fA-F]{2}/g,  // Unicode escape sequences
      /[\x00-\x08\x0B\x0C\x0E-\x1F]/g,  // Control characters
      /^\d+\s+0\s+obj/m,  // PDF object patterns
      /<</g,  // PDF dictionary markers
    ];
    
    for (const pattern of binaryPatterns) {
      if (pattern.test(text)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Check for menu-related keywords
   */
  private hasMenuKeywords(text: string): boolean {
    const menuKeywords = [
      'appetizer', 'starter', 'main', 'course', 'dessert', 'drink', 'beverage',
      'chicken', 'beef', 'pork', 'fish', 'salmon', 'pizza', 'pasta', 'burger',
      'salad', 'soup', 'sandwich', 'wrap', 'rice', 'noodles', 'curry',
      'menu', 'special', 'today', 'fresh', 'grilled', 'fried', 'baked',
      'breakfast', 'lunch', 'dinner', 'coffee', 'tea', 'wine', 'beer',
      'restaurant', 'food', 'dish', 'meal'
    ];
    
    const lowerText = text.toLowerCase();
    return menuKeywords.some(keyword => lowerText.includes(keyword));
  }

  /**
   * Check for price patterns
   */
  private hasPrices(text: string): boolean {
    const pricePatterns = [
      /[€$£₹]\s*\d+/g,
      /\d+[,\.]\d{2}\s*[€$£₹]/g,
      /\d+\.\d{2}/g,
      /\d+,\d{2}/g
    ];
    
    return pricePatterns.some(pattern => pattern.test(text));
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
                id: `bypass-${Date.now()}-${items.length}`,
                name: name,
                price: price,
                category: currentCategory,
                image: '',
                ingredients: this.generateBasicIngredients(name, currentCategory),
                extractionMethod: 'bypass-regex'
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
export async function extractMenuBypass(buffer: Buffer): Promise<{ items: any[], tier: string, warning?: string }> {
  const extractor = new BypassPDFExtractor();
  return await extractor.extractMenuFromPDF(buffer);
}
