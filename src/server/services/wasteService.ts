import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Zod schemas for validation
export const WasteEventInputSchema = z.object({
  amountKg: z.number().positive(),
  type: z.enum(['food', 'oil', 'packaging', 'organic']),
  station: z.enum(['kitchen', 'bar', 'dining']),
  staffId: z.number().optional(),
  photoUrl: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  notes: z.string().optional(),
});

export const AnalyticsQuerySchema = z.object({
  tenantId: z.number().optional(),
  from: z.date(),
  to: z.date(),
  metric: z.enum(['weight', 'cost', 'co2']).optional(),
});

export const KPIQuerySchema = z.object({
  tenantId: z.number().optional(),
  window: z.enum(['today', 'week', 'month']),
});

export const ComplianceQuerySchema = z.object({
  tenantId: z.number().optional(),
  from: z.date(),
  to: z.date(),
});

// TypeScript types
export type WasteEventInput = z.infer<typeof WasteEventInputSchema>;
export type AnalyticsQuery = z.infer<typeof AnalyticsQuerySchema>;
export type KPIQuery = z.infer<typeof KPIQuerySchema>;
export type ComplianceQuery = z.infer<typeof ComplianceQuerySchema>;

export interface DashboardKPIs {
  totalWasteKg: number;
  totalCostEUR: number;
  totalCO2Kg: number;
  wasteReductionPercent: number;
  costSavingsEUR: number;
  co2SavedKg: number;
  avgWastePerCover: number;
  wasteToSalesRatio: number;
  trends: {
    waste: number;
    cost: number;
    co2: number;
  };
}

export interface WasteAnalytics {
  dailyTrends: Array<{
    date: string;
    weight: number;
    cost: number;
    co2: number;
    covers: number;
  }>;
  byCategory: Array<{
    type: string;
    weight: number;
    cost: number;
    co2: number;
    percentage: number;
  }>;
  byStation: Array<{
    station: string;
    weight: number;
    cost: number;
    co2: number;
    percentage: number;
  }>;
  topWastedDishes: Array<{
    dish: string;
    frequency: number;
    totalWaste: number;
    estimatedCost: number;
  }>;
  ratios: {
    wastePerCover: number;
    wasteToSales: number;
    costPerCover: number;
  };
  impact: {
    co2Equivalent: string;
    treesEquivalent: number;
    mealsLost: number;
  };
}

export interface ComplianceSummary {
  score: number;
  openViolations: {
    critical: number;
    major: number;
    minor: number;
  };
  actions: Array<{
    id: number;
    title: string;
    severity: string;
    status: string;
    dueDate: string;
    assignee: string | null;
    overdue: boolean;
  }>;
  logCompleteness: number;
  sdg12_3Progress: number;
}

// Helper functions
function calculateCO2FromWaste(amountKg: number, type: string): number {
  const co2Factors = {
    food: 2.5,
    oil: 3.2,
    packaging: 1.8,
    organic: 2.1
  };
  return amountKg * (co2Factors[type as keyof typeof co2Factors] || 2.0);
}

function calculateCostFromWaste(amountKg: number, type: string): number {
  const costFactors = {
    food: 12.50,
    oil: 8.75,
    packaging: 5.20,
    organic: 6.80
  };
  return amountKg * (costFactors[type as keyof typeof costFactors] || 8.0);
}

function getDateRange(window: string): { from: Date; to: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (window) {
    case 'today':
      return {
        from: today,
        to: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      };
    case 'week':
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return { from: weekAgo, to: today };
    case 'month':
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return { from: monthAgo, to: today };
    default:
      return { from: today, to: today };
  }
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Main service functions
export async function getOwnerKPIs(query: KPIQuery): Promise<DashboardKPIs> {
  const { from, to } = getDateRange(query.window);
  
  // Get current period data
  const currentWaste = await prisma.wasteEvent.aggregate({
    where: {
      occurredAt: {
        gte: from,
        lt: to
      }
    },
    _sum: {
      amountKg: true,
      costEUR: true,
      co2Kg: true
    },
    _count: true
  });

  // Get previous period for comparison
  const periodLength = to.getTime() - from.getTime();
  const prevFrom = new Date(from.getTime() - periodLength);
  const prevTo = from;

  const previousWaste = await prisma.wasteEvent.aggregate({
    where: {
      occurredAt: {
        gte: prevFrom,
        lt: prevTo
      }
    },
    _sum: {
      amountKg: true,
      costEUR: true,
      co2Kg: true
    }
  });

  // Get covers for the current period
  const covers = await prisma.coverCount.aggregate({
    where: {
      date: {
        gte: from,
        lt: to
      }
    },
    _sum: {
      covers: true,
      revenue: true
    }
  });

  const totalWasteKg = currentWaste._sum.amountKg || 0;
  const totalCostEUR = currentWaste._sum.costEUR || 0;
  const totalCO2Kg = currentWaste._sum.co2Kg || 0;
  const totalCovers = covers._sum.covers || 1;
  const totalRevenue = covers._sum.revenue || 1;

  const prevWasteKg = previousWaste._sum.amountKg || 0;
  const prevCostEUR = previousWaste._sum.costEUR || 0;
  const prevCO2Kg = previousWaste._sum.co2Kg || 0;

  // Calculate reduction percentages
  const wasteReductionPercent = prevWasteKg > 0 
    ? ((prevWasteKg - totalWasteKg) / prevWasteKg) * 100 
    : 0;

  const costSavingsEUR = prevCostEUR - totalCostEUR;
  const co2SavedKg = prevCO2Kg - totalCO2Kg;

  return {
    totalWasteKg,
    totalCostEUR,
    totalCO2Kg,
    wasteReductionPercent,
    costSavingsEUR,
    co2SavedKg,
    avgWastePerCover: totalWasteKg / totalCovers,
    wasteToSalesRatio: (totalCostEUR / totalRevenue) * 100,
    trends: {
      waste: wasteReductionPercent,
      cost: prevCostEUR > 0 ? ((prevCostEUR - totalCostEUR) / prevCostEUR) * 100 : 0,
      co2: prevCO2Kg > 0 ? ((prevCO2Kg - totalCO2Kg) / prevCO2Kg) * 100 : 0
    }
  };
}

export async function getAnalytics(query: AnalyticsQuery): Promise<WasteAnalytics> {
  const { from, to } = query;

  // Daily trends with proper SQLite query
  const dailyData = await prisma.$queryRaw<Array<{
    date: string;
    weight: number;
    cost: number;
    co2: number;
  }>>`
    SELECT 
      DATE(occurredAt) as date,
      CAST(SUM(amountKg) AS REAL) as weight,
      CAST(SUM(costEUR) AS REAL) as cost,
      CAST(SUM(co2Kg) AS REAL) as co2
    FROM WasteEvent 
    WHERE occurredAt >= ${from} AND occurredAt <= ${to}
    GROUP BY DATE(occurredAt)
    ORDER BY date
  `;

  // Get covers for the same period
  const coverData = await prisma.coverCount.findMany({
    where: {
      date: {
        gte: from,
        lte: to
      }
    },
    select: {
      date: true,
      covers: true
    }
  });

  const dailyTrends = dailyData.map(day => {
    const coverInfo = coverData.find(c => 
      formatDate(c.date) === day.date
    );
    
    return {
      date: day.date,
      weight: Number(day.weight),
      cost: Number(day.cost),
      co2: Number(day.co2),
      covers: coverInfo?.covers || 0
    };
  });

  // By category
  const categoryData = await prisma.wasteEvent.groupBy({
    by: ['type'],
    where: {
      occurredAt: {
        gte: from,
        lte: to
      }
    },
    _sum: {
      amountKg: true,
      costEUR: true,
      co2Kg: true
    }
  });

  const totalWeight = categoryData.reduce((sum, cat) => sum + (cat._sum.amountKg || 0), 0);
  
  const byCategory = categoryData.map(cat => ({
    type: cat.type,
    weight: cat._sum.amountKg || 0,
    cost: cat._sum.costEUR || 0,
    co2: cat._sum.co2Kg || 0,
    percentage: totalWeight > 0 ? ((cat._sum.amountKg || 0) / totalWeight) * 100 : 0
  }));

  // By station
  const stationData = await prisma.wasteEvent.groupBy({
    by: ['station'],
    where: {
      occurredAt: {
        gte: from,
        lte: to
      }
    },
    _sum: {
      amountKg: true,
      costEUR: true,
      co2Kg: true
    }
  });

  const byStation = stationData.map(station => ({
    station: station.station,
    weight: station._sum.amountKg || 0,
    cost: station._sum.costEUR || 0,
    co2: station._sum.co2Kg || 0,
    percentage: totalWeight > 0 ? ((station._sum.amountKg || 0) / totalWeight) * 100 : 0
  }));

  // Mock top wasted dishes (would need menu item integration)
  const topWastedDishes = [
    { dish: "Caesar Salad", frequency: 15, totalWaste: 12.5, estimatedCost: 156.25 },
    { dish: "Grilled Salmon", frequency: 12, totalWaste: 18.0, estimatedCost: 225.00 },
    { dish: "Beef Burger", frequency: 10, totalWaste: 8.5, estimatedCost: 106.25 },
    { dish: "Pasta Carbonara", frequency: 8, totalWaste: 6.2, estimatedCost: 77.50 },
    { dish: "Chicken Wings", frequency: 7, totalWaste: 9.1, estimatedCost: 113.75 }
  ];

  // Calculate ratios
  const totalCovers = coverData.reduce((sum, c) => sum + c.covers, 0);
  const totalRevenue = await prisma.coverCount.aggregate({
    where: {
      date: {
        gte: from,
        lte: to
      }
    },
    _sum: {
      revenue: true
    }
  });

  const ratios = {
    wastePerCover: totalCovers > 0 ? totalWeight / totalCovers : 0,
    wasteToSales: (totalRevenue._sum.revenue || 0) > 0 
      ? (categoryData.reduce((sum, cat) => sum + (cat._sum.costEUR || 0), 0) / (totalRevenue._sum.revenue || 1)) * 100
      : 0,
    costPerCover: totalCovers > 0 
      ? categoryData.reduce((sum, cat) => sum + (cat._sum.costEUR || 0), 0) / totalCovers
      : 0
  };

  // Impact calculations
  const totalCO2 = categoryData.reduce((sum, cat) => sum + (cat._sum.co2Kg || 0), 0);
  const impact = {
    co2Equivalent: `${totalCO2.toFixed(1)} kg CO₂`,
    treesEquivalent: Math.round(totalCO2 / 22), // 1 tree absorbs ~22kg CO2/year
    mealsLost: Math.round(totalWeight / 0.5) // Assuming 500g per meal
  };

  return {
    dailyTrends,
    byCategory,
    byStation,
    topWastedDishes,
    ratios,
    impact
  };
}

export async function getCompliance(query: ComplianceQuery): Promise<ComplianceSummary> {
  const { from, to } = query;

  // Get compliance checks
  const checks = await prisma.complianceCheck.findMany({
    where: {
      createdAt: {
        gte: from,
        lte: to
      }
    },
    include: {
      assignee: {
        select: {
          name: true
        }
      }
    }
  });

  // Count violations by severity and status
  const openViolations = {
    critical: checks.filter(c => c.status === 'open' && c.severity === 'critical').length,
    major: checks.filter(c => c.status === 'open' && c.severity === 'major').length,
    minor: checks.filter(c => c.status === 'open' && c.severity === 'minor').length
  };

  // Calculate compliance score (based on resolved vs total issues)
  const totalIssues = checks.length;
  const resolvedIssues = checks.filter(c => c.status === 'closed').length;
  const score = totalIssues > 0 ? Math.round((resolvedIssues / totalIssues) * 100) : 100;

  // Format actions
  const now = new Date();
  const actions = checks.map(check => ({
    id: check.id,
    title: check.title,
    severity: check.severity,
    status: check.status,
    dueDate: check.dueDate.toISOString().split('T')[0],
    assignee: check.assignee?.name || null,
    overdue: check.dueDate < now && check.status !== 'closed'
  }));

  // Calculate log completeness (mock - would check actual logging frequency)
  const expectedLogs = Math.ceil((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000)) * 3; // 3 logs per day expected
  const actualLogs = await prisma.wasteEvent.count({
    where: {
      occurredAt: {
        gte: from,
        lte: to
      }
    }
  });
  
  const logCompleteness = Math.min(100, Math.round((actualLogs / expectedLogs) * 100));

  // SDG 12.3 progress (50% food waste reduction by 2030)
  // Mock calculation - would need baseline year data
  const currentFoodWaste = await prisma.wasteEvent.aggregate({
    where: {
      type: 'food',
      occurredAt: {
        gte: from,
        lte: to
      }
    },
    _sum: {
      amountKg: true
    }
  });

  // Assume 25% reduction achieved towards 50% goal
  const sdg12_3Progress = 50; // 50% progress towards SDG 12.3

  return {
    score,
    openViolations,
    actions,
    logCompleteness,
    sdg12_3Progress
  };
}

export async function logEvent(input: WasteEventInput): Promise<void> {
  const validatedInput = WasteEventInputSchema.parse(input);
  
  // Calculate cost and CO2 if not provided
  const costEUR = calculateCostFromWaste(validatedInput.amountKg, validatedInput.type);
  const co2Kg = calculateCO2FromWaste(validatedInput.amountKg, validatedInput.type);

  await prisma.wasteEvent.create({
    data: {
      ...validatedInput,
      costEUR,
      co2Kg,
      occurredAt: new Date()
    }
  });
}
