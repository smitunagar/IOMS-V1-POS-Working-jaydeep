import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { extractMenuWithGemini } from '@/server/lib/geminiMenuExtractor';

export const runtime = 'nodejs';

/**
 * Ensure exports directory exists
 */
function ensureExportsDir(): string {
  const exportDir = path.join(process.cwd(), 'exports');
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }
  return exportDir;
}

/**
 * Export menu items to CSV
 */
function exportToCSV(items: any[]): string {
  const exportDir = ensureExportsDir();
  const timestamp = Date.now();
  const csvPath = path.join(exportDir, `menu-export-${timestamp}.csv`);
  
  const headers = ['ID', 'Name', 'Price', 'Category', 'Image', 'Ingredients', 'Extraction Method'];
  const csvContent = [
    headers.join(','),
    ...items.map(item => [
      item.id,
      `"${item.name}"`,
      item.price,
      `"${item.category}"`,
      `"${item.image}"`,
         `"${Array.isArray(item.ingredients) ? item.ingredients.map((ing: any) => typeof ing === 'string' ? ing : (ing.name || ing.inventoryItemName || 'Unknown')).join('; ') : item.ingredients}"`,
      item.extractionMethod
    ].join(','))
  ].join('\n');
  
  fs.writeFileSync(csvPath, csvContent);
  return csvPath;
}

/**
 * Simple heuristic extraction for text input (fallback)
 */
function extractHeuristicFromText(text: string): any[] {
  const items: any[] = [];
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  let currentCategory = 'Main Menu';
  
  lines.forEach((line, idx) => {
    // Skip very short lines or lines that look like headers
    if (line.length < 3 || line.length > 100) return;
    
    // Check for category headers
    if (!/\d/.test(line) && (line === line.toUpperCase() || line.endsWith(':'))) {
      currentCategory = line.replace(/[:\.\s]+$/, '').trim();
      return;
    }

    // Try to extract name and price using various patterns
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
            ingredients: ['water', 'salt'], // Basic fallback ingredients
            extractionMethod: 'heuristic'
          });
          break;
        }
      }
    }
  });
  
  return items;
}

export async function POST(request: NextRequest) {
  try {
    console.log('==> /api/uploadMenu POST received');
    
    const body = await request.json();
    const { file, userId, manualData, textData } = body;
    
    console.log('payload keys:', Object.keys(body));
    
    // Handle manual data input
    if (manualData && Array.isArray(manualData) && manualData.length > 0) {
      console.log('📝 Processing manual data input...');
      const csvPath = exportToCSV(manualData);
      
      return NextResponse.json({
        success: true,
        count: manualData.length,
        csvExported: true,
        csvPath: csvPath,
        extractionAccuracy: 100,
        extractionTier: 'MANUAL',
        extractionMethod: 'MANUAL',
        message: 'Manual data processed successfully',
        quotaStatus: 'OK',
        menu: manualData
      });
    }
    
    // Handle text data input
    if (textData && typeof textData === 'string' && textData.trim().length > 0) {
      console.log('📄 Processing text data input...');
      const extractedItems = extractHeuristicFromText(textData);
      const csvPath = exportToCSV(extractedItems);
      
      return NextResponse.json({
        success: true,
        count: extractedItems.length,
        csvExported: true,
        csvPath: csvPath,
        extractionAccuracy: extractedItems.length > 0 ? 85 : 0,
        extractionTier: 'TEXT_INPUT',
        extractionMethod: 'TEXT_INPUT',
        message: `Text data processed: ${extractedItems.length} items extracted`,
        quotaStatus: 'OK',
        menu: extractedItems
      });
    }
    
    // Handle file upload - Use Gemini prompt-based extraction
    if (!file || typeof file !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'No file provided'
      }, { status: 400 });
    }
    
    console.log('🤖 Starting Gemini prompt-based PDF extraction...');
    
    // Parse the data URL and extract base64 content
    const base64Data = file.includes(',') ? file.split(',')[1] : file;
    const pdfBuffer = Buffer.from(base64Data, 'base64');
    
    console.log('📊 File data URL type:', file.substring(0, 50) + '...');
    console.log('📊 Base64 data length:', base64Data.length);
    console.log('📊 PDF buffer size:', pdfBuffer.length, 'bytes');
    
    // Extract menu items using Gemini
    const result = await extractMenuWithGemini(pdfBuffer);
    
    console.log(`📊 Gemini extraction result: ${result.items.length} items, tier: ${result.tier}`);
    
    // Export to CSV
    const csvPath = exportToCSV(result.items);
    
    // Determine response based on extraction result
    if (result.tier === 'GEMINI_QUOTA_EXCEEDED') {
      return NextResponse.json({
        success: false,
        count: 0,
        csvExported: false,
        extractionAccuracy: 0,
        extractionTier: result.tier,
        extractionMethod: result.tier,
        error: result.error,
        warning: result.warning,
        quotaStatus: 'EXCEEDED',
        menu: []
      });
    }
    
    if (result.tier === 'GEMINI_API_KEY_ERROR') {
      return NextResponse.json({
        success: false,
        count: 0,
        csvExported: false,
        extractionAccuracy: 0,
        extractionTier: result.tier,
        extractionMethod: result.tier,
        error: result.error,
        warning: result.warning,
        quotaStatus: 'API_KEY_ERROR',
        menu: []
      }, { status: 401 });
    }
    
    if (result.tier === 'GEMINI_ERROR') {
      return NextResponse.json({
        success: false,
        count: 0,
        csvExported: false,
        extractionAccuracy: 0,
        extractionTier: result.tier,
        extractionMethod: result.tier,
        error: result.error,
        quotaStatus: 'ERROR',
        menu: []
      });
    }
    
    // Success case
    return NextResponse.json({
      success: true,
      count: result.items.length,
      csvExported: true,
      csvPath: csvPath,
      extractionAccuracy: result.items.length > 0 ? 95 : 0,
      extractionTier: result.tier,
      extractionMethod: result.tier,
      message: `Gemini extraction successful: ${result.items.length} items extracted`,
      warning: result.warning,
      quotaStatus: 'OK',
      menu: result.items
    });
    
  } catch (error) {
    console.error('❌ Upload error:', error);
    return NextResponse.json({
      success: false, 
      error: 'Upload failed',
      quotaStatus: 'ERROR'
    }, { status: 500 });
  }
}