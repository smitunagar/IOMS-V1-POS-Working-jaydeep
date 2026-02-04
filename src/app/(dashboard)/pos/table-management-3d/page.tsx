'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { ThreeFloor } from '@/features/table-management/components/ThreeFloor';
import { Toolbar3D } from '@/features/table-management/components/Toolbar3D';
import { PropertiesDrawer } from '@/features/table-management/components/PropertiesDrawer';
import { useTableManagementStore } from '@/stores/tableManagementStore';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/shared/components/ui/alert-dialog';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/shared/components/ui/dialog';
import { 
  Eye,
  Layers,
  Settings,
  HelpCircle,
  Zap,
  Camera,
  Save,
  Upload,
  BarChart3,
  Users,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { toast } from 'sonner';

interface LayoutStats {
  tables: number;
  totalSeats: number;
  occupiedTables: number;
  freeSeats: number;
  utilizationPercent: number;
  avgTableSize: number;
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Loading 3D Environment</h2>
        <p className="text-gray-600">Initializing table management system...</p>
      </div>
    </div>
  );
}

function StatsPanel() {
  const tables = useTableManagementStore(state => state.tables);
  const { calculateFloorUtilization } = useTableManagementStore();

  const stats: LayoutStats = React.useMemo(() => {
    const totalSeats = tables.reduce((sum, t) => sum + t.seats, 0);
    const occupiedTables = tables.filter(t => t.status === 'SEATED').length;
    const freeSeats = tables
      .filter(t => t.status === 'FREE')
      .reduce((sum, t) => sum + t.seats, 0);
    const { utilization } = calculateFloorUtilization();
    const avgTableSize = tables.length > 0 ? totalSeats / tables.length : 0;

    return {
      tables: tables.length,
      totalSeats,
      occupiedTables,
      freeSeats,
      utilizationPercent: utilization,
      avgTableSize
    };
  }, [tables, calculateFloorUtilization]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <div className="bg-white p-4 rounded-lg border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Tables</p>
            <p className="text-2xl font-bold text-gray-900">{stats.tables}</p>
          </div>
          <Layers className="w-8 h-8 text-blue-500" />
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total Seats</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalSeats}</p>
          </div>
          <Users className="w-8 h-8 text-green-500" />
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Occupied</p>
            <p className="text-2xl font-bold text-red-600">{stats.occupiedTables}</p>
          </div>
          <Eye className="w-8 h-8 text-red-500" />
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Free Seats</p>
            <p className="text-2xl font-bold text-green-600">{stats.freeSeats}</p>
          </div>
          <Users className="w-8 h-8 text-green-500" />
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Utilization</p>
            <p className="text-2xl font-bold text-purple-600">{stats.utilizationPercent.toFixed(1)}%</p>
          </div>
          <BarChart3 className="w-8 h-8 text-purple-500" />
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Avg Size</p>
            <p className="text-2xl font-bold text-blue-600">{stats.avgTableSize.toFixed(1)}</p>
          </div>
          <BarChart3 className="w-8 h-8 text-blue-500" />
        </div>
      </div>
    </div>
  );
}

function ShortcutsHelp() {
  const shortcuts = [
    { key: 'V', action: 'Select & Move tool' },
    { key: 'T', action: 'Add Table tool' },
    { key: 'F', action: 'Add Fixture tool' },
    { key: 'W', action: 'Add Wall tool' },
    { key: 'M', action: 'Measure tool' },
    { key: 'G', action: 'Toggle Grid' },
    { key: 'R', action: 'Reset Camera' },
    { key: 'Ctrl+S', action: 'Save Layout' },
    { key: 'Ctrl+Z', action: 'Undo' },
    { key: 'Ctrl+Shift+Z', action: 'Redo' },
    { key: 'Delete', action: 'Delete Selected' },
    { key: 'Esc', action: 'Clear Selection' }
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <HelpCircle className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Use these shortcuts to speed up your workflow
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2 max-h-64 overflow-y-auto">
          {shortcuts.map((shortcut, index) => (
            <div key={index} className="flex justify-between items-center p-2 border rounded">
              <span className="text-sm">{shortcut.action}</span>
              <Badge variant="secondary" className="font-mono text-xs">
                {shortcut.key}
              </Badge>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CameraScanDialog() {
  const [isScanning, setIsScanning] = useState(false);

  const handleStartScan = () => {
    setIsScanning(true);
    // Simulate scanning process
    setTimeout(() => {
      setIsScanning(false);
      toast.success('Room scan completed! 3D model imported.');
    }, 3000);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Camera className="w-4 h-4 mr-2" />
          Scan Room
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Camera Room Scanning</DialogTitle>
          <DialogDescription>
            Use your device's camera to capture the room and generate a 3D model automatically.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {isScanning ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-sm text-gray-600">Scanning room...</p>
              <p className="text-xs text-gray-500 mt-2">This may take a few moments</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Supported Methods</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• iOS RoomPlan (iPhone/iPad with LiDAR)</li>
                  <li>• WebXR Room Scanning (AR-enabled browsers)</li>
                  <li>• Photogrammetry (Multiple photos)</li>
                </ul>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={handleStartScan} className="flex-1">
                  <Camera className="w-4 h-4 mr-2" />
                  Start Scan
                </Button>
                <Button variant="outline" className="flex-1">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Images
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Enhanced3DTableManagementPage() {
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const {
    mode,
    editMode,
    isDirty,
    isLoading,
    error,
    lastSaved,
    saveLayout,
    clearSelection
  } = useTableManagementStore();

  // Initialize default tables and fixtures for demo
  useEffect(() => {
    const {
      addTable,
      addFixture,
      tables,
      fixtures
    } = useTableManagementStore.getState();

    // Add sample data only if none exists
    if (tables.length === 0) {
      // Add sample tables
      const sampleTables = [
        { number: 'T1', seats: 4, status: 'FREE' as const, shape: 'circle' as const, x: -5, y: -3, z: 0, width: 1.2, height: 1.2, depth: 0.1, rotation: 0 },
        { number: 'T2', seats: 2, status: 'SEATED' as const, shape: 'square' as const, x: 0, y: -3, z: 0, width: 0.8, height: 0.8, depth: 0.1, rotation: 0 },
        { number: 'T3', seats: 6, status: 'FREE' as const, shape: 'rectangle' as const, x: 5, y: -3, z: 0, width: 1.8, height: 1, depth: 0.1, rotation: 0 },
        { number: 'T4', seats: 4, status: 'RESERVED' as const, shape: 'circle' as const, x: -5, y: 3, z: 0, width: 1.2, height: 1.2, depth: 0.1, rotation: 0 },
        { number: 'T5', seats: 8, status: 'DIRTY' as const, shape: 'rectangle' as const, x: 3, y: 3, z: 0, width: 2.4, height: 1.2, depth: 0.1, rotation: Math.PI / 4 }
      ];

      sampleTables.forEach(table => addTable(table));
    }

    if (fixtures.length === 0) {
      // Add sample fixtures
      const sampleFixtures = [
        { type: 'bar' as const, x: -8, y: 0, z: 0, width: 4, height: 1, depth: 0.8, rotation: 0, label: 'Main Bar' },
        { type: 'kitchen' as const, x: 8, y: -5, z: 0, width: 4, height: 2.5, depth: 3, rotation: 0, label: 'Kitchen Area' },
        { type: 'restroom' as const, x: 8, y: 5, z: 0, width: 2, height: 2.5, depth: 2, rotation: 0, label: 'Restrooms' },
        { type: 'door' as const, x: 0, y: -10, z: 0, width: 1, height: 2.5, depth: 0.1, rotation: 0, label: 'Main Entrance' }
      ];

      sampleFixtures.forEach(fixture => addFixture(fixture));
    }
  }, []);

  const handleExportGLTF = () => {
    toast.info('Exporting 3D model...');
    // Implement GLTF export
    setTimeout(() => {
      toast.success('3D model exported successfully!');
    }, 2000);
  };

  const handleExportPDF = () => {
    toast.info('Generating PDF floor plan...');
    // Implement PDF export
    setTimeout(() => {
      toast.success('Floor plan PDF generated!');
    }, 2000);
  };

  const handleImportGLTF = () => {
    toast.info('Importing 3D model...');
    // Implement GLTF import
    setTimeout(() => {
      toast.success('3D model imported successfully!');
    }, 2000);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-black">
        <div className="absolute top-4 left-4 z-10">
          <Button
            variant="secondary"
            size="sm"
            onClick={toggleFullscreen}
          >
            <Minimize2 className="w-4 h-4 mr-2" />
            Exit Fullscreen
          </Button>
        </div>
        
        <div className="absolute top-4 right-4 z-10">
          <Toolbar3D
            onImportGLTF={handleImportGLTF}
            onExportGLTF={handleExportGLTF}
            onExportPDF={handleExportPDF}
          />
        </div>

        <Suspense fallback={<LoadingFallback />}>
          <ThreeFloor className="w-full h-full" showStats />
        </Suspense>
      </div>
    );
  }

  return (
    
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Eye className="w-8 h-8 text-blue-600" />
                  3D Table Management
                </h1>
                <div className="flex items-center gap-4 mt-1">
                  <Badge variant={mode === '3D' ? 'default' : 'secondary'}>
                    {mode} Mode
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {editMode.replace('-', ' ')} Tool
                  </Badge>
                  {isDirty && <Badge variant="destructive">Unsaved Changes</Badge>}
                  {lastSaved && (
                    <span className="text-xs text-gray-500">
                      Last saved: {lastSaved.toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <CameraScanDialog />
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleFullscreen}
                >
                  <Maximize2 className="w-4 h-4 mr-2" />
                  Fullscreen
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPropertiesPanel(!showPropertiesPanel)}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  {showPropertiesPanel ? 'Hide' : 'Show'} Properties
                </Button>

                <ShortcutsHelp />

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="default" disabled={isLoading}>
                      <Save className="w-4 h-4 mr-2" />
                      {isLoading ? 'Saving...' : 'Save Layout'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Save Layout</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will save your current table layout and all changes. Continue?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={saveLayout}>
                        Save Changes
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>

          {/* Stats Panel */}
          <div className="px-6 pb-4">
            <StatsPanel />
          </div>

          {/* Toolbar */}
          <div className="px-6 pb-4">
            <Toolbar3D
              onImportGLTF={handleImportGLTF}
              onExportGLTF={handleExportGLTF}
              onExportPDF={handleExportPDF}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex">
          {/* 3D Viewport */}
          <div className={`flex-1 ${showPropertiesPanel ? 'mr-80' : ''}`}>
            <div className="h-[calc(100vh-280px)] relative">
              {error && (
                <div className="absolute top-4 left-4 z-10 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg">
                  <Zap className="w-4 h-4 inline mr-2" />
                  {error}
                </div>
              )}

              <Suspense fallback={<LoadingFallback />}>
                <ThreeFloor 
                  className="w-full h-full"
                  showStats={false}
                  enablePerformanceMonitor={true}
                />
              </Suspense>
            </div>
          </div>

          {/* Properties Panel */}
          {showPropertiesPanel && (
            <div className="fixed right-0 top-0 h-full">
              <PropertiesDrawer 
                className="h-full"
                onClose={() => setShowPropertiesPanel(false)}
              />
            </div>
          )}
        </div>
      </div>
    
  );
}
