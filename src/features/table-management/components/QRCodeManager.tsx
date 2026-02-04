'use client';

import React, { useState } from 'react';
import { useTableStore } from '@/features/table-management/stores/tableStore';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { QrCode, Download, FileImage, FileText, Package, Loader2 } from 'lucide-react';
import { cn } from '@/server/lib/utils';

interface QRCodeManagerProps {
  className?: string;
}

interface QRCodeGeneration {
  tableId: string;
  status: 'pending' | 'generating' | 'completed' | 'error';
  pngUrl?: string;
  pdfUrl?: string;
  error?: string;
}

export function QRCodeManager({ className }: QRCodeManagerProps) {
  const { tables } = useTableStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [qrCodes, setQrCodes] = useState<Map<string, QRCodeGeneration>>(new Map());
  const [batchProgress, setBatchProgress] = useState<{ completed: number; total: number } | null>(null);

  const handleGenerateSingle = async (tableId: string) => {
    setQrCodes(prev => new Map(prev.set(tableId, { 
      tableId, 
      status: 'generating' 
    })));

    try {
      const response = await fetch('/api/pos/qr/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': 'default-tenant',
        },
        body: JSON.stringify({
          tableId,
          format: ['png', 'pdf'],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate QR code');
      }

      const result = await response.json();
      
      setQrCodes(prev => new Map(prev.set(tableId, {
        tableId,
        status: 'completed',
        pngUrl: result.pngUrl,
        pdfUrl: result.pdfUrl,
      })));

    } catch (error) {
      setQrCodes(prev => new Map(prev.set(tableId, {
        tableId,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      })));
    }
  };

  const handleGenerateBatch = async () => {
    setIsGenerating(true);
    setBatchProgress({ completed: 0, total: tables.length });

    try {
      const response = await fetch('/api/pos/qr/generate-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': 'default-tenant',
        },
        body: JSON.stringify({
          tableIds: tables.map(t => t.id),
          format: ['png', 'pdf'],
          generateZip: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate batch QR codes');
      }

      const result = await response.json();
      
      // Update individual QR codes
      result.qrCodes?.forEach((qr: any) => {
        setQrCodes(prev => new Map(prev.set(qr.tableId, {
          tableId: qr.tableId,
          status: 'completed',
          pngUrl: qr.pngUrl,
          pdfUrl: qr.pdfUrl,
        })));
      });

      // Download ZIP if available
      if (result.zipUrl) {
        const link = document.createElement('a');
        link.href = result.zipUrl;
        link.download = `table-qr-codes-${new Date().toISOString().split('T')[0]}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

    } catch (error) {
      console.error('Batch generation failed:', error);
    } finally {
      setIsGenerating(false);
      setBatchProgress(null);
    }
  };

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getQRCodeStatus = (tableId: string) => {
    return qrCodes.get(tableId);
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center">
          <QrCode className="h-4 w-4 mr-2" />
          QR Code Manager
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Batch Generation */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium">Batch Generation</p>
            <Badge variant="outline" className="text-xs">
              {tables.length} tables
            </Badge>
          </div>
          
          <Button
            size="sm"
            onClick={handleGenerateBatch}
            disabled={isGenerating || tables.length === 0}
            className="w-full"
          >
            {isGenerating ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Package className="h-3 w-3 mr-1" />
            )}
            {isGenerating ? 'Generating...' : 'Generate All QR Codes (ZIP)'}
          </Button>

          {batchProgress && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{
                  width: `${(batchProgress.completed / batchProgress.total) * 100}%`,
                }}
              />
            </div>
          )}
        </div>

        {/* Individual Table QR Codes */}
        <div className="space-y-2">
          <p className="text-xs font-medium">Individual Tables</p>
          
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {tables.map(table => {
              const qrStatus = getQRCodeStatus(table.id);
              const isSelected = false;
              
              return (
                <div
                  key={table.id}
                  className={cn(
                    'flex items-center justify-between p-2 rounded border text-xs',
                    isSelected ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                  )}
                >
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">
                      {table.label || table.id}
                    </span>
                    
                    {qrStatus && (
                      <Badge
                        variant={qrStatus.status === 'completed' ? 'default' : 
                                qrStatus.status === 'error' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {qrStatus.status}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center space-x-1">
                    {qrStatus?.status === 'completed' ? (
                      <>
                        {qrStatus.pngUrl && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDownload(
                              qrStatus.pngUrl!, 
                              `${table.label || table.id}-qr.png`
                            )}
                            className="h-6 w-6 p-0"
                            title="Download PNG"
                          >
                            <FileImage className="h-3 w-3" />
                          </Button>
                        )}
                        
                        {qrStatus.pdfUrl && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDownload(
                              qrStatus.pdfUrl!, 
                              `${table.label || table.id}-qr.pdf`
                            )}
                            className="h-6 w-6 p-0"
                            title="Download PDF"
                          >
                            <FileText className="h-3 w-3" />
                          </Button>
                        )}
                      </>
                    ) : qrStatus?.status === 'generating' ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleGenerateSingle(table.id)}
                        className="h-6 w-6 p-0"
                        title="Generate QR Code"
                      >
                        <QrCode className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {tables.length === 0 && (
            <p className="text-xs text-gray-500 text-center py-4">
              No tables in layout
            </p>
          )}
        </div>

        {/* Instructions */}
        <div className="p-2 bg-gray-50 border border-gray-200 rounded text-xs">
          <p className="font-medium mb-1">QR Code Instructions:</p>
          <ul className="space-y-0.5 text-gray-600">
            <li>• PNG files: For digital displays</li>
            <li>• PDF files: For printing table tents</li>
            <li>• ZIP batch: All codes in one download</li>
            <li>• Codes link to table-specific ordering</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

export default QRCodeManager;
