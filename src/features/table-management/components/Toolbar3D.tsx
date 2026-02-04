'use client';

import React, { useState } from 'react';
import { 
  RotateCcw, 
  Move3d, 
  Ruler, 
  Square, 
  Home, 
  Upload, 
  Download, 
  Grid3x3, 
  Camera, 
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
  Settings,
  Undo2,
  Redo2,
  Save,
  FileImage,
  Package,
  DoorOpen
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Separator } from '@/shared/components/ui/separator';
import { Badge } from '@/shared/components/ui/badge';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/shared/components/ui/tooltip';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/shared/components/ui/dropdown-menu';
import { useTableManagementStore, useHistory } from '@/stores/tableManagementStore';

interface Toolbar3DProps {
  className?: string;
  onImportGLTF?: () => void;
  onExportGLTF?: () => void;
  onExportPDF?: () => void;
  onStartScan?: () => void;
}

export function Toolbar3D({ 
  className = '',
  onImportGLTF,
  onExportGLTF,
  onExportPDF,
  onStartScan
}: Toolbar3DProps) {
  const [showUnits, setShowUnits] = useState(false);
  
  const {
    editMode,
    setEditMode,
    snapToGrid,
    toggleSnapToGrid,
    showGrid,
    toggleGrid,
    showMiniMap,
    toggleMiniMap,
    mode,
    setMode,
    resetCamera,
    saveLayout,
    isLoading,
    undo,
    redo,
    addTable,
    addFixture,
    addWall
  } = useTableManagementStore();

  const { canUndo, canRedo, history } = useHistory();

  // Edit mode configurations
  const editModes = [
    { id: 'select', icon: Move3d, label: 'Select & Move', shortcut: 'V' },
    { id: 'add-table', icon: Square, label: 'Add Table', shortcut: 'T' },
    { id: 'add-wall', icon: Square, label: 'Add Wall', shortcut: 'W' },
    { id: 'add-fixture', icon: Package, label: 'Add Fixture', shortcut: 'F' },
    { id: 'measure', icon: Ruler, label: 'Measure', shortcut: 'M' }
  ] as const;

  // Handle keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 's':
            e.preventDefault();
            saveLayout();
            break;
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              redo();
            } else {
              undo();
            }
            break;
        }
      } else {
        switch (e.key) {
          case 'v':
            setEditMode('select');
            break;
          case 't':
            setEditMode('add-table');
            break;
          case 'w':
            setEditMode('add-wall');
            break;
          case 'f':
            setEditMode('add-fixture');
            break;
          case 'm':
            setEditMode('measure');
            break;
          case 'g':
            toggleGrid();
            break;
          case 'r':
            resetCamera();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setEditMode, toggleGrid, resetCamera, saveLayout, undo, redo]);

  const handleQuickAddTable = () => {
    addTable({
      number: 'T' + (Date.now() % 1000),
      seats: 4,
      status: 'FREE',
      shape: 'circle',
      x: 0,
      y: 0,
      z: 0,
      width: 1.2,
      height: 1.2,
      depth: 0.1,
      rotation: 0
    });
  };

  const handleQuickAddFixture = (type: string) => {
    const fixtureConfigs = {
      door: { width: 1, height: 2.5, depth: 0.1 },
      window: { width: 1.5, height: 1.2, depth: 0.1 },
      bar: { width: 3, height: 1, depth: 0.8 },
      restroom: { width: 2, height: 2.5, depth: 2 },
      kitchen: { width: 4, height: 2.5, depth: 3 },
      column: { width: 0.4, height: 3, depth: 0.4 }
    };

    const config = fixtureConfigs[type as keyof typeof fixtureConfigs] || { width: 1, height: 1, depth: 1 };

    addFixture({
      type: type as any,
      x: 0,
      y: 0,
      z: 0,
      ...config,
      rotation: 0,
      label: `${type.charAt(0).toUpperCase() + type.slice(1)} ${Date.now() % 1000}`
    });
  };

  return (
    <TooltipProvider>
      <div className={`bg-white border rounded-lg shadow-lg p-2 ${className}`}>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Mode Toggle */}
          <div className="flex items-center border rounded">
            <Button
              variant={mode === '2D' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setMode('2D')}
              className="rounded-r-none"
            >
              2D
            </Button>
            <Button
              variant={mode === '3D' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setMode('3D')}
              className="rounded-l-none"
            >
              3D
            </Button>
          </div>

          <div className="w-px h-8 bg-gray-300" />

          {/* Edit Tools */}
          <div className="flex items-center gap-1">
            {editModes.map((toolMode) => (
              <Tooltip key={toolMode.id}>
                <TooltipTrigger asChild>
                  <Button
                    variant={editMode === toolMode.id ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setEditMode(toolMode.id as any)}
                    className="relative"
                  >
                    <toolMode.icon className="w-4 h-4" />
                    {toolMode.shortcut && (
                      <Badge 
                        variant="secondary" 
                        className="absolute -top-1 -right-1 text-xs h-4 min-w-4 p-0"
                      >
                        {toolMode.shortcut}
                      </Badge>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{toolMode.label} ({toolMode.shortcut})</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>

          <div className="w-px h-8 bg-gray-300" />

          {/* Quick Add */}
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleQuickAddTable}
                >
                  <Square className="w-4 h-4 mr-1" />
                  Table
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Add Table (Quick)</p>
              </TooltipContent>
            </Tooltip>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Package className="w-4 h-4 mr-1" />
                  Fixture
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Add Fixture</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleQuickAddFixture('door')}>
                  <DoorOpen className="w-4 h-4 mr-2" />
                  Door
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleQuickAddFixture('window')}>
                  <Square className="w-4 h-4 mr-2" />
                  Window
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleQuickAddFixture('bar')}>
                  <Square className="w-4 h-4 mr-2" />
                  Bar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleQuickAddFixture('restroom')}>
                  <Home className="w-4 h-4 mr-2" />
                  Restroom
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleQuickAddFixture('kitchen')}>
                  <Square className="w-4 h-4 mr-2" />
                  Kitchen
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleQuickAddFixture('column')}>
                  <Square className="w-4 h-4 mr-2" />
                  Column
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="w-px h-8 bg-gray-300" />

          {/* View Controls */}
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={snapToGrid ? 'default' : 'ghost'}
                  size="sm"
                  onClick={toggleSnapToGrid}
                >
                  <Grid3x3 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Snap to Grid (G)</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={showGrid ? 'default' : 'ghost'}
                  size="sm"
                  onClick={toggleGrid}
                >
                  {showGrid ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle Grid Visibility</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={showMiniMap ? 'default' : 'ghost'}
                  size="sm"
                  onClick={toggleMiniMap}
                >
                  {showMiniMap ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle Mini Map</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetCamera}
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Reset Camera (R)</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="w-px h-8 bg-gray-300" />

          {/* History Controls */}
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={undo}
                  disabled={!canUndo}
                >
                  <Undo2 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Undo (Ctrl+Z)</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={redo}
                  disabled={!canRedo}
                >
                  <Redo2 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Redo (Ctrl+Shift+Z)</p>
              </TooltipContent>
            </Tooltip>

            {history.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {history.length}
              </Badge>
            )}
          </div>

          <div className="w-px h-8 bg-gray-300" />

          {/* Import/Export */}
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Upload className="w-4 h-4 mr-1" />
                  Import
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Import Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onImportGLTF}>
                  <Package className="w-4 h-4 mr-2" />
                  Import 3D Model (GLTF)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onStartScan}>
                  <Camera className="w-4 h-4 mr-2" />
                  Start Room Scan
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <FileImage className="w-4 h-4 mr-2" />
                  Import Floor Plan Image
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-1" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Export Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onExportGLTF}>
                  <Package className="w-4 h-4 mr-2" />
                  Export 3D Model (GLTF)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onExportPDF}>
                  <FileImage className="w-4 h-4 mr-2" />
                  Export Floor Plan (PDF)
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <FileImage className="w-4 h-4 mr-2" />
                  Export QR Codes
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="w-px h-8 bg-gray-300" />

          {/* Save */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="default"
                size="sm"
                onClick={saveLayout}
                disabled={isLoading}
              >
                <Save className="w-4 h-4 mr-1" />
                {isLoading ? 'Saving...' : 'Save'}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Save Layout (Ctrl+S)</p>
            </TooltipContent>
          </Tooltip>

          {/* Units Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowUnits(!showUnits)}
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>

        {/* Units Display */}
        {showUnits && (
          <div className="mt-2 pt-2 border-t">
            <div className="flex items-center gap-4 text-xs text-gray-600">
              <span>Units: Meters</span>
              <span>Grid: 1m</span>
              <span>Mode: {mode}</span>
              <span>Tool: {editModes.find(m => m.id === editMode)?.label}</span>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

export default Toolbar3D;
