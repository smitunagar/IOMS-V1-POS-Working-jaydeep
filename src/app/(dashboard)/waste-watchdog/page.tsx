"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { 
  Trash2, 
  Scan, 
  Activity, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Wifi, 
  WifiOff,
  BarChart3,
  PieChart,
  Calendar,
  DollarSign,
  Leaf,
  Target,
  ArrowLeft,
  Upload,
  Camera,
  X,
  Edit,
  Save,
  ClipboardCheck
} from 'lucide-react';
import { useToast } from '@/shared/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { 
  PieChart as RechartsPieChart, 
  Pie as RechartsPie,
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';

const wasteSubsections = [
  {
    id: 'dashboard',
    title: 'WasteWatchDog Dashboard',
    description: 'Monitor and analyze waste',
    icon: BarChart3,
  },
  {
    id: 'scan-waste',
    title: 'Scan Waste',
    description: 'Manual waste scanning',
    icon: Scan,
  },
];

interface WasteItem {
  id: string;
  dishName: string;
  category: string;
  estimatedWeight: string;
  confidence: number;
  timestamp: string;
  imageUrl?: string;
}

export default function WasteWatchDogPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'scanning'>('connected');
  const [activeSubsection, setActiveSubsection] = useState<string>('dashboard');
  
  // Image upload state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<WasteItem | null>(null);
  
  // Saved waste records
  const [wasteRecords, setWasteRecords] = useState<WasteItem[]>([]);
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<Partial<WasteItem>>({});
  
  // Confirmation state
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [useManualEntry, setUseManualEntry] = useState(false);
  
  // Mock data for waste categories - Professional color palette
  const wasteData = [
    { name: 'Food Waste', value: 65, color: '#EF4444' },      // Red-500
    { name: 'Packaging', value: 20, color: '#3B82F6' },       // Blue-500
    { name: 'Other', value: 15, color: '#6B7280' }            // Gray-500
  ];

  const monthlyWasteData = [
    { month: 'Jan', food: 85, packaging: 22, other: 8 },
    { month: 'Feb', food: 78, packaging: 19, other: 7 },
    { month: 'Mar', food: 72, packaging: 18, other: 6 },
    { month: 'Apr', food: 68, packaging: 16, other: 5 },
    { month: 'May', food: 65, packaging: 15, other: 4 }
  ];

  useEffect(() => {
    // Load saved waste records
    loadWasteRecords();
    
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const loadWasteRecords = () => {
    try {
      const stored = localStorage.getItem('waste_records');
      if (stored) {
        setWasteRecords(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading waste records:', error);
    }
  };

  const startEditing = () => {
    if (!analysisResult) return;
    setIsEditing(true);
    setEditedData({
      dishName: analysisResult.dishName,
      category: analysisResult.category,
      estimatedWeight: analysisResult.estimatedWeight,
      confidence: analysisResult.confidence,
    });
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditedData({});
    setUseManualEntry(false);
  };

  const saveEdits = () => {
    if (!analysisResult) return;
    
    // Validate required fields
    if (!editedData.dishName && useManualEntry) {
      toast({
        title: 'Missing Information',
        description: 'Please enter dish name',
        variant: 'destructive',
      });
      return;
    }
    
    if (!editedData.estimatedWeight && useManualEntry) {
      toast({
        title: 'Missing Information',
        description: 'Please enter estimated weight',
        variant: 'destructive',
      });
      return;
    }
    
    const updated: WasteItem = {
      ...analysisResult,
      dishName: editedData.dishName || analysisResult.dishName,
      category: editedData.category || analysisResult.category,
      estimatedWeight: editedData.estimatedWeight || analysisResult.estimatedWeight,
      confidence: editedData.confidence ?? (useManualEntry ? 100 : analysisResult.confidence),
    };
    
    setAnalysisResult(updated);
    setIsEditing(false);
    setEditedData({});
    setUseManualEntry(false);
    
    toast({
      title: 'Updated',
      description: useManualEntry ? 'Manual entry saved' : 'Analysis results updated',
    });
  };

  const saveWasteRecord = () => {
    if (!analysisResult) return;

    try {
      const updatedRecords = [analysisResult, ...wasteRecords];
      localStorage.setItem('waste_records', JSON.stringify(updatedRecords));
      setWasteRecords(updatedRecords);
      
      toast({
        title: 'Success',
        description: 'Waste record saved successfully!',
      });

      // Clear current scan
      clearImage();
      setIsEditing(false);
      
      // Switch to dashboard to show the record
      setActiveSubsection('dashboard');
    } catch (error) {
      console.error('Error saving waste record:', error);
      toast({
        title: 'Error',
        description: 'Failed to save record',
        variant: 'destructive',
      });
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // Reset previous results
      setAnalysisResult(null);
    }
  };

  const handleAnalyzeImage = async () => {
    if (!selectedImage) {
      toast({
        title: 'Error',
        description: 'Please select an image first',
        variant: 'destructive',
      });
      return;
    }

    setIsAnalyzing(true);
    setIsScanning(true);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result as string;

        const response = await fetch('/api/analyzeWaste', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: base64Image,
          }),
        });

        const result = await response.json();

        if (response.ok) {
          const wasteItem: WasteItem = {
            id: `waste-${Date.now()}`,
            dishName: result.dishName || 'Unknown Dish',
            category: result.category || 'Food Waste',
            estimatedWeight: result.estimatedWeight || '0.5 kg',
            confidence: result.confidence || 85,
            timestamp: new Date().toISOString(),
            imageUrl: imagePreview || undefined,
          };

          setAnalysisResult(wasteItem);
          setShowConfirmation(true);
          
          toast({
            title: 'Analysis Complete',
            description: `Identified: ${wasteItem.dishName}`,
          });
        } else {
          throw new Error(result.error || 'Analysis failed');
        }
      };

      reader.readAsDataURL(selectedImage);
    } catch (error) {
      console.error('Image analysis error:', error);
      toast({
        title: 'Error',
        description: 'Failed to analyze image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
      setIsScanning(false);
    }
  };

  const handleManualScan = () => {
    handleAnalyzeImage();
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setAnalysisResult(null);
    setShowConfirmation(false);
    setUseManualEntry(false);
    setIsEditing(false);
    setEditedData({});
  };

  const handleConfirmCorrect = () => {
    setShowConfirmation(false);
    setUseManualEntry(false);
    // Keep the AI results as is
  };

  const handleConfirmIncorrect = () => {
    setShowConfirmation(false);
    setUseManualEntry(true);
    setIsEditing(true);
    if (analysisResult) {
      setEditedData({
        dishName: '',
        category: 'Food Waste',
        estimatedWeight: '',
        confidence: 100,
      });
    }
  };

  if (loading) {
    return (
      
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading WasteWatchDog data...</p>
            </div>
          </div>
        </div>
      
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Back Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.push('/apps-waste-watchdog')}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">WasteWatchDog</h1>
        <p className="text-gray-600">Monitor and reduce food waste with smart tracking</p>
      </div>

      {/* Subsection Navigation - Same as Orders page */}
      <div className="mb-8">
        <div className="grid grid-cols-2 gap-3">
          {wasteSubsections.map((subsection) => {
            const IconComponent = subsection.icon;
            const isActive = activeSubsection === subsection.id;
            
            return (
              <Card 
                key={subsection.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                  isActive ? 'ring-2 ring-green-500 shadow-md' : ''
                }`}
                onClick={() => setActiveSubsection(subsection.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${
                      isActive ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      <IconComponent className={`h-6 w-6 ${
                        isActive ? 'text-green-600' : 'text-gray-700'
                      }`} />
                    </div>
                    <div>
                      <CardTitle className={`text-base font-bold ${
                        isActive ? 'text-green-700' : 'text-gray-800'
                      }`}>
                        {subsection.title}
                      </CardTitle>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Active Subsection Content */}
      {activeSubsection === 'dashboard' && (
        <div className="space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-sm rounded-xl border border-gray-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Total Waste Today</p>
                <p className="text-2xl font-bold text-gray-900">23.4 kg</p>
              </div>
              <div className="p-2 bg-red-100 rounded-lg">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm rounded-xl border border-gray-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Cost Savings</p>
                <p className="text-2xl font-bold text-gray-900">$147</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm rounded-xl border border-gray-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Efficiency Score</p>
                <p className="text-2xl font-bold text-gray-900">87%</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm rounded-xl border border-gray-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">CO₂ Reduced</p>
                <p className="text-2xl font-bold text-gray-900">45.2 kg</p>
              </div>
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Leaf className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-white border border-gray-200 p-1 rounded-lg">
          <TabsTrigger value="overview" className="data-[state=active]:bg-gray-900 data-[state=active]:text-white">
            Overview
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-gray-900 data-[state=active]:text-white">
            Analytics
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-gray-900 data-[state=active]:text-white">
            History
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-gray-900 data-[state=active]:text-white">
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Waste Composition Chart */}
            <Card className="shadow-sm rounded-xl border border-gray-200">
              <CardHeader className="border-b border-gray-200">
                <CardTitle className="flex items-center gap-2 text-base font-bold text-gray-900">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <PieChart className="w-4 h-4 text-gray-700" />
                  </div>
                  Waste Composition
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="mb-4">
                  <ResponsiveContainer width="100%" height={280}>
                    <RechartsPieChart>
                      <RechartsPie
                        data={wasteData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {wasteData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </RechartsPie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          padding: '8px 12px'
                        }}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
                {/* Legend */}
                <div className="flex justify-center gap-4">
                  {wasteData.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="text-sm text-gray-700">
                        {item.name}: <span className="font-semibold">{item.value}%</span>
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Monthly Trends */}
            <Card className="shadow-sm rounded-xl border border-gray-200">
              <CardHeader className="border-b border-gray-200">
                <CardTitle className="flex items-center gap-2 text-base font-bold text-gray-900">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <BarChart3 className="w-4 h-4 text-gray-700" />
                  </div>
                  Monthly Waste Trends
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={monthlyWasteData} barGap={8}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <YAxis 
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '8px 12px'
                      }}
                      cursor={{ fill: '#f9fafb' }}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: '20px' }}
                      iconType="circle"
                    />
                    <Bar dataKey="food" stackId="a" fill="#EF4444" name="Food Waste" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="packaging" stackId="a" fill="#3B82F6" name="Packaging" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="other" stackId="a" fill="#6B7280" name="Other" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="shadow-sm rounded-xl border border-gray-200">
            <CardHeader className="border-b border-gray-200">
              <CardTitle className="flex items-center gap-2 text-base font-bold text-gray-900">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Activity className="w-4 h-4 text-gray-700" />
                </div>
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                {[
                  { time: '2 minutes ago', action: 'Waste scan completed', status: 'success' },
                  { time: '15 minutes ago', action: 'Food waste threshold exceeded', status: 'warning' },
                  { time: '1 hour ago', action: 'Weekly report generated', status: 'info' },
                  { time: '3 hours ago', action: 'System maintenance completed', status: 'success' }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-3">
                      {item.status === 'success' && <CheckCircle className="w-4 h-4 text-green-600" />}
                      {item.status === 'warning' && <AlertCircle className="w-4 h-4 text-yellow-600" />}
                      {item.status === 'info' && <Clock className="w-4 h-4 text-blue-600" />}
                      <span className="text-sm text-gray-700">{item.action}</span>
                    </div>
                    <span className="text-xs text-gray-500">{item.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Waste Records Table */}
          <Card className="shadow-sm rounded-xl border border-gray-200">
            <CardHeader className="border-b border-gray-200">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-base font-bold text-gray-900">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Trash2 className="w-4 h-4 text-gray-700" />
                  </div>
                  Waste Records
                </div>
                <span className="text-sm font-normal text-gray-500">
                  ({wasteRecords.length} items)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {wasteRecords.length === 0 ? (
                <div className="text-center py-12">
                  <Trash2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">No waste records yet</p>
                  <p className="text-sm text-gray-500">Scan waste items to start tracking</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                          Image
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                          Dish Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                          Weight
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                          Confidence
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                          Time
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {wasteRecords.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            {record.imageUrl ? (
                              <img 
                                src={record.imageUrl} 
                                alt={record.dishName}
                                className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                                <Camera className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-semibold text-sm text-gray-900">{record.dishName}</p>
                          </td>
                          <td className="px-6 py-4">
                            <Badge className="bg-red-100 text-red-700 text-xs">
                              {record.category}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-700">{record.estimatedWeight}</p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-full bg-gray-200 rounded-full h-2 max-w-[80px]">
                                <div 
                                  className="bg-green-600 h-2 rounded-full" 
                                  style={{ width: `${record.confidence}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-gray-600">{record.confidence}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-xs text-gray-500">
                              {new Date(record.timestamp).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card className="shadow-sm rounded-xl border border-gray-200">
            <CardContent className="py-12">
              <div className="text-center">
                <BarChart3 className="w-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Advanced Analytics</h3>
                <p className="text-gray-600">Detailed analytics and insights coming soon.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card className="shadow-sm rounded-xl border border-gray-200">
            <CardContent className="py-12">
              <div className="text-center">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Historical Data</h3>
                <p className="text-gray-600">Waste tracking history coming soon.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card className="shadow-sm rounded-xl border border-gray-200">
            <CardHeader className="border-b border-gray-200">
              <CardTitle className="text-base font-bold text-gray-900">Configuration</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Waste Threshold (kg)
                  </label>
                  <Input type="number" defaultValue="25" className="max-w-xs" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Scan Frequency (minutes)
                  </label>
                  <Input type="number" defaultValue="30" className="max-w-xs" />
                </div>
                <Button className="bg-gray-900 hover:bg-gray-800">
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
        </div>
      )}

      {/* Scan Waste Section */}
      {activeSubsection === 'scan-waste' && (
        <div className="space-y-6">
          {/* Connection Status */}
          <Card className="shadow-sm rounded-xl border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${
                    connectionStatus === 'connected' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {connectionStatus === 'connected' ? (
                      <Wifi className="w-6 h-6 text-green-600" />
                    ) : (
                      <WifiOff className="w-6 h-6 text-red-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {connectionStatus === 'connected' ? 'Device Connected' : 'Device Disconnected'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {connectionStatus === 'connected' 
                        ? 'Ready to scan waste items' 
                        : 'Please check your device connection'}
                    </p>
                  </div>
                </div>
                <Badge className={
                  connectionStatus === 'connected' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }>
                  {connectionStatus === 'connected' ? 'Online' : 'Offline'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Image Upload & Analysis */}
          <Card className="shadow-sm rounded-xl border border-gray-200">
            <CardHeader className="border-b border-gray-200">
              <CardTitle className="flex items-center gap-2 text-base font-bold text-gray-900">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Camera className="w-4 h-4 text-gray-700" />
                </div>
                AI Waste Identification
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* Image Upload Area */}
                {!imagePreview ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-gray-400 transition-colors">
                    <div className="space-y-4">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100">
                        <Upload className="w-8 h-8 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-gray-900 mb-1">Upload Waste Image</h3>
                        <p className="text-sm text-gray-600">
                          Take a photo or upload an image of the food waste
                        </p>
                      </div>
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="hidden"
                          id="waste-image-upload"
                        />
                        <label htmlFor="waste-image-upload">
                          <Button 
                            type="button" 
                            className="bg-gray-900 hover:bg-gray-800"
                            onClick={() => document.getElementById('waste-image-upload')?.click()}
                          >
                            <Camera className="w-4 h-4 mr-2" />
                            Choose Image
                          </Button>
                        </label>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Image Preview */}
                    <div className="relative">
                      <img 
                        src={imagePreview} 
                        alt="Waste preview" 
                        className="w-full h-64 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        onClick={clearImage}
                        className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Analyze Button */}
                    {!analysisResult && (
                      <Button 
                        onClick={handleAnalyzeImage}
                        disabled={isAnalyzing}
                        className="w-full bg-gray-900 hover:bg-gray-800 h-12"
                      >
                        {isAnalyzing ? (
                          <>
                            <Clock className="w-4 h-4 mr-2 animate-spin" />
                            Analyzing with AI...
                          </>
                        ) : (
                          <>
                            <Scan className="w-4 h-4 mr-2" />
                            Analyze Waste
                          </>
                        )}
                      </Button>
                    )}

                    {/* Confirmation Step */}
                    {analysisResult && showConfirmation && (
                      <Card className="bg-blue-50 border-blue-200">
                        <CardContent className="p-6">
                          <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <AlertCircle className="w-8 h-8 text-blue-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              Verify Scan Results
                            </h3>
                            <p className="text-sm text-gray-600">
                              Please confirm if the AI analysis is correct
                            </p>
                          </div>

                          <Card className="bg-white border border-blue-200 mb-6">
                            <CardContent className="p-4">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-600">Identified As:</span>
                                  <p className="font-semibold text-gray-900">{analysisResult.dishName}</p>
                                </div>
                                <div>
                                  <span className="text-gray-600">Category:</span>
                                  <p className="font-semibold text-gray-900">{analysisResult.category}</p>
                                </div>
                                <div>
                                  <span className="text-gray-600">Est. Weight:</span>
                                  <p className="font-semibold text-gray-900">{analysisResult.estimatedWeight}</p>
                                </div>
                                <div>
                                  <span className="text-gray-600">Confidence:</span>
                                  <p className="font-semibold text-gray-900">{analysisResult.confidence}%</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          <div className="space-y-3">
                            <Button 
                              onClick={handleConfirmCorrect}
                              className="w-full bg-green-600 hover:bg-green-700 text-white h-12"
                            >
                              <CheckCircle className="w-5 h-5 mr-2" />
                              Yes, This is Correct
                            </Button>
                            <Button 
                              onClick={handleConfirmIncorrect}
                              variant="outline"
                              className="w-full border-2 border-orange-400 text-orange-600 hover:bg-orange-50 h-12"
                            >
                              <AlertCircle className="w-5 h-5 mr-2" />
                              No, Let Me Enter Details Manually
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Manual Entry / Edit Mode */}
                    {analysisResult && !showConfirmation && (useManualEntry || isEditing) && (
                      <Card className="bg-orange-50 border-orange-200">
                        <CardContent className="p-4">
                          <h4 className="font-semibold text-orange-900 mb-4 flex items-center gap-2">
                            <Edit className="w-5 h-5" />
                            {useManualEntry ? 'Enter Waste Details Manually' : 'Edit Analysis Results'}
                          </h4>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="edit-dish-name" className="text-sm font-medium text-gray-700">
                                Dish Name *
                              </Label>
                              <Input
                                id="edit-dish-name"
                                value={editedData.dishName ?? (useManualEntry ? '' : analysisResult.dishName)}
                                onChange={(e) => setEditedData({ ...editedData, dishName: e.target.value })}
                                placeholder="Enter dish name"
                                className="mt-1"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="edit-category" className="text-sm font-medium text-gray-700">
                                  Category *
                                </Label>
                                <Select
                                  value={editedData.category ?? (useManualEntry ? 'Food Waste' : analysisResult.category)}
                                  onValueChange={(value) => setEditedData({ ...editedData, category: value })}
                                >
                                  <SelectTrigger className="mt-1">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Food Waste">Food Waste</SelectItem>
                                    <SelectItem value="Prepared Food">Prepared Food</SelectItem>
                                    <SelectItem value="Raw Ingredients">Raw Ingredients</SelectItem>
                                    <SelectItem value="Vegetables">Vegetables</SelectItem>
                                    <SelectItem value="Meat">Meat</SelectItem>
                                    <SelectItem value="Dairy">Dairy</SelectItem>
                                    <SelectItem value="Bakery">Bakery</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label htmlFor="edit-weight" className="text-sm font-medium text-gray-700">
                                  Estimated Weight *
                                </Label>
                                <Input
                                  id="edit-weight"
                                  value={editedData.estimatedWeight ?? (useManualEntry ? '' : analysisResult.estimatedWeight)}
                                  onChange={(e) => setEditedData({ ...editedData, estimatedWeight: e.target.value })}
                                  placeholder="e.g., 0.8 kg"
                                  className="mt-1"
                                />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button onClick={cancelEditing} variant="outline" className="flex-1">
                                Cancel
                              </Button>
                              <Button onClick={saveEdits} className="flex-1 bg-blue-600 hover:bg-blue-700">
                                <Save className="w-4 h-4 mr-2" />
                                Save Changes
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Final Results (After Confirmation/Edit) */}
                    {analysisResult && !showConfirmation && !isEditing && !useManualEntry && (
                      <Card className="bg-green-50 border-green-200">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-green-900 flex items-center gap-2">
                              <CheckCircle className="w-5 h-5" />
                              Analysis Results
                            </h4>
                            <Button 
                              onClick={startEditing} 
                              variant="outline" 
                              size="sm"
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              Edit
                            </Button>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                            <div>
                              <span className="text-gray-600">Dish Name:</span>
                              <p className="font-semibold text-gray-900">{analysisResult.dishName}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Category:</span>
                              <p className="font-semibold text-gray-900">{analysisResult.category}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Est. Weight:</span>
                              <p className="font-semibold text-gray-900">{analysisResult.estimatedWeight}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Confidence:</span>
                              <p className="font-semibold text-gray-900">{analysisResult.confidence}%</p>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button onClick={clearImage} variant="outline" className="flex-1">
                              Scan Another
                            </Button>
                            <Button onClick={saveWasteRecord} className="flex-1 bg-green-600 hover:bg-green-700">
                              Save to Records
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Scanning Tips */}
          <Card className="shadow-sm rounded-xl border border-gray-200 bg-blue-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">Scanning Tips</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Place waste items on the scanning surface</li>
                    <li>• Ensure proper lighting for accurate detection</li>
                    <li>• Wait for the scan to complete before removing items</li>
                    <li>• Results will be automatically recorded in the dashboard</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
