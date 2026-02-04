"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  Download, 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  Droplet, 
  Leaf, 
  Users, 
  Shield, 
  Factory, 
  DollarSign,
  Target,
  AlertTriangle,
  CheckCircle,
  FileText,
  BarChart3,
  Clock,
  Eye,
  Calendar,
  ClipboardCheck
} from 'lucide-react';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// ESRS Standards
const ESRS_STANDARDS = {
  E1: { name: 'Climate Change', color: 'bg-red-500' },
  E1_EXT: { name: 'Greenhouse Gas Emissions', color: 'bg-orange-500' },
  E2: { name: 'Water & Marine Resources', color: 'bg-blue-500' },
  E5: { name: 'Resource Use & Circular Economy', color: 'bg-green-500' },
  E5_EXT: { name: 'Packaging Circularity', color: 'bg-emerald-500' },
  S1: { name: 'Workforce', color: 'bg-purple-500' },
  S2: { name: 'Workers in Value Chain', color: 'bg-pink-500' },
  S4: { name: 'Consumers & End Users', color: 'bg-yellow-500' },
  G1: { name: 'Business Conduct', color: 'bg-indigo-500' },
};

export default function CSRDReportingPage() {
  const [exportFormat, setExportFormat] = useState<string>('');
  
  // Mock data - will be replaced with actual data from modules
  const mockKPIData = {
    E1: {
      energyKWh: 25430.5,
      energyPerMeal: 0.87,
      scope1Emissions: 1205.3,
      scope2Emissions: 8547.2,
      trend: -8.3
    },
    E1_EXT: {
      co2eTotal: 15234.5,
      scope1CO2e: 1205.3,
      scope2CO2e: 8547.2,
      scope3CO2e: 5482.0,
      trend: -5.2
    },
    E2: {
      waterPerDay: 1250.5,
      waterPerMeal: 0.42,
      trend: -12.5
    },
    E5: {
      wasteKg: 1250.3,
      wasteValue: 1250.30,
      co2eAvoided: 3420.8,
      trend: -15.3
    },
    E5_EXT: {
      recyclablePercent: 78.5,
      reuseRatio: 0.65,
      trend: 2.3
    },
    S1: {
      headcount: 45,
      genderRatio: 0.52,
      avgTrainingHours: 28.5,
      turnoverPercent: 8.5,
      trend: -2.1
    },
    S2: {
      auditedPercent: 82.5,
      certifiedPercent: 65.8,
      esgScore: 4.2,
      trend: 3.4
    },
    S4: {
      menuItemsLabeled: 145,
      totalMenuItems: 180,
      foodSafetyIncidents: 0,
      allergenLabelingPercent: 100,
      trend: 0.0
    },
    G1: {
      policyCoverage: 95.0,
      dataPrivacyCompliance: 100,
      auditLogs: 15420,
      trend: 0.5
    }
  };

  // Energy consumption trend data
  const energyTrendData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Energy Consumption (kWh)',
      data: [28000, 26500, 25800, 25100, 24800, 25430],
      borderColor: 'rgb(239, 68, 68)',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      fill: true,
      tension: 0.4
    }]
  };

  const energyTrendOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: false }
    },
    scales: {
      y: {
        beginAtZero: false,
        title: { display: true, text: 'kWh' }
      }
    }
  };

  // Emissions breakdown
  const emissionsData = {
    labels: ['Scope 1', 'Scope 2', 'Scope 3'],
    datasets: [{
      label: 'CO₂e Emissions',
      data: [1205.3, 8547.2, 5482.0],
      backgroundColor: [
        'rgba(239, 68, 68, 0.8)',
        'rgba(251, 146, 60, 0.8)',
        'rgba(251, 191, 36, 0.8)'
      ],
      borderWidth: 2,
      borderColor: '#ffffff'
    }]
  };

  // Waste by category
  const wasteCategoryData = {
    labels: ['Food Waste', 'Packaging', 'Oil/Waste', 'Other'],
    datasets: [{
      label: 'Waste Volume (kg)',
      data: [450.3, 320.5, 280.2, 199.3],
      backgroundColor: [
        'rgba(34, 197, 94, 0.8)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(251, 191, 36, 0.8)',
        'rgba(156, 163, 175, 0.8)'
      ],
      borderWidth: 2,
      borderColor: '#ffffff'
    }]
  };

  // Benchmark comparison data
  const benchmarkData = {
    labels: ['Our Performance', 'Industry Average', 'EU Target', 'SDG 12.3'],
    datasets: [{
      label: 'Food Waste Reduction %',
      data: [78.5, 62.0, 50.0, 50.0],
      backgroundColor: [
        'rgba(34, 197, 94, 0.8)',
        'rgba(156, 163, 175, 0.8)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(168, 85, 247, 0.8)'
      ],
      borderWidth: 2,
      borderColor: '#ffffff'
    }]
  };

  // Financial correlation
  const financialTrendData = {
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
    datasets: [
      {
        label: 'ESG Cost Savings (€)',
        data: [8500, 9200, 10800, 12500],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        yAxisID: 'y',
        fill: true
      },
      {
        label: 'Operating Costs (€)',
        data: [125000, 128000, 131000, 134000],
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        yAxisID: 'y1',
        fill: true
      }
    ]
  };

  const financialTrendOptions = {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: { display: true },
      title: { display: false }
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: { display: true, text: 'ESG Savings (€)' }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: { display: true, text: 'Operating Costs (€)' },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  // Audit trail mock data
  const auditTrail = [
    {
      id: 1,
      timestamp: '2025-01-15 10:30:00',
      metric: 'E1 - Energy Consumption',
      value: '25430.5 kWh',
      source: 'Smart Meters',
      user: 'System Auto',
      change: '+523.5 kWh',
      status: 'verified'
    },
    {
      id: 2,
      timestamp: '2025-01-15 09:15:00',
      metric: 'E5 - Food Waste',
      value: '1250.3 kg',
      source: 'WasteWatchDog Scanner',
      user: 'Kitchen Staff',
      change: '+45.2 kg',
      status: 'verified'
    },
    {
      id: 3,
      timestamp: '2025-01-15 08:00:00',
      metric: 'E1_EXT - Scope 3 Emissions',
      value: '5482.0 kg CO₂e',
      source: 'Supplier API',
      user: 'System Auto',
      change: 'No change',
      status: 'verified'
    }
  ];

  const generatePDFReport = () => {
    setExportFormat('pdf');
    
    try {
      const doc = new jsPDF();
      let yPos = 20;
      
      // Helper function to add new page if needed
      const checkPageBreak = (requiredSpace: number = 20) => {
        if (yPos + requiredSpace > 270) {
          doc.addPage();
          yPos = 20;
        }
      };

      // Title Page
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('CSRD Waste Recording Report', 105, yPos, { align: 'center' });
      
      yPos += 10;
      doc.setFontSize(16);
      doc.setFont('helvetica', 'normal');
      doc.text('ESRS E5 Compliant Sustainability Report', 105, yPos, { align: 'center' });
      
      yPos += 15;
      doc.setFontSize(12);
      doc.text(`Report Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 105, yPos, { align: 'center' });
      
      yPos += 5;
      doc.text(`Reporting Period: 2024 Q4`, 105, yPos, { align: 'center' });
      
      yPos += 10;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.text('This report is generated in compliance with European Sustainability Reporting Standards (ESRS)', 105, yPos, { align: 'center', maxWidth: 180 });
      
      // Section 1: Report Information
      checkPageBreak(40);
      yPos += 20;
      doc.addPage();
      yPos = 20;
      
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('1. Report Information', 20, yPos);
      
      yPos += 10;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text('Reporting Period: 2024 Q4', 20, yPos);
      yPos += 6;
      doc.text('Report Type: CSRD Waste Recording - ESRS E5 Compliant', 20, yPos);
      yPos += 6;
      doc.text(`Report Date: ${new Date().toLocaleDateString()}`, 20, yPos);
      yPos += 6;
      doc.text('Report Status: Draft', 20, yPos);
      
      // Section 2: Executive Summary
      checkPageBreak(50);
      yPos += 20;
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('2. Executive Summary', 20, yPos);
      
      yPos += 10;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      
      // Summary stats
      doc.setFont('helvetica', 'bold');
      doc.text('Key Metrics:', 20, yPos);
      yPos += 7;
      doc.setFont('helvetica', 'normal');
      doc.text(`• Total Waste Generated: ${mockKPIData.E5.wasteKg.toFixed(1)} kg (Material Value: €${mockKPIData.E5.wasteValue.toFixed(2)})`, 20, yPos);
      yPos += 7;
      doc.text(`• Waste Reduction: ${Math.abs(mockKPIData.E5.trend)}% vs previous period`, 20, yPos);
      yPos += 7;
      doc.text(`• CO₂e Avoided: ${mockKPIData.E5.co2eAvoided.toFixed(1)} kg`, 20, yPos);
      
      yPos += 10;
      doc.setFont('helvetica', 'bold');
      doc.text('Key Highlights:', 20, yPos);
      yPos += 7;
      doc.setFont('helvetica', 'normal');
      doc.text(`• Achieved ${Math.abs(mockKPIData.E5.trend)}% reduction in food waste through WasteWatchDog AI monitoring`, 20, yPos);
      yPos += 7;
      doc.text(`• Prevented ${mockKPIData.E5.co2eAvoided.toFixed(0)} kg of CO₂e emissions through waste reduction initiatives`, 20, yPos);
      yPos += 7;
      doc.text(`• ${mockKPIData.E5_EXT.recyclablePercent}% of packaging materials are recyclable`, 20, yPos);
      yPos += 7;
      doc.text(`• ${mockKPIData.S4.allergenLabelingPercent}% of menu items labeled with allergen information`, 20, yPos);
      
      // Section 3: Introduction & Scope
      checkPageBreak(60);
      yPos += 20;
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('3. Introduction & Scope', 20, yPos);
      
      yPos += 10;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      
      doc.setFont('helvetica', 'bold');
      doc.text('Organizational Context:', 20, yPos);
      yPos += 7;
      doc.setFont('helvetica', 'normal');
      doc.text('This report presents comprehensive waste management data for our restaurant operations, aligned with', 20, yPos);
      yPos += 5;
      doc.text('ESRS E5 (Resource Use & Circular Economy) standards. Our sustainability commitment focuses on minimizing', 20, yPos);
      yPos += 5;
      doc.text('food waste, promoting circular economy principles, and ensuring transparent reporting.', 20, yPos);
      
      yPos += 10;
      doc.setFont('helvetica', 'bold');
      doc.text('Reporting Scope:', 20, yPos);
      yPos += 7;
      doc.setFont('helvetica', 'normal');
      doc.text('• Geographic Scope: All restaurant locations within EU operations', 20, yPos);
      yPos += 7;
      doc.text('• Operational Scope: Kitchen waste, packaging materials, and food by-products', 20, yPos);
      yPos += 7;
      doc.text('• Methodology: AI-powered waste tracking, manual verification, and third-party audits', 20, yPos);
      yPos += 7;
      doc.text('• Data Sources: WasteWatchDog automated scanning, POS integration, and inventory management', 20, yPos);
      
      // Section 4: Materiality Assessment
      checkPageBreak(60);
      yPos += 20;
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('4. Materiality Assessment (Double Materiality)', 20, yPos);
      
      yPos += 10;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      
      doc.setFont('helvetica', 'bold');
      doc.text('Impact Materiality Assessment:', 20, yPos);
      yPos += 7;
      doc.setFont('helvetica', 'normal');
      doc.text('• Food Waste Impact: HIGH - Environmental impact (greenhouse gas emissions, resource depletion)', 20, yPos);
      yPos += 7;
      doc.text('• Packaging Circularity: MODERATE - Waste generation, resource efficiency', 20, yPos);
      
      yPos += 10;
      doc.setFont('helvetica', 'bold');
      doc.text('Financial Materiality Assessment:', 20, yPos);
      yPos += 7;
      doc.setFont('helvetica', 'normal');
      doc.text(`• Cost of Waste Disposal: MEDIUM RISK - €${mockKPIData.E5.wasteValue.toFixed(2)} material value lost`, 20, yPos);
      yPos += 7;
      doc.text('• Regulatory Compliance: HIGH RISK - CSRD reporting requirements, EU waste regulations', 20, yPos);
      
      // Section 5: Policies, Governance & Objectives
      checkPageBreak(80);
      yPos += 20;
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('5. Policies, Governance & Objectives', 20, yPos);
      
      yPos += 10;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      
      doc.setFont('helvetica', 'bold');
      doc.text('Waste Management Policy:', 20, yPos);
      yPos += 7;
      doc.setFont('helvetica', 'normal');
      doc.text('• Zero food waste to landfill by 2026', 20, yPos);
      yPos += 7;
      doc.text('• 50% waste reduction vs 2023 baseline', 20, yPos);
      yPos += 7;
      doc.text('• Full traceability through AI tracking', 20, yPos);
      
      yPos += 10;
      doc.setFont('helvetica', 'bold');
      doc.text('Governance Structure:', 20, yPos);
      yPos += 7;
      doc.setFont('helvetica', 'normal');
      doc.text('• Sustainability Committee (monthly reviews)', 20, yPos);
      yPos += 7;
      doc.text('• Waste Management Officer (dedicated role)', 20, yPos);
      yPos += 7;
      doc.text('• Internal audit quarterly', 20, yPos);
      
      yPos += 10;
      doc.setFont('helvetica', 'bold');
      doc.text('Performance Objectives & Targets:', 20, yPos);
      yPos += 7;
      doc.setFont('helvetica', 'normal');
      doc.text('• SDG 12.3 Target: 50% reduction by 2030 (Current: 78% achieved)', 20, yPos);
      yPos += 7;
      doc.text(`• Packaging Recyclability: Target 90% by 2025 (Current: ${mockKPIData.E5_EXT.recyclablePercent}%)`, 20, yPos);
      yPos += 7;
      doc.text(`• Carbon Impact: Target 5000 kg CO₂e avoided (Current: ${mockKPIData.E5.co2eAvoided.toFixed(0)} kg)`, 20, yPos);
      
      // Section 6: Quantitative Waste Data
      checkPageBreak(50);
      yPos += 20;
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('6. Quantitative Waste Data (by Category)', 20, yPos);
      
      yPos += 10;
      
      // Waste data table
      autoTable(doc, {
        startY: yPos,
        head: [['Category', 'Volume (kg)', 'Value (€)', 'CO₂e (kg)', 'Recyclability', 'Status']],
        body: [
          ['Food Waste', '450.3', '450.30', '1,125.8', 'Compostable', '✓'],
          ['Packaging Materials', '320.5', '320.50', '128.2', `${mockKPIData.E5_EXT.recyclablePercent}% Recyclable`, '✓'],
          ['Used Cooking Oil', '280.2', '280.20', '0.0', 'Biodiesel', '✓'],
          ['TOTAL', mockKPIData.E5.wasteKg.toFixed(1), `€${mockKPIData.E5.wasteValue.toFixed(2)}`, mockKPIData.E5.co2eAvoided.toFixed(1), '-', '-']
        ],
        theme: 'striped',
        headStyles: { fillColor: [52, 73, 85], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 10 },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 30, halign: 'right' },
          2: { cellWidth: 30, halign: 'right' },
          3: { cellWidth: 30, halign: 'right' },
          4: { cellWidth: 35 },
          5: { cellWidth: 20, halign: 'center' }
        }
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 15;
      
      // Footer on last page
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.text(
          `CSRD Waste Recording Report - Page ${i} of ${pageCount}`,
          105,
          285,
          { align: 'center' }
        );
        doc.text(
          `Generated by IOMS WasteWatchDog System - Confidential`,
          105,
          292,
          { align: 'center' }
        );
      }
      
      // Save PDF
      const fileName = `CSRD_Waste_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      // Reset export state
      setTimeout(() => {
        setExportFormat('');
        alert('PDF report generated successfully!');
      }, 500);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF report. Please try again.');
      setExportFormat('');
    }
  };

  const handleExport = (format: string) => {
    if (format === 'pdf') {
      generatePDFReport();
    } else {
      setExportFormat(format);
      // Simulate export process for other formats
      console.log(`Exporting report in ${format} format...`);
      setTimeout(() => {
        alert(`${format.toUpperCase()} export completed successfully!`);
        setExportFormat('');
      }, 2000);
    }
  };

  const KPICard = ({ 
    standard, 
    title, 
    value, 
    unit, 
    trend, 
    icon: Icon,
    subtitle 
  }: {
    standard: keyof typeof ESRS_STANDARDS;
    title: string;
    value: string | number;
    unit?: string;
    trend?: number;
    icon: any;
    subtitle?: string;
  }) => {
    const isPositive = trend === undefined || trend <= 0;
    return (
      <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
        <div className={`absolute top-0 right-0 w-32 h-32 ${ESRS_STANDARDS[standard].color} opacity-10 rounded-bl-full`} />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="text-2xl font-bold mb-1">
            {typeof value === 'number' ? value.toLocaleString('en-US', { maximumFractionDigits: 1 }) : value}
            {unit && <span className="text-lg text-muted-foreground ml-1">{unit}</span>}
          </div>
          {subtitle && <p className="text-xs text-muted-foreground mb-2">{subtitle}</p>}
          {trend !== undefined && (
            <div className={`flex items-center text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? <TrendingDown className="h-3 w-3 mr-1" /> : <TrendingUp className="h-3 w-3 mr-1" />}
              <span>{Math.abs(trend)}% vs previous period</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto space-y-4 px-6 py-4">
        {/* Professional Header */}
        <div className="bg-white rounded border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 rounded flex items-center justify-center">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-semibold text-gray-900">CSRD Waste Recording Report</h1>
                    <p className="text-sm text-gray-600">ESRS E5 Compliant Sustainability Reporting</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="border-green-300 text-green-700 bg-green-50">
                  <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                  Operational
                </Badge>
                <Button 
                  onClick={() => handleExport('pdf')} 
                  disabled={exportFormat === 'pdf'}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4"
                >
                  {exportFormat === 'pdf' ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Generating
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Export PDF
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className="border border-gray-200 shadow-sm bg-white rounded">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Data Accuracy</p>
                  <p className="text-3xl font-bold text-gray-900 mb-1">99.2%</p>
                  <p className="text-xs text-gray-500">Target: ≥99%</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded flex items-center justify-center">
                  <Target className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-gray-200 shadow-sm bg-white rounded">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Last Report</p>
                  <p className="text-3xl font-bold text-gray-900 mb-1">2h ago</p>
                  <p className="text-xs text-gray-500">45s generation time</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded flex items-center justify-center">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-gray-200 shadow-sm bg-white rounded">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Audit Records</p>
                  <p className="text-3xl font-bold text-gray-900 mb-1">15,420</p>
                  <p className="text-xs text-gray-500">Full traceability</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded flex items-center justify-center">
                  <Shield className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="report" className="space-y-4">
          <div className="bg-white rounded shadow-sm border border-gray-200 p-1">
            <TabsList className="grid w-full grid-cols-6 bg-transparent gap-1">
              <TabsTrigger value="report" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:font-semibold text-sm">CSRD Report</TabsTrigger>
              <TabsTrigger value="overview" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:font-semibold text-sm">Overview</TabsTrigger>
              <TabsTrigger value="emissions" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:font-semibold text-sm">Emissions</TabsTrigger>
              <TabsTrigger value="waste" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:font-semibold text-sm">Waste</TabsTrigger>
              <TabsTrigger value="workforce" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:font-semibold text-sm">Workforce</TabsTrigger>
              <TabsTrigger value="audit" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:font-semibold text-sm">Audit</TabsTrigger>
            </TabsList>
          </div>

          {/* CSRD Report Generator Tab */}
          <TabsContent value="report" className="space-y-6">
            {/* Section 1: Report Information */}
            <Card className="border border-gray-200 shadow-sm rounded">
              <CardHeader className="border-b border-gray-200 px-5 py-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-900">
                    <span className="bg-indigo-600 text-white w-8 h-8 rounded flex items-center justify-center font-semibold text-sm">1</span>
                    Report Information
                  </CardTitle>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="px-3 py-1.5">
                      <ClipboardCheck className="w-4 h-4 mr-1.5" />
                      ESRS E5 Compliant
                    </Badge>
                    <Badge variant="success" className="px-3 py-1.5">
                      <CheckCircle className="w-4 h-4 mr-1.5" />
                      Draft
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="max-w-4xl mx-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-indigo-600" />
                        Reporting Period
                      </label>
                      <select className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all text-sm font-medium bg-white hover:border-gray-300">
                        <option>2024 Q1</option>
                        <option>2024 Q2</option>
                        <option>2024 Q3</option>
                        <option>2024 Q4</option>
                        <option>2024 Full Year</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">Select the time period for this report</p>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-600" />
                        Report Date
                      </label>
                      <input 
                        type="date" 
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all text-sm font-medium bg-white hover:border-gray-300" 
                        defaultValue={new Date().toISOString().split('T')[0]} 
                      />
                      <p className="text-xs text-gray-500 mt-1">Date when this report was generated</p>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <Users className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Prepared by</p>
                        <p className="text-xs text-gray-600">Waste Management Team • Last updated 2 hours ago</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 2: Executive Summary */}
            <Card className="border border-gray-200 shadow-sm rounded">
              <CardHeader className="border-b border-gray-200 px-5 py-4">
                <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-900">
                  <span className="bg-indigo-600 text-white w-8 h-8 rounded flex items-center justify-center font-semibold text-sm">2</span>
                  Executive Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="border border-gray-200 rounded p-4 bg-white">
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">Total Waste Generated</p>
                    <p className="text-3xl font-bold text-gray-900 mb-1">{mockKPIData.E5.wasteKg.toFixed(1)} kg</p>
                    <p className="text-xs text-gray-500">Material value: €{mockKPIData.E5.wasteValue.toFixed(2)}</p>
                  </div>
                  <div className="border border-gray-200 rounded p-4 bg-white">
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">Waste Reduction</p>
                    <p className="text-3xl font-bold text-green-600 mb-1">{Math.abs(mockKPIData.E5.trend)}%</p>
                    <p className="text-xs text-gray-500">vs previous period</p>
                  </div>
                  <div className="border border-gray-200 rounded p-4 bg-white">
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">CO₂e Avoided</p>
                    <p className="text-3xl font-bold text-blue-600 mb-1">{mockKPIData.E5.co2eAvoided.toFixed(1)} kg</p>
                    <p className="text-xs text-gray-500">Environmental impact</p>
                  </div>
                </div>
                <div className="border border-blue-200 rounded bg-blue-50 p-4">
                  <h3 className="font-semibold text-blue-900 mb-3 text-base">Key Highlights</h3>
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li className="flex items-start"><CheckCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" /> Achieved {Math.abs(mockKPIData.E5.trend)}% reduction in food waste through WasteWatchDog AI monitoring</li>
                    <li className="flex items-start"><CheckCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" /> Prevented {mockKPIData.E5.co2eAvoided.toFixed(0)} kg of CO₂e emissions through waste reduction initiatives</li>
                    <li className="flex items-start"><CheckCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" /> {mockKPIData.E5_EXT.recyclablePercent}% of packaging materials are recyclable</li>
                    <li className="flex items-start"><CheckCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" /> {mockKPIData.S4.allergenLabelingPercent}% of menu items labeled with allergen information</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Section 3: Introduction & Scope */}
            <Card className="border border-gray-200 shadow-sm rounded">
              <CardHeader className="border-b border-gray-200 px-5 py-4">
                <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-900">
                  <span className="bg-indigo-600 text-white w-8 h-8 rounded flex items-center justify-center font-semibold text-sm">3</span>
                  Introduction & Scope
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="border border-gray-200 rounded bg-gray-50 p-5 space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 text-base">Organizational Context</h3>
                    <p className="text-sm text-gray-700 leading-relaxed">This report presents comprehensive waste management data for our restaurant operations, aligned with ESRS E5 (Resource Use & Circular Economy) standards. Our sustainability commitment focuses on minimizing food waste, promoting circular economy principles, and ensuring transparent reporting.</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 text-base">Reporting Scope</h3>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-start"><span className="mr-2">•</span> <strong>Geographic Scope:</strong> All restaurant locations within EU operations</li>
                      <li className="flex items-start"><span className="mr-2">•</span> <strong>Operational Scope:</strong> Kitchen waste, packaging materials, and food by-products</li>
                      <li className="flex items-start"><span className="mr-2">•</span> <strong>Methodology:</strong> AI-powered waste tracking, manual verification, and third-party audits</li>
                      <li className="flex items-start"><span className="mr-2">•</span> <strong>Data Sources:</strong> WasteWatchDog automated scanning, POS integration, and inventory management</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 4: Materiality Assessment */}
            <Card className="border border-gray-200 shadow-sm rounded">
              <CardHeader className="border-b border-gray-200 px-5 py-4">
                <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-900">
                  <span className="bg-indigo-600 text-white w-8 h-8 rounded flex items-center justify-center font-semibold text-sm">4</span>
                  Materiality Assessment (Double Materiality)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="border border-orange-200 rounded bg-orange-50 p-5 mb-4">
                  <h3 className="font-semibold text-orange-900 mb-4 text-base">Impact Materiality Assessment</h3>
                  <div className="space-y-3">
                    <div className="flex items-start justify-between bg-white p-3 rounded border border-orange-100">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm mb-1">Food Waste Impact</p>
                        <p className="text-xs text-gray-600">High environmental impact - greenhouse gas emissions, resource depletion</p>
                      </div>
                      <Badge variant="warning" className="ml-3">High Impact</Badge>
                    </div>
                    <div className="flex items-start justify-between bg-white p-3 rounded border border-orange-100">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm mb-1">Packaging Circularity</p>
                        <p className="text-xs text-gray-600">Moderate impact - waste generation, resource efficiency</p>
                      </div>
                      <Badge variant="outline" className="border-orange-300 text-orange-700 ml-3">Moderate</Badge>
                    </div>
                  </div>
                </div>
                <div className="border border-blue-200 rounded bg-blue-50 p-5">
                  <h3 className="font-semibold text-blue-900 mb-4 text-base">Financial Materiality Assessment</h3>
                  <div className="space-y-3">
                    <div className="flex items-start justify-between bg-white p-3 rounded border border-blue-100">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm mb-1">Cost of Waste Disposal</p>
                        <p className="text-xs text-gray-600">€{mockKPIData.E5.wasteValue.toFixed(2)} material value lost</p>
                      </div>
                      <Badge variant="secondary" className="ml-3">Medium Risk</Badge>
                    </div>
                    <div className="flex items-start justify-between bg-white p-3 rounded border border-blue-100">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm mb-1">Regulatory Compliance</p>
                        <p className="text-xs text-gray-600">CSRD reporting requirements, EU waste regulations</p>
                      </div>
                      <Badge variant="destructive" className="ml-3">High Risk</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 5: Policies, Governance & Objectives */}
            <Card className="border border-gray-200 shadow-sm rounded">
              <CardHeader className="border-b border-gray-200 px-5 py-4">
                <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-900">
                  <span className="bg-indigo-600 text-white w-8 h-8 rounded flex items-center justify-center font-semibold text-sm">5</span>
                  Policies, Governance & Objectives
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="border border-green-200 rounded bg-green-50 p-5">
                    <h3 className="font-semibold text-gray-900 mb-3 text-base flex items-center gap-2">
                      <Shield className="w-5 h-5 text-green-600" />
                      Waste Management Policy
                    </h3>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-start"><CheckCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-green-600" /> Zero food waste to landfill by 2026</li>
                      <li className="flex items-start"><CheckCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-green-600" /> 50% waste reduction vs 2023 baseline</li>
                      <li className="flex items-start"><CheckCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-green-600" /> Full traceability through AI tracking</li>
                    </ul>
                  </div>
                  <div className="border border-purple-200 rounded bg-purple-50 p-5">
                    <h3 className="font-semibold text-gray-900 mb-3 text-base flex items-center gap-2">
                      <Target className="w-5 h-5 text-purple-600" />
                      Governance Structure
                    </h3>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-start"><Users className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-purple-600" /> Sustainability Committee (monthly reviews)</li>
                      <li className="flex items-start"><Users className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-purple-600" /> Waste Management Officer (dedicated role)</li>
                      <li className="flex items-start"><Users className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-purple-600" /> Internal audit quarterly</li>
                    </ul>
                  </div>
                </div>
                <div className="border border-indigo-200 rounded bg-indigo-50 p-5">
                  <h3 className="font-semibold text-gray-900 mb-4 text-base flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-indigo-600" />
                    Performance Objectives & Targets
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="bg-white p-3 rounded border border-indigo-100">
                      <p className="font-semibold text-gray-900 mb-1 text-xs">SDG 12.3 Target</p>
                      <p className="text-xs text-gray-600 mb-2">50% reduction by 2030</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-indigo-200 rounded-full h-2">
                          <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '78%' }}></div>
                        </div>
                        <span className="text-xs font-bold text-indigo-700">78%</span>
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded border border-indigo-100">
                      <p className="font-semibold text-gray-900 mb-1 text-xs">Packaging Recyclability</p>
                      <p className="text-xs text-gray-600 mb-2">Target: 90% by 2025</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-indigo-200 rounded-full h-2">
                          <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${mockKPIData.E5_EXT.recyclablePercent}%` }}></div>
                        </div>
                        <span className="text-xs font-bold text-indigo-700">{mockKPIData.E5_EXT.recyclablePercent}%</span>
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded border border-indigo-100">
                      <p className="font-semibold text-gray-900 mb-1 text-xs">Carbon Impact</p>
                      <p className="text-xs text-gray-600 mb-2">Target: 5000 kg CO₂e avoided</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-indigo-200 rounded-full h-2">
                          <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${(mockKPIData.E5.co2eAvoided / 5000) * 100}%` }}></div>
                        </div>
                        <span className="text-xs font-bold text-indigo-700">{((mockKPIData.E5.co2eAvoided / 5000) * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 6: Quantitative Waste Data */}
            <Card className="border border-gray-200 shadow-sm rounded">
              <CardHeader className="border-b border-gray-200 px-5 py-4">
                <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-900">
                  <span className="bg-indigo-600 text-white w-8 h-8 rounded flex items-center justify-center font-semibold text-sm">6</span>
                  Quantitative Waste Data (by Category)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="overflow-x-auto border border-gray-200 rounded mb-5">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-300">
                        <th className="text-left p-4 font-semibold text-gray-700 text-sm">Waste Category</th>
                        <th className="text-right p-4 font-semibold text-gray-700 text-sm">Volume (kg)</th>
                        <th className="text-right p-4 font-semibold text-gray-700 text-sm">Value (€)</th>
                        <th className="text-right p-4 font-semibold text-gray-700 text-sm">CO₂e Impact (kg)</th>
                        <th className="text-center p-4 font-semibold text-gray-700 text-sm">Recyclability</th>
                        <th className="text-center p-4 font-semibold text-gray-700 text-sm">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="p-4 font-medium text-gray-900 text-sm">Food Waste</td>
                        <td className="p-4 text-right text-sm">{450.3}</td>
                        <td className="p-4 text-right text-sm">€{450.30.toFixed(2)}</td>
                        <td className="p-4 text-right text-sm">1,125.8</td>
                        <td className="p-4 text-center"><Badge variant="success">Compostable</Badge></td>
                        <td className="p-4 text-center"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                      </tr>
                      <tr className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="p-4 font-medium text-gray-900 text-sm">Packaging Materials</td>
                        <td className="p-4 text-right text-sm">{320.5}</td>
                        <td className="p-4 text-right text-sm">€{320.50.toFixed(2)}</td>
                        <td className="p-4 text-right text-sm">{320.5 * 0.4}</td>
                        <td className="p-4 text-center"><Badge variant="outline" className="border-blue-300 text-blue-700 bg-blue-50">{mockKPIData.E5_EXT.recyclablePercent}% Recyclable</Badge></td>
                        <td className="p-4 text-center"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                      </tr>
                      <tr className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="p-4 font-medium text-gray-900 text-sm">Used Cooking Oil</td>
                        <td className="p-4 text-right text-sm">{280.2}</td>
                        <td className="p-4 text-right text-sm">€{280.20.toFixed(2)}</td>
                        <td className="p-4 text-right text-sm">0.0</td>
                        <td className="p-4 text-center"><Badge variant="secondary">Biodiesel</Badge></td>
                        <td className="p-4 text-center"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                      </tr>
                      <tr className="bg-gray-50 border-t-2 border-gray-300">
                        <td className="p-4 font-bold text-gray-900">TOTAL</td>
                        <td className="p-4 text-right font-bold">{mockKPIData.E5.wasteKg.toFixed(1)}</td>
                        <td className="p-4 text-right font-bold">€{mockKPIData.E5.wasteValue.toFixed(2)}</td>
                        <td className="p-4 text-right font-bold">{mockKPIData.E5.co2eAvoided.toFixed(1)}</td>
                        <td className="p-4 text-center">-</td>
                        <td className="p-4 text-center">-</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-gray-200 rounded">
                    <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
                      <h3 className="font-semibold text-gray-900 text-base">Waste Distribution</h3>
                    </div>
                    <div className="p-4">
                      <div className="h-64">
                        <Pie data={wasteCategoryData} options={{ responsive: true, maintainAspectRatio: false }} />
                      </div>
                    </div>
                  </div>
                  <div className="border border-gray-200 rounded">
                    <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
                      <h3 className="font-semibold text-gray-900 text-base">Trend Analysis</h3>
                    </div>
                    <div className="p-4">
                      <div className="h-64">
                        <Line data={energyTrendData} options={energyTrendOptions} />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Export Section */}
            <Card className="border border-gray-200 shadow-sm rounded">
              <CardHeader className="border-b border-gray-200 px-5 py-4">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  Export Report
                </CardTitle>
                <CardDescription className="text-sm text-gray-600 mt-1">Download your comprehensive CSRD report in multiple formats</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-28 flex-col border border-gray-300 hover:bg-blue-50 hover:border-blue-400"
                    onClick={() => handleExport('pdf')}
                    disabled={exportFormat === 'pdf'}
                  >
                    {exportFormat === 'pdf' ? (
                      <>
                        <Clock className="w-6 h-6 mb-2 animate-spin text-blue-600" />
                        <span className="text-sm font-medium">Generating...</span>
                      </>
                    ) : (
                      <>
                        <FileText className="w-6 h-6 mb-2 text-blue-600" />
                        <span className="text-sm font-medium">PDF Report</span>
                        <span className="text-xs text-gray-500 mt-1">Complete document</span>
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-28 flex-col border border-gray-300 hover:bg-green-50 hover:border-green-400"
                    onClick={() => handleExport('csv')}
                    disabled={exportFormat === 'csv'}
                  >
                    {exportFormat === 'csv' ? (
                      <>
                        <Clock className="w-6 h-6 mb-2 animate-spin text-green-600" />
                        <span className="text-sm font-medium">Generating...</span>
                      </>
                    ) : (
                      <>
                        <FileText className="w-6 h-6 mb-2 text-green-600" />
                        <span className="text-sm font-medium">CSV Export</span>
                        <span className="text-xs text-gray-500 mt-1">Data tables</span>
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-28 flex-col border border-gray-300 hover:bg-purple-50 hover:border-purple-400"
                    onClick={() => handleExport('xbrl')}
                    disabled={exportFormat === 'xbrl'}
                  >
                    {exportFormat === 'xbrl' ? (
                      <>
                        <Clock className="w-6 h-6 mb-2 animate-spin text-purple-600" />
                        <span className="text-sm font-medium">Generating...</span>
                      </>
                    ) : (
                      <>
                        <FileText className="w-6 h-6 mb-2 text-purple-600" />
                        <span className="text-sm font-medium">XBRL Format</span>
                        <span className="text-xs text-gray-500 mt-1">ESRS compliant</span>
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* E1 - Energy Consumption */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-red-600" />
                      E1 - Energy Consumption
                    </CardTitle>
                    <CardDescription>Total energy usage and efficiency metrics</CardDescription>
                  </div>
                  <Badge variant="outline" className="border-red-300 text-red-700">ESRS E1</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Total kWh</p>
                    <p className="text-2xl font-bold">{mockKPIData.E1.energyKWh.toLocaleString()}</p>
                    <p className="text-xs text-green-600 flex items-center mt-1">
                      <TrendingDown className="h-3 w-3 mr-1" /> {Math.abs(mockKPIData.E1.trend)}% ↓
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Energy per Meal</p>
                    <p className="text-2xl font-bold">{mockKPIData.E1.energyPerMeal}</p>
                    <p className="text-xs text-muted-foreground">kWh/meal</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Scope 1 Emissions</p>
                    <p className="text-2xl font-bold">{mockKPIData.E1.scope1Emissions.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">kg CO₂e</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Scope 2 Emissions</p>
                    <p className="text-2xl font-bold">{mockKPIData.E1.scope2Emissions.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">kg CO₂e</p>
                  </div>
                </div>
                <div className="h-64">
                  <Line data={energyTrendData} options={energyTrendOptions} />
                </div>
              </CardContent>
            </Card>

            {/* E1 Extension - GHG Emissions */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Leaf className="h-5 w-5 text-orange-600" />
                      E1 Extension - Greenhouse Gas Emissions
                    </CardTitle>
                    <CardDescription>Complete carbon footprint across all scopes</CardDescription>
                  </div>
                  <Badge variant="outline" className="border-orange-300 text-orange-700">ESRS E1-Ext</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Total CO₂e</p>
                    <p className="text-3xl font-bold">{mockKPIData.E1_EXT.co2eTotal.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mb-4">kg CO₂e</p>
                    <p className="text-xs text-green-600 flex items-center">
                      <TrendingDown className="h-3 w-3 mr-1" /> {Math.abs(mockKPIData.E1_EXT.trend)}% reduction
                    </p>
                  </div>
                  <div className="h-48">
                    <Pie data={emissionsData} options={{ responsive: true, maintainAspectRatio: false }} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Benchmark Comparison */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  Performance Benchmarking
                </CardTitle>
                <CardDescription>Compare against industry standards and regulatory targets</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <Bar data={benchmarkData} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Emissions Tab */}
          <TabsContent value="emissions" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <KPICard
                standard="E1"
                title="Total Energy Consumption"
                value={mockKPIData.E1.energyKWh}
                unit="kWh"
                trend={mockKPIData.E1.trend}
                icon={Zap}
                subtitle="Period: Last month"
              />
              <KPICard
                standard="E2"
                title="Water Consumption"
                value={mockKPIData.E2.waterPerDay}
                unit="L/day"
                trend={mockKPIData.E2.trend}
                icon={Droplet}
                subtitle={`${mockKPIData.E2.waterPerMeal} L per meal`}
              />
              <KPICard
                standard="E1_EXT"
                title="Scope 3 Emissions"
                value={mockKPIData.E1_EXT.scope3CO2e}
                unit="kg CO₂e"
                trend={mockKPIData.E1_EXT.trend}
                icon={Factory}
                subtitle="Supplier & value chain"
              />
              <KPICard
                standard="G1"
                title="Data Privacy Compliance"
                value={mockKPIData.G1.dataPrivacyCompliance}
                unit="%"
                icon={Shield}
                subtitle="GDPR, CCPA compliant"
              />
            </div>
          </TabsContent>

          {/* Waste Tab */}
          <TabsContent value="waste" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <KPICard
                standard="E5"
                title="Food Waste Volume"
                value={mockKPIData.E5.wasteKg}
                unit="kg"
                trend={mockKPIData.E5.trend}
                icon={Leaf}
                subtitle={`€${mockKPIData.E5.wasteValue.toFixed(2)} material value`}
              />
              <KPICard
                standard="E5"
                title="CO₂e Avoided"
                value={mockKPIData.E5.co2eAvoided}
                unit="kg"
                icon={Target}
                subtitle="Through waste reduction"
              />
              <KPICard
                standard="E5_EXT"
                title="Recyclable %"
                value={mockKPIData.E5_EXT.recyclablePercent}
                unit="%"
                trend={mockKPIData.E5_EXT.trend}
                icon={BarChart3}
                subtitle="Packaging circularity"
              />
              <KPICard
                standard="S4"
                title="Menu Transparency"
                value={mockKPIData.S4.menuItemsLabeled}
                unit={`/${mockKPIData.S4.totalMenuItems}`}
                icon={FileText}
                subtitle="100% allergen labeled"
              />
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Waste by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <Pie data={wasteCategoryData} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Workforce Tab */}
          <TabsContent value="workforce" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <KPICard
                standard="S1"
                title="Total Headcount"
                value={mockKPIData.S1.headcount}
                icon={Users}
                subtitle={`${(mockKPIData.S1.genderRatio * 100).toFixed(1)}% female ratio`}
              />
              <KPICard
                standard="S1"
                title="Avg Training Hours"
                value={mockKPIData.S1.avgTrainingHours}
                unit="hrs/employee"
                icon={Target}
                subtitle="Annual training program"
              />
              <KPICard
                standard="S1"
                title="Turnover Rate"
                value={mockKPIData.S1.turnoverPercent}
                unit="%"
                trend={mockKPIData.S1.trend}
                icon={TrendingDown}
                subtitle="Industry avg: 12.5%"
              />
              <KPICard
                standard="S2"
                title="Supplier ESG Score"
                value={mockKPIData.S2.esgScore}
                unit="/5.0"
                trend={mockKPIData.S2.trend}
                icon={Shield}
                subtitle={`${mockKPIData.S2.auditedPercent}% audited`}
              />
            </div>

            {/* Financial Impact */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  ESG Cost Savings vs Operating Costs
                </CardTitle>
                <CardDescription>Financial correlation of sustainability measures</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <Line data={financialTrendData} options={financialTrendOptions} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Trail Tab */}
          <TabsContent value="audit" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Complete Audit Trail</CardTitle>
                    <CardDescription>Timestamp, source ID, and change tracking for all metrics</CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export Audit Log
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {auditTrail.map((entry) => (
                    <div key={entry.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-sm">{entry.metric}</h4>
                            <Badge variant="outline" className={`${entry.status === 'verified' ? 'bg-green-50 text-green-700 border-green-300' : ''}`}>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              {entry.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-muted-foreground">
                            <div>
                              <p className="font-medium text-gray-900">Value</p>
                              <p>{entry.value}</p>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">Source</p>
                              <p className="truncate">{entry.source}</p>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">Change</p>
                              <p>{entry.change}</p>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">Timestamp</p>
                              <p>{entry.timestamp}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

