import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const floorId = searchParams.get('floorId');
    
    // Return a simple mock layout for now
    const mockLayout = {
      floorId: floorId || 'main-floor',
      tables: [
        {
          id: 'table-1',
          x: 100,
          y: 100,
          w: 80,
          h: 80,
          shape: 'round',
          capacity: 4,
          seats: 4,
          label: 'Table 1',
          zoneId: 'dining-area'
        },
        {
          id: 'table-2',
          x: 200,
          y: 100,
          w: 120,
          h: 80,
          shape: 'rect',
          capacity: 6,
          seats: 6,
          label: 'Table 2',
          zoneId: 'dining-area'
        }
      ],
      zones: [
        {
          id: 'dining-area',
          name: 'Main Dining Area',
          color: '#3b82f6',
          visible: true
        }
      ],
      lastModified: new Date().toISOString(),
      version: 1
    };

    return NextResponse.json(mockLayout);
  } catch (error) {
    console.error('Draft layout API error:', error);
    return NextResponse.json(
      { error: 'Failed to load draft layout' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const floorId = searchParams.get('floorId');
    
    console.log('Saving draft layout for floor:', floorId);
    console.log('Layout data:', JSON.stringify(body, null, 2));
    
    // For now, just return success
    return NextResponse.json({
      success: true,
      floorId,
      savedAt: new Date().toISOString(),
      message: 'Draft layout saved successfully'
    });
  } catch (error) {
    console.error('Save draft layout error:', error);
    return NextResponse.json(
      { error: 'Failed to save draft layout' },
      { status: 500 }
    );
  }
}