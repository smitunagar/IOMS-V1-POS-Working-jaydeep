'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Plus, Save, Settings } from 'lucide-react';
import { AppLayout } from '@/shared/components/layout/AppLayout';

interface Table {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved';
  label: string;
}

export default function TableManagementPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [layoutName, setLayoutName] = useState('Default Layout');

  const addTable = () => {
    const newTable: Table = {
      id: `table-${Date.now()}`,
      x: 100,
      y: 100,
      width: 80,
      height: 80,
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

  const saveTables = () => {
    console.log('Saving tables:', tables);
    alert('Layout saved successfully!');
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">
                Table Management
              </h1>
              <Input
                value={layoutName}
                onChange={(e) => setLayoutName(e.target.value)}
                className="w-64"
                placeholder="Layout name"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Button onClick={addTable}>
                <Plus className="w-4 h-4 mr-2" />
                Add Table
              </Button>
              <Button onClick={saveTables} variant="outline">
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex">
          {/* Canvas */}
          <div className="flex-1 p-4">
            <Card className="h-full">
              <CardContent className="p-4 h-full">
                <div className="h-full bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg relative">
                  {/* Tables */}
                  {tables.map((table) => (
                    <div
                      key={table.id}
                      className={`absolute bg-white border-2 rounded-lg shadow cursor-pointer ${
                        selectedTable?.id === table.id
                          ? 'border-blue-500'
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
                      <div className="flex items-center justify-center h-full text-sm font-medium">
                        {table.label}
                      </div>
                    </div>
                  ))}

                  {/* Empty State */}
                  {tables.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <p>Click "Add Table" to start designing your layout</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="w-80 p-4 border-l bg-white">
            {selectedTable ? (
              <Card>
                <CardHeader>
                  <CardTitle>Table Properties</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Capacity</label>
                    <Input
                      type="number"
                      value={selectedTable.capacity}
                      onChange={(e) => updateTable({
                        ...selectedTable,
                        capacity: parseInt(e.target.value) || 1
                      })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <select 
                      value={selectedTable.status}
                      onChange={(e) => updateTable({
                        ...selectedTable,
                        status: e.target.value as Table['status']
                      })}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="available">Available</option>
                      <option value="occupied">Occupied</option>
                      <option value="reserved">Reserved</option>
                    </select>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-500">Select a table to edit properties</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
