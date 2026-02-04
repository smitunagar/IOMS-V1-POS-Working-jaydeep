'use client';

import React, { useState } from 'react';
import { X, RotateCw, Copy, Trash2, Merge, Split, Users, Ruler, Palette } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Separator } from '@/shared/components/ui/separator';
import { Badge } from '@/shared/components/ui/badge';
import { Slider } from '@/shared/components/ui/slider';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/shared/components/ui/select';
import { 
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/shared/components/ui/tabs';
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/shared/components/ui/card';
import { useSelectedObject, useTableManagementStore } from '@/stores/tableManagementStore';
import type { Table3D, Fixture3D } from '@/stores/tableManagementStore';

interface PropertiesDrawerProps {
  className?: string;
  onClose?: () => void;
}

function TableProperties({ table }: { table: Table3D }) {
  const {
    updateTable,
    deleteTable,
    duplicateTable,
    mergeTable,
    splitTable,
    updateChairsForTable,
    generateUniqueTableNumber,
    checkCollisions
  } = useTableManagementStore();

  const [localTable, setLocalTable] = useState(table);

  const handleUpdate = (updates: Partial<Table3D>) => {
    const newTable = { ...localTable, ...updates };
    setLocalTable(newTable);
    updateTable(table.id, updates);
    
    // Update chairs if seat count or shape changed
    if (updates.seats !== undefined || updates.shape !== undefined) {
      updateChairsForTable(table.id);
    }
  };

  const hasCollision = checkCollisions(table.id, table, { 
    width: table.width, 
    height: table.height, 
    depth: table.depth 
  });

  return (
    <div className="space-y-6">
      {/* Basic Properties */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Table Properties</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tableNumber" className="text-xs">Table Number</Label>
              <Input
                id="tableNumber"
                value={localTable.number}
                onChange={(e) => handleUpdate({ number: e.target.value })}
                className="text-sm"
              />
            </div>
            <div>
              <Label htmlFor="seats" className="text-xs">Seats</Label>
              <Input
                id="seats"
                type="number"
                min="1"
                max="20"
                value={localTable.seats}
                onChange={(e) => handleUpdate({ seats: parseInt(e.target.value) || 1 })}
                className="text-sm"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="status" className="text-xs">Status</Label>
            <Select value={localTable.status} onValueChange={(value: any) => handleUpdate({ status: value })}>
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FREE">Free</SelectItem>
                <SelectItem value="SEATED">Seated</SelectItem>
                <SelectItem value="DIRTY">Dirty</SelectItem>
                <SelectItem value="RESERVED">Reserved</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="shape" className="text-xs">Shape</Label>
            <Select value={localTable.shape} onValueChange={(value: any) => handleUpdate({ shape: value })}>
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="circle">Circle</SelectItem>
                <SelectItem value="square">Square</SelectItem>
                <SelectItem value="rectangle">Rectangle</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="zone" className="text-xs">Zone</Label>
            <Input
              id="zone"
              value={localTable.zone || ''}
              onChange={(e) => handleUpdate({ zone: e.target.value })}
              placeholder="e.g., Main Dining, Patio"
              className="text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Position & Size */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Ruler className="w-4 h-4" />
            Position & Dimensions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label htmlFor="posX" className="text-xs">X (m)</Label>
              <Input
                id="posX"
                type="number"
                step="0.1"
                value={localTable.x.toFixed(1)}
                onChange={(e) => handleUpdate({ x: parseFloat(e.target.value) || 0 })}
                className="text-sm"
              />
            </div>
            <div>
              <Label htmlFor="posY" className="text-xs">Y (m)</Label>
              <Input
                id="posY"
                type="number"
                step="0.1"
                value={localTable.y.toFixed(1)}
                onChange={(e) => handleUpdate({ y: parseFloat(e.target.value) || 0 })}
                className="text-sm"
              />
            </div>
            <div>
              <Label htmlFor="posZ" className="text-xs">Z (m)</Label>
              <Input
                id="posZ"
                type="number"
                step="0.1"
                value={localTable.z.toFixed(1)}
                onChange={(e) => handleUpdate({ z: parseFloat(e.target.value) || 0 })}
                className="text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="width" className="text-xs">Width (m)</Label>
              <Input
                id="width"
                type="number"
                step="0.1"
                min="0.5"
                max="5"
                value={localTable.width.toFixed(1)}
                onChange={(e) => handleUpdate({ width: parseFloat(e.target.value) || 0.5 })}
                className="text-sm"
              />
            </div>
            <div>
              <Label htmlFor="height" className="text-xs">Height (m)</Label>
              <Input
                id="height"
                type="number"
                step="0.1"
                min="0.5"
                max="5"
                value={localTable.height.toFixed(1)}
                onChange={(e) => handleUpdate({ height: parseFloat(e.target.value) || 0.5 })}
                className="text-sm"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">Rotation: {Math.round(localTable.rotation * 180 / Math.PI)}°</Label>
            <Slider
              value={[localTable.rotation * 180 / Math.PI]}
              onValueChange={([value]) => handleUpdate({ rotation: value * Math.PI / 180 })}
              max={360}
              step={15}
              className="mt-2"
            />
          </div>

          {hasCollision && (
            <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
              ⚠️ Collision detected! This table overlaps with another object.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => duplicateTable(table.id)}
              className="text-xs"
            >
              <Copy className="w-3 h-3 mr-1" />
              Duplicate
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleUpdate({ rotation: localTable.rotation + Math.PI / 4 })}
              className="text-xs"
            >
              <RotateCw className="w-3 h-3 mr-1" />
              Rotate 45°
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled
              className="text-xs"
            >
              <Merge className="w-3 h-3 mr-1" />
              Merge
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled
              className="text-xs"
            >
              <Split className="w-3 h-3 mr-1" />
              Split
            </Button>
          </div>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => deleteTable(table.id)}
            className="w-full text-xs"
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Delete Table
          </Button>
        </CardContent>
      </Card>

      {/* Chair Layout */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="w-4 h-4" />
            Chair Layout
          </CardTitle>
          <CardDescription className="text-xs">
            Chairs are automatically positioned based on table shape and seat count
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateChairsForTable(table.id)}
            className="w-full text-xs"
          >
            Regenerate Chair Positions
          </Button>
        </CardContent>
      </Card>

      {/* Metadata */}
      {(localTable.parentId || localTable.childIds) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Relationship</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {localTable.parentId && (
              <div className="flex items-center gap-2 text-xs">
                <Badge variant="outline">Split from: {localTable.parentId}</Badge>
              </div>
            )}
            {localTable.childIds && (
              <div className="flex items-center gap-2 text-xs">
                <Badge variant="outline">Merged: {localTable.childIds.join(', ')}</Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function FixtureProperties({ fixture }: { fixture: Fixture3D }) {
  const { updateFixture, deleteFixture } = useTableManagementStore();
  const [localFixture, setLocalFixture] = useState(fixture);

  const handleUpdate = (updates: Partial<Fixture3D>) => {
    const newFixture = { ...localFixture, ...updates };
    setLocalFixture(newFixture);
    updateFixture(fixture.id, updates);
  };

  return (
    <div className="space-y-6">
      {/* Basic Properties */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Fixture Properties</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="fixtureType" className="text-xs">Type</Label>
            <Select value={localFixture.type} onValueChange={(value: any) => handleUpdate({ type: value })}>
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="door">Door</SelectItem>
                <SelectItem value="window">Window</SelectItem>
                <SelectItem value="bar">Bar</SelectItem>
                <SelectItem value="restroom">Restroom</SelectItem>
                <SelectItem value="stage">Stage</SelectItem>
                <SelectItem value="column">Column</SelectItem>
                <SelectItem value="kitchen">Kitchen</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="fixtureLabel" className="text-xs">Label</Label>
            <Input
              id="fixtureLabel"
              value={localFixture.label || ''}
              onChange={(e) => handleUpdate({ label: e.target.value })}
              className="text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Position & Size */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Ruler className="w-4 h-4" />
            Position & Dimensions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label htmlFor="fixX" className="text-xs">X (m)</Label>
              <Input
                id="fixX"
                type="number"
                step="0.1"
                value={localFixture.x.toFixed(1)}
                onChange={(e) => handleUpdate({ x: parseFloat(e.target.value) || 0 })}
                className="text-sm"
              />
            </div>
            <div>
              <Label htmlFor="fixY" className="text-xs">Y (m)</Label>
              <Input
                id="fixY"
                type="number"
                step="0.1"
                value={localFixture.y.toFixed(1)}
                onChange={(e) => handleUpdate({ y: parseFloat(e.target.value) || 0 })}
                className="text-sm"
              />
            </div>
            <div>
              <Label htmlFor="fixZ" className="text-xs">Z (m)</Label>
              <Input
                id="fixZ"
                type="number"
                step="0.1"
                value={localFixture.z.toFixed(1)}
                onChange={(e) => handleUpdate({ z: parseFloat(e.target.value) || 0 })}
                className="text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label htmlFor="fixWidth" className="text-xs">Width (m)</Label>
              <Input
                id="fixWidth"
                type="number"
                step="0.1"
                min="0.1"
                value={localFixture.width.toFixed(1)}
                onChange={(e) => handleUpdate({ width: parseFloat(e.target.value) || 0.1 })}
                className="text-sm"
              />
            </div>
            <div>
              <Label htmlFor="fixHeight" className="text-xs">Height (m)</Label>
              <Input
                id="fixHeight"
                type="number"
                step="0.1"
                min="0.1"
                value={localFixture.height.toFixed(1)}
                onChange={(e) => handleUpdate({ height: parseFloat(e.target.value) || 0.1 })}
                className="text-sm"
              />
            </div>
            <div>
              <Label htmlFor="fixDepth" className="text-xs">Depth (m)</Label>
              <Input
                id="fixDepth"
                type="number"
                step="0.1"
                min="0.1"
                value={localFixture.depth.toFixed(1)}
                onChange={(e) => handleUpdate({ depth: parseFloat(e.target.value) || 0.1 })}
                className="text-sm"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">Rotation: {Math.round(localFixture.rotation * 180 / Math.PI)}°</Label>
            <Slider
              value={[localFixture.rotation * 180 / Math.PI]}
              onValueChange={([value]) => handleUpdate({ rotation: value * Math.PI / 180 })}
              max={360}
              step={15}
              className="mt-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleUpdate({ rotation: localFixture.rotation + Math.PI / 4 })}
            className="w-full text-xs"
          >
            <RotateCw className="w-3 h-3 mr-1" />
            Rotate 45°
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => deleteFixture(fixture.id)}
            className="w-full text-xs"
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Delete Fixture
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function PropertiesDrawer({ className = '', onClose }: PropertiesDrawerProps) {
  const { object: selectedObject, type: selectedType } = useSelectedObject();
  const { clearSelection } = useTableManagementStore();

  if (!selectedObject || !selectedType) {
    return (
      <div className={`w-80 bg-white border-l shadow-lg p-4 ${className}`}>
        <div className="text-center text-gray-500 mt-8">
          <Palette className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-sm font-medium mb-2">No Selection</h3>
          <p className="text-xs text-gray-400">
            Click on a table or fixture to view and edit its properties
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-80 bg-white border-l shadow-lg overflow-y-auto ${className}`}>
      {/* Header */}
      <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Properties</h2>
          <p className="text-xs text-gray-500 capitalize">
            {selectedType === 'table' ? `Table ${(selectedObject as Table3D).number}` : 
             selectedType === 'fixture' ? `${(selectedObject as Fixture3D).type} Fixture` : 
             'Selected Object'}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            clearSelection();
            onClose?.();
          }}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="p-4">
        <Tabs value={selectedType} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="table" disabled={selectedType !== 'table'}>
              Table
            </TabsTrigger>
            <TabsTrigger value="fixture" disabled={selectedType !== 'fixture'}>
              Fixture
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="table" className="mt-4">
            {selectedType === 'table' && <TableProperties table={selectedObject as Table3D} />}
          </TabsContent>
          
          <TabsContent value="fixture" className="mt-4">
            {selectedType === 'fixture' && <FixtureProperties fixture={selectedObject as Fixture3D} />}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default PropertiesDrawer;
