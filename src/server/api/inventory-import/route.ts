import { NextRequest, NextResponse } from 'next/server';

interface InventoryItem {
  id?: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  price?: number;
  expiryDate?: string;
  location?: string;
  supplier?: string;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'File must be a CSV' }, { status: 400 });
    }

    // Read the CSV file
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      return NextResponse.json({ error: 'CSV file must have at least a header and one data row' }, { status: 400 });
    }

    // Parse header
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    // Validate required headers
    const requiredHeaders = ['name', 'category', 'quantity', 'unit'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      return NextResponse.json({ 
        error: `Missing required headers: ${missingHeaders.join(', ')}` 
      }, { status: 400 });
    }

    // Parse data rows
    const inventoryItems: InventoryItem[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Handle CSV with commas in quoted fields
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      
      // Map values to headers
      const item: any = {};
      headers.forEach((header, index) => {
        if (values[index]) {
          item[header] = values[index].replace(/^"|"$/g, ''); // Remove quotes
        }
      });
      
      // Validate required fields
      if (!item.name || !item.category || !item.quantity || !item.unit) {
        continue; // Skip invalid rows
      }
      
      // Convert quantity to number
      const quantity = parseFloat(item.quantity);
      if (isNaN(quantity) || quantity < 0) {
        continue; // Skip invalid quantity
      }
      
      // Convert price to number if present
      if (item.price) {
        const price = parseFloat(item.price);
        if (!isNaN(price) && price >= 0) {
          item.price = price;
        }
      }
      
      // Validate date format if present
      if (item.expirydate) {
        const date = new Date(item.expirydate);
        if (isNaN(date.getTime())) {
          delete item.expirydate; // Remove invalid date
        }
      }
      
      inventoryItems.push({
        name: item.name,
        category: item.category,
        quantity: quantity,
        unit: item.unit,
        price: item.price,
        expiryDate: item.expirydate,
        location: item.location,
        supplier: item.supplier
      });
    }
    
    if (inventoryItems.length === 0) {
      return NextResponse.json({ error: 'No valid inventory items found in CSV' }, { status: 400 });
    }
    
    console.log(`Processed ${inventoryItems.length} inventory items from CSV`);
    
    return NextResponse.json({
      success: true,
      inventoryItems,
      count: inventoryItems.length
    });
    
  } catch (error) {
    console.error('Error processing CSV:', error);
    return NextResponse.json({ 
      error: 'Failed to process CSV file' 
    }, { status: 500 });
  }
}

