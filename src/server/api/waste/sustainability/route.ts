import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const range = searchParams.get('range') || 'month';

  try {
    // Mock sustainability data - replace with actual calculations
    const sustainabilityData = {
      success: true,
      data: {
        range,
        carbonFootprint: {
          reduction: 24, // percentage
          totalSaved: 1.2, // tons CO2
          equivalent: '2,400 km driving', // comparison
          trend: 'improving'
        },
        sustainabilityScore: {
          overall: 8.4,
          breakdown: {
            wasteReduction: 8.8,
            energyEfficiency: 7.9,
            compliance: 8.7,
            innovation: 8.2
          }
        },
        wasteDeversion: {
          fromLandfill: 89, // percentage
          breakdown: {
            recycled: 45,
            composted: 32,
            donated: 12
          }
        },
        impactMetrics: {
          co2Saved: 1200, // kg
          waterSaved: 3400, // liters
          energySaved: 890, // kWh
          costSavings: 245 // EUR
        },
        trends: {
          monthly: [
            { month: 'Jan', score: 7.8, co2: 980 },
            { month: 'Feb', score: 8.1, co2: 1050 },
            { month: 'Mar', score: 8.3, co2: 1120 },
            { month: 'Apr', score: 8.4, co2: 1200 },
            { month: 'May', score: 8.2, co2: 1180 },
            { month: 'Jun', score: 8.5, co2: 1250 },
            { month: 'Jul', score: 8.4, co2: 1200 },
            { month: 'Aug', score: 8.6, co2: 1280 }
          ]
        },
        certifications: [
          {
            name: 'ISO 14001',
            status: 'active',
            validUntil: '2026-03-15',
            score: 92
          },
          {
            name: 'Zero Waste to Landfill',
            status: 'pending',
            validUntil: null,
            score: 89
          },
          {
            name: 'Carbon Neutral',
            status: 'in-progress',
            validUntil: null,
            score: 76
          }
        ]
      }
    };

    return NextResponse.json(sustainabilityData);
  } catch (error) {
    console.error('Sustainability API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sustainability data' },
      { status: 500 }
    );
  }
}
