'use client';

import React, { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Badge } from '@/shared/components/ui/badge';
import { Separator } from '@/shared/components/ui/separator';
import { 
  Upload, 
  Download, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Package,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/shared/hooks/use-toast';

interface InventoryItem {
  id?: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  price?: number;
  expiryDate?: string;
  location?: string;
  supplier?: string;
}

export default function InventoryImportPage() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [importedCount, setImportedCount] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        setError(null);
        setSuccess(false);
        setInventoryItems([]);
        setPreviewMode(false);
      } else {
        setError('Please select a valid CSV file');
        setFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    setError(null);
    setSuccess(false);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/inventory-import', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Import failed');
      }
      
      setInventoryItems(data.inventoryItems || []);
      setPreviewMode(true);
      setSuccess(true);
      toast({
        title: 'CSV Uploaded Successfully',
        description: `Found ${data.inventoryItems?.length || 0} inventory items`,
      });
      
    } catch (err: any) {
      setError(err.message || 'Failed to upload CSV file');
      toast({
        title: 'Upload Failed',
        description: err.message || 'Failed to upload CSV file',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleImportToInventory = async () => {
    if (inventoryItems.length === 0) return;
    
    setUploading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/inventory-import/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items: inventoryItems }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Import to inventory failed');
      }
      
      setImportedCount(data.importedCount || 0);
      setSuccess(true);
      toast({
        title: 'Inventory Updated Successfully',
        description: `Successfully imported ${data.importedCount || 0} items to inventory`,
      });
      
    } catch (err: any) {
      setError(err.message || 'Failed to import to inventory');
      toast({
        title: 'Import Failed',
        description: err.message || 'Failed to import to inventory',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const template = `name,category,quantity,unit,price,expiryDate,location,supplier
Tomatoes,Vegetables,10,kg,2.50,2024-12-31,Cold Storage,Local Market
Chicken Breast,Meat,5,kg,8.00,2024-12-25,Freezer,Butcher Shop
Rice,Grains,20,kg,1.50,2025-12-31,Dry Storage,Wholesale Market
Milk,Dairy,10,liters,1.20,2024-12-20,Refrigerator,Dairy Farm
Olive Oil,Condiments,5,liters,12.00,2025-06-30,Dry Storage,Import Supplier`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Link 
                href="/apps/ioms" 
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to IOMS</span>
              </Link>
              <div className="w-px h-6 bg-gray-300"></div>
              <h1 className="text-3xl font-bold text-gray-900">Inventory Import</h1>
            </div>
          </div>

          {/* Upload Section */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Upload className="w-5 h-5" />
                <span>Upload CSV File</span>
              </CardTitle>
              <CardDescription>
                Import inventory items directly from a CSV file. The file should contain columns for name, category, quantity, unit, and optionally price, expiry date, location, and supplier.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <Label htmlFor="csv-file">Select CSV File</Label>
                    <Input
                      id="csv-file"
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex flex-col justify-end">
                    <Label className="mb-1 text-sm text-gray-600">Template</Label>
                    <Button
                      onClick={downloadTemplate}
                      variant="outline"
                      className="flex items-center space-x-2 whitespace-nowrap"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Template</span>
                    </Button>
                  </div>
                </div>
                
                {file && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <FileText className="w-4 h-4" />
                    <span>Selected: {file.name}</span>
                    <Badge variant="secondary">{(file.size / 1024).toFixed(1)} KB</Badge>
                  </div>
                )}
                
                <div className="flex space-x-3">
                  <Button
                    onClick={handleUpload}
                    disabled={!file || uploading}
                    className="flex items-center space-x-2"
                  >
                    {uploading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    <span>{uploading ? 'Processing...' : 'Process CSV'}</span>
                  </Button>
                  
                  {file && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setFile(null);
                        setInventoryItems([]);
                        setError(null);
                        setSuccess(false);
                        setPreviewMode(false);
                      }}
                    >
                      Clear
                    </Button>
                  )}
                </div>
                
                {error && (
                  <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <span className="text-red-700">{error}</span>
                  </div>
                )}
                
                {success && (
                  <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-green-700">CSV processed successfully! Found {inventoryItems.length} items.</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Preview Section */}
          {previewMode && inventoryItems.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Package className="w-5 h-5" />
                  <span>Preview ({inventoryItems.length} items)</span>
                </CardTitle>
                <CardDescription>
                  Review the items before importing them to your inventory. You can make changes or proceed with the import.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-200">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium text-gray-700">Name</th>
                        <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium text-gray-700">Category</th>
                        <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium text-gray-700">Quantity</th>
                        <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium text-gray-700">Unit</th>
                        <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium text-gray-700">Price</th>
                        <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium text-gray-700">Expiry Date</th>
                        <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium text-gray-700">Location</th>
                        <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium text-gray-700">Supplier</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventoryItems.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="border border-gray-200 px-3 py-2 text-sm">{item.name}</td>
                          <td className="border border-gray-200 px-3 py-2 text-sm">
                            <Badge variant="secondary">{item.category}</Badge>
                          </td>
                          <td className="border border-gray-200 px-3 py-2 text-sm">{item.quantity}</td>
                          <td className="border border-gray-200 px-3 py-2 text-sm">{item.unit}</td>
                          <td className="border border-gray-200 px-3 py-2 text-sm">{item.price ? `$${item.price}` : '-'}</td>
                          <td className="border border-gray-200 px-3 py-2 text-sm">{item.expiryDate || '-'}</td>
                          <td className="border border-gray-200 px-3 py-2 text-sm">{item.location || '-'}</td>
                          <td className="border border-gray-200 px-3 py-2 text-sm">{item.supplier || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="mt-6 flex justify-center">
                  <Button
                    onClick={handleImportToInventory}
                    disabled={uploading}
                    size="lg"
                    className="flex items-center space-x-2"
                  >
                    {uploading ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <Package className="w-5 h-5" />
                    )}
                    <span>{uploading ? 'Importing...' : `Import ${inventoryItems.length} Items to Inventory`}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Success Message */}
          {importedCount > 0 && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-6">
                <div className="text-center">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-green-900 mb-2">Import Successful!</h3>
                  <p className="text-green-700 mb-4">
                    Successfully imported {importedCount} items to your inventory.
                  </p>
                  <div className="flex justify-center space-x-4">
                    <Link href="/inventory">
                      <Button variant="outline" className="border-green-300 text-green-700 hover:bg-green-100">
                        View Inventory
                      </Button>
                    </Link>
                    <Link href="/apps/ioms">
                      <Button className="bg-green-600 hover:bg-green-700">
                        Back to IOMS
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    
  );
}
