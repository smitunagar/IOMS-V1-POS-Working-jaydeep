import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const threshold = parseInt(searchParams.get('threshold') || '10');
    const category = searchParams.get('category');

    // Base query for low stock items
    let whereClause: any = {
      quantity: {
        lte: threshold
      }
    };

    // Note: Category filtering would need to be implemented at the ingredient level
    // if categories are added to the ingredient model in the future

    // Fetch low stock items from inventory with ingredient details
    const lowStockItems = await prisma.inventory.findMany({
      where: whereClause,
      select: {
        id: true,
        quantity: true,
        lastUpdated: true,
        ingredient: {
          select: {
            id: true,
            name: true,
            unit: true
          }
        }
      },
      orderBy: [
        { quantity: 'asc' }
      ]
    });

    // Calculate additional metrics
    const totalLowStockItems = lowStockItems.length;
    const criticalItems = lowStockItems.filter(item => item.quantity <= 5);

    // Transform data for frontend consumption
    const formattedItems = lowStockItems.map(item => ({
      id: item.id,
      name: item.ingredient.name,
      quantity: item.quantity,
      unit: item.ingredient.unit || 'units',
      lastUpdated: item.lastUpdated,
      ingredientId: item.ingredient.id
    }));

    return NextResponse.json({
      success: true,
      data: {
        items: formattedItems,
        summary: {
          totalLowStockItems,
          criticalItems: criticalItems.length,
          threshold
        }
      }
    });

  } catch (error) {
    console.error('Error fetching low stock items:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch low stock items',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { itemId, newQuantity, restockNote } = body;

    if (!itemId || newQuantity === undefined) {
      return NextResponse.json(
        { success: false, error: 'Item ID and new quantity are required' },
        { status: 400 }
      );
    }

    // Update inventory item quantity
    const updatedItem = await prisma.inventory.update({
      where: { id: itemId },
      data: {
        quantity: newQuantity,
        lastUpdated: new Date()
      },
      include: {
        ingredient: true
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedItem,
      message: 'Item successfully restocked'
    });

  } catch (error) {
    console.error('Error restocking item:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to restock item',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
