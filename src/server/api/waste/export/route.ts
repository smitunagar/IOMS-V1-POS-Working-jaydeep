import { NextRequest, NextResponse } from 'next/server';
import { getAnalytics, getOwnerKPIs, AnalyticsQuerySchema, KPIQuerySchema } from '@/server/services/wasteService';
import * as ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Extend jsPDF type for autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { format, range = '30d', type = 'analytics' } = body;

    if (!format || !['pdf', 'excel'].includes(format)) {
      return NextResponse.json(
        { success: false, error: 'Invalid format. Must be "pdf" or "excel"' },
        { status: 400 }
      );
    }

    // Get data for export
    const now = new Date();
    let daysAgo: number;
    
    switch (range) {
      case '7d':
        daysAgo = 7;
        break;
      case '30d':
        daysAgo = 30;
        break;
      case '90d':
        daysAgo = 90;
        break;
      default:
        daysAgo = 30;
    }
    
    const from = new Date(now);
    from.setDate(from.getDate() - daysAgo);

    const [analyticsData, kpiData] = await Promise.all([
      getAnalytics(AnalyticsQuerySchema.parse({ from, to: now })),
      getOwnerKPIs(KPIQuerySchema.parse({ window: 'month' }))
    ]);

    if (format === 'excel') {
      return await generateExcelReport(analyticsData, kpiData, range);
    } else {
      return await generatePDFReport(analyticsData, kpiData, range);
    }

  } catch (error) {
    console.error('Export API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate export' },
      { status: 500 }
    );
  }
}

async function generateExcelReport(analytics: any, kpis: any, range: string) {
  const workbook = new ExcelJS.Workbook();
  
  // KPIs Sheet
  const kpiSheet = workbook.addWorksheet('KPIs');
  kpiSheet.columns = [
    { header: 'Metric', key: 'metric', width: 25 },
    { header: 'Value', key: 'value', width: 15 },
    { header: 'Unit', key: 'unit', width: 10 },
    { header: 'Trend', key: 'trend', width: 15 }
  ];

  kpiSheet.addRows([
    { metric: 'Total Waste', value: kpis.totalWasteKg.toFixed(2), unit: 'kg', trend: `${kpis.trends.waste.toFixed(1)}%` },
    { metric: 'Total Cost', value: kpis.totalCostEUR.toFixed(2), unit: '€', trend: `${kpis.trends.cost.toFixed(1)}%` },
    { metric: 'CO₂ Impact', value: kpis.totalCO2Kg.toFixed(2), unit: 'kg', trend: `${kpis.trends.co2.toFixed(1)}%` },
    { metric: 'Waste Reduction', value: kpis.wasteReductionPercent.toFixed(1), unit: '%', trend: '-' },
    { metric: 'Cost Savings', value: kpis.costSavingsEUR.toFixed(2), unit: '€', trend: '-' },
    { metric: 'Avg Waste per Cover', value: kpis.avgWastePerCover.toFixed(2), unit: 'kg', trend: '-' },
    { metric: 'Waste-to-Sales Ratio', value: kpis.wasteToSalesRatio.toFixed(2), unit: '%', trend: '-' }
  ]);

  // Daily Trends Sheet
  const trendsSheet = workbook.addWorksheet('Daily Trends');
  trendsSheet.columns = [
    { header: 'Date', key: 'date', width: 12 },
    { header: 'Weight (kg)', key: 'weight', width: 15 },
    { header: 'Cost (€)', key: 'cost', width: 15 },
    { header: 'CO₂ (kg)', key: 'co2', width: 15 },
    { header: 'Covers', key: 'covers', width: 12 }
  ];
  
  trendsSheet.addRows(analytics.dailyTrends);

  // Category Breakdown Sheet
  const categorySheet = workbook.addWorksheet('By Category');
  categorySheet.columns = [
    { header: 'Category', key: 'type', width: 15 },
    { header: 'Weight (kg)', key: 'weight', width: 15 },
    { header: 'Cost (€)', key: 'cost', width: 15 },
    { header: 'CO₂ (kg)', key: 'co2', width: 15 },
    { header: 'Percentage', key: 'percentage', width: 15 }
  ];
  
  categorySheet.addRows(analytics.byCategory);

  // Station Breakdown Sheet
  const stationSheet = workbook.addWorksheet('By Station');
  stationSheet.columns = [
    { header: 'Station', key: 'station', width: 15 },
    { header: 'Weight (kg)', key: 'weight', width: 15 },
    { header: 'Cost (€)', key: 'cost', width: 15 },
    { header: 'CO₂ (kg)', key: 'co2', width: 15 },
    { header: 'Percentage', key: 'percentage', width: 15 }
  ];
  
  stationSheet.addRows(analytics.byStation);

  // Top Wasted Dishes Sheet
  const dishesSheet = workbook.addWorksheet('Top Wasted Dishes');
  dishesSheet.columns = [
    { header: 'Dish', key: 'dish', width: 25 },
    { header: 'Frequency', key: 'frequency', width: 12 },
    { header: 'Total Waste (kg)', key: 'totalWaste', width: 18 },
    { header: 'Estimated Cost (€)', key: 'estimatedCost', width: 20 }
  ];
  
  dishesSheet.addRows(analytics.topWastedDishes);

  // Style headers
  [kpiSheet, trendsSheet, categorySheet, stationSheet, dishesSheet].forEach(sheet => {
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6F3FF' }
    };
  });

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="waste-analytics-${range}.xlsx"`
    }
  });
}

async function generatePDFReport(analytics: any, kpis: any, range: string) {
  const doc = new jsPDF();
  let currentY = 20;
  
  // Title
  doc.setFontSize(20);
  doc.text('WasteWatch Analytics Report', 20, currentY);
  currentY += 15;
  
  doc.setFontSize(12);
  doc.text(`Report Period: ${range}`, 20, currentY);
  currentY += 10;
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, currentY);
  currentY += 30;

  // KPIs Section
  doc.setFontSize(16);
  doc.text('Key Performance Indicators', 20, currentY);
  currentY += 10;
  
  const kpiData = [
    ['Metric', 'Value', 'Trend'],
    ['Total Waste', `${kpis.totalWasteKg.toFixed(2)} kg`, `${kpis.trends.waste.toFixed(1)}%`],
    ['Total Cost', `€${kpis.totalCostEUR.toFixed(2)}`, `${kpis.trends.cost.toFixed(1)}%`],
    ['CO₂ Impact', `${kpis.totalCO2Kg.toFixed(2)} kg`, `${kpis.trends.co2.toFixed(1)}%`],
    ['Waste Reduction', `${kpis.wasteReductionPercent.toFixed(1)}%`, '-'],
    ['Avg Waste/Cover', `${kpis.avgWastePerCover.toFixed(2)} kg`, '-']
  ];

  doc.autoTable({
    startY: currentY,
    head: [kpiData[0]],
    body: kpiData.slice(1),
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185] }
  });
  currentY += (kpiData.length * 8) + 20;

  // Category Breakdown
  doc.setFontSize(16);
  doc.text('Waste by Category', 20, currentY);
  currentY += 10;
  
  const categoryData = [
    ['Category', 'Weight (kg)', 'Cost (€)', 'Percentage'],
    ...analytics.byCategory.map((cat: any) => [
      cat.type,
      cat.weight.toFixed(2),
      cat.cost.toFixed(2),
      `${cat.percentage.toFixed(1)}%`
    ])
  ];

  doc.autoTable({
    startY: currentY,
    head: [categoryData[0]],
    body: categoryData.slice(1),
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185] }
  });
  currentY += (categoryData.length * 8) + 20;

  // Station Breakdown
  doc.setFontSize(16);
  doc.text('Waste by Station', 20, currentY);
  currentY += 10;
  
  const stationData = [
    ['Station', 'Weight (kg)', 'Cost (€)', 'Percentage'],
    ...analytics.byStation.map((station: any) => [
      station.station,
      station.weight.toFixed(2),
      station.cost.toFixed(2),
      `${station.percentage.toFixed(1)}%`
    ])
  ];

  doc.autoTable({
    startY: currentY,
    head: [stationData[0]],
    body: stationData.slice(1),
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185] }
  });

  // Environmental Impact
  doc.addPage();
  currentY = 30;
  doc.setFontSize(16);
  doc.text('Environmental Impact', 20, currentY);
  currentY += 10;
  
  const impactData = [
    ['Metric', 'Value'],
    ['CO₂ Equivalent', analytics.impact.co2Equivalent],
    ['Trees Equivalent', `${analytics.impact.treesEquivalent} trees`],
    ['Meals Lost', `${analytics.impact.mealsLost} meals`]
  ];

  doc.autoTable({
    startY: currentY,
    head: [impactData[0]],
    body: impactData.slice(1),
    theme: 'grid',
    headStyles: { fillColor: [39, 174, 96] }
  });
  currentY += (impactData.length * 8) + 20;

  // Top Wasted Dishes
  doc.setFontSize(16);
  doc.text('Top Wasted Dishes', 20, currentY);
  currentY += 10;
  
  const dishData = [
    ['Dish', 'Frequency', 'Total Waste (kg)', 'Cost (€)'],
    ...analytics.topWastedDishes.slice(0, 10).map((dish: any) => [
      dish.dish,
      dish.frequency.toString(),
      dish.totalWaste.toFixed(2),
      dish.estimatedCost.toFixed(2)
    ])
  ];

  doc.autoTable({
    startY: currentY,
    head: [dishData[0]],
    body: dishData.slice(1),
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185] }
  });

  // Generate buffer
  const pdfBuffer = doc.output('arraybuffer');
  
  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="waste-analytics-${range}.pdf"`
    }
  });
}
