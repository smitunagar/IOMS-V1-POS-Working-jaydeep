'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { 
  Plus, 
  Save, 
  Play, 
  RotateCcw, 
  Upload, 
  Download, 
  Sparkles, 
  Settings,
  Grid3x3,
  Layout,
  CheckCircle,
  Palette,
  Clock
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { AppLayout } from '@/shared/components/layout/AppLayout';

interface Table {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  shape: 'square' | 'round';
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'dirty';
  label: string;
}

export default function TableManagementPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTool, setSelectedTool] = useState<'select' | 'table'>('select');
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [layoutName, setLayoutName] = useState('Default Layout');
  const [activeTab, setActiveTab] = useState('editor');

  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = async () => {
    try {
      const response = await fetch('/api/tables');
      if (response.ok) {
        const data = await response.json();
        setTables(data.tables || []);
      }
    } catch (error) {
      console.error('Failed to load tables:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveTables = async () => {
    try {
      const response = await fetch('/api/tables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tables }),
      });
      
      if (response.ok) {
        alert('Layout saved successfully!');
      }
    } catch (error) {
      console.error('Failed to save tables:', error);
    }
  };

  const addTable = (config?: { shape?: 'square' | 'round' }) => {
    const newTable: Table = {
      id: `table-${Date.now()}`,
      x: 100,
      y: 100,
      width: 80,
      height: 80,
      shape: config?.shape || 'round',
      capacity: 4,
      status: 'available',
      label: `T${tables.length + 1}`
    };
    
    setTables(prev => [...prev, newTable]);
  };

  const updateTable = (updatedTable: Table) => {
    setTables(prev => prev.map(table => 
      table.id === updatedTable.id ? updatedTable : table
    ));
  };

  const deleteTable = (tableId: string) => {
    setTables(prev => prev.filter(table => table.id !== tableId));
    if (selectedTable?.id === tableId) {
      setSelectedTable(null);
    }
  };

  const resetLayout = () => {
    if (confirm('Are you sure you want to reset the layout? This will remove all tables.')) {
      setTables([]);
      setSelectedTable(null);
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Table Management
              </h1>
              <Input
                value={layoutName}
                onChange={(e) => setLayoutName(e.target.value)}
                className="w-64 bg-white/50 border-gray-200/50"
                placeholder="Layout name"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant={selectedTool === 'select' ? 'default' : 'outline'}
                onClick={() => setSelectedTool('select')}
                className="transition-all duration-200"
              >
                Select
              </Button>
              <Button
                variant={selectedTool === 'table' ? 'default' : 'outline'}
                onClick={() => setSelectedTool('table')}
                className="transition-all duration-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Table
              </Button>
              <div className="w-px h-6 bg-gray-300" />
              <Button
                variant="outline"
                onClick={resetLayout}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={saveTables}
                className="bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 border-green-200"
              >
                <Save className="w-4 h-4 mr-1" />
                Save Draft
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Canvas */}
          <div className="flex-1 p-4">
            <Card className="h-full">
              <CardContent className="p-0 h-full">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                  <TabsList className="m-4 mb-0">
                    <TabsTrigger value="editor">Editor</TabsTrigger>
                    <TabsTrigger value="tools">Tools</TabsTrigger>
                  </TabsList>

                  <TabsContent value="editor" className="flex-1 p-4">
                    <div className="h-full bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-200 rounded-xl relative overflow-hidden">
                      {/* Tables */}
                      {tables.map((table) => (
                        <div
                          key={table.id}
                          className={`absolute bg-white border-2 rounded-lg shadow-sm cursor-pointer transition-all duration-200 ${
                            selectedTable?.id === table.id
                              ? 'border-blue-500 shadow-lg scale-105'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                          style={{
                            left: `${table.x}px`,
                            top: `${table.y}px`,
                            width: `${table.width}px`,
                            height: `${table.height}px`,
                          }}
                          onClick={() => setSelectedTable(table)}
                        >
                          <div className="flex items-center justify-center h-full text-xs font-medium text-gray-700">
                            Table {table.label}
                          </div>
                        </div>
                      ))}

                      {/* Empty State */}
                      {tables.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                          <div className="text-center">
                            <Grid3x3 className="w-12 h-12 mx-auto mb-2 opacity-30" />
                            <p className="text-sm">Click "Add Table" to start designing your floor plan</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="tools" className="flex-1 p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        variant="outline"
                        onClick={() => addTable({ shape: 'square' })}
                        className="h-24 flex flex-col gap-2 border-dashed"
                      >
                        <div className="w-8 h-8 bg-blue-100 rounded"></div>
                        <span className="text-xs">Square Table</span>
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => addTable({ shape: 'round' })}
                        className="h-24 flex flex-col gap-2 border-dashed"
                      >
                        <div className="w-8 h-8 bg-green-100 rounded-full"></div>
                        <span className="text-xs">Round Table</span>
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="w-80 p-4 border-l border-gray-200 bg-gray-50/50">
            <div className="space-y-4">
              {/* Table Properties */}
              {selectedTable ? (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Table Properties</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-gray-600">Capacity</label>
                        <Input
                          type="number"
                          value={selectedTable.capacity}
                          onChange={(e) => updateTable({
                            ...selectedTable,
                            capacity: parseInt(e.target.value) || 1
                          })}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600">Status</label>
                        <select 
                          value={selectedTable.status}
                          onChange={(e) => updateTable({
                            ...selectedTable,
                            status: e.target.value as Table['status']
                          })}
                          className="w-full h-8 px-2 text-xs border rounded-md"
                        >
                          <option value="available">Available</option>
                          <option value="occupied">Occupied</option>
                          <option value="reserved">Reserved</option>
                          <option value="dirty">Needs Cleaning</option>
                        </select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-sm text-gray-500">Select a table to edit properties</p>
                  </CardContent>
                </Card>
              )}

              {/* Layout Tools */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Layout Tools</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => addTable()}>
                    <Plus className="w-3 h-3 mr-2" />
                    Add Table
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Settings className="w-3 h-3 mr-2" />
                    Layout Settings
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
