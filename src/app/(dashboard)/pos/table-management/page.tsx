'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Plus,
  RefreshCw
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
    <div className="w-full h-full overflow-hidden bg-gray-50">
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
  const [isLoading, setIsLoading] = useState(true);

  // Load tables from localStorage and sync statuses from backend
  useEffect(() => {
    const loadTables = async () => {
      try {
        const saved = localStorage.getItem('restaurant-tables');
        let localTables: Table[] = [];
        
        if (saved) {
          const parsed = JSON.parse(saved);
          localTables = parsed.tables || [];
          setNextTableNumber(parsed.nextNumber || 1);
        } else {
          // Initialize with sample layout if nothing saved
          localTables = [
            { id: '1', label: 'T1', x: 100, y: 80, width: 80, height: 80, shape: 'round', capacity: 4, status: 'available' },
            { id: '2', label: 'T2', x: 220, y: 80, width: 80, height: 80, shape: 'square', capacity: 4, status: 'available' },
            { id: '3', label: 'T3', x: 340, y: 80, width: 120, height: 80, shape: 'rect', capacity: 6, status: 'available' },
            { id: '4', label: 'T4', x: 100, y: 200, width: 80, height: 80, shape: 'round', capacity: 2, status: 'available' },
            { id: '5', label: 'T5', x: 220, y: 200, width: 80, height: 80, shape: 'square', capacity: 8, status: 'available' },
            { id: '6', label: 'Bar', x: 340, y: 200, width: 120, height: 60, shape: 'rect', capacity: 6, status: 'available', zone: 'bar' }
          ];
          setNextTableNumber(7);
        }
        
        // Fetch current table statuses from backend and merge with local layout
        try {
          const res = await fetch('/api/tables');
          const data = await res.json();
          
          if (data.tables && data.tables.length > 0) {
            console.log('📥 Fetched table statuses from backend:', data.tables);
            
            // Merge backend statuses with local layout
            const mergedTables = localTables.map(localTable => {
              const backendTable = data.tables.find((bt: any) => bt.id === localTable.id);
              if (backendTable) {
                return {
                  ...localTable,
                  status: backendTable.status as 'available' | 'occupied' | 'reserved'
                };
              }
              return localTable;
            });
            
            setTables(mergedTables);
          } else {
            setTables(localTables);
          }
        } catch (error) {
          console.error('Error fetching table statuses:', error);
          setTables(localTables);
        }
      } catch (error) {
        console.error('Error loading tables:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadTables();
  }, []);

  // Save tables to localStorage
  useEffect(() => {
    if (!isLoading && tables.length >= 0) {
      // Save to localStorage
      localStorage.setItem('restaurant-tables', JSON.stringify({
        tables,
        nextNumber: nextTableNumber
      }));
    }
  }, [tables, nextTableNumber, isLoading]);

  const syncTablesWithBackend = async () => {
    try {
      console.log('🔄 Starting table sync to POS...');
      console.log('📋 Tables to sync:', tables);
      
      // Clear all existing tables first
      const clearResponse = await fetch('/api/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear-all' })
      });
      console.log('🗑️ Cleared existing tables:', await clearResponse.json());
      
      // Then sync all current tables
      for (const table of tables) {
        const syncResponse = await fetch('/api/tables', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'sync',
            tableId: table.id,
            number: table.label,
            capacity: table.capacity,
            status: table.status
          })
        });
        const syncData = await syncResponse.json();
        console.log(`✅ Synced table ${table.label}:`, syncData);
      }
      
      console.log('✅ Table sync complete!');
    } catch (error) {
      console.error('❌ Error syncing tables with backend:', error);
    }
  };

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
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700">
              <Layout className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Table Management</h1>
              <p className="text-xs text-gray-500">Design and manage your floor layout</p>
            </div>
          </div>
            
          <div className="flex items-center gap-4 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 text-sm">
              <Grid3X3 className="h-4 w-4 text-gray-500" />
              <span className="font-semibold text-gray-900">{tables.length}</span>
              <span className="text-gray-500">Tables</span>
            </div>
            <div className="w-px h-4 bg-gray-300"></div>
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-gray-500" />
              <span className="font-semibold text-gray-900">{totalCapacity}</span>
              <span className="text-gray-500">Seats</span>
            </div>
            <div className="w-px h-4 bg-gray-300"></div>
            <div className="flex items-center gap-2 text-sm">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span className="font-semibold text-gray-900">{occupiedTables}</span>
              <span className="text-gray-500">Occupied</span>
            </div>
            <div className="w-px h-4 bg-gray-300"></div>
            <div className="flex items-center gap-2 text-sm">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span className="font-semibold text-gray-900">{availableTables}</span>
              <span className="text-gray-500">Available</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Controls */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
          <Tabs defaultValue="design" className="flex-1 flex flex-col overflow-hidden">
            <div className="px-4 pt-4 pb-3 border-b border-gray-200">
              <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1">
                <TabsTrigger value="design" className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs font-medium">Design Mode</TabsTrigger>
                <TabsTrigger value="manage" className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs font-medium">Manage</TabsTrigger>
              </TabsList>
            </div>
              
            <TabsContent value="design" className="flex-1 overflow-y-auto">
              {/* Section Header */}
              <div className="px-4 pt-3 pb-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Add New Tables</h3>
              </div>
              
              {/* Add Tables Options */}
              <div className="px-4 pb-3 space-y-1.5">
                <button
                  onClick={() => setAddingTableType('round')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                    addingTableType === 'round' 
                      ? 'bg-blue-50 border border-blue-200 text-blue-700' 
                      : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${
                    addingTableType === 'round' ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <Circle className={`h-4 w-4 ${addingTableType === 'round' ? 'text-blue-600' : 'text-gray-600'}`} />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium">Round Table</div>
                    <div className="text-xs text-gray-500">4 seats capacity</div>
                  </div>
                </button>
                
                <button
                  onClick={() => setAddingTableType('square')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                    addingTableType === 'square' 
                      ? 'bg-blue-50 border border-blue-200 text-blue-700' 
                      : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${
                    addingTableType === 'square' ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <Square className={`h-4 w-4 ${addingTableType === 'square' ? 'text-blue-600' : 'text-gray-600'}`} />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium">Square Table</div>
                    <div className="text-xs text-gray-500">4 seats capacity</div>
                  </div>
                </button>
                
                <button
                  onClick={() => setAddingTableType('rect')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                    addingTableType === 'rect' 
                      ? 'bg-blue-50 border border-blue-200 text-blue-700' 
                      : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${
                    addingTableType === 'rect' ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <Maximize className={`h-4 w-4 ${addingTableType === 'rect' ? 'text-blue-600' : 'text-gray-600'}`} />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium">Rectangular Table</div>
                    <div className="text-xs text-gray-500">6 seats capacity</div>
                  </div>
                </button>
              </div>
              
              {addingTableType && (
                <div className="mx-4 mb-3">
                  <div className="flex items-start gap-2 text-xs text-blue-700 bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse mt-1.5"></div>
                    <span>Click anywhere on the canvas to place your {addingTableType} table</span>
                  </div>
                </div>
              )}
              
              <div className="h-px bg-gray-200 my-3"></div>

              {/* View Controls */}
              <div className="px-4 pt-1 pb-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">View Settings</h3>
              </div>
              
              <div className="px-4 pb-3 space-y-3">
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <Grid3X3 className="h-4 w-4 text-gray-500" />
                    <Label htmlFor="show-grid" className="text-sm font-medium text-gray-700 cursor-pointer">Show Grid</Label>
                  </div>
                  <Switch
                    id="show-grid"
                    checked={showGrid}
                    onCheckedChange={setShowGrid}
                  />
                </div>
                
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-gray-700">Grid Size</Label>
                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{gridSize}px</span>
                  </div>
                  <Slider
                    value={[gridSize]}
                    onValueChange={(value) => setGridSize(value[0])}
                    max={40}
                    min={10}
                    step={5}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Selected Table */}
              {selectedTable && (
                <>
                  <div className="h-px bg-gray-200 my-3"></div>
                  
                  <div className="px-4 pt-1 pb-2">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Edit Table</h3>
                  </div>
                  
                  <div className="mx-4 mb-4 bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3 pb-3 border-b border-blue-200">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600">
                        <Settings className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{selectedTable.label}</div>
                        <div className="text-xs text-gray-500">{selectedTable.shape} • {selectedTable.capacity} seats</div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-gray-700">Table Name</Label>
                        <Input
                          value={selectedTable.label}
                          onChange={(e) => updateTable(selectedTable.id, { label: e.target.value })}
                          className="h-9 text-sm bg-white"
                        />
                      </div>
                      
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-gray-700">Seat Capacity</Label>
                        <Input
                          type="number"
                          value={selectedTable.capacity}
                          onChange={(e) => updateTable(selectedTable.id, { capacity: parseInt(e.target.value) || 1 })}
                          min="1"
                          max="20"
                          className="h-9 text-sm bg-white"
                        />
                      </div>
                      
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-gray-700">Table Status</Label>
                        <div className="grid grid-cols-1 gap-1.5">
                          {['available', 'occupied', 'reserved'].map((status) => (
                            <button
                              key={status}
                              onClick={() => updateTable(selectedTable.id, { status: status as any })}
                              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                                selectedTable.status === status
                                  ? 'bg-white border-2 border-blue-600 text-blue-700 shadow-sm'
                                  : 'bg-white/50 border border-blue-200 text-gray-700 hover:bg-white hover:border-blue-300'
                              }`}
                            >
                              <div className={`h-2.5 w-2.5 rounded-full ${
                                status === 'available' ? 'bg-green-500' :
                                status === 'occupied' ? 'bg-red-500' : 'bg-yellow-500'
                              }`} />
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => deleteTable(selectedTable.id)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 mt-2 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm font-medium transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete Table
                      </button>
                    </div>
                  </div>
                </>
              )}
            </TabsContent>
            
            <TabsContent value="manage" className="flex-1 overflow-y-auto">
              {/* Quick Actions */}
              <div className="px-4 pt-3 pb-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Quick Actions</h3>
              </div>
              
              <div className="px-4 pb-3 space-y-2">
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/tables');
                      const data = await res.json();
                      
                      if (data.tables && data.tables.length > 0) {
                        // Update table statuses from backend
                        const updatedTables = tables.map(localTable => {
                          const backendTable = data.tables.find((bt: any) => bt.id === localTable.id);
                          if (backendTable) {
                            return {
                              ...localTable,
                              status: backendTable.status as 'available' | 'occupied' | 'reserved'
                            };
                          }
                          return localTable;
                        });
                        
                        setTables(updatedTables);
                        toast({ 
                          title: "Statuses refreshed", 
                          description: "Table statuses updated from POS." 
                        });
                      }
                    } catch (error) {
                      console.error('Error refreshing statuses:', error);
                      toast({ 
                        title: "Refresh failed", 
                        description: "Could not fetch table statuses.",
                        variant: "destructive"
                      });
                    }
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 border border-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/20">
                    <RefreshCw className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-semibold">Refresh Statuses</div>
                    <div className="text-xs text-blue-100">Get latest from POS</div>
                  </div>
                </button>
                
                <button
                  onClick={async () => {
                    await syncTablesWithBackend();
                    toast({ 
                      title: "Tables synced to POS", 
                      description: `${tables.length} tables are now available in POS.` 
                    });
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gradient-to-r from-green-500 to-green-600 border border-green-600 text-white hover:from-green-600 hover:to-green-700 transition-all shadow-sm"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/20">
                    <Upload className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-semibold">Sync to POS</div>
                    <div className="text-xs text-green-100">Update POS tables</div>
                  </div>
                </button>
                
                <button
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
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100">
                    <Download className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium">Export Layout</div>
                    <div className="text-xs text-gray-500">Save as JSON file</div>
                  </div>
                </button>
                
                <button
                  onClick={() => {
                    setTables([]);
                    setSelectedTableId(null);
                    setNextTableNumber(1);
                    toast({ title: "All tables cleared", description: "Floor plan has been reset." });
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white border border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 transition-all"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-100">
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium">Clear All Tables</div>
                    <div className="text-xs text-red-600">Reset floor plan</div>
                  </div>
                </button>
              </div>
              
              <div className="h-px bg-gray-200 my-3"></div>

              {/* Table List */}
              <div className="px-4 pt-1 pb-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">All Tables ({tables.length})</h3>
              </div>
              
              <div className="px-4 pb-4">
                <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
                  {tables.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <Layout className="h-12 w-12 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">No tables yet</p>
                      <p className="text-xs">Add tables in Design Mode</p>
                    </div>
                  ) : (
                    tables.map((table) => (
                      <div
                        key={table.id}
                        onClick={() => setSelectedTableId(table.id)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedTableId === table.id 
                            ? 'border-blue-500 bg-blue-50 shadow-sm' 
                            : 'border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${
                            selectedTableId === table.id ? 'bg-blue-100' : 'bg-gray-100'
                          }`}>
                            {table.shape === 'round' && <Circle className={`h-5 w-5 ${selectedTableId === table.id ? 'text-blue-600' : 'text-gray-600'}`} />}
                            {table.shape === 'square' && <Square className={`h-5 w-5 ${selectedTableId === table.id ? 'text-blue-600' : 'text-gray-600'}`} />}
                            {table.shape === 'rect' && <Maximize className={`h-5 w-5 ${selectedTableId === table.id ? 'text-blue-600' : 'text-gray-600'}`} />}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-gray-900">{table.label}</div>
                            <div className="text-xs text-gray-500">
                              {table.capacity} seats • {table.shape}
                            </div>
                          </div>
                          
                          <div className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${
                            table.status === 'available' ? 'bg-green-500' :
                            table.status === 'occupied' ? 'bg-red-500' : 'bg-yellow-500'
                          }`} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col p-6 bg-gray-50">
          <div className="flex-1 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <TableCanvas
              tables={tables}
              selectedTableId={selectedTableId}
              showGrid={showGrid}
              gridSize={gridSize}
              onTableClick={setSelectedTableId}
              onCanvasClick={handleCanvasClick}
            />
          </div>
          
          {/* Help Text */}
          <div className="mt-4 flex items-center gap-2 text-xs text-gray-500 bg-blue-50 p-3 rounded-md border border-blue-200">
            <HelpCircle className="h-4 w-4 text-blue-600" />
            <span>Click and drag tables to reposition them. Select a table to edit its properties.</span>
          </div>
        </div>
        </div>
      </div>
    
  );
}
