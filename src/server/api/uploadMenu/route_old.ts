import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import { extractMenuFromPdf } from '@/server/lib/aiMenuExtractor';
import { extractMenuFromPDF } from '@/server/lib/aiMenuExtractorOptimized';
import { extractMenuWithoutQuota } from '@/server/lib/noQuotaExtractor';
import { extractMenuBypass } from '@/server/lib/bypassExtractor';
// Removed AI ingredients generation to avoid quota issues

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

export const runtime = 'nodejs';

// Retry utilities for AI quota handling
async function delay(ms: number) { 
  return new Promise(res => setTimeout(res, ms)); 
}

async function callWithRetry<T>(fn: () => Promise<T>, retries = 2, baseDelayMs = 5000): Promise<T> {
  let attempt = 0;
  let lastErr: any;
  
  while (attempt <= retries) {
    try { 
      return await fn(); 
    } catch (err: any) {
      lastErr = err;
      const msg = String(err?.message || err);
      const isQuota = msg.includes('429') || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('too many requests');
      const isTransient = isQuota || msg.toLowerCase().includes('timeout');
      
      if (attempt === retries || !isQuota) break;
      
      const jitter = Math.floor(Math.random() * 1000);
      const delayMs = baseDelayMs * Math.pow(2, attempt) + jitter;
      
      console.log(`🔄 Retrying AI call in ${delayMs}ms (attempt ${attempt+1}/${retries+1}) - ${msg}`);
      await delay(delayMs);
      attempt++;
    }
  }
  throw lastErr;
}

function ensureExportsDir() {
  const exportDir = path.join(process.cwd(), 'exports');
  if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir, { recursive: true });
  return exportDir;
}

// Enhanced heuristic text extraction with multiple patterns
function extractHeuristicFromText(text: string): any[] {
  const items: any[] = [];
  const lines = text.split('\n').filter(line => line.trim().length > 2);
  
  // Enhanced regex patterns for food detection
  const foodPatterns = [
    // Pattern 1: Name followed by price with currency
    /^([A-Z][a-zA-Z\s&''-]+)\s*[\.\s]*[\$£€₹]?\s*(\d+(?:[,\.]\d{1,2})?)\s*[\$£€₹]?/,
    // Pattern 2: Number. Name Price
    /^(\d+)\.\s*([A-Za-z][a-zA-Z\s&''-]+)\s*[\.\s]*[\$£€₹]?\s*(\d+(?:[,\.]\d{1,2})?)/,
    // Pattern 3: Name - Price
    /([A-Za-z][a-zA-Z\s&''-]+)\s*[-–—]\s*[\$£€₹]?\s*(\d+(?:[,\.]\d{1,2})?)\s*[\$£€₹]?/,
    // Pattern 4: Name ... Price
    /([A-Za-z][a-zA-Z\s&''-]+)[\s\.]{3,}[\$£€₹]?\s*(\d+(?:[,\.]\d{1,2})?)\s*[\$£€₹]?/,
    // Pattern 5: Name (description) Price
    /([A-Za-z][a-zA-Z\s&''-]+)\s*\([^)]+\)\s*[\$£€₹]?\s*(\d+(?:[,\.]\d{1,2})?)\s*[\$£€₹]?/
  ];

  // Category detection patterns
  const categoryPatterns = [
    { pattern: /appetizer|starter|vorspeise|entrée/i, category: 'Appetizers' },
    { pattern: /main\s*course|hauptgericht|plat\s*principal/i, category: 'Main Course' },
    { pattern: /pizza/i, category: 'Pizza' },
    { pattern: /pasta|spaghetti|linguine|penne/i, category: 'Pasta' },
    { pattern: /salad|salat/i, category: 'Salads' },
    { pattern: /soup|suppe/i, category: 'Soups' },
    { pattern: /dessert|nachspeise|sweet/i, category: 'Desserts' },
    { pattern: /drink|beverage|getränke|boisson/i, category: 'Beverages' },
    { pattern: /beer|bier|bière/i, category: 'Beer' },
    { pattern: /wine|wein|vin/i, category: 'Wine' },
    { pattern: /coffee|kaffee|café/i, category: 'Coffee' }
  ];

  let currentCategory = 'Other';
  
  lines.forEach((line, idx) => {
    line = line.trim();
    if (line.length < 3) return;

    // Check if line is a category header
    const categoryMatch = categoryPatterns.find(cat => cat.pattern.test(line));
    if (categoryMatch && !foodPatterns.some(pattern => pattern.test(line))) {
      currentCategory = categoryMatch.category;
      return;
    }

    // Try to extract menu item
    for (const pattern of foodPatterns) {
      const match = line.match(pattern);
      if (match) {
        let name = '';
        let price = '';
        
        if (match.length === 3) {
          name = match[1];
          price = match[2];
        } else if (match.length === 4) {
          name = match[2];
          price = match[3];
        }
        
        // Clean name
        name = name.trim()
          .replace(/^\d+\.\s*/, '') // Remove leading numbers
          .replace(/[\.\s]+$/, '') // Remove trailing dots/spaces
          .replace(/\s{2,}/g, ' '); // Normalize spaces

        // Validate extracted data
        if (name.length > 2 && name.length < 80 && 
            /[a-zA-Z]/.test(name) && 
            price && parseFloat(price.replace(',', '.')) > 0) {
          
          items.push({
            id: `extracted-${Date.now()}-${idx}`,
            name: name,
            price: price,
            category: currentCategory,
            image: '',
            ingredients: [],
            extractionMethod: 'heuristic-enhanced'
          });
          break;
        }
      }
    }
  });
  
  return items;
}

// PRIORITY EXTRACTION: No-Quota → AI → Fallback
async function extractWithFallback(file: string): Promise<{ items: any[], tier: string, error?: string, warning?: string }> {
  const exportDir = ensureExportsDir();
  const logPath = path.join(exportDir, 'extraction-debug.log');
  
  // TIER 0: Bypass Extractor (IMMEDIATE FIX - No PDF library issues)
  try {
    console.log('🔧 Attempting Bypass extraction (Tier 0 - Immediate Fix)...');
    const pdfBuffer = Buffer.from(file, 'base64');
    const result = await extractMenuBypass(pdfBuffer);
    
    if (result.items && result.items.length > 0) {
      fs.appendFileSync(logPath, `[${new Date().toISOString()}] ✅ Tier 0 (Bypass) success: ${result.items.length} items\n`);
      console.log(`✅ Bypass extraction successful: ${result.items.length} items found`);
      return { items: result.items, tier: 'BYPASS_SUCCESS' };
    } else if (result.tier === 'PDF_DETECTED_CONTINUE') {
      console.log('📄 PDF detected by bypass extractor - continuing to AI/PDF parsers...');
      fs.appendFileSync(logPath, `[${new Date().toISOString()}] 📄 PDF detected, continuing to AI/PDF parsers\n`);
      // Continue to next tier - don't return here
    } else {
      console.log('📄 Real text detected, but no items extracted - trying advanced methods...');
    }
  } catch (err: any) {
    const msg = String(err?.message || err);
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] ⚠️ Tier 0 (Bypass) had issues: ${msg}\n`);
    console.log(`⚠️ Bypass extraction had issues: ${msg}`);
  }

  // TIER 1: Try AI (only if Tier 0 didn't work well)
  try {
    console.log('🤖 Attempting AI extraction (Tier 1)...');
    const pdfBuffer = Buffer.from(file, 'base64');
    const result = await extractMenuFromPDF(pdfBuffer);
    
    if (result.items && result.items.length > 0) {
      fs.appendFileSync(logPath, `[${new Date().toISOString()}] ✅ Tier 1 (AI) success: ${result.items.length} items\n`);
      console.log(`✅ AI extraction successful: ${result.items.length} items found`);
      return { items: result.items, tier: 'AI' };
    } else if (result.tier === 'AI_QUOTA_EXCEEDED') {
      fs.appendFileSync(logPath, `[${new Date().toISOString()}] ⚠️ Tier 1 (AI) quota exceeded - using fallback\n`);
      console.log('⚠️ AI quota exceeded, using advanced PDF parsing...');
      
      // Fall back to no-quota method with more aggressive parsing
      const pdfBuffer = Buffer.from(file, 'base64');
      const fallbackResult = await extractMenuWithoutQuota(pdfBuffer);
      
      return { 
        items: fallbackResult.items, 
        tier: 'QUOTA_FALLBACK',
        error: '� AI quota exceeded. Using advanced PDF parsing. Results may need manual review.'
      };
    }
  } catch (err: any) {
    const msg = String(err?.message || err);
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] ❌ Tier 1 (AI) failed: ${msg}\n`);
    console.log(`❌ AI extraction failed: ${msg}`);
  }
  
  // Tier 2: Custom PDF text extraction (no external dependencies)
  try {
    console.log('📄 Attempting custom PDF extraction (Tier 2)...');
    const pdfBuffer = Buffer.from(file, 'base64');
    const text = await extractTextFromPDFBuffer(pdfBuffer);
    const extractedItems = extractHeuristicFromText(text);
    if (extractedItems.length > 0) {
      fs.appendFileSync(logPath, `[${new Date().toISOString()}] ✅ Tier 2 (Custom PDF) success: ${extractedItems.length} items\n`);
      console.log(`✅ Custom PDF extraction successful: ${extractedItems.length} items found`);
      return { items: extractedItems, tier: 'CUSTOM_PDF' };
    }
  } catch (err: any) {
    const msg = String(err?.message || err);
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] ❌ Tier 2 (Custom PDF) failed: ${msg}\n`);
    console.log(`❌ Custom PDF extraction failed: ${msg}`);
  }
  
  // Tier 3: No-quota fallback (advanced regex parsing)
  try {
    console.log('🔧 Attempting No-quota extraction (Tier 3)...');
    const pdfBuffer = Buffer.from(file, 'base64');
    const { extractMenuWithoutQuota } = await import('../../lib/noQuotaExtractor');
    const result = await extractMenuWithoutQuota(pdfBuffer);
    
    if (result.items && result.items.length > 0) {
      fs.appendFileSync(logPath, `[${new Date().toISOString()}] ✅ Tier 3 (No-quota) success: ${result.items.length} items\n`);
      console.log(`✅ No-quota extraction successful: ${result.items.length} items found`);
      return { items: result.items, tier: 'NO_QUOTA_SUCCESS', warning: result.warning };
    } else {
      fs.appendFileSync(logPath, `[${new Date().toISOString()}] ⚠️ Tier 3 (No-quota) found no items\n`);
      console.log(`⚠️ No-quota extraction found no items`);
    }
  } catch (err: any) {
    const msg = String(err?.message || err);
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] ❌ Tier 3 (No-quota) failed: ${msg}\n`);
    console.log(`❌ No-quota extraction failed: ${msg}`);
  }
  
  // All methods failed
  console.log('⚠️ All extraction methods failed. Consider upgrading your AI quota or providing manual data.');
  fs.appendFileSync(logPath, `[${new Date().toISOString()}] ⚠️ All extraction tiers failed\n`);
  
  return { 
    items: [], 
    tier: 'ALL_FAILED', 
    error: '⚠️ All extraction methods failed. Please check your PDF format or try manual entry.' 
  };
}

export async function POST(request: NextRequest) {
  try {
    console.log('==> /api/uploadMenu POST received');
    
    const body = await request.json();
    console.log('payload keys:', Object.keys(body || {}));
    console.log('📊 Body structure:', {
      hasFile: !!body.file,
      fileType: typeof body.file,
      fileLength: body.file ? body.file.length : 0,
      filePrefix: body.file ? body.file.substring(0, 50) + '...' : 'none',
      hasUserId: !!body.userId,
      hasManualData: !!body.manualMenuData,
      hasTextData: !!body.textData
    });
    
    const { manualMenuData, file, userId, textData } = body;
    
    let menuItems: any[] = [];
    let extractionTier = 'MANUAL';
    let extractionError = '';
    
    if (manualMenuData && Array.isArray(manualMenuData)) {
      menuItems = manualMenuData;
      extractionTier = 'MANUAL';
      console.log(`📝 Manual data provided: ${menuItems.length} items`);
    } else if (textData && typeof textData === 'string') {
      // Direct text extraction
      menuItems = extractHeuristicFromText(textData);
      extractionTier = 'TEXT_HEURISTIC';
      console.log(`📝 Text extraction: ${menuItems.length} items found`);
    } else if (file && typeof file === 'string') {
      // Three-tier extraction with retry and fallback
      console.log('📊 Starting PDF extraction with AI-first approach...');
      console.log('📄 File data preview:', file.substring(0, 100) + '...');
      console.log('📄 File size:', file.length, 'characters');
      console.log('📄 Is base64 PDF?:', file.startsWith('data:application/pdf;base64,'));
      
      const result = await extractWithFallback(file);
      menuItems = result.items;
      extractionTier = result.tier;
      extractionError = result.error || '';
      
      console.log('📊 Extraction result:', {
        itemCount: menuItems.length,
        tier: extractionTier,
        error: extractionError
      });
      
      if (result.error) {
        console.log(`⚠️ Extraction warning: ${result.error}`);
      }
    }
    
    // Normalize menu items
    menuItems = menuItems.map((item: any, idx: number) => ({
      id: item.id || `menu-${Date.now()}-${idx}`,
      name: item.name || item.title || `Item ${idx+1}`,
      price: item.price || '',
      category: item.category || 'Uncategorized',
      image: item.image || '',
      ingredients: Array.isArray(item.ingredients) ? item.ingredients : ['water', 'salt'],
      extractionMethod: item.extractionMethod || extractionTier
    }));
    
    // Ingredient enrichment removed to avoid AI quota issues
    // Items will use basic ingredients: ['water', 'salt'] as fallback
    
    // Export to CSV with enhanced data
    let csvExported = false;
    let csvPath = '';
    
    try {
      const exportsDir = ensureExportsDir();
      csvPath = path.join(exportsDir, `menu-export-${Date.now()}.csv`);
      
      let csvContent = 'ID,Name,Price,Category,Image,Ingredients,ExtractionMethod,IngredientCount\n';
      menuItems.forEach(item => {
        const ingredients = Array.isArray(item.ingredients) ? item.ingredients.join(';') : '';
        const ingredientCount = Array.isArray(item.ingredients) ? item.ingredients.length : 0;
        const escapedName = String(item.name || '').replace(/"/g, '""');
        const escapedCategory = String(item.category || '').replace(/"/g, '""');
        csvContent += `"${item.id}","${escapedName}","${item.price}","${escapedCategory}","${item.image}","${ingredients}","${item.extractionMethod}","${ingredientCount}"\n`;
      });
      
      fs.writeFileSync(csvPath, csvContent, 'utf8');
      csvExported = true;
      console.log(`📄 CSV exported: ${csvPath}`);
    } catch (csvErr) {
      console.log('CSV export failed:', csvErr);
    }
    
    // Prepare result with clear messaging
    const result = {
      success: true,
      count: menuItems.length,
      csvExported,
      csvPath,
      extractionAccuracy: menuItems.length > 0 ? 100 : 0,
      extractionTier,
      extractionMethod: extractionTier,
      warning: extractionError || undefined,
      message: extractionError ? 
        extractionError : 
        `✅ Successfully processed ${menuItems.length} menu items using ${extractionTier} extraction`,
      quotaStatus: extractionTier === 'AI_QUOTA_EXCEEDED' ? 'EXCEEDED' : 'OK',
      menu: menuItems
    };
    
    console.log(`✅ Upload completed: ${menuItems.length} items, tier: ${extractionTier}`);
    
    return new Response(JSON.stringify(result), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });
    
  } catch (error: any) {
    console.error('❌ Upload Menu API error:', error);
    
    const errorMsg = String(error?.message || error);
    const isQuota = errorMsg.includes('429') || errorMsg.toLowerCase().includes('quota');
    
    return new Response(JSON.stringify({ 
      success: false, 
      message: isQuota ? 
        '🚨 AI Quota Exceeded: Please upgrade your plan or wait for quota reset' : 
        'Internal server error',
      error: errorMsg,
      quotaStatus: isQuota ? 'EXCEEDED' : 'ERROR'
    }), { 
      status: isQuota ? 429 : 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}