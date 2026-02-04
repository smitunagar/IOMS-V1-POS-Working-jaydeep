import { NextResponse } from 'next/server';
import { parse as csvParse } from 'csv-parse/sync';
import fs from 'fs';
import path from 'path';

const MENU_JSON_PATH = path.join(process.cwd(), 'menu-data.json');

export async function GET() {
  // Return saved menu items for Order Entry
  try {
    if (fs.existsSync(MENU_JSON_PATH)) {
      const data = fs.readFileSync(MENU_JSON_PATH, 'utf-8');
      const menu = JSON.parse(data);
      return NextResponse.json({ menu });
    }
    return NextResponse.json({ menu: [] });
  } catch (err) {
    return NextResponse.json({ menu: [] });
  }
}

export const runtime = 'nodejs'; // Ensure Node.js APIs are available

export async function POST(request: Request) {
  // If JSON, handle save or delete
  const url = new URL(request.url, 'http://localhost');
  const action = url.searchParams.get('action');
  if (action === 'delete') {
    if (fs.existsSync(MENU_JSON_PATH)) {
      fs.unlinkSync(MENU_JSON_PATH);
    }
    return NextResponse.json({ success: true });
  }

  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const body = await request.json();
    if (body.action === 'save' && Array.isArray(body.menuItems)) {
      // Save menuItems to file
      fs.writeFileSync(MENU_JSON_PATH, JSON.stringify(body.menuItems, null, 2), 'utf-8');
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: 'Invalid save request' }, { status: 400 });
  }

  const formData = await request.formData();
  const file = formData.get('file');

  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const filename = (file as any).name || '';
  const fileExt = filename.toLowerCase().split('.').pop();

  let menuItems = [];
  
  console.log(`📁 Processing file: ${filename} (${fileExt})`);
  
  try {
    if (fileExt === 'pdf') {
      console.log('⚠️ PDF parsing without AI - creating placeholder items');
      // For PDF without AI, provide basic structure for manual entry
      menuItems = [{
        name: `PDF Menu: ${filename}`,
        price: 0,
        category: 'Imported Items',
        description: 'Please manually add menu items from the PDF',
        ingredients: []
      }];
    } else if (fileExt === 'csv') {
      // Enhanced CSV parsing
      console.log('📊 Parsing CSV file...');
      const csvText = buffer.toString('utf-8');
      const rawData = csvParse(csvText, { 
        columns: true, 
        skip_empty_lines: true,
        relax_column_count: true 
      });
      
      menuItems = rawData.map((row: any, index: number) => {
        // Try to find name and price from various column names
        const possibleNames = ['name', 'Name', 'item', 'Item', 'dish', 'Dish', 'menu_item', 'product'];
        const possiblePrices = ['price', 'Price', 'cost', 'Cost', 'amount', 'Amount'];
        const possibleCategories = ['category', 'Category', 'type', 'Type', 'section', 'Section'];
        
        const name = possibleNames.reduce((acc, key) => acc || row[key], null) || `Item ${index + 1}`;
        const priceStr = possiblePrices.reduce((acc, key) => acc || row[key], null) || '0';
        const category = possibleCategories.reduce((acc, key) => acc || row[key], null) || 'Main Dishes';
        
        const price = parseFloat(priceStr.toString().replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
        
        return {
          name: cleanMenuItemName(name),
          price: price,
          category: category,
          description: row.description || row.Description || '',
          ingredients: []
        };
      });
      
      console.log(`✅ CSV parsed: ${menuItems.length} items`);
      
    } else if (['txt', 'text'].includes(fileExt || '')) {
      // Enhanced text parsing
      console.log('📝 Parsing text file...');
      menuItems = parseMenuFromText(buffer.toString('utf-8'));
      console.log(`✅ Text parsed: ${menuItems.length} items`);
      
    } else {
      // Try to parse as text anyway
      console.log('⚠️ Unknown file type, attempting text parsing...');
      try {
        const text = buffer.toString('utf-8');
        if (text.length > 0) {
          menuItems = parseMenuFromText(text);
          console.log(`✅ Text fallback parsed: ${menuItems.length} items`);
        } else {
          throw new Error('Empty file');
        }
      } catch (textError) {
        // Create a placeholder item
        menuItems = [{
          name: `Manual Entry Required: ${filename}`,
          price: 0,
          category: 'Uploaded Files',
          description: `Please manually add items from: ${filename}`,
          ingredients: []
        }];
      }
    }
    
    // Ensure we have at least something to work with
    if (menuItems.length === 0) {
      menuItems = [{
        name: `Please Add Items Manually`,
        price: 0,
        category: 'Manual Entry',
        description: `No items could be extracted from ${filename}. Please add menu items manually.`,
        ingredients: []
      }];
    }
    
    console.log(`📋 Final result: ${menuItems.length} menu items extracted`);
    return NextResponse.json({ menuItems });
    
  } catch (error) {
    console.error('❌ File processing error:', error);
    
    // Last resort fallback - always return something workable
    menuItems = [{
      name: `Upload Error: ${filename}`,
      price: 0,
      category: 'Manual Entry Required',
      description: `Error processing ${filename}. Please add menu items manually.`,
      ingredients: []
    }];
    
    return NextResponse.json({ 
      menuItems,
      warning: `File parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please add menu items manually.`
    });
  }
}

// Enhanced manual text parsing function
function parseMenuFromText(text: string): any[] {
  const lines = text.split(/\r?\n/).filter(line => line.trim());
  const items: any[] = [];
  
  let currentCategory = 'Main Dishes';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines and very short lines
    if (!line || line.length < 2) continue;
    
    // Check if this might be a category header
    if (looksLikeCategory(line)) {
      currentCategory = line;
      continue;
    }
    
    // Try to extract item information
    const itemInfo = extractItemFromLine(line);
    if (itemInfo) {
      items.push({
        name: itemInfo.name,
        price: itemInfo.price,
        category: currentCategory,
        description: itemInfo.description || '',
        ingredients: []
      });
    }
  }
  
  // If no items found with price extraction, try simpler parsing
  if (items.length === 0) {
    console.log('🔄 No items with prices found, trying simple line parsing...');
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (trimmed.length > 2 && trimmed.length < 150 && !looksLikeCategory(trimmed)) {
        items.push({
          name: cleanMenuItemName(trimmed),
          price: 0,
          category: 'Imported Items',
          description: 'Price not detected - please update manually',
          ingredients: []
        });
      }
    });
  }
  
  return items.slice(0, 100); // Limit to 100 items to prevent overflow
}

// Check if a line looks like a category header
function looksLikeCategory(line: string): boolean {
  const trimmed = line.trim();
  
  // Category indicators
  if (trimmed.toUpperCase() === trimmed && trimmed.length > 2 && trimmed.length < 30) return true;
  if (/(MENU|SECTION|CATEGORY|APPETIZER|MAIN|DESSERT|DRINK|BEVERAGE|PIZZA|PASTA|SALAD|SOUP|STARTER)/i.test(trimmed)) return true;
  if (trimmed.split(' ').length <= 4 && !containsPrice(trimmed) && trimmed.length < 30) return true;
  
  return false;
}

// Extract item information from a line
function extractItemFromLine(line: string): { name: string; price: number; description?: string } | null {
  const trimmed = line.trim();
  
  // Look for price patterns
  const pricePatterns = [
    /([€$£]\s*\d+[.,]\d{2})/g,           // €12.90, $12.90
    /(\d+[.,]\d{2}\s*[€$£])/g,           // 12.90€, 12.90$
    /(\d+[.,]\d{2})/g                    // 12.90
  ];
  
  let price = 0;
  let name = trimmed;
  let priceMatch = null;
  
  // Try each price pattern
  for (const pattern of pricePatterns) {
    const matches = Array.from(trimmed.matchAll(pattern));
    if (matches.length > 0) {
      priceMatch = matches[0];
      break;
    }
  }
  
  if (priceMatch) {
    const priceStr = priceMatch[0];
    price = parseFloat(priceStr.replace(/[€$£\s]/g, '').replace(',', '.')) || 0;
    
    // Remove price from name
    name = trimmed.replace(priceStr, '').trim();
    
    // Clean up common separators
    name = name.replace(/^[-•·\*\+\s]+/, '').replace(/[-•·\*\+\s]+$/, '').trim();
    
    // Remove dots if they seem to be leaders (like "Pizza............12.90")
    name = name.replace(/\.{3,}.*$/, '').trim();
  }
  
  // Validate name
  if (name.length < 2 || name.length > 100) return null;
  
  // Skip lines that are likely not menu items
  if (/(PAGE|SEITE|\d+\/\d+|TOTAL|SUM|TAX|TIP|RESTAURANT|ADDRESS|PHONE|WWW|HTTP)/i.test(name)) return null;
  
  return {
    name: name,
    price: price,
    description: ''
  };
}

// Helper function to check if text contains price indicators
function containsPrice(text: string): boolean {
  return /([€$£]\s*\d+[.,]\d{2})|(\d+[.,]\d{2}\s*[€$£]?)|(\d+[.,]\d{2})/.test(text);
}

// Function to clean menu item names by removing price information
function cleanMenuItemName(name: string): string {
  if (!name) return name;
  
  // Remove price patterns
  return name
    .replace(/\s*-\s*\d+[\.,]\d+\s*(EUR|USD|GBP|€|$|£)\s*$/i, '')
    .replace(/\s*-\s*\d+[\.,]\d+\s*$/i, '')
    .replace(/\s*\(\d+[\.,]\d+\s*(EUR|USD|GBP|€|$|£)\)\s*$/i, '')
    .replace(/\s*[€$£]\d+[\.,]\d+\s*$/i, '')
    .replace(/\s*\d+[\.,]\d+\s*[€$£]\s*$/i, '')
    .replace(/\.{3,}.*$/, '') // Remove dot leaders
    .replace(/^[-•·\*\+\s]+/, '') // Remove leading separators
    .replace(/[-•·\*\+\s]+$/, '') // Remove trailing separators
    .trim();
}
