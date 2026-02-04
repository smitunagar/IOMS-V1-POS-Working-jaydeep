'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppLayout } from '@/shared/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Separator } from '@/shared/components/ui/separator';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Switch } from '@/shared/components/ui/switch';
import { Slider } from '@/shared/components/ui/slider';
import { FloorEditorCanvas } from '@/features/table-management/components/FloorEditorCanvas';
import { BottomToolbar } from '@/features/table-management/components/BottomToolbar';
import { SaveDraftButton } from '@/features/table-management/components/SaveDraftButton';
import { ActivateLayoutButton } from '@/features/table-management/components/ActivateLayoutButton';
import { ZoneLegend } from '@/features/table-management/components/ZoneLegend';
import { TableMergeTool } from '@/features/table-management/components/TableMergeTool';
import { TableSplitTool } from '@/features/table-management/components/TableSplitTool';
import { QRCodeManager } from '@/features/table-management/components/QRCodeManager';
import { ReservationLink } from '@/features/table-management/components/ReservationLink';
import { Table3DControls } from '@/features/table-management/components/Table3DControls';
import { useTableStore } from '@/features/table-management/stores/tableStore';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { 
  Layout, 
  Grid3X3, 
  Palette, 
  Settings, 
  History, 
  Users, 
  QrCode,
  Calendar,
  Merge,
  Split,
  Info,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  Download,
  Upload,
  Camera,
  Smartphone,
  Monitor,
  RotateCcw,
  Move,
  AlignCenter,
  Grid,
  Eye,
  EyeOff,
  Zap,
  TrendingUp,
  PieChart,
  BarChart3,
  Maximize2,
  HelpCircle,
  Command,
  RefreshCw,
  Save,
  FileOutput,
  Scan
} from 'lucide-react';
import { toast } from '@/shared/hooks/use-toast';

// Mock utilization data for sparkline
const utilizationData = [
  { hour: '9am', utilization: 45 },
  { hour: '10am', utilization: 62 },
  { hour: '11am', utilization: 78 },
  { hour: '12pm', utilization: 95 },
  { hour: '1pm', utilization: 88 },
  { hour: '2pm', utilization: 71 },
  { hour: '3pm', utilization: 54 }
];

export default function EnhancedTableManagementPage() {
  const { 
    tables, 
    zones, 
    fixtures,
    selectedTableIds, 
    isDraftMode, 
    isLoading, 
    error, 
    validationErrors,
    canUndo,
    canRedo,
    viewMode,
    showGrid,
    showZones,
    gridSize,
    snapToGrid,
    hasOverlaps,
    totalTables,
    totalCapacity,
    availableTables,
    tableStates,
    undo,
    redo,
    saveDraft,
    activateLayout,
    loadDraft,
    setViewMode,
    toggleGrid,
    toggleZones,
    setGridSize,
    toggleSnapToGrid,
    clearSelection,
    exportLayout,
    importLayout,
    alignTables,
    distributeTablesEvenly
  } = useTableStore();

  const [activeTab, setActiveTab] = useState('designer');
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

  // Load draft on mount
  useEffect(() => {
    loadDraft('main-floor');
  }, [loadDraft]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) undo();
      }
      
      // Ctrl/Cmd + Shift + Z for redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        if (canRedo) redo();
      }
      
      // Ctrl/Cmd + S for save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveDraft('main-floor');
      }
      
      // Escape to clear selection
      if (e.key === 'Escape') {
        clearSelection();
      }
      
      // ? to show shortcuts
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        setShowShortcuts(true);
      }
      
      // G to toggle grid
      if (e.key === 'g' && !e.ctrlKey && !e.metaKey) {
        toggleGrid();
      }
      
      // Z to toggle zones
      if (e.key === 'z' && !e.ctrlKey && !e.metaKey) {
        toggleZones();
      }
      
      // 1-3 for view modes
      if (e.key === '2' && !e.ctrlKey && !e.metaKey) {
        setViewMode('2D');
      }
      if (e.key === '3' && !e.ctrlKey && !e.metaKey) {
        setViewMode('3D');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, undo, redo, saveDraft, clearSelection, toggleGrid, toggleZones, setViewMode]);

  // Handle successful activation
  const handleActivationSuccess = useCallback(() => {
    setShowSuccessBanner(true);
    setTimeout(() => setShowSuccessBanner(false), 5000);
    toast({
      title: "Layout Activated!",
      description: "Your table layout is now live and ready for service.",
    });
  }, []);

  // Computed values
  const hasErrors = validationErrors.length > 0;
  const selectedTable = selectedTableIds.length === 1 ? tables.find(t => t.id === selectedTableIds[0]) : undefined;
  const selectedTables = tables.filter(t => selectedTableIds.includes(t.id));
  
  const utilizationRate = totalCapacity > 0 ? Math.round((totalCapacity - availableTables) / totalCapacity * 100) : 0;
  const occupiedTables = Object.values(tableStates).filter(status => status === 'SEATED').length;
  const reservedTables = Object.values(tableStates).filter(status => status === 'RESERVED').length;
  const dirtyTables = Object.values(tableStates).filter(status => status === 'DIRTY').length;

  return (
    <AppLayout pageTitle="3D Table Management">
      <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        
        {/* Success Banner */}
        <AnimatePresence>
          {showSuccessBanner && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 shadow-lg"
            >
              <div className="flex items-center justify-between max-w-7xl mx-auto">
                <div className="flex items-center space-x-3">
                  <CheckCircle2 className="h-6 w-6" />
                  <div>
                    <h3 className="font-semibold">Layout Activated Successfully!</h3>
                    <p className="text-sm opacity-90">
                      Real-time table status tracking • QR code generation • Reservation management • Live analytics
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSuccessBanner(false)}
                  className="text-white hover:bg-white/10"
                >
                  ×
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Header Section with KPIs */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Layout className="h-6 w-6 text-blue-600" />
                <h1 className="text-2xl font-bold text-slate-900">3D Floor Plan Designer</h1>
              </div>
              
              {/* KPI Cards */}
              <div className="hidden lg:flex items-center space-x-4">
                <Card className="p-3">
                  <div className="flex items-center space-x-2">
                    <Grid3X3 className="h-4 w-4 text-blue-600" />
                    <div>
                      <div className="text-sm font-medium">{totalTables}</div>
                      <div className="text-xs text-slate-500">Tables</div>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-3">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-green-600" />
                    <div>
                      <div className="text-sm font-medium">{totalCapacity}</div>
                      <div className="text-xs text-slate-500">Capacity</div>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-3">
                  <div className="flex items-center space-x-3">
                    <div className="flex flex-col">
                      <div className="text-xs text-slate-500">Available</div>
                      <div className="text-sm font-medium text-green-600">{availableTables}</div>
                    </div>
                    <div className="flex flex-col">
                      <div className="text-xs text-slate-500">Occupied</div>
                      <div className="text-sm font-medium text-red-600">{occupiedTables}</div>
                    </div>
                    <div className="flex flex-col">
                      <div className="text-xs text-slate-500">Reserved</div>
                      <div className="text-sm font-medium text-amber-600">{reservedTables}</div>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-3 min-w-[120px]">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{utilizationRate}%</div>
                      <div className="text-xs text-slate-500">Utilization</div>
                      <ResponsiveContainer width="100%" height={20}>
                        <LineChart data={utilizationData}>
                          <Line 
                            type="monotone" 
                            dataKey="utilization" 
                            stroke="#8b5cf6" 
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </Card>
              </div>
              
              <div className="flex items-center space-x-2">
                <Badge variant={isDraftMode ? "secondary" : "default"} className="text-xs">
                  {isDraftMode ? "Draft Mode" : "Live Layout"}
                </Badge>
                {hasErrors && (
                  <Badge variant="destructive" className="text-xs animate-pulse">
                    {validationErrors.length} Issues
                  </Badge>
                )}
                {hasOverlaps && (
                  <Badge variant="destructive" className="text-xs">
                    Overlaps Detected
                  </Badge>
                )}
              </div>
            </div>

            {/* Mode Switch & Actions */}
            <div className="flex items-center space-x-3">
              {/* 2D/3D Mode Switch */}
              <div className="flex items-center space-x-2 bg-slate-100 rounded-lg p-1">
                <Button
                  variant={viewMode === '2D' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('2D')}
                  className="text-xs px-3"
                >
                  <Monitor className="h-3 w-3 mr-1" />
                  2D
                </Button>
                <Button
                  variant={viewMode === '3D' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('3D')}
                  className="text-xs px-3"
                >
                  <Layers className="h-3 w-3 mr-1" />
                  3D
                </Button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={undo}
                  disabled={!canUndo}
                  className="flex items-center space-x-1"
                >
                  <History className="h-4 w-4" />
                  <span className="hidden sm:inline">Undo</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={redo}
                  disabled={!canRedo}
                  className="flex items-center space-x-1"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span className="hidden sm:inline">Redo</span>
                </Button>
                
                <div className="w-px h-6 bg-gray-300" />
                
                <SaveDraftButton />
                <ActivateLayoutButton />
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowShortcuts(true)}
                  className="flex items-center space-x-1"
                >
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Validation Errors */}
          <AnimatePresence>
            {hasErrors && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Alert className="mt-4 border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <strong>Layout Issues:</strong> {validationErrors.join(', ')}
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Sidebar */}
          <motion.div 
            className="w-80 bg-white/80 backdrop-blur-sm border-r border-slate-200 flex flex-col"
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            transition={{ type: "spring", damping: 25 }}
          >
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-4 m-2">
                <TabsTrigger value="designer" className="text-xs">
                  <Settings className="h-4 w-4 mr-1" />
                  Designer
                </TabsTrigger>
                <TabsTrigger value="zones" className="text-xs">
                  <Palette className="h-4 w-4 mr-1" />
                  Zones
                </TabsTrigger>
                <TabsTrigger value="tools" className="text-xs">
                  <Merge className="h-4 w-4 mr-1" />
                  Tools
                </TabsTrigger>
                <TabsTrigger value="export" className="text-xs">
                  <QrCode className="h-4 w-4 mr-1" />
                  Export
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto">
                <TabsContent value="designer" className="p-4 space-y-4">
                  {/* View Controls */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center">
                        <Eye className="h-4 w-4 mr-2" />
                        View Controls
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Show Grid</span>
                        <Switch checked={showGrid} onCheckedChange={toggleGrid} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Show Zones</span>
                        <Switch checked={showZones} onCheckedChange={toggleZones} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Snap to Grid</span>
                        <Switch checked={snapToGrid} onCheckedChange={toggleSnapToGrid} />
                      </div>
                      <div className="space-y-2">
                        <span className="text-sm">Grid Size: {gridSize}px</span>
                        <Slider
                          value={[gridSize]}
                          onValueChange={([value]) => setGridSize(value)}
                          min={8}
                          max={40}
                          step={4}
                          className="w-full"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Add Tables */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center">
                        <Grid3X3 className="h-4 w-4 mr-2" />
                        Add Tables
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <BottomToolbar />
                    </CardContent>
                  </Card>

                  {/* 3D Controls */}
                  {viewMode === '3D' && (
                    <Table3DControls />
                  )}

                  {/* Selected Table Properties */}
                  {selectedTable && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card className="border-blue-200 bg-blue-50/50">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium flex items-center">
                            <Settings className="h-4 w-4 mr-2" />
                            Table Properties
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div>
                            <label className="text-xs font-medium text-slate-600">Table ID</label>
                            <div className="text-sm font-mono bg-white px-2 py-1 rounded border">
                              {selectedTable.label}
                            </div>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-slate-600">Capacity</label>
                            <div className="text-sm">{selectedTable.capacity} guests</div>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-slate-600">Shape</label>
                            <div className="text-sm capitalize">{selectedTable.shape}</div>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-slate-600">Status</label>
                            <Badge 
                              variant={selectedTable.status === 'FREE' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {selectedTable.status}
                            </Badge>
                          </div>
                          {selectedTable.zone && (
                            <div>
                              <label className="text-xs font-medium text-slate-600">Zone</label>
                              <div className="text-sm">{selectedTable.zone}</div>
                            </div>
                          )}
                          
                          {/* Quick Actions */}
                          <Separator />
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // Duplicate table
                                useTableStore.getState().duplicateTable(selectedTable.id);
                              }}
                              className="text-xs"
                            >
                              Duplicate
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // Center table
                                const centerX = 600;
                                const centerY = 400;
                                useTableStore.getState().moveTable(selectedTable.id, centerX, centerY);
                              }}
                              className="text-xs"
                            >
                              <AlignCenter className="h-3 w-3 mr-1" />
                              Center
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}

                  {/* Multi-Selection Tools */}
                  {selectedTables.length > 1 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card className="border-purple-200 bg-purple-50/50">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium flex items-center">
                            <Move className="h-4 w-4 mr-2" />
                            {selectedTables.length} Tables Selected
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => alignTables(selectedTableIds, 'left')}
                              className="text-xs"
                            >
                              Align Left
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => alignTables(selectedTableIds, 'right')}
                              className="text-xs"
                            >
                              Align Right
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => alignTables(selectedTableIds, 'top')}
                              className="text-xs"
                            >
                              Align Top
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => alignTables(selectedTableIds, 'bottom')}
                              className="text-xs"
                            >
                              Align Bottom
                            </Button>
                          </div>
                          <Separator />
                          <div className="grid grid-cols-1 gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => distributeTablesEvenly(selectedTableIds, 'horizontal')}
                              className="text-xs"
                            >
                              Distribute Horizontally
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => distributeTablesEvenly(selectedTableIds, 'vertical')}
                              className="text-xs"
                            >
                              Distribute Vertically
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}

                  {/* Reservations */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        Reservations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ReservationLink />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="zones" className="p-4">
                  <ZoneLegend />
                </TabsContent>

                <TabsContent value="tools" className="p-4 space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center">
                        <Merge className="h-4 w-4 mr-2" />
                        Merge Tables
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <TableMergeTool />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center">
                        <Split className="h-4 w-4 mr-2" />
                        Split Tables
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <TableSplitTool />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center">
                        <Camera className="h-4 w-4 mr-2" />
                        Import & Scan
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        size="sm"
                        onClick={() => {
                          // Implement import functionality
                          toast({
                            title: "Import Layout",
                            description: "Feature coming soon - import from glTF, USDZ, or JSON",
                          });
                        }}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Import Layout
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        size="sm"
                        onClick={() => {
                          // Implement camera scan
                          toast({
                            title: "Camera Scan",
                            description: "Feature coming soon - scan with device camera",
                          });
                        }}
                      >
                        <Smartphone className="h-4 w-4 mr-2" />
                        Camera Scan
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        size="sm"
                        onClick={() => {
                          // Export current layout
                          const layout = exportLayout();
                          const blob = new Blob([JSON.stringify(layout, null, 2)], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `floor-layout-${new Date().toISOString().split('T')[0]}.json`;
                          a.click();
                          URL.revokeObjectURL(url);
                          
                          toast({
                            title: "Layout Exported",
                            description: "Floor layout downloaded as JSON file",
                          });
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export JSON
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="export" className="p-4">
                  <QRCodeManager />
                </TabsContent>
              </div>
            </Tabs>
          </motion.div>

          {/* Canvas Area */}
          <div className="flex-1 relative">
            <FloorEditorCanvas />
            
            {/* Loading Overlay */}
            <AnimatePresence>
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center"
                >
                  <div className="flex items-center space-x-3 bg-white px-6 py-4 rounded-lg shadow-lg">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="text-sm text-slate-600">Processing...</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Canvas Help */}
            <motion.div 
              className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg text-xs text-slate-600 max-w-xs"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center space-x-1 mb-2">
                <Info className="h-3 w-3" />
                <span className="font-medium">Quick Help</span>
              </div>
              <div className="space-y-1">
                {viewMode === '3D' ? (
                  <>
                    <div>• Left-click + drag: Rotate view</div>
                    <div>• Right-click + drag: Pan around</div>
                    <div>• Scroll wheel: Zoom in/out</div>
                    <div>• Click tables: Select/deselect</div>
                  </>
                ) : (
                  <>
                    <div>• Click and drag to move tables</div>
                    <div>• Use corner handles to resize</div>
                    <div>• Arrow keys for precise positioning</div>
                    <div>• Shift+Click for multi-select</div>
                  </>
                )}
              </div>
            </motion.div>

            {/* Status Indicator */}
            <div className="absolute bottom-4 right-4 flex items-center space-x-2">
              <AnimatePresence>
                {!hasErrors ? (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="flex items-center space-x-1 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-medium"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Layout Valid</span>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="flex items-center space-x-1 bg-red-50 text-red-700 px-3 py-1 rounded-full text-xs font-medium"
                  >
                    <AlertTriangle className="h-3 w-3" />
                    <span>{validationErrors.length} Issues</span>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="flex items-center space-x-1 bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs">
                <Clock className="h-3 w-3" />
                <span>Auto-save: ON</span>
              </div>
              
              <div className="flex items-center space-x-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs">
                <Zap className="h-3 w-3" />
                <span>{viewMode} Mode</span>
              </div>
            </div>
          </div>
        </div>

        {/* Shortcuts Modal */}
        <AnimatePresence>
          {showShortcuts && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
              onClick={() => setShowShortcuts(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <Command className="h-5 w-5 mr-2" />
                    Keyboard Shortcuts
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowShortcuts(false)}
                  >
                    ×
                  </Button>
                </div>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Undo</span>
                    <kbd className="bg-slate-100 px-2 py-1 rounded text-xs">Ctrl+Z</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Redo</span>
                    <kbd className="bg-slate-100 px-2 py-1 rounded text-xs">Ctrl+Shift+Z</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Save Draft</span>
                    <kbd className="bg-slate-100 px-2 py-1 rounded text-xs">Ctrl+S</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Clear Selection</span>
                    <kbd className="bg-slate-100 px-2 py-1 rounded text-xs">Esc</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Toggle Grid</span>
                    <kbd className="bg-slate-100 px-2 py-1 rounded text-xs">G</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Toggle Zones</span>
                    <kbd className="bg-slate-100 px-2 py-1 rounded text-xs">Z</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>2D View</span>
                    <kbd className="bg-slate-100 px-2 py-1 rounded text-xs">2</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>3D View</span>
                    <kbd className="bg-slate-100 px-2 py-1 rounded text-xs">3</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Show Shortcuts</span>
                    <kbd className="bg-slate-100 px-2 py-1 rounded text-xs">?</kbd>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
