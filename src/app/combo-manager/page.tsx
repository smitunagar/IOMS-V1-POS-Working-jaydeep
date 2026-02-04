'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { AppLayout } from '@/shared/components/layout/AppLayout';
import { useToast } from '@/shared/hooks/use-toast';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Plus, Trash2, Save, ArrowLeft, GripVertical, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface MenuItem {
  id: string;
  name: string;
  price: string;
  category: string;
  image: string;
  ingredients: Array<{
    name: string;
    quantity: string;
    unit: string;
  }>;
  addons?: Array<{
    id: string;
    name: string;
    price: string;
    description?: string;
  }>;
  description?: string;
  extractionMethod: string;
}

interface ComboItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
}

interface Combo {
  id: string;
  name: string;
  description: string;
  items: ComboItem[];
  totalPrice: number;
  discount: number;
  finalPrice: number;
  category: string;
  image: string;
  isActive: boolean;
}

const COMBO_CATEGORIES = [
  'Breakfast Combos',
  'Lunch Combos',
  'Dinner Combos',
  'Family Combos',
  'Value Combos',
  'Special Combos',
  'Other'
];

export default function ComboManagerPage() {
  const { currentUser, isLoading, isInitialized } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [draggedItem, setDraggedItem] = useState<MenuItem | null>(null);
  const [showComboForm, setShowComboForm] = useState(false);
  const [editingCombo, setEditingCombo] = useState<Combo | null>(null);

  // Load menu data
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const loadMenuData = () => {
      try {
        const userId = currentUser?.id || 'default_user';
        const menuDataKey = `menu_data_${userId}`;
        const storedData = localStorage.getItem(menuDataKey);
        
        if (storedData) {
          const menuData = JSON.parse(storedData);
          setMenuItems(menuData.menuItems || []);
        }
        
        // Load existing combos
        const combosKey = `combos_data_${userId}`;
        const storedCombos = localStorage.getItem(combosKey);
        if (storedCombos) {
          setCombos(JSON.parse(storedCombos));
        }
      } catch (error) {
        console.error('Error loading menu data:', error);
      } finally {
        setIsLoadingData(false);
      }
    };

    if (currentUser) {
      loadMenuData();
    }
  }, [currentUser]);

  // Combo form state
  const [comboForm, setComboForm] = useState({
    name: '',
    description: '',
    category: 'Value Combos',
    discount: 0,
    image: '',
    items: [] as ComboItem[]
  });

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, item: MenuItem) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedItem) return;

    const existingItem = comboForm.items.find(item => item.menuItem.id === draggedItem.id);
    if (existingItem) {
      // Increase quantity if item already exists
      setComboForm(prev => ({
        ...prev,
        items: prev.items.map(item =>
          item.menuItem.id === draggedItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }));
    } else {
      // Add new item to combo
      const newComboItem: ComboItem = {
        id: `combo_item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        menuItem: draggedItem,
        quantity: 1
      };
      
      setComboForm(prev => ({
        ...prev,
        items: [...prev.items, newComboItem]
      }));
    }
    
    setDraggedItem(null);
  };

  // Combo management functions
  const updateComboItemQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeComboItem(itemId);
      return;
    }
    
    setComboForm(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      )
    }));
  };

  const removeComboItem = (itemId: string) => {
    setComboForm(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }));
  };

  const calculateComboPrice = () => {
    const totalPrice = comboForm.items.reduce((total, item) => {
      const itemPrice = parseFloat(item.menuItem.price) || 0;
      return total + (itemPrice * item.quantity);
    }, 0);
    
    const discountAmount = (totalPrice * comboForm.discount) / 100;
    const finalPrice = totalPrice - discountAmount;
    
    return { totalPrice, discountAmount, finalPrice };
  };

  const handleSaveCombo = () => {
    if (!comboForm.name.trim() || comboForm.items.length === 0) {
      toast({
        title: 'Error',
        description: 'Please provide a combo name and add at least one item.',
        variant: 'destructive'
      });
      return;
    }

    const { totalPrice, discountAmount, finalPrice } = calculateComboPrice();
    
    const newCombo: Combo = {
      id: editingCombo?.id || `combo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: comboForm.name,
      description: comboForm.description,
      items: comboForm.items,
      totalPrice,
      discount: comboForm.discount,
      finalPrice,
      category: comboForm.category,
      image: comboForm.image,
      isActive: true
    };

    if (editingCombo) {
      setCombos(prev => prev.map(combo => 
        combo.id === editingCombo.id ? newCombo : combo
      ));
    } else {
      setCombos(prev => [...prev, newCombo]);
    }

    // Reset form
    setComboForm({
      name: '',
      description: '',
      category: 'Value Combos',
      discount: 0,
      image: '',
      items: []
    });
    setShowComboForm(false);
    setEditingCombo(null);

    toast({
      title: 'Success',
      description: `Combo "${newCombo.name}" ${editingCombo ? 'updated' : 'created'} successfully!`
    });
  };

  const handleEditCombo = (combo: Combo) => {
    setComboForm({
      name: combo.name,
      description: combo.description,
      category: combo.category,
      discount: combo.discount,
      image: combo.image,
      items: combo.items
    });
    setEditingCombo(combo);
    setShowComboForm(true);
  };

  const handleDeleteCombo = (comboId: string) => {
    setCombos(prev => prev.filter(combo => combo.id !== comboId));
    toast({
      title: 'Success',
      description: 'Combo deleted successfully!'
    });
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const userId = currentUser?.id || 'default_user';
      const combosKey = `combos_data_${userId}`;
      localStorage.setItem(combosKey, JSON.stringify(combos));
      
      toast({
        title: 'Success',
        description: `All ${combos.length} combos saved successfully!`
      });
    } catch (error) {
      console.error('Error saving combos:', error);
      toast({
        title: 'Error',
        description: 'Failed to save combos',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading state
  if (isLoading || !isInitialized || isLoadingData) {
    return (
      <AppLayout pageTitle="Combo Manager">
        <div className="max-w-6xl mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading combos...</span>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Show login prompt if not authenticated
  if (!currentUser) {
    return (
      <AppLayout pageTitle="Combo Manager">
        <div className="max-w-6xl mx-auto p-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-6 text-center">
            <h2 className="text-xl font-semibold text-yellow-800 mb-2">Authentication Required</h2>
            <p className="text-yellow-700">Please log in to access the combo management feature.</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const { totalPrice, discountAmount, finalPrice } = calculateComboPrice();

  return (
    <AppLayout pageTitle="Combo Manager">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Combo Manager</h1>
              <p className="text-gray-600 mt-1">Create and manage dish combinations with drag-and-drop</p>
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => router.push('/orders')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Orders</span>
              </Button>
              <Button
                onClick={() => setShowComboForm(true)}
                className="flex items-center space-x-2 food-button-primary"
              >
                <Plus className="h-4 w-4" />
                <span>Create Combo</span>
              </Button>
              <Button
                onClick={handleSaveAll}
                disabled={isSaving}
                className="flex items-center space-x-2 food-button-success"
              >
                <Save className="h-4 w-4" />
                <span>{isSaving ? 'Saving...' : 'Save All'}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Combo Creation Form */}
        {showComboForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {editingCombo ? 'Edit Combo' : 'Create New Combo'}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowComboForm(false);
                    setEditingCombo(null);
                    setComboForm({
                      name: '',
                      description: '',
                      category: 'Value Combos',
                      discount: 0,
                      image: '',
                      items: []
                    });
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="combo-name">Combo Name</Label>
                  <Input
                    id="combo-name"
                    value={comboForm.name}
                    onChange={(e) => setComboForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Family Feast Combo"
                  />
                </div>
                <div>
                  <Label htmlFor="combo-category">Category</Label>
                  <select
                    id="combo-category"
                    value={comboForm.category}
                    onChange={(e) => setComboForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {COMBO_CATEGORIES.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="combo-description">Description</Label>
                  <Textarea
                    id="combo-description"
                    value={comboForm.description}
                    onChange={(e) => setComboForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe this combo..."
                    rows={3}
                  />
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="combo-discount">Discount (%)</Label>
                    <Input
                      id="combo-discount"
                      type="number"
                      min="0"
                      max="100"
                      value={comboForm.discount}
                      onChange={(e) => setComboForm(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="combo-image">Image URL</Label>
                    <Input
                      id="combo-image"
                      value={comboForm.image}
                      onChange={(e) => setComboForm(prev => ({ ...prev, image: e.target.value }))}
                      placeholder="https://example.com/combo-image.jpg"
                    />
                  </div>
                </div>
              </div>

              {/* Drag and Drop Area */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-semibold">Combo Items</Label>
                  <div className="text-sm text-gray-600">
                    Drag dishes from the menu below to add them to this combo
                  </div>
                </div>

                {/* Drop Zone */}
                <div
                  className="min-h-[200px] border-2 border-dashed border-orange-300 rounded-lg p-4 bg-orange-50"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  {comboForm.items.length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-gray-500">
                      <div className="text-center">
                        <GripVertical className="h-8 w-8 mx-auto mb-2 text-orange-400" />
                        <p>Drag dishes here to create your combo</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {comboForm.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-white border border-orange-200 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <GripVertical className="h-4 w-4 text-gray-400" />
                            <img
                              src={item.menuItem.image || '/placeholder-dish.jpg'}
                              alt={item.menuItem.name}
                              className="w-12 h-12 object-cover rounded"
                            />
                            <div>
                              <p className="font-medium">{item.menuItem.name}</p>
                              <p className="text-sm text-gray-600">€{item.menuItem.price}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateComboItemQuantity(item.id, item.quantity - 1)}
                              className="h-8 w-8 p-0"
                            >
                              -
                            </Button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateComboItemQuantity(item.id, item.quantity + 1)}
                              className="h-8 w-8 p-0"
                            >
                              +
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeComboItem(item.id)}
                              className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Price Summary */}
                {comboForm.items.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center text-sm">
                      <span>Total Price:</span>
                      <span>€{totalPrice.toFixed(2)}</span>
                    </div>
                    {comboForm.discount > 0 && (
                      <div className="flex justify-between items-center text-sm text-green-600">
                        <span>Discount ({comboForm.discount}%):</span>
                        <span>-€{discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center font-semibold text-lg border-t pt-2 mt-2">
                      <span>Final Price:</span>
                      <span className="text-orange-600">€{finalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowComboForm(false);
                    setEditingCombo(null);
                    setComboForm({
                      name: '',
                      description: '',
                      category: 'Value Combos',
                      discount: 0,
                      image: '',
                      items: []
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveCombo}
                  disabled={!comboForm.name.trim() || comboForm.items.length === 0}
                  className="food-button-primary"
                >
                  {editingCombo ? 'Update Combo' : 'Create Combo'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Menu Items for Dragging */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Available Dishes</CardTitle>
            <p className="text-sm text-gray-600">Drag dishes to the combo creation area above</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {menuItems.map((item) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item)}
                  className="p-3 border border-gray-200 rounded-lg cursor-move hover:border-orange-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={item.image || '/placeholder-dish.jpg'}
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-gray-600">€{item.price}</p>
                      <Badge variant="outline" className="text-xs mt-1">
                        {item.category}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Existing Combos */}
        <Card>
          <CardHeader>
            <CardTitle>Existing Combos ({combos.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {combos.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No combos created yet. Create your first combo above!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {combos.map((combo) => (
                  <div key={combo.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">{combo.name}</h3>
                        <Badge variant="outline" className="text-xs mt-1">
                          {combo.category}
                        </Badge>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditCombo(combo)}
                          className="h-8 w-8 p-0"
                        >
                          ✏️
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteCombo(combo.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {combo.image && (
                      <img
                        src={combo.image}
                        alt={combo.name}
                        className="w-full h-32 object-cover rounded mb-3"
                      />
                    )}
                    
                    <p className="text-sm text-gray-600 mb-3">{combo.description}</p>
                    
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="font-medium">Items:</span>
                        <div className="mt-1 space-y-1">
                          {combo.items.map((item) => (
                            <div key={item.id} className="flex justify-between text-xs">
                              <span>{item.menuItem.name} x{item.quantity}</span>
                              <span>€{(parseFloat(item.menuItem.price) * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="border-t pt-2">
                        <div className="flex justify-between text-sm">
                          <span>Total:</span>
                          <span className="font-semibold text-orange-600">€{combo.finalPrice.toFixed(2)}</span>
                        </div>
                        {combo.discount > 0 && (
                          <div className="text-xs text-green-600">
                            {combo.discount}% discount applied
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

