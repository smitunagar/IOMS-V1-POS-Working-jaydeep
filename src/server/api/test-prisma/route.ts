import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Simple test query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    return NextResponse.json({ success: true, prisma: 'working', result });
  } catch (error) {
    console.error('Prisma test error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
