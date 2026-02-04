import { NextResponse } from 'next/server';
import { parse as csvParse } from 'csv-parse/sync';
import { extractMenuItemsFromPdfWithGemini } from '@/server/lib/aiMenuExtractor';
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
    console.log('MenuCsv POST body:', body);
    if (body.action === 'save' && Array.isArray(body.menuItems)) {
      // Save menuItems to file
      console.log('Saving menu items to:', MENU_JSON_PATH);
      try {
        fs.writeFileSync(MENU_JSON_PATH, JSON.stringify(body.menuItems, null, 2), 'utf-8');
        console.log('Menu items saved successfully');
        return NextResponse.json({ success: true });
      } catch (error) {
        console.error('Error saving menu items:', error);
        return NextResponse.json({ error: 'Failed to save menu items' }, { status: 500 });
      }
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
  const isPdf = filename.toLowerCase().endsWith('.pdf');
  const isCsv = filename.toLowerCase().endsWith('.csv');

  let menuItems = [];
  try {
    if (isPdf) {
      // Use Gemini for PDF extraction
      menuItems = await extractMenuItemsFromPdfWithGemini(buffer);
    } else if (isCsv) {
      // Parse CSV
      const csvText = buffer.toString('utf-8');
      menuItems = csvParse(csvText, { columns: true, skip_empty_lines: true });
    } else {
      return NextResponse.json({ error: 'Unsupported file type. Please upload a PDF or CSV.' }, { status: 400 });
    }
    // Do NOT write extracted menuItems to file here (revert to old flow)
    return NextResponse.json({ menuItems });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message || 'Failed to extract menu items.' }, { status: 500 });
  }
}

// Function to clean menu item names by removing price information
function cleanMenuItemName(name: string): string {
  if (!name) return name;
  
  // Remove price patterns like "- 12.90 EUR", "- $12.90", "- 12.90", "- 12.90"
  return name
    .replace(/\s*-\s*\d+[\.,]\d+\s*(EUR|USD|GBP|  |$  |  )\s*$/i, '') // Remove "- 12.90 EUR" patterns
    .replace(/\s*-\s*\d+[\.,]\d+\s*$/i, '') // Remove "- 12.90" patterns  
    .replace(/\s*\(\d+[\.,]\d+\s*(EUR|USD|GBP|  |$  |  )\)\s*$/i, '') // Remove "(12.90 EUR)" patterns
    .replace(/\s*\$\d+[\.,]\d+\s*$/i, '') // Remove "$12.90" patterns
    .replace(/\s*  \d+[\.,]\d+\s*$/i, '') // Remove " 12.90" patterns
    .replace(/\s*  \d+[\.,]\d+\s*$/i, '') // Remove " 12.90" patterns
    .trim();
}

// ... (rest of the code from the Noman branch version) ... 