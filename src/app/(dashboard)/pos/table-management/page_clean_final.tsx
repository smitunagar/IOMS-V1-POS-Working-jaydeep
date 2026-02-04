'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Settings, Save, RotateCcw, Play, Upload, Download, Sparkles, Grid3x3, AlertTriangle, Layout, Clock, CheckCircle, Palette } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/components/ui/dialog';
import { AppLayout } from '@/shared/components/layout/AppLayout';

interface Table {
  id: number;
  number: string;
  seats: number;
  status: 'available' | 'occupied' | 'reserved' | 'out-of-service';
  zone?: string;
  shape: 'circle' | 'square' | 'rectangle';
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Zone {
  id: string;
  name: string;
  color: string;
  tables: number[];
}

export default function TableManagementPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [activeTab, setActiveTab] = useState('layout');
  const [isDraftMode, setIsDraftMode] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    loadTableConfiguration();
  }, []);

  const loadTableConfiguration = () => {
    const defaultTables: Table[] = [
      { id: 1, number: '1', seats: 4, status: 'available', zone: 'main', shape: 'circle', x: 100, y: 100, width: 80, height: 80 },
      { id: 2, number: '2', seats: 2, status: 'occupied', zone: 'main', shape: 'square', x: 200, y: 100, width: 60, height: 60 },
      { id: 3, number: '3', seats: 6, status: 'available', zone: 'patio', shape: 'rectangle', x: 300, y: 100, width: 100, height: 60 },
    ];

    const defaultZones: Zone[] = [
      { id: 'main', name: 'Main Dining', color: '#3b82f6', tables: [1, 2] },
      { id: 'patio', name: 'Patio', color: '#10b981', tables: [3] },
    ];

    setTables(defaultTables);
    setZones(defaultZones);
  };

  const addTable = () => {
    const newTable: Table = {
      id: Math.max(...tables.map(t => t.id), 0) + 1,
      number: `${tables.length + 1}`,
      seats: 4,
      status: 'available',
      shape: 'circle',
      x: 150,
      y: 150,
      width: 80,
      height: 80
    };
    setTables([...tables, newTable]);
  };

  const updateTable = (updatedTable: Table) => {
    setTables(tables.map(t => t.id === updatedTable.id ? updatedTable : t));
  };

  const deleteTable = (tableId: number) => {
    setTables(tables.filter(t => t.id !== tableId));
    if (selectedTable?.id === tableId) {
      setSelectedTable(null);
    }
  };

  const saveConfiguration = () => {
    console.log('Saving table configuration...', { tables, zones });
    setIsDraftMode(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'occupied': return 'bg-red-500';
      case 'reserved': return 'bg-yellow-500';
      case 'out-of-service': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const renderTable = (table: Table) => {
    const isSelected = selectedTable?.id === table.id;
    const baseClasses = `absolute border-2 cursor-pointer transition-all duration-200 flex items-center justify-center text-white font-semibold`;
    const shapeClasses = table.shape === 'circle' ? 'rounded-full' : table.shape === 'square' ? 'rounded-lg' : 'rounded-lg';
    const statusClasses = getStatusColor(table.status);
    const selectedClasses = isSelected ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-300';

    return (
      <div
        key={table.id}
        className={`${baseClasses} ${shapeClasses} ${statusClasses} ${selectedClasses}`}
        style={{
          left: table.x,
          top: table.y,
          width: table.width,
          height: table.height,
        }}
        onClick={() => setSelectedTable(table)}
      >
        <span className="text-sm">{table.number}</span>
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Table Management</h1>
              <p className="text-gray-600 mt-1">Configure dining area layout and table settings</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={saveConfiguration} className="bg-blue-600 hover:bg-blue-700">
                <Save className="w-4 h-4 mr-2" />
                Save Layout
              </Button>
              <Button variant="outline" onClick={addTable}>
                <Plus className="w-4 h-4 mr-2" />
                Add Table
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="layout">Layout Designer</TabsTrigger>
              <TabsTrigger value="tables">Table List</TabsTrigger>
              <TabsTrigger value="zones">Zone Management</TabsTrigger>
            </TabsList>

            <TabsContent value="layout" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layout className="w-5 h-5" />
                    Dining Area Layout
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative bg-white border-2 border-dashed border-gray-300 rounded-lg p-4" style={{ height: '600px', width: '100%' }}>
                    {tables.map(renderTable)}
                    {tables.length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                        <div className="text-center">
                          <Grid3x3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>No tables added yet</p>
                          <p className="text-sm">Click "Add Table" to get started</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {selectedTable && (
                <Card>
                  <CardHeader>
                    <CardTitle>Table Properties</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="tableNumber">Table Number</Label>
                        <Input
                          id="tableNumber"
                          value={selectedTable.number}
                          onChange={(e) => updateTable({ ...selectedTable, number: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="seats">Seats</Label>
                        <Input
                          id="seats"
                          type="number"
                          value={selectedTable.seats}
                          onChange={(e) => updateTable({ ...selectedTable, seats: parseInt(e.target.value) || 1 })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="status">Status</Label>
                        <Select value={selectedTable.status} onValueChange={(value: any) => updateTable({ ...selectedTable, status: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="available">Available</SelectItem>
                            <SelectItem value="occupied">Occupied</SelectItem>
                            <SelectItem value="reserved">Reserved</SelectItem>
                            <SelectItem value="out-of-service">Out of Service</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="shape">Shape</Label>
                        <Select value={selectedTable.shape} onValueChange={(value: any) => updateTable({ ...selectedTable, shape: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="circle">Circle</SelectItem>
                            <SelectItem value="square">Square</SelectItem>
                            <SelectItem value="rectangle">Rectangle</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => deleteTable(selectedTable.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Delete Table
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="tables" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>All Tables</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {tables.map((table) => (
                      <div key={table.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(table.status)}`} />
                          <span className="font-medium">Table {table.number}</span>
                          <Badge variant="secondary">{table.seats} seats</Badge>
                          <Badge variant="outline">{table.status}</Badge>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedTable(table)}
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="zones" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Zone Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {zones.map((zone) => (
                      <div key={zone.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: zone.color }}
                          />
                          <span className="font-medium">{zone.name}</span>
                          <Badge variant="secondary">{zone.tables.length} tables</Badge>
                        </div>
                        <Button variant="outline" size="sm">
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}
