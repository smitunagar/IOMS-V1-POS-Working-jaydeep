'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Plus, Edit, Trash2, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { getDiningSetup, setDiningSetup, AreaDef, TableDef } from '@/server/lib/diningSetupStorage';

const DEFAULT_ICONS = ['🍽️', '🌿', '🍷', '☀️', '🏖️', '🏠', '🪟', '🎉'];

export default function DiningAreaSetupPage() {
  const [areas, setAreas] = useState<AreaDef[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editArea, setEditArea] = useState<AreaDef | null>(null);
  const [form, setForm] = useState<{ name: string; icon: string; maxTables: string }>({ name: '', icon: DEFAULT_ICONS[0], maxTables: '5' });

  // Table modal state
  const [tableModalOpen, setTableModalOpen] = useState(false);
  const [tableAreaId, setTableAreaId] = useState<string | null>(null);
  const [editTable, setEditTable] = useState<{ areaId: string; table: TableDef } | null>(null);
  const [tableForm, setTableForm] = useState<{ name: string; occupancy: string }>({ name: '', occupancy: '4' });
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // Load areas from localStorage on mount
  useEffect(() => {
    const data = getDiningSetup();
    setAreas(data.areas);
  }, []);

  // Remove auto-save on every change
  // useEffect(() => { setDiningSetup({ areas }); }, [areas]);

  const openAddModal = () => {
    setEditArea(null);
    setForm({ name: '', icon: DEFAULT_ICONS[0], maxTables: '5' });
    setModalOpen(true);
  };

  const openEditModal = (area: AreaDef) => {
    setEditArea(area);
    setForm({ name: area.name, icon: area.icon, maxTables: String(area.maxTables) });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editArea) {
      setAreas(areas.map(a => a.id === editArea.id ? { ...a, ...form, maxTables: Number(form.maxTables) } : a));
    } else {
      setAreas([...areas, { id: Date.now().toString(), name: form.name, icon: form.icon, maxTables: Number(form.maxTables), tables: [] }]);
    }
    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setAreas(areas.filter(a => a.id !== id));
  };

  // Table management
  const openAddTableModal = (areaId: string) => {
    setEditTable(null);
    setTableAreaId(areaId);
    setTableForm({ name: '', occupancy: '4' });
    setTableModalOpen(true);
  };

  const openEditTableModal = (areaId: string, table: TableDef) => {
    setEditTable({ areaId, table });
    setTableAreaId(areaId);
    setTableForm({ name: table.name, occupancy: String(table.occupancy) });
    setTableModalOpen(true);
  };

  const handleSaveTable = () => {
    if (!tableAreaId || !tableForm.name.trim()) return;
    setAreas(areas => areas.map(area => {
      if (area.id !== tableAreaId) return area;
      if (editTable) {
        // Edit existing table
        return {
          ...area,
          tables: area.tables.map(t => t.id === editTable.table.id ? { ...t, name: tableForm.name, occupancy: Number(tableForm.occupancy) } : t)
        };
      } else {
        // Add new table
        return {
          ...area,
          tables: [...area.tables, { id: Date.now().toString(), name: tableForm.name, occupancy: Number(tableForm.occupancy) }]
        };
      }
    }));
    setTableModalOpen(false);
  };

  const handleDeleteTable = (areaId: string, tableId: string) => {
    setAreas(areas => areas.map(area =>
      area.id === areaId ? { ...area, tables: area.tables.filter(t => t.id !== tableId) } : area
    ));
  };

  const handleSaveSetup = () => {
    setDiningSetup({ areas });
    setSaveMsg('Setup saved! Changes will reflect in Table Management.');
    setTimeout(() => setSaveMsg(null), 2000);
  };

  return (
    
      <div className="container mx-auto p-6">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              Dining Area Setup
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className="text-muted-foreground text-sm">
                Define your restaurant's areas and tables for better management.
              </div>
              <Button variant="default" className="flex items-center gap-2" onClick={openAddModal}>
                <Plus className="h-4 w-4" />
                Add Area
              </Button>
            </div>
            {areas.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <div className="text-3xl mb-2">🍽️</div>
                <div className="font-semibold mb-2">No dining areas defined yet.</div>
                <div className="text-sm mb-4">Click "Add Area" to create your first dining zone (e.g., Indoor, Outdoor, Balcony).</div>
              </div>
            ) : (
              <div className="space-y-6">
                {areas.map((area) => (
                  <Card key={area.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-4">
                        <span className="text-2xl">{area.icon}</span>
                        <div>
                          <div className="font-semibold text-lg">{area.name}</div>
                          <div className="text-xs text-muted-foreground">Max Tables: {area.maxTables}</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="icon" variant="outline" onClick={() => openEditModal(area)} title="Edit Area">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="destructive" onClick={() => handleDelete(area.id)} title="Delete Area">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {/* Table List */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold text-sm">Tables</div>
                        <Button size="sm" variant="outline" className="flex items-center gap-1" onClick={() => openAddTableModal(area.id)}>
                          <Plus className="h-4 w-4" /> Add Table
                        </Button>
                      </div>
                      {area.tables && area.tables.length > 0 ? (
                        <div className="space-y-2">
                          {area.tables.map(table => (
                            <div key={table.id} className="flex items-center justify-between rounded border px-3 py-2 bg-gray-50">
                              <div className="flex items-center gap-3">
                                <span className="font-semibold">{table.name}</span>
                                <span className="flex items-center gap-1 text-xs text-muted-foreground"><Users className="h-4 w-4" /> {table.occupancy} seats</span>
                              </div>
                              <div className="flex gap-2">
                                <Button size="icon" variant="outline" onClick={() => openEditTableModal(area.id, table)} title="Edit Table">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="destructive" onClick={() => handleDeleteTable(area.id, table.id)} title="Delete Table">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground">No tables defined for this area.</div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
            <div className="flex justify-end mt-8">
              <Button variant="default" className="px-6 py-2 text-base font-semibold" onClick={handleSaveSetup}>
                Save Setup
              </Button>
            </div>
            {saveMsg && <div className="text-green-600 text-sm text-right mt-2">{saveMsg}</div>}
          </CardContent>
        </Card>
        {/* Add/Edit Area Modal */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editArea ? 'Edit Area' : 'Add Area'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Area Name</label>
                <Input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Outdoor, Balcony, Private Room"
                  maxLength={32}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Icon/Emoji</label>
                <div className="flex gap-2 flex-wrap">
                  {DEFAULT_ICONS.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      className={`text-2xl px-2 py-1 rounded border ${form.icon === icon ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'} hover:border-blue-400`}
                      onClick={() => setForm(f => ({ ...f, icon }))}
                    >
                      {icon}
                    </button>
                  ))}
                  <Input
                    value={form.icon}
                    onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
                    className="w-16 text-center"
                    maxLength={2}
                    placeholder="🌟"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Max Tables</label>
                <Input
                  type="number"
                  min={1}
                  value={form.maxTables}
                  onChange={e => setForm(f => ({ ...f, maxTables: e.target.value }))}
                  className="w-24"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setModalOpen(false)} type="button">Cancel</Button>
              <Button onClick={handleSave} type="button">{editArea ? 'Save Changes' : 'Add Area'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Add/Edit Table Modal */}
        <Dialog open={tableModalOpen} onOpenChange={setTableModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editTable ? 'Edit Table' : 'Add Table'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Table Name/Label</label>
                <Input
                  value={tableForm.name}
                  onChange={e => setTableForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Table 1, Booth 3, Patio A1"
                  maxLength={32}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Occupancy (seats)</label>
                <Input
                  type="number"
                  min={1}
                  value={tableForm.occupancy}
                  onChange={e => setTableForm(f => ({ ...f, occupancy: e.target.value }))}
                  className="w-24"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setTableModalOpen(false)} type="button">Cancel</Button>
              <Button onClick={handleSaveTable} type="button">{editTable ? 'Save Changes' : 'Add Table'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    
  );
} 