import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const model = searchParams.get('model') || 'waste-forecast';
  const period = searchParams.get('period') || '7-days';

  try {
    // Mock predictive data - replace with actual ML model predictions
    const predictiveData = {
      success: true,
      data: {
        model,
        period,
        confidence: 87,
        predictions: {
          'food-waste': {
            current: 12.5,
            predicted: 15.2,
            trend: 'increase',
            confidence: 87,
            factors: ['weekend peak', 'inventory surplus', 'portion sizes']
          },
          'packaging-waste': {
            current: 8.3,
            predicted: 7.1,
            trend: 'decrease',
            confidence: 92,
            factors: ['sustainable packaging', 'reduced orders', 'efficiency gains']
          },
          'oil-waste': {
            current: 2.1,
            predicted: 2.8,
            trend: 'increase',
            confidence: 78,
            factors: ['filter maintenance due', 'high usage period', 'equipment wear']
          }
        },
        insights: [
          {
            type: 'peak-times',
            title: 'Weekend Peak Waste',
            description: 'Highest waste generation expected Saturday-Sunday',
            priority: 'high',
            recommendation: 'Increase staff awareness and portion control'
          },
          {
            type: 'inventory',
            title: 'Over-ordering Detected',
            description: 'Fresh produce orders 15% above optimal levels',
            priority: 'medium',
            recommendation: 'Reduce next order by 15% based on historical data'
          },
          {
            type: 'cost-impact',
            title: 'Potential Savings',
            description: '€245 monthly savings through optimization',
            priority: 'high',
            recommendation: 'Implement suggested portion and ordering changes'
          }
        ],
        models: {
          'waste-forecast': {
            accuracy: 87,
            lastTrained: '2025-08-26T18:00:00Z',
            status: 'active'
          },
          'peak-prediction': {
            accuracy: 94,
            lastTrained: '2025-08-26T12:00:00Z',
            status: 'active'
          },
          'cost-modeling': {
            accuracy: 82,
            lastTrained: '2025-08-25T20:00:00Z',
            status: 'active'
          },
          'seasonal-trends': {
            accuracy: 91,
            lastTrained: '2025-08-24T16:00:00Z',
            status: 'active'
          }
        },
        optimization: {
          potentialSavings: 245,
          efficiencyScore: 7.8,
          actionItems: {
            high: 3,
            medium: 5,
            low: 4
          },
          recommendations: [
            {
              title: 'Reduce portion sizes during peak periods',
              impact: 'High',
              savings: 85,
              effort: 'Low',
              category: 'Operations'
            },
            {
              title: 'Optimize inventory ordering schedule',
              impact: 'Medium',
              savings: 65,
              effort: 'Medium',
              category: 'Inventory'
            },
            {
              title: 'Implement dynamic pricing for expiring items',
              impact: 'High',
              savings: 95,
              effort: 'High',
              category: 'Technology'
            }
          ]
        }
      }
    };

    return NextResponse.json(predictiveData);
  } catch (error) {
    console.error('Predictive API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch predictive data' },
      { status: 500 }
    );
  }
}
