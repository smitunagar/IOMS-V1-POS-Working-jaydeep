import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    const menuPath = path.join(process.cwd(), 'menu-data.json');
    const raw = await fs.readFile(menuPath, 'utf8');
    const menu = JSON.parse(raw);

    if (!Array.isArray(menu)) {
      return NextResponse.json({ menu: [] }, { status: 200 });
    }

    return NextResponse.json({ menu }, { status: 200 });
  } catch (error) {
    console.error('❌ /api/menuCsv failed to read menu-data.json:', error);
    return NextResponse.json({ menu: [] }, { status: 200 });
  }
}
