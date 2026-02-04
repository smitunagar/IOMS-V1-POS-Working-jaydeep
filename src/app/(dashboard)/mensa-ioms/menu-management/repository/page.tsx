"use client";

import { AppLayout } from "@/shared/components/layout/AppLayout";
import { useState, useRef } from "react";
import { 
  ArrowLeft,
  FolderOpen,
  Search,
  Edit,
  Copy,
  Archive,
  Download,
  FileText,
  Calendar,
  Filter,
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  ChevronRight,
  Plus,
  Trash2,
  Save
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Ingredient {
  name: string;
  quantity?: string;
  unit?: string;
}

interface MenuItem {
  id?: string;
  name: string;
  price?: string;
  category?: string;
  ingredients?: string[] | Ingredient[];
  description?: string;
  sizes?: Array<{ size: string; price: string }>;
}

export default function MenuRepositoryPage() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'extracting' | 'success' | 'error'>('idle');
  const [extractedItems, setExtractedItems] = useState<MenuItem[]>([]);
  const [showExtractedItems, setShowExtractedItems] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingIngredientIndex, setEditingIngredientIndex] = useState<{itemId: string, index: number} | null>(null);
  const [newIngredient, setNewIngredient] = useState<{name: string, quantity: string, unit: string}>({name: '', quantity: '', unit: ''});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const normalizeIngredients = (ingredients?: string[] | Ingredient[]): Ingredient[] => {
    return (ingredients || []).map((ingredient) =>
      typeof ingredient === 'string' ? { name: ingredient } : ingredient
    );
  };

  const handleFileSelect = (file: File) => {
    const validTypes = ['application/pdf', 'text/csv', 'application/vnd.ms-excel'];
    const validExtensions = ['.pdf', '.csv'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (validTypes.includes(file.type) || validExtensions.includes(fileExtension)) {
      setSelectedFile(file);
      setUploadStatus('idle');
    } else {
      alert('Please select a PDF or CSV file');
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setUploadStatus('idle');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploadStatus('extracting');
    setExtractionError(null);
    setExtractedItems([]);
    setShowExtractedItems(false);
    
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64 = e.target?.result as string;
          
          // Call the menu upload API which uses Gemini for extraction
          const response = await fetch('/api/uploadMenu', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              file: base64,
              userId: 'current-user' // TODO: Get from auth context
            })
          });

          const result = await response.json();
          
          if (response.ok && result.success && result.menu) {
            setExtractedItems(result.menu);
            setUploadStatus('success');
            setShowExtractedItems(true);
            // Clear file selection after successful extraction
            setSelectedFile(null);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
          } else {
            throw new Error(result.error || result.message || 'Extraction failed');
          }
        } catch (error: any) {
          console.error('Extraction error:', error);
          setExtractionError(error.message || 'Failed to extract menu items from PDF');
          setUploadStatus('error');
        }
      };
      
      reader.readAsDataURL(selectedFile);
    } catch (error: any) {
      console.error('File processing error:', error);
      setExtractionError(error.message || 'Failed to process file');
      setUploadStatus('error');
    }
  };

  // Editing functions
  const startEditingItem = (itemId: string) => {
    setEditingItemId(itemId);
  };

  const cancelEditing = () => {
    setEditingItemId(null);
    setEditingIngredientIndex(null);
    setNewIngredient({name: '', quantity: '', unit: ''});
  };

  const saveItem = (itemId: string) => {
    setExtractedItems(items => items.map(item => 
      item.id === itemId ? { ...item } : item
    ));
    setEditingItemId(null);
  };

  const updateItemField = (itemId: string, field: keyof MenuItem, value: any) => {
    setExtractedItems(items => items.map(item => 
      item.id === itemId ? { ...item, [field]: value } : item
    ));
  };

  const addNewItem = () => {
    const newItem: MenuItem = {
      id: `new-item-${Date.now()}`,
      name: '',
      price: '',
      category: '',
      ingredients: [],
      description: ''
    };
    setExtractedItems([...extractedItems, newItem]);
    setEditingItemId(newItem.id!);
  };

  const deleteItem = (itemId: string) => {
    setExtractedItems(items => items.filter(item => item.id !== itemId));
  };

  const addIngredientToItem = (itemId: string) => {
    if (!newIngredient.name.trim()) return;
    
    const ingredientToAdd: Ingredient = {
      name: newIngredient.name.trim(),
      quantity: newIngredient.quantity.trim() || undefined,
      unit: newIngredient.unit.trim() || undefined
    };

    setExtractedItems(items => items.map(item => {
      if (item.id === itemId) {
        const currentIngredients = normalizeIngredients(item.ingredients);
        return {
          ...item,
          ingredients: [...currentIngredients, ingredientToAdd]
        };
      }
      return item;
    }));

    setNewIngredient({name: '', quantity: '', unit: ''});
  };

  const removeIngredient = (itemId: string, index: number) => {
    setExtractedItems(items => items.map(item => {
      if (item.id === itemId) {
        const updatedIngredients = normalizeIngredients(item.ingredients);
        updatedIngredients.splice(index, 1);
        return {
          ...item,
          ingredients: updatedIngredients
        };
      }
      return item;
    }));
  };

  const updateIngredient = (itemId: string, index: number, field: 'name' | 'quantity' | 'unit', value: string) => {
    setExtractedItems(items => items.map(item => {
      if (item.id === itemId) {
        const updatedIngredients = normalizeIngredients(item.ingredients);
        const ingredient = updatedIngredients[index];
        if (!ingredient) {
          return item;
        }
        updatedIngredients[index] = { ...ingredient, [field]: value };
        return {
          ...item,
          ingredients: updatedIngredients
        };
      }
      return item;
    }));
  };
  return (
    <AppLayout pageTitle="Menu Repository">
      <div className="min-h-screen bg-[#F5F5F7] p-6">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/mensa-ioms/menu-management"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-wm-blue mb-4 transition-colors"
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">Back to Menu Management</span>
          </Link>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <FolderOpen className="w-7 h-7 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-4xl font-headline font-black text-wm-blue tracking-tight">
                Menu Repository
              </h1>
              <p className="text-gray-600 mt-1 font-sans">
                Access and manage existing menu configurations
              </p>
            </div>
          </div>
        </div>

        {/* Menu Upload Section */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-enterprise p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-headline font-black text-wm-blue mb-1">
                Upload Menu
              </h2>
              <p className="text-sm text-gray-600">
                Upload menu files in PDF or CSV format
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-200">
                PDF
              </span>
              <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-200">
                CSV
              </span>
            </div>
          </div>

          {/* File Upload Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              border-2 border-dashed rounded-2xl p-8 text-center transition-all
              ${isDragging 
                ? 'border-wm-blue bg-blue-50' 
                : selectedFile 
                  ? 'border-gray-300 bg-gray-50' 
                  : 'border-gray-300 bg-white hover:border-wm-blue hover:bg-blue-50/30'
              }
            `}
          >
            {!selectedFile ? (
              <>
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-wm-blue/10 rounded-full flex items-center justify-center mb-4">
                    <Upload className="w-8 h-8 text-wm-blue" strokeWidth={2} />
                  </div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Drag and drop your menu file here, or
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-2.5 bg-wm-blue hover:bg-[#23294a] text-white font-bold rounded-xl transition-colors text-sm"
                  >
                    Browse Files
                  </button>
                  <p className="text-xs text-gray-500 mt-3">
                    Supported formats: PDF, CSV (Max size: 10MB)
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.csv,application/pdf,text/csv"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-bold text-sm text-wm-blue mb-1">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {
                        selectedFile.type === 'application/pdf' ? 'PDF' : 'CSV'
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {uploadStatus === 'success' && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 size={20} />
                      <span className="text-sm font-medium">Uploaded</span>
                    </div>
                  )}
                  {uploadStatus === 'error' && (
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertCircle size={20} />
                      <span className="text-sm font-medium">Error</span>
                    </div>
                  )}
                  {uploadStatus === 'extracting' && (
                    <div className="flex items-center gap-2 text-wm-blue">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="text-sm font-medium">Extracting with Gemini AI...</span>
                    </div>
                  )}
                  {uploadStatus === 'idle' && (
                    <button
                      onClick={handleUpload}
                      className="px-4 py-2 bg-wm-blue hover:bg-[#23294a] text-white font-bold rounded-xl transition-colors text-sm"
                    >
                      Extract Menu
                    </button>
                  )}
                  {uploadStatus === 'success' && (
                    <button
                      onClick={() => setShowExtractedItems(!showExtractedItems)}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors text-sm flex items-center gap-2"
                    >
                      <Eye size={16} />
                      {showExtractedItems ? 'Hide' : 'View'} Items ({extractedItems.length})
                    </button>
                  )}
                  <button
                    onClick={handleRemoveFile}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove file"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Error Message */}
          {uploadStatus === 'error' && extractionError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm text-red-800 mb-1">Extraction Failed</p>
                  <p className="text-xs text-red-700">{extractionError}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Extracted Menu Items Display */}
        {showExtractedItems && extractedItems.length > 0 && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-enterprise p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-headline font-black text-wm-blue mb-1">
                  Extracted Menu Items
                </h2>
                <p className="text-sm text-gray-600">
                  {extractedItems.length} items extracted from PDF using Gemini AI
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={addNewItem}
                  className="px-4 py-2 bg-wm-blue hover:bg-[#23294a] text-white font-bold rounded-xl transition-colors text-sm flex items-center gap-2"
                >
                  <Plus size={16} />
                  Add New Item
                </button>
                <button
                  onClick={() => setShowExtractedItems(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Close"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Menu Items Grid */}
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {extractedItems.map((item, index) => {
                const isEditing = editingItemId === item.id;
                const itemIngredients = item.ingredients || [];
                
                return (
                  <div
                    key={item.id || `item-${index}`}
                    className="p-5 bg-gray-50 rounded-xl border-2 border-gray-200 hover:border-wm-blue transition-colors"
                  >
                    {!isEditing ? (
                      // View Mode
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-headline font-black text-lg text-wm-blue">
                              {item.name || 'Unnamed Item'}
                            </h3>
                            {item.category && (
                              <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full">
                                {item.category}
                              </span>
                            )}
                          </div>
                          
                          {item.description && (
                            <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                          )}
                          
                          {itemIngredients.length > 0 && (
                            <div className="mb-2">
                              <p className="text-xs font-bold text-gray-500 mb-1">Ingredients:</p>
                              <div className="flex flex-wrap gap-1.5">
                                {itemIngredients.map((ingredient, idx) => {
                                  const ingredientName = typeof ingredient === 'string' 
                                    ? ingredient 
                                    : ingredient.name || 'Unknown';
                                  const ingredientDisplay = typeof ingredient === 'string'
                                    ? ingredientName
                                    : ingredient.quantity && ingredient.unit
                                      ? `${ingredientName} (${ingredient.quantity} ${ingredient.unit})`
                                      : ingredientName;
                                  
                                  return (
                                    <span
                                      key={idx}
                                      className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded-md"
                                    >
                                      {ingredientDisplay}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          
                          {item.sizes && item.sizes.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {item.sizes.map((size, idx) => (
                                <div
                                  key={idx}
                                  className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg"
                                >
                                  <span className="text-xs font-medium text-gray-600">{size.size}</span>
                                  <span className="ml-2 font-bold text-sm text-wm-blue">{size.price}</span>
                                </div>
                              ))}
                            </div>
                          ) : item.price && (
                            <p className="font-bold text-lg text-wm-blue">{item.price}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => startEditingItem(item.id!)}
                            className="p-2 text-wm-blue hover:bg-wm-blue/10 rounded-lg transition-colors"
                            title="Edit Item"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => deleteItem(item.id!)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Item"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Edit Mode
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Item Name *</label>
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => updateItemField(item.id!, 'name', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wm-blue focus:border-wm-blue text-sm"
                              placeholder="Enter item name"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Category</label>
                            <input
                              type="text"
                              value={item.category || ''}
                              onChange={(e) => updateItemField(item.id!, 'category', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wm-blue focus:border-wm-blue text-sm"
                              placeholder="e.g., Main Course, Appetizer"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">Description</label>
                          <textarea
                            value={item.description || ''}
                            onChange={(e) => updateItemField(item.id!, 'description', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wm-blue focus:border-wm-blue text-sm"
                            rows={2}
                            placeholder="Item description"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">Price</label>
                          <input
                            type="text"
                            value={item.price || ''}
                            onChange={(e) => updateItemField(item.id!, 'price', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wm-blue focus:border-wm-blue text-sm"
                            placeholder="e.g., €12.99"
                          />
                        </div>
                        
                        {/* Ingredients Section */}
                        <div className="border-t border-gray-200 pt-4">
                          <label className="block text-xs font-bold text-gray-700 mb-3">Ingredients</label>
                          
                          {/* Existing Ingredients */}
                          {itemIngredients.length > 0 && (
                            <div className="space-y-2 mb-4">
                              {itemIngredients.map((ingredient, idx) => {
                                const ingName = typeof ingredient === 'string' ? ingredient : ingredient.name;
                                const ingQty = typeof ingredient === 'object' ? ingredient.quantity || '' : '';
                                const ingUnit = typeof ingredient === 'object' ? ingredient.unit || '' : '';
                                
                                return (
                                  <div key={idx} className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded-lg">
                                    <input
                                      type="text"
                                      value={ingName}
                                      onChange={(e) => updateIngredient(item.id!, idx, 'name', e.target.value)}
                                      className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm"
                                      placeholder="Ingredient name"
                                    />
                                    <input
                                      type="text"
                                      value={ingQty}
                                      onChange={(e) => updateIngredient(item.id!, idx, 'quantity', e.target.value)}
                                      className="w-20 px-2 py-1.5 border border-gray-300 rounded text-sm"
                                      placeholder="Qty"
                                    />
                                    <input
                                      type="text"
                                      value={ingUnit}
                                      onChange={(e) => updateIngredient(item.id!, idx, 'unit', e.target.value)}
                                      className="w-20 px-2 py-1.5 border border-gray-300 rounded text-sm"
                                      placeholder="Unit"
                                    />
                                    <button
                                      onClick={() => removeIngredient(item.id!, idx)}
                                      className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                                      title="Remove ingredient"
                                    >
                                      <X size={16} />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          
                          {/* Add New Ingredient */}
                          <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                            <input
                              type="text"
                              value={newIngredient.name}
                              onChange={(e) => setNewIngredient({...newIngredient, name: e.target.value})}
                              className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm"
                              placeholder="Ingredient name"
                            />
                            <input
                              type="text"
                              value={newIngredient.quantity}
                              onChange={(e) => setNewIngredient({...newIngredient, quantity: e.target.value})}
                              className="w-20 px-2 py-1.5 border border-gray-300 rounded text-sm"
                              placeholder="Qty"
                            />
                            <input
                              type="text"
                              value={newIngredient.unit}
                              onChange={(e) => setNewIngredient({...newIngredient, unit: e.target.value})}
                              className="w-20 px-2 py-1.5 border border-gray-300 rounded text-sm"
                              placeholder="Unit"
                            />
                            <button
                              onClick={() => addIngredientToItem(item.id!)}
                              className="px-3 py-1.5 bg-wm-teal hover:bg-[#238b7e] text-white rounded text-sm font-bold transition-colors flex items-center gap-1"
                            >
                              <Plus size={14} />
                              Add
                            </button>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200">
                          <button
                            onClick={cancelEditing}
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg transition-colors text-sm"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => saveItem(item.id!)}
                            className="px-4 py-2 bg-wm-teal hover:bg-[#238b7e] text-white font-bold rounded-lg transition-colors text-sm flex items-center gap-2"
                          >
                            <Save size={16} />
                            Save
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Action Buttons */}
            <div className="mt-6 pt-6 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Review and edit items before saving to repository
              </p>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setShowExtractedItems(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors text-sm"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    // Normalize and save items to localStorage
                    // Ensure ingredients are in the correct format
                    const normalizedItems = extractedItems.map(item => {
                      // Ensure ingredients are properly structured
                      const normalizedIngredients = (item.ingredients || []).map((ing: any) => {
                        if (typeof ing === 'string') {
                          return { name: ing, quantity: '', unit: '' };
                        } else if (ing && typeof ing === 'object') {
                          return {
                            name: ing.name || ing.inventoryItemName || 'Unknown',
                            quantity: ing.quantity || ing.quantityPerDish || '',
                            unit: ing.unit || ''
                          };
                        }
                        return { name: 'Unknown', quantity: '', unit: '' };
                      });
                      
                      return {
                        ...item,
                        ingredients: normalizedIngredients
                      };
                    });
                    
                    const userId = 'current-user'; // TODO: Get from auth context
                    const menuDataKey = `menu_data_${userId}`;
                    const menuData = {
                      menuItems: normalizedItems,
                      categories: [...new Set(normalizedItems.map(item => item.category).filter(Boolean))],
                      lastUpdated: new Date().toISOString(),
                      source: 'gemini-extraction'
                    };
                    
                    // Save to both formats for compatibility
                    localStorage.setItem(menuDataKey, JSON.stringify(menuData));
                    localStorage.setItem(`menu_${userId}`, JSON.stringify(normalizedItems));
                    
                    console.log('💾 Saved', normalizedItems.length, 'menu items with ingredients to localStorage');
                    
                    // Navigate to Edit Menu page
                    router.push('/mensa-ioms/menu-management/edit-menu');
                  }}
                  className="px-6 py-2 bg-wm-teal hover:bg-[#238b7e] text-white font-bold rounded-xl transition-colors text-sm flex items-center gap-2"
                >
                  Save to Repository
                  <ChevronRight size={16} />
                </button>
                <button 
                  onClick={() => {
                    // Normalize and save items to localStorage
                    // Ensure ingredients are in the correct format
                    const normalizedItems = extractedItems.map(item => {
                      // Ensure ingredients are properly structured
                      const normalizedIngredients = (item.ingredients || []).map((ing: any) => {
                        if (typeof ing === 'string') {
                          return { name: ing, quantity: '', unit: '' };
                        } else if (ing && typeof ing === 'object') {
                          return {
                            name: ing.name || ing.inventoryItemName || 'Unknown',
                            quantity: ing.quantity || ing.quantityPerDish || '',
                            unit: ing.unit || ''
                          };
                        }
                        return { name: 'Unknown', quantity: '', unit: '' };
                      });
                      
                      return {
                        ...item,
                        ingredients: normalizedIngredients
                      };
                    });
                    
                    const userId = 'current-user'; // TODO: Get from auth context
                    const menuDataKey = `menu_data_${userId}`;
                    const menuData = {
                      menuItems: normalizedItems,
                      categories: [...new Set(normalizedItems.map(item => item.category).filter(Boolean))],
                      lastUpdated: new Date().toISOString(),
                      source: 'gemini-extraction'
                    };
                    
                    // Save to both formats for compatibility
                    localStorage.setItem(menuDataKey, JSON.stringify(menuData));
                    localStorage.setItem(`menu_${userId}`, JSON.stringify(normalizedItems));
                    
                    console.log('💾 Saved', normalizedItems.length, 'menu items with ingredients to localStorage');
                    
                    // Navigate to Edit Menu page
                    router.push('/mensa-ioms/menu-management/edit-menu');
                  }}
                  className="px-6 py-2 bg-wm-blue hover:bg-[#23294a] text-white font-bold rounded-xl transition-colors text-sm flex items-center gap-2"
                >
                  Next: Edit Menu
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full md:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search menus by name, date, or category..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-wm-blue focus:border-transparent text-sm"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors text-sm font-medium text-gray-700">
                <Filter size={18} />
                Filter
              </button>
              <button className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors text-sm font-medium text-gray-700">
                <Calendar size={18} />
                Date Range
              </button>
            </div>
          </div>
        </div>

        {/* Placeholder Content */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-enterprise p-8">
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="w-10 h-10 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-headline font-black text-wm-blue mb-2">
              Menu Repository
            </h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              This section will display all existing menus with search, filter, and management capabilities.
            </p>
            
            {/* Feature Placeholders */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 max-w-2xl mx-auto">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <Edit className="w-6 h-6 text-wm-blue mb-2" />
                <p className="font-bold text-sm text-wm-blue mb-1">Menu Editing & Updates</p>
                <p className="text-xs text-gray-600">Placeholder for editing functionality</p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <Archive className="w-6 h-6 text-wm-blue mb-2" />
                <p className="font-bold text-sm text-wm-blue mb-1">Version History</p>
                <p className="text-xs text-gray-600">Placeholder for versioning functionality</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

