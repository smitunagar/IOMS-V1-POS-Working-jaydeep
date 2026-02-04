'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppLayout } from '@/shared/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Switch } from '@/shared/components/ui/switch';
import { Slider } from '@/shared/components/ui/slider';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { useToast } from '@/shared/hooks/use-toast';
import { 
  Layout, 
  Grid3X3, 
  Palette, 
  Settings, 
  History, 
  Users, 
  QrCode,
  Download,
  Upload,
  Save,
  Play,
  Square,
  Circle,
  Maximize,
  RotateCcw,
  RotateCw,
  Trash2,
  Copy,
  Move,
  ZoomIn,
  ZoomOut,
  HelpCircle,
  ChefHat,
  Utensils,
  Plus
} from 'lucide-react';

// Simple Table Management Store
interface Table {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  shape: 'round' | 'square' | 'rect';
  capacity: number;
  status: 'available' | 'occupied' | 'reserved';
  zone?: string;
}

interface TableStore {
  tables: Table[];
  selectedTableId: string | null;
  showGrid: boolean;
  gridSize: number;
  addTable: (table: Omit<Table, 'id'>) => void;
  updateTable: (id: string, updates: Partial<Table>) => void;
  deleteTable: (id: string) => void;
  selectTable: (id: string | null) => void;
  toggleGrid: () => void;
  setGridSize: (size: number) => void;
  clearTables: () => void;
}

// Simple Canvas Component
function TableCanvas({ 
  tables, 
  selectedTableId, 
  showGrid, 
  gridSize, 
  onTableClick, 
  onCanvasClick 
}: {
  tables: Table[];
  selectedTableId: string | null;
  showGrid: boolean;
  gridSize: number;
  onTableClick: (tableId: string) => void;
  onCanvasClick: (x: number, y: number) => void;
}) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    if (showGrid) {
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      
      for (let x = 0; x <= canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      
      for (let y = 0; y <= canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    }

    // Draw tables
    tables.forEach(table => {
      const isSelected = table.id === selectedTableId;
      
      ctx.fillStyle = isSelected ? '#3b82f6' : 
                      table.status === 'occupied' ? '#ef4444' :
                      table.status === 'reserved' ? '#f59e0b' : '#10b981';
      ctx.strokeStyle = isSelected ? '#1d4ed8' : '#6b7280';
      ctx.lineWidth = isSelected ? 3 : 2;

      if (table.shape === 'round') {
        const radius = Math.min(table.width, table.height) / 2;
        ctx.beginPath();
        ctx.arc(table.x + radius, table.y + radius, radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillRect(table.x, table.y, table.width, table.height);
        ctx.strokeRect(table.x, table.y, table.width, table.height);
      }

      // Draw table label
      ctx.fillStyle = isSelected ? '#ffffff' : '#000000';
      ctx.font = 'bold 14px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        table.label,
        table.x + table.width / 2,
        table.y + table.height / 2 - 8
      );
      
      // Draw capacity
      ctx.font = '12px Inter, sans-serif';
      ctx.fillText(
        `${table.capacity} seats`,
        table.x + table.width / 2,
        table.y + table.height / 2 + 8
      );
    });

    // Welcome message if no tables
    if (tables.length === 0) {
      ctx.fillStyle = '#6b7280';
      ctx.font = 'bold 20px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        '🏪 Restaurant Floor Plan Designer',
        canvas.width / 2,
        canvas.height / 2 - 40
      );
      ctx.font = '16px Inter, sans-serif';
      ctx.fillText(
        'Click "Add Round Table" or "Add Square Table" to start',
        canvas.width / 2,
        canvas.height / 2 - 10
      );
      ctx.fillText(
        'Click on the canvas to place tables',
        canvas.width / 2,
        canvas.height / 2 + 20
      );
    }
  }, [tables, selectedTableId, showGrid, gridSize]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if click is on a table
    const clickedTable = tables.find(table => {
      if (table.shape === 'round') {
        const radius = Math.min(table.width, table.height) / 2;
        const centerX = table.x + radius;
        const centerY = table.y + radius;
        const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        return distance <= radius;
      } else {
        return x >= table.x && x <= table.x + table.width &&
               y >= table.y && y <= table.y + table.height;
      }
    });

    if (clickedTable) {
      onTableClick(clickedTable.id);
    } else {
      onCanvasClick(x, y);
    }
  };

  return (
    <div className="w-full h-96 border border-gray-200 rounded-lg overflow-hidden bg-white">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair"
        onClick={handleCanvasClick}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}

export default function TableManagementPage() {
  const { toast } = useToast();
  
  // Table store state
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [gridSize, setGridSize] = useState(20);
  const [nextTableNumber, setNextTableNumber] = useState(1);
  const [addingTableType, setAddingTableType] = useState<'round' | 'square' | 'rect' | null>(null);

  // Initialize with sample restaurant layout
  useEffect(() => {
    const sampleTables: Table[] = [
      { id: '1', label: 'T1', x: 100, y: 80, width: 80, height: 80, shape: 'round', capacity: 4, status: 'available' },
      { id: '2', label: 'T2', x: 220, y: 80, width: 80, height: 80, shape: 'square', capacity: 4, status: 'occupied' },
      { id: '3', label: 'T3', x: 340, y: 80, width: 120, height: 80, shape: 'rect', capacity: 6, status: 'available' },
      { id: '4', label: 'T4', x: 100, y: 200, width: 80, height: 80, shape: 'round', capacity: 2, status: 'reserved' },
      { id: '5', label: 'T5', x: 220, y: 200, width: 80, height: 80, shape: 'square', capacity: 8, status: 'available' },
      { id: '6', label: 'Bar', x: 340, y: 200, width: 120, height: 60, shape: 'rect', capacity: 6, status: 'available', zone: 'bar' }
    ];
    setTables(sampleTables);
    setNextTableNumber(7);
  }, []);

  const addTable = useCallback((tableData: Omit<Table, 'id'>) => {
    const newTable: Table = {
      ...tableData,
      id: Date.now().toString(),
      label: `T${nextTableNumber}`
    };
    setTables(prev => [...prev, newTable]);
    setNextTableNumber(prev => prev + 1);
    setSelectedTableId(newTable.id);
    toast({
      title: "Table Added",
      description: `${newTable.label} has been added to your floor plan.`,
    });
  }, [nextTableNumber, toast]);

  const updateTable = useCallback((id: string, updates: Partial<Table>) => {
    setTables(prev => prev.map(table => 
      table.id === id ? { ...table, ...updates } : table
    ));
  }, []);

  const deleteTable = useCallback((id: string) => {
    setTables(prev => prev.filter(table => table.id !== id));
    if (selectedTableId === id) {
      setSelectedTableId(null);
    }
    toast({
      title: "Table Deleted",
      description: "Table has been removed from your floor plan.",
    });
  }, [selectedTableId, toast]);

  const handleCanvasClick = useCallback((x: number, y: number) => {
    if (addingTableType) {
      const tableSize = addingTableType === 'round' ? { width: 80, height: 80 } :
                       addingTableType === 'square' ? { width: 80, height: 80 } :
                       { width: 120, height: 80 };
      
      addTable({
        label: `T${nextTableNumber}`,
        x: Math.max(0, x - tableSize.width / 2),
        y: Math.max(0, y - tableSize.height / 2),
        ...tableSize,
        shape: addingTableType,
        capacity: addingTableType === 'round' ? 4 : addingTableType === 'square' ? 4 : 6,
        status: 'available'
      });
      setAddingTableType(null);
    } else {
      setSelectedTableId(null);
    }
  }, [addingTableType, addTable, nextTableNumber]);

  const selectedTable = tables.find(t => t.id === selectedTableId);

  const totalCapacity = tables.reduce((sum, table) => sum + table.capacity, 0);
  const occupiedTables = tables.filter(t => t.status === 'occupied').length;
  const availableTables = tables.filter(t => t.status === 'available').length;

  return (
    <AppLayout pageTitle="Restaurant Table Management">
      <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <ChefHat className="h-6 w-6 text-blue-600" />
                Restaurant Floor Plan Designer
              </h1>
              <p className="text-gray-600">Design and manage your restaurant's table layout</p>
            </div>
            
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-sm">
                {tables.length} Tables
              </Badge>
              <Badge variant="outline" className="text-sm">
                {totalCapacity} Total Seats
              </Badge>
              <Badge variant={occupiedTables > 0 ? "destructive" : "default"} className="text-sm">
                {occupiedTables} Occupied
              </Badge>
              <Badge variant="secondary" className="text-sm">
                {availableTables} Available
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          
          {/* Left Sidebar - Controls */}
          <div className="w-80 bg-white border-r border-gray-200 p-6 overflow-y-auto">
            <Tabs defaultValue="design" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="design">Design</TabsTrigger>
                <TabsTrigger value="manage">Manage</TabsTrigger>
              </TabsList>
              
              <TabsContent value="design" className="space-y-6">
                
                {/* Add Tables */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Plus className="h-5 w-5" />
                      Add Tables
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button
                      onClick={() => setAddingTableType('round')}
                      variant={addingTableType === 'round' ? 'default' : 'outline'}
                      className="w-full justify-start"
                    >
                      <Circle className="h-4 w-4 mr-2" />
                      Add Round Table (4 seats)
                    </Button>
                    
                    <Button
                      onClick={() => setAddingTableType('square')}
                      variant={addingTableType === 'square' ? 'default' : 'outline'}
                      className="w-full justify-start"
                    >
                      <Square className="h-4 w-4 mr-2" />
                      Add Square Table (4 seats)
                    </Button>
                    
                    <Button
                      onClick={() => setAddingTableType('rect')}
                      variant={addingTableType === 'rect' ? 'default' : 'outline'}
                      className="w-full justify-start"
                    >
                      <Maximize className="h-4 w-4 mr-2" />
                      Add Rectangular Table (6 seats)
                    </Button>
                    
                    {addingTableType && (
                      <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
                        ✨ Click on the canvas to place your {addingTableType} table
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* View Controls */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Grid3X3 className="h-5 w-5" />
                      View Controls
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="show-grid">Show Grid</Label>
                      <Switch
                        id="show-grid"
                        checked={showGrid}
                        onCheckedChange={setShowGrid}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Grid Size: {gridSize}px</Label>
                      <Slider
                        value={[gridSize]}
                        onValueChange={(value) => setGridSize(value[0])}
                        max={40}
                        min={10}
                        step={5}
                        className="w-full"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Selected Table */}
                {selectedTable && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Edit {selectedTable.label}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Table Name</Label>
                        <Input
                          value={selectedTable.label}
                          onChange={(e) => updateTable(selectedTable.id, { label: e.target.value })}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Capacity</Label>
                        <Input
                          type="number"
                          value={selectedTable.capacity}
                          onChange={(e) => updateTable(selectedTable.id, { capacity: parseInt(e.target.value) || 1 })}
                          min="1"
                          max="20"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <div className="grid grid-cols-1 gap-2">
                          {['available', 'occupied', 'reserved'].map((status) => (
                            <Button
                              key={status}
                              onClick={() => updateTable(selectedTable.id, { status: status as any })}
                              variant={selectedTable.status === status ? 'default' : 'outline'}
                              size="sm"
                              className="justify-start"
                            >
                              <div className={`h-3 w-3 rounded-full mr-2 ${
                                status === 'available' ? 'bg-green-500' :
                                status === 'occupied' ? 'bg-red-500' : 'bg-yellow-500'
                              }`} />
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </Button>
                          ))}
                        </div>
                      </div>
                      
                      <Button
                        onClick={() => deleteTable(selectedTable.id)}
                        variant="destructive"
                        size="sm"
                        className="w-full"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Table
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              <TabsContent value="manage" className="space-y-6">
                
                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      onClick={() => {
                        setTables([]);
                        setSelectedTableId(null);
                        setNextTableNumber(1);
                        toast({ title: "All tables cleared", description: "Floor plan has been reset." });
                      }}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear All Tables
                    </Button>
                    
                    <Button
                      onClick={() => {
                        const dataStr = JSON.stringify(tables, null, 2);
                        const dataBlob = new Blob([dataStr], { type: 'application/json' });
                        const url = URL.createObjectURL(dataBlob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = 'restaurant-layout.json';
                        link.click();
                        toast({ title: "Layout exported", description: "Floor plan saved to downloads." });
                      }}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Layout
                    </Button>
                  </CardContent>
                </Card>

                {/* Table List */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">All Tables</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {tables.map((table) => (
                        <div
                          key={table.id}
                          onClick={() => setSelectedTableId(table.id)}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedTableId === table.id 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{table.label}</div>
                              <div className="text-sm text-gray-500">
                                {table.capacity} seats • {table.shape}
                              </div>
                            </div>
                            <div className={`h-3 w-3 rounded-full ${
                              table.status === 'available' ? 'bg-green-500' :
                              table.status === 'occupied' ? 'bg-red-500' : 'bg-yellow-500'
                            }`} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Main Canvas Area */}
          <div className="flex-1 p-6">
            <div className="h-full">
              <TableCanvas
                tables={tables}
                selectedTableId={selectedTableId}
                showGrid={showGrid}
                gridSize={gridSize}
                onTableClick={setSelectedTableId}
                onCanvasClick={handleCanvasClick}
              />
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
