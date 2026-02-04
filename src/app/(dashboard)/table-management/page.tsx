'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Separator } from '@/shared/components/ui/separator';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { FloorEditorCanvas } from '@/features/table-management/components/FloorEditorCanvas';
import { BottomToolbar } from '@/features/table-management/components/BottomToolbar';
import { SaveDraftButton } from '@/features/table-management/components/SaveDraftButton';
import { ActivateLayoutButton } from '@/features/table-management/components/ActivateLayoutButton';
import { ZoneLegend } from '@/features/table-management/components/ZoneLegend';
import { TableMergeTool } from '@/features/table-management/components/TableMergeTool';
import { TableSplitTool } from '@/features/table-management/components/TableSplitTool';
import { QRCodeManager } from '@/features/table-management/components/QRCodeManager';
import { ReservationLink } from '@/features/table-management/components/ReservationLink';
import { useTableStore } from '@/features/table-management/stores/tableStore';
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
  Layers
} from 'lucide-react';

export default function TableManagementPage() {
  const { 
    tables, 
    zones, 
    selectedTableIds, 
    isDraftMode, 
    isLoading, 
    error, 
    validationErrors,
    canUndo,
    canRedo,
    undo,
    redo,
    saveDraft,
    activateLayout,
    loadDraft
  } = useTableStore();

  const [activeTab, setActiveTab] = useState('editor');
  const [showAdvancedTools, setShowAdvancedTools] = useState(false);

  // Load draft on mount
  useEffect(() => {
    loadDraft('main-floor');
  }, [loadDraft]);

  const hasErrors = validationErrors.length > 0;
  const selectedTable = selectedTableIds.length === 1 ? tables.find(t => t.id === selectedTableIds[0]) : null;
  const totalTables = tables.length;
  const totalCapacity = tables.reduce((sum, table) => sum + table.capacity, 0);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700">
                <Layout className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Table Management</h1>
                <p className="text-xs text-gray-500">Design and manage your floor layout</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={isDraftMode ? "outline" : "default"} className="text-xs">
                {isDraftMode ? "Draft" : "Live"}
              </Badge>
              {hasErrors && (
                <Badge variant="destructive" className="text-xs">
                  {validationErrors.length} Issues
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Stats */}
            <div className="hidden md:flex items-center gap-4 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 text-sm">
                <Grid3X3 className="h-4 w-4 text-gray-500" />
                <span className="font-semibold text-gray-900">{totalTables}</span>
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
                <Layers className="h-4 w-4 text-gray-500" />
                <span className="font-semibold text-gray-900">{zones.length}</span>
                <span className="text-gray-500">Zones</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={undo}
                disabled={!canUndo}
                className="gap-1"
              >
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">Undo</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={redo}
                disabled={!canRedo}
                className="gap-1"
              >
                <History className="h-4 w-4 rotate-180" />
                <span className="hidden sm:inline">Redo</span>
              </Button>
              <SaveDraftButton />
              <ActivateLayoutButton />
            </div>
          </div>
          </div>

        {/* Validation Errors */}
        {hasErrors && (
          <Alert className="mt-3 border-red-300 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-sm text-red-800">
              <strong>Layout Issues:</strong> {validationErrors.join(', ')}
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-4 m-3 bg-gray-100">
              <TabsTrigger value="editor" className="text-xs data-[state=active]:bg-white">
                <Settings className="h-4 w-4 mr-1" />
                Editor
              </TabsTrigger>
              <TabsTrigger value="zones" className="text-xs data-[state=active]:bg-white">
                <Palette className="h-4 w-4 mr-1" />
                Zones
              </TabsTrigger>
              <TabsTrigger value="tools" className="text-xs data-[state=active]:bg-white">
                <Merge className="h-4 w-4 mr-1" />
                Tools
              </TabsTrigger>
              <TabsTrigger value="export" className="text-xs data-[state=active]:bg-white">
                <QrCode className="h-4 w-4 mr-1" />
                Export
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto p-3">
              <TabsContent value="editor" className="space-y-3 mt-0">
                <Card className="border-gray-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center text-gray-900">
                      <Grid3X3 className="h-4 w-4 mr-2 text-blue-600" />
                      Add Tables
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <BottomToolbar />
                  </CardContent>
                </Card>

                {selectedTable && (
                  <Card className="border-blue-200 shadow-sm bg-blue-50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold flex items-center text-gray-900">
                        <Settings className="h-4 w-4 mr-2 text-blue-600" />
                        Table Properties
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-white p-2 rounded-lg border border-gray-200">
                          <label className="text-xs font-medium text-gray-500 block mb-1">Table ID</label>
                          <div className="text-sm font-semibold text-gray-900">
                            {selectedTable.label}
                          </div>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-gray-200">
                          <label className="text-xs font-medium text-gray-500 block mb-1">Capacity</label>
                          <div className="text-sm font-semibold text-gray-900">{selectedTable.capacity} guests</div>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-gray-200">
                          <label className="text-xs font-medium text-gray-500 block mb-1">Shape</label>
                          <div className="text-sm font-semibold text-gray-900 capitalize">{selectedTable.shape}</div>
                        </div>
                        {selectedTable.zone && (
                          <div className="bg-white p-2 rounded-lg border border-gray-200">
                            <label className="text-xs font-medium text-gray-500 block mb-1">Zone</label>
                            <div className="text-sm font-semibold text-gray-900">{selectedTable.zone}</div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card className="border-gray-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center text-gray-900">
                      <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                      Reservations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ReservationLink />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="zones" className="space-y-3 mt-0">
                <ZoneLegend />
              </TabsContent>

              <TabsContent value="tools" className="space-y-3 mt-0">
                <Card className="border-gray-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center text-gray-900">
                      <Merge className="h-4 w-4 mr-2 text-blue-600" />
                      Merge Tables
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <TableMergeTool />
                  </CardContent>
                </Card>

                <Card className="border-gray-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center text-gray-900">
                      <Split className="h-4 w-4 mr-2 text-blue-600" />
                      Split Tables
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <TableSplitTool />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="export" className="space-y-3 mt-0">
                <Card className="border-gray-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center text-gray-900">
                      <QrCode className="h-4 w-4 mr-2 text-blue-600" />
                      QR Code Manager
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <QRCodeManager />
                  </CardContent>
                </Card>
              </TabsContent>
              </div>
            </Tabs>
          </div>

        {/* Canvas Area */}
        <div className="flex-1 relative bg-white">
          <FloorEditorCanvas />
          
          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
              <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-xl shadow-lg border border-gray-200">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                <span className="text-sm font-medium text-gray-900">Loading layout...</span>
              </div>
            </div>
          )}

          {/* Canvas Help */}
          <div className="absolute top-4 right-4 bg-white rounded-xl p-4 shadow-md border border-gray-200 text-xs text-gray-700 max-w-xs">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-md bg-blue-100">
                <Info className="h-3 w-3 text-blue-600" />
              </div>
              <span className="font-semibold text-gray-900">Quick Help</span>
            </div>
            <div className="space-y-1.5 text-gray-600">
              <div className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Click and drag to move tables</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Use corner handles to resize</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Arrow keys for precise positioning</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Shift+Click for multi-select</span>
              </div>
            </div>
          </div>

          {/* Status Indicator */}
          <div className="absolute bottom-4 right-4 flex items-center gap-2">
            {!hasErrors ? (
              <div className="flex items-center gap-2 bg-white border border-green-200 text-green-700 px-3 py-2 rounded-lg text-xs font-medium shadow-md">
                <CheckCircle2 className="h-4 w-4" />
                <span>Layout Valid</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-white border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs font-medium shadow-md">
                <AlertTriangle className="h-4 w-4" />
                <span>{validationErrors.length} Issues</span>
              </div>
            )}
            <div className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 px-3 py-2 rounded-lg text-xs font-medium shadow-md">
              <Clock className="h-4 w-4" />
              <span>Auto-save</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 