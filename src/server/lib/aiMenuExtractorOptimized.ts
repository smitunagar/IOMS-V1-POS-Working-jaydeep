import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Optimized AI Menu Extractor with Rate Limiting and Batching
 * Handles quota exceeded errors gracefully
 */
export class OptimizedAIExtractor {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private rateLimitDelay = 60000; // 1 minute delay for rate limits
  private maxRetries = 2; // Reduced retries to save quota
  
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
    }
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const modelName = process.env.AI_MODEL || 'gemini-2.5-flash';
    this.model = this.genAI.getGenerativeModel({ 
      model: modelName,
      generationConfig: {
        maxOutputTokens: 2048, // Limit output to save quota
        temperature: 0.1, // Low temperature for consistent output
      }
    });
  }

  /**
   * Extract menu items with quota-aware processing
   */
  async extractMenuFromPDF(buffer: Buffer): Promise<{ items: any[], tier: string, warning?: string }> {
    console.log('🤖 Starting optimized AI extraction...');
    
    try {
      // Check buffer size - if too large, process in chunks
      const bufferSizeMB = buffer.length / (1024 * 1024);
      console.log(`📁 PDF size: ${bufferSizeMB.toFixed(2)} MB`);
      console.log(`📁 Buffer length: ${buffer.length} bytes`);
      console.log(`📁 Actual file size: ${(buffer.length * 3 / 4 / 1024 / 1024).toFixed(2)} MB (from base64)`);
      
      if (bufferSizeMB > 10) {
        return {
          items: [],
          tier: 'PDF_TOO_LARGE',
          warning: '📄 PDF too large for AI processing. Please use a smaller file or try manual entry.'
        };
      }

      const base64Data = buffer.toString('base64');
      
      // Use a more concise prompt to save tokens
      const prompt = `Extract menu items from this PDF as JSON array. Format:
[{"name":"Item Name","price":12.99,"category":"Main Course","image":"","ingredients":["ing1","ing2"]}]

Categories: Appetizers, Main Course, Pizza, Pasta, Salads, Soups, Desserts, Beverages, Other
Return only valid JSON array, no explanations. Max 30 items.`;

      // Single optimized API call with timeout
      const result = await this.makeAIRequest(base64Data, prompt);
      
      if (result.success) {
        const validatedItems = this.validateAndCleanItems(result.data || []);
        console.log(`✅ AI extraction successful: ${validatedItems.length} items`);
        
        return {
          items: validatedItems,
          tier: 'AI_SUCCESS'
        };
      } else {
        return {
          items: [],
          tier: result.tier,
          warning: result.warning
        };
      }
      
    } catch (error: any) {
      console.error('❌ AI extraction error:', error.message);
      return {
        items: [],
        tier: 'AI_ERROR',
        warning: `AI extraction failed: ${error.message}`
      };
    }
  }

  /**
   * Make AI request with retry logic and rate limit handling
   */
  private async makeAIRequest(base64Data: string, prompt: string): Promise<{
    success: boolean;
    data?: any[];
    tier: string;
    warning?: string;
  }> {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`🔄 AI attempt ${attempt}/${this.maxRetries}`);
        
        // Create timeout promise
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('REQUEST_TIMEOUT')), 25000)
        );
        
        // Make API request
        const apiPromise = this.model.generateContent([
          {
            inlineData: {
              data: base64Data,
              mimeType: 'application/pdf'
            }
          },
          { text: prompt }
        ]);

        const result = await Promise.race([apiPromise, timeoutPromise]);
        const text = result.response?.text();
        
        if (!text) {
          throw new Error('Empty response from AI');
        }

        // Parse response
        const parsedData = this.parseAIResponse(text);
        
        if (parsedData.length === 0) {
          throw new Error('No valid items extracted');
        }

        return {
          success: true,
          data: parsedData,
          tier: 'AI_SUCCESS'
        };

      } catch (error: any) {
        const errorMsg = error?.message || String(error);
        console.log(`❌ Attempt ${attempt} failed:`, errorMsg.substring(0, 100));
        
        // Check for quota exceeded
        if (this.isQuotaError(errorMsg)) {
          console.log('⚠️ Quota exceeded detected');
          
          if (attempt === this.maxRetries) {
            return {
              success: false,
              tier: 'AI_QUOTA_EXCEEDED',
              warning: '🚨 AI Quota Exceeded: Your Gemini AI daily/minute quota is exhausted. Please wait or upgrade your plan. Using fallback extraction.'
            };
          }
          
          // Wait before retry for quota errors
          console.log(`⏳ Waiting ${this.rateLimitDelay/1000}s for quota reset...`);
          await this.delay(this.rateLimitDelay);
          continue;
        }
        
        // Check for timeout
        if (errorMsg.includes('REQUEST_TIMEOUT')) {
          if (attempt === this.maxRetries) {
            return {
              success: false,
              tier: 'AI_TIMEOUT',
              warning: '⏱️ AI request timed out. The PDF might be too complex. Try manual entry.'
            };
          }
          continue;
        }
        
        // For other errors, don't retry immediately
        if (attempt === this.maxRetries) {
          return {
            success: false,
            tier: 'AI_FAILED',
            warning: `⚠️ AI extraction failed: ${errorMsg.substring(0, 100)}`
          };
        }
        
        // Short delay before retry for other errors
        await this.delay(2000);
      }
    }

    return {
      success: false,
      tier: 'AI_FAILED',
      warning: 'All AI extraction attempts failed'
    };
  }

  /**
   * Check if error is quota-related
   */
  private isQuotaError(errorMsg: string): boolean {
    const quotaKeywords = [
      '429',
      'Too Many Requests',
      'quota',
      'RATE_LIMIT_EXCEEDED',
      'quota_limit_value":"0"',
      'GenerateContent request limit'
    ];
    
    return quotaKeywords.some(keyword => errorMsg.includes(keyword));
  }

  /**
   * Parse AI response with multiple fallback methods
   */
  private parseAIResponse(text: string): any[] {
    let cleanedText = text.trim();
    
    // Remove code blocks
    cleanedText = cleanedText
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .replace(/^json\s*/i, '')
      .trim();

    // Extract JSON array
    const jsonMatch = cleanedText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      cleanedText = jsonMatch[0];
    }

    try {
      // First try: direct parse
      const parsed = JSON.parse(cleanedText);
      return Array.isArray(parsed) ? parsed : [];
      
    } catch (error) {
      console.log('🔧 JSON parse failed, trying repair...');
      
      try {
        // Second try: basic repair
        const repaired = cleanedText
          .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
          .replace(/([^\\])"/g, '$1"') // Fix quotes
          .replace(/\n/g, ' ') // Remove newlines
          .replace(/\s+/g, ' '); // Normalize spaces
          
        const parsed = JSON.parse(repaired);
        return Array.isArray(parsed) ? parsed : [];
        
      } catch (error2) {
        console.log('❌ All JSON parsing attempts failed');
        return [];
      }
    }
  }

  /**
   * Validate and clean extracted items
   */
  private validateAndCleanItems(items: any[]): any[] {
    if (!Array.isArray(items)) {
      return [];
    }

    return items
      .filter(item => item && typeof item === 'object')
      .map((item, index) => {
        // Clean and validate fields
        const name = String(item.name || '').trim();
        const priceStr = String(item.price || '0');
        const price = parseFloat(priceStr.replace(/[^\d.]/g, '')) || 0;
        const category = String(item.category || 'Other').trim();
        
        // Validate ingredients
        let ingredients = [];
        if (Array.isArray(item.ingredients)) {
          ingredients = item.ingredients
            .map((ing: string) => String(ing).trim())
            .filter((ing: string) => ing.length > 0);
        }
        
        // Basic validation
        if (name.length < 2 || name.length > 100 || price <= 0) {
          return null;
        }

        return {
          id: `ai-optimized-${Date.now()}-${index}`,
          name: name,
          price: price,
          category: category,
          image: '',
          ingredients: ingredients.length > 0 ? ingredients : ['water', 'salt']
        };
      })
      .filter(item => item !== null);
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export convenience function for backward compatibility
export async function extractMenuFromPDF(
  buffer: Buffer,
  fileName: string = 'menu.pdf'
): Promise<{ items: any[], tier: string, warning?: string }> {
  const extractor = new OptimizedAIExtractor();
  return await extractor.extractMenuFromPDF(buffer);
}
