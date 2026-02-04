'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { useToast } from '@/shared/hooks/use-toast';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Plus, Trash2, Save, ArrowRight, Upload, FileText, Package, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  description?: string;
  extractionMethod?: string;
}

const UNITS = [
  'kg', 'g', 'l', 'ml', 'cups', 'tbsp', 'tsp', 'pieces', 'slices', 'cloves', 'bunches', 'boxes', 'bags'
];

const CATEGORIES = [
  'Meat & Poultry',
  'Seafood',
  'Vegetables',
  'Fruits',
  'Dairy & Eggs',
  'Grains & Rice',
  'Spices & Seasonings',
  'Oils & Fats',
  'Beverages',
  'Frozen Foods',
  'Canned Goods',
  'Bakery',
  'Other'
];

export default function InventoryManagementPage() {
  const { currentUser, isLoading, isInitialized } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState<'csv' | 'pdf'>('csv');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({
    name: '',
    quantity: 0,
    unit: 'kg',
    category: 'Other',
    description: ''
  });

  // Load existing inventory from multiple sources on mount
  useEffect(() => {
    const loadExistingInventory = async () => {
      try {
        const userId = currentUser?.id || 'default_user';
        
        // First try to load from API if user is authenticated
        if (currentUser?.id) {
          try {
            const response = await fetch(`/api/inventory?userId=${currentUser.id}`);
            if (response.ok) {
              const data = await response.json();
              if (data.inventory && Array.isArray(data.inventory)) {
                console.log('📦 Loaded inventory from API:', data.inventory.length, 'items');
                setInventoryItems(data.inventory);
                return;
              }
            }
          } catch (apiError) {
            console.warn('Failed to load from API, falling back to localStorage:', apiError);
          }
        }

        // Try localStorage with user-specific key (consistent with inventory page)
        const localStorageKey = `inventory_${userId}`;
        const storedLocalInventory = localStorage.getItem(localStorageKey);
        if (storedLocalInventory) {
          const parsedInventory = JSON.parse(storedLocalInventory);
          console.log('📦 [INVENTORY-MANAGEMENT] Loaded inventory from localStorage:', parsedInventory.length, 'items');
          console.log('📦 [INVENTORY-MANAGEMENT] Sample items:', JSON.stringify(parsedInventory.slice(0, 3), null, 2));
          setInventoryItems(parsedInventory);
          return;
        }

        // Fallback to sessionStorage for compatibility
        const storedSessionInventory = sessionStorage.getItem('inventoryItems');
        if (storedSessionInventory) {
          const parsedInventory = JSON.parse(storedSessionInventory);
          console.log('📦 Loaded inventory from sessionStorage:', parsedInventory.length, 'items');
          setInventoryItems(parsedInventory);
          // Also save to localStorage for future consistency
          localStorage.setItem(localStorageKey, storedSessionInventory);
          return;
        }
        
        console.log('📦 No existing inventory found');
      } catch (error) {
        console.error('Error loading inventory:', error);
      }
    };

    if (isInitialized && !isLoading) {
      loadExistingInventory();
    }
  }, [currentUser, isInitialized, isLoading]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Auto-detect file type
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setUploadType('csv');
      } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        setUploadType('pdf');
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !currentUser) {
      toast({
        title: 'Error',
        description: 'Please select a file and ensure you are logged in',
        variant: 'destructive'
      });
      return;
    }

    setIsUploading(true);
    
    try {
      if (uploadType === 'pdf') {
        await handlePDFUpload();
      } else {
        await handleCSVUpload();
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Error',
        description: 'Upload failed',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handlePDFUpload = async () => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const base64 = e.target?.result as string;
        
        const response = await fetch('/api/uploadInventory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            file: base64,
            userId: currentUser?.id || 'anonymous',
            type: 'pdf'
          })
        });

        const result = await response.json();
        
        if (response.ok) {
          const extractedItems = result.items || [];
          setInventoryItems(prev => [...prev, ...extractedItems]);
          toast({
            title: 'Success',
            description: `Extracted ${extractedItems.length} inventory items from PDF`
          });
        } else {
          throw new Error(result.error || 'PDF extraction failed');
        }
      } catch (error) {
        console.error('PDF upload error:', error);
        throw error;
      }
    };
    
    if (selectedFile) {
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleCSVUpload = async () => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const csvText = e.target?.result as string;
        const lines = csvText.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          throw new Error('CSV file must have at least a header and one data row');
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const items: InventoryItem[] = [];

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          if (values.length >= 3) {
            items.push({
              id: `csv-${Date.now()}-${i}`,
              name: values[0] || 'Unknown Item',
              quantity: parseFloat(values[1]) || 0,
              unit: values[2] || 'kg',
              category: values[3] || 'Other',
              description: values[4] || '',
              extractionMethod: 'csv-upload'
            });
          }
        }

        setInventoryItems(prev => [...prev, ...items]);
        toast({
          title: 'Success',
          description: `Imported ${items.length} inventory items from CSV`
        });
      } catch (error) {
        console.error('CSV upload error:', error);
        throw error;
      }
    };
    
    if (selectedFile) {
      reader.readAsText(selectedFile);
    }
  };

  const addManualItem = () => {
    if (!newItem.name || newItem.quantity === undefined) {
      toast({
        title: 'Error',
        description: 'Please fill in name and quantity',
        variant: 'destructive'
      });
      return;
    }

    const item: InventoryItem = {
      id: `manual-${Date.now()}`,
      name: newItem.name,
      quantity: newItem.quantity || 0,
      unit: newItem.unit || 'kg',
      category: newItem.category || 'Other',
      description: newItem.description || '',
      extractionMethod: 'manual-entry'
    };

    setInventoryItems(prev => [...prev, item]);
    setNewItem({
      name: '',
      quantity: 0,
      unit: 'kg',
      category: 'Other',
      description: ''
    });
    setShowAddForm(false);
    
    toast({
      title: 'Success',
      description: 'Item added to inventory'
    });
  };

  const updateItem = (id: string, field: keyof InventoryItem, value: any) => {
    setInventoryItems(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const removeItem = (id: string) => {
    setInventoryItems(prev => prev.filter(item => item.id !== id));
    toast({
      title: 'Success',
      description: 'Item removed from inventory'
    });
  };

  const handleNext = async () => {
    try {
      const userId = currentUser?.id || 'default_user';
      
      // Debug: Log what we're saving
      console.log('💾 [INVENTORY-MANAGEMENT-NEXT] Saving inventory items:', inventoryItems.length, 'items');
      console.log('💾 [INVENTORY-MANAGEMENT-NEXT] Sample items being saved:', inventoryItems.slice(0, 3));
      
      // Save inventory to BOTH sessionStorage (for compatibility) AND localStorage (for inventory page)
      sessionStorage.setItem('inventoryItems', JSON.stringify(inventoryItems));
      localStorage.setItem(`inventory_${userId}`, JSON.stringify(inventoryItems));
      
      console.log('✅ Inventory saved to both sessionStorage and localStorage for userId:', userId);
      
      // Also sync with API if user is authenticated
      if (currentUser?.id) {
        try {
          const response = await fetch('/api/inventory', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: currentUser.id,
              inventory: inventoryItems,
              action: 'sync'
            }),
          });
          
          if (response.ok) {
            console.log('✅ Inventory synced with API successfully');
          } else {
            console.warn('⚠️ Failed to sync inventory with API');
          }
        } catch (apiError) {
          console.warn('⚠️ API sync failed, but continuing with localStorage:', apiError);
        }
      }
      
      router.push('/menu-upload');
    } catch (error) {
      console.error('Error saving inventory:', error);
      toast({
        title: "Error",
        description: "Failed to save inventory. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSaveInventory = async () => {
    try {
      const userId = currentUser?.id || 'default_user';
      
      // Debug: Log what we're saving
      console.log('💾 [INVENTORY-MANAGEMENT] Saving inventory items:', inventoryItems.length, 'items');
      console.log('💾 [INVENTORY-MANAGEMENT] Sample items being saved:', inventoryItems.slice(0, 3));
      console.log('💾 [INVENTORY-MANAGEMENT] Full inventory data:', JSON.stringify(inventoryItems, null, 2));
      
      // Save inventory to BOTH sessionStorage (for compatibility) AND localStorage (for inventory page)
      sessionStorage.setItem('inventoryItems', JSON.stringify(inventoryItems));
      localStorage.setItem(`inventory_${userId}`, JSON.stringify(inventoryItems));
      
      console.log('✅ Inventory saved to both sessionStorage and localStorage for userId:', userId);
      
      // Also sync with API if user is authenticated
      if (currentUser?.id) {
        try {
          const response = await fetch('/api/inventory', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: currentUser.id,
              inventory: inventoryItems,
              action: 'sync'
            }),
          });
          
          if (response.ok) {
            console.log('✅ Inventory synced with API successfully');
            toast({
              title: "Success",
              description: "Inventory saved successfully and synced with server!",
            });
          } else {
            console.warn('⚠️ Failed to sync inventory with API');
            toast({
              title: "Warning",
              description: "Inventory saved locally, but failed to sync with server.",
              variant: "destructive",
            });
          }
        } catch (apiError) {
          console.warn('⚠️ API sync failed, but continuing with localStorage:', apiError);
          toast({
            title: "Warning",
            description: "Inventory saved locally, but failed to sync with server.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Success",
          description: "Inventory saved locally!",
        });
      }
    } catch (error) {
      console.error('Error saving inventory:', error);
      toast({
        title: "Error",
        description: "Failed to save inventory. Please try again.",
        variant: "destructive",
      });
    }
  };


  // Show loading state while auth is initializing
  if (isLoading || !isInitialized) {
    return (
      
        <div className="max-w-6xl mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading...</span>
          </div>
        </div>
      
    );
  }

  // Show login prompt if not authenticated
  if (!currentUser) {
    return (
      
        <div className="max-w-6xl mx-auto p-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-6 text-center">
            <h2 className="text-xl font-semibold text-yellow-800 mb-2">Authentication Required</h2>
            <p className="text-yellow-700">Please log in to access the inventory management feature.</p>
          </div>
        </div>
      
    );
  }

  return (
    
      <div className="max-w-6xl mx-auto p-6">
        {/* Header with Centered Title and Action Buttons */}
        <div className="mb-6">
          {/* Back Button */}
          <div className="mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/setup')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Setup
            </Button>
          </div>
          
          {/* Centered Title */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold">Inventory Management</h1>
            <p className="text-gray-600">Upload or manually add your current inventory items</p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-center gap-2">
            <Button
              onClick={handleSaveInventory}
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Inventory
            </Button>
            <Button
              onClick={handleNext}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Next: Upload Menu →
            </Button>
          </div>
        </div>

        {/* Upload Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Inventory
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="file-upload">Select File</Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".csv,.pdf"
                  onChange={handleFileSelect}
                  className="mt-1"
                />
              </div>
              <div className="w-48">
                <Label htmlFor="upload-type">File Type</Label>
                <Select value={uploadType} onValueChange={(value: 'csv' | 'pdf') => setUploadType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV File</SelectItem>
                    <SelectItem value="pdf">PDF File</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedFile && (
              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                <span className="text-sm text-gray-700">
                  📄 {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </span>
                <Button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isUploading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      {uploadType === 'pdf' ? 'Extracting...' : 'Processing...'}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {uploadType === 'pdf' ? <FileText className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
                      {uploadType === 'pdf' ? 'Extract from PDF' : 'Import CSV'}
                    </div>
                  )}
                </Button>
              </div>
            )}

            <div className="text-sm text-gray-500">
              <p><strong>CSV Format:</strong> Name, Quantity, Unit, Category, Description</p>
              <p><strong>PDF Format:</strong> Upload inventory documents for AI extraction</p>
            </div>
          </CardContent>
        </Card>

        {/* Manual Add Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add Manual Item
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!showAddForm ? (
              <Button
                onClick={() => setShowAddForm(true)}
                variant="outline"
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Item
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="item-name">Item Name</Label>
                    <Input
                      id="item-name"
                      value={newItem.name}
                      onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Chicken Breast"
                    />
                  </div>
                  <div>
                    <Label htmlFor="item-category">Category</Label>
                    <Select
                      value={newItem.category}
                      onValueChange={(value) => setNewItem(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="item-quantity">Quantity</Label>
                    <Input
                      id="item-quantity"
                      type="number"
                      value={newItem.quantity}
                      onChange={(e) => setNewItem(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                      placeholder="0"
                      min="0"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="item-unit">Unit</Label>
                    <Select
                      value={newItem.unit}
                      onValueChange={(value) => setNewItem(prev => ({ ...prev, unit: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {UNITS.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="item-description">Description (Optional)</Label>
                  <Input
                    id="item-description"
                    value={newItem.description}
                    onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="e.g., Fresh, organic"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={addManualItem} className="bg-green-600 hover:bg-green-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowAddForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Inventory Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Current Inventory ({inventoryItems.length} items)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {inventoryItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No inventory items yet. Upload a file or add items manually.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventoryItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{item.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                            className="w-20"
                            min="0"
                            step="0.1"
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={item.unit}
                            onValueChange={(value) => updateItem(item.id, 'unit', value)}
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {UNITS.map((unit) => (
                                <SelectItem key={unit} value={unit}>
                                  {unit}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.description || ''}
                            onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                            placeholder="Description"
                            className="w-32"
                          />
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {item.extractionMethod || 'manual'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeItem(item.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    
  );
}
