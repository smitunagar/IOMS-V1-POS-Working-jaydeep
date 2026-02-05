"use client";
import { useEffect, useState, useLayoutEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { Badge } from '@/shared/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { AlertTriangle, CheckCircle, Clock, XCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/shared/hooks/use-toast';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  PaginationState,
} from '@tanstack/react-table';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import Select from 'react-select';
import { PencilIcon } from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import React from 'react';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Dialog, DialogContent, DialogTitle } from '@/shared/components/ui/dialog';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { matchSorter } from 'match-sorter';

function getStatus(item: any) {
  // Low Stock check
  if (item.lowStockThreshold !== undefined && item.quantity <= item.lowStockThreshold) return 'Low Stock';
  if (!item.expiryDate) return 'Unknown';
  const now = new Date();
  const exp = new Date(item.expiryDate);
  const diff = (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (diff < 0) return 'Expired';
  if (diff < 3) return 'Expiring Soon';
  return 'Fresh';
}

const statusStyles: Record<string, string> = {
  'Fresh': 'bg-blue-100 text-blue-700 border-blue-300',
  'Expiring Soon': 'bg-amber-100 text-amber-800 border-amber-400',
  'Expired': 'bg-red-100 text-red-700 border-red-400',
  'Low Stock': 'bg-yellow-50 text-yellow-800 border-yellow-400 border-2',
  'Unknown': 'bg-gray-100 text-gray-600 border-gray-300',
};

const statusIcons: Record<string, JSX.Element> = {
  'Fresh': <CheckCircle className="inline mr-1 h-4 w-4 text-blue-500" />, 
  'Expiring Soon': <Clock className="inline mr-1 h-4 w-4 text-amber-500" />, 
  'Expired': <XCircle className="inline mr-1 h-4 w-4 text-red-500" />, 
  'Low Stock': <AlertTriangle className="inline mr-1 h-4 w-4 text-yellow-500" />, 
  'Unknown': <Clock className="inline mr-1 h-4 w-4 text-gray-400" />
};

function Chip({ label, selected, onClick, icon }: { label: string, selected: boolean, onClick: () => void, icon?: JSX.Element }) {
  return (
    <button
      className={`inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
        selected 
          ? 'bg-green-600 text-white border border-green-600' 
          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
      }`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function IndeterminateCheckbox({ checked, indeterminate, ...rest }: { checked: boolean, indeterminate: boolean, [key: string]: any }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return <input ref={ref} type="checkbox" checked={checked} {...rest} />;
}

export default function InventoryPage() {
  // All useState hooks - moved to top to prevent hooks order issues
  const { currentUser, isLoading } = useAuth();
  const { toast } = useToast();
  const [inventoryError, setInventoryError] = useState<string | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'expiry' | 'name' | 'stock' | 'status'>('expiry');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [dishFilter, setDishFilter] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [expiryFilter, setExpiryFilter] = useState<string[]>([]);
  const [stockFilter, setStockFilter] = useState<string>('');
  const [expiryColFilter, setExpiryColFilter] = useState<string>('');
  const [unitColFilter, setUnitColFilter] = useState<string>('');
  const [selectedRowIds, setSelectedRowIds] = useState<Record<string, boolean>>({});
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});
  const [columnSizing, setColumnSizing] = useState<Record<string, number>>({});
  const [editPanelOpen, setEditPanelOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addItemDialogOpen, setAddItemDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [newItemForm, setNewItemForm] = useState<any>({
    name: '',
    quantity: '',
    unit: 'g',
    category: '',
    lowStockThreshold: '',
    expiryDate: ''
  });
  const [updatedRowId, setUpdatedRowId] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 50,
  });

  const fetchInventory = useCallback(async (userId: string) => {
    const response = await fetch(`/api/inventory?userId=${encodeURIComponent(userId)}`);
    if (!response.ok) {
      throw new Error('Failed to fetch inventory');
    }
    const data = await response.json();
    return data.inventory || [];
  }, []);

  const syncInventory = useCallback(async (userId: string, inventoryItems: any[]) => {
    const response = await fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, inventory: inventoryItems, action: 'sync' })
    });

    if (!response.ok) {
      throw new Error('Failed to sync inventory');
    }
  }, []);

  // COMPLETELY CLEAN: Single useEffect for loading inventory
  useEffect(() => {
    if (!currentUser) {
      console.log('[InventoryPage] No currentUser, skipping inventory load');
      setLoading(false);
      return;
    }
  
    console.log('[InventoryPage] Loading inventory for user:', currentUser.id);
    setLoading(true);

    (async () => {
      try {
        const inv = await fetchInventory(currentUser.id);
        setItems(inv);
        console.log('[InventoryPage] Inventory loaded successfully:', inv.length, 'items');
      } catch (error) {
        console.error('[InventoryPage] Error loading inventory:', error);
        setInventoryError('Failed to load inventory');
      } finally {
        setLoading(false);
      }
    })();
  }, [currentUser?.id, fetchInventory]); // Only depend on currentUser.id, not the entire object

  // Listen for inventory update events from order placement
  useEffect(() => {
    const handleInventoryUpdated = (event: CustomEvent) => {
      console.log('🔔 [InventoryPage] Inventory updated event received:', event.detail);
      
      if (!currentUser) return;
      
      console.log('[InventoryPage] Auto-refreshing inventory due to order placement');
      setLoading(true);
      
      (async () => {
        try {
          const inv = await fetchInventory(currentUser.id);
          setItems(inv);
          console.log('[InventoryPage] Auto-refresh completed:', inv.length, 'items');
          
          toast({
            title: 'Inventory Updated',
            description: `Inventory automatically updated after order placement (${event.detail.deductionsCount} items affected)`,
          });
        } catch (error) {
          console.error('[InventoryPage] Error during auto-refresh:', error);
        } finally {
          setLoading(false);
        }
      })();
    };

    window.addEventListener('inventoryUpdated', handleInventoryUpdated as EventListener);
    
    return () => {
      window.removeEventListener('inventoryUpdated', handleInventoryUpdated as EventListener);
    };
  }, [currentUser, toast, fetchInventory]);

  // Manual refresh function
  const refreshInventory = useCallback(() => {
    if (!currentUser) {
      console.log('[InventoryPage] Refresh: No currentUser available');
      return;
    }
    
    console.log('[InventoryPage] Manual refresh triggered for user:', currentUser.id);
    setLoading(true);

    (async () => {
      try {
        const inv = await fetchInventory(currentUser.id);
        setItems(inv);
        console.log('[InventoryPage] Manual refresh completed:', inv.length, 'items');
      } catch (error) {
        console.error('[InventoryPage] Error during manual refresh:', error);
        setInventoryError('Failed to refresh inventory');
      } finally {
        setLoading(false);
      }
    })();
  }, [currentUser, fetchInventory]);
  
  // Reset selected rows when items change
  useLayoutEffect(() => { 
    setSelectedRowIds({}); 
  }, [items]);

  // Memoized filtered and sorted data to prevent expensive recalculations
  const filteredData = useMemo(() => {
    let filtered = items;

    // Apply search filter
    if (search) {
      filtered = matchSorter(filtered, search, {
        keys: ['name', 'associatedDish', 'unit'],
        threshold: matchSorter.rankings.CONTAINS,
      });
    }

    // Apply status filter
    if (statusFilter.length > 0) {
      filtered = filtered.filter(item => statusFilter.includes(getStatus(item)));
    }

    // Apply dish filter
    if (dishFilter.length > 0) {
      filtered = filtered.filter(item => dishFilter.includes(item.associatedDish || 'Unknown'));
    }

    // Apply type filter
    if (typeFilter.length > 0) {
      filtered = filtered.filter(item => typeFilter.includes(inferType(item.name)));
    }

    return filtered;
  }, [items, search, statusFilter, dishFilter, typeFilter]);

  // Memoized columns to prevent recreation on every render
  const columns = useMemo<ColumnDef<any>[]>(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <IndeterminateCheckbox
          checked={table.getIsAllPageRowsSelected()}
          indeterminate={table.getIsSomePageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
        />
      ),
      cell: ({ row }) => (
        <IndeterminateCheckbox
          checked={row.getIsSelected()}
          indeterminate={row.getIsSomeSelected()}
          onChange={row.getToggleSelectedHandler()}
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    },
    {
      accessorKey: 'name',
      header: 'Ingredient',
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('name')}</div>
      ),
      size: 200,
    },
    {
      accessorKey: 'quantity',
      header: 'Stock Available',
      cell: ({ row }) => (
        <div className="font-semibold">{row.getValue('quantity')}</div>
      ),
      size: 120,
    },
    {
      accessorKey: 'unit',
      header: 'Unit',
      cell: ({ row }) => (
        <div className="text-sm">{row.getValue('unit')}</div>
      ),
      size: 80,
    },
    {
      accessorKey: 'quantityUsed',
      header: 'Stock Used',
      cell: ({ row }) => (
        <div className="text-sm text-gray-600">{row.getValue('quantityUsed') || 0}</div>
      ),
      size: 100,
    },
    {
      accessorKey: 'totalUsed',
      header: 'Total Used',
      cell: ({ row }) => (
        <div className="text-sm text-gray-600">{row.getValue('totalUsed') || 0}</div>
      ),
      size: 100,
    },
    {
      accessorKey: 'expiryDate',
      header: 'Expiry Date',
      cell: ({ row }) => {
        const date = row.getValue('expiryDate') as string;
        return (
          <div className="text-sm">
            {date ? new Date(date).toLocaleDateString() : 'N/A'}
          </div>
        );
      },
      size: 120,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = getStatus(row.original);
        const colorMap: Record<string, string> = {
          'Fresh': 'bg-green-100 text-green-700 border-green-300',
          'Expiring Soon': 'bg-yellow-100 text-yellow-700 border-yellow-300',
          'Expired': 'bg-red-100 text-red-700 border-red-300',
          'Low Stock': 'bg-orange-100 text-orange-700 border-orange-300',
          'Unknown': 'bg-gray-100 text-gray-600 border-gray-300',
        };
        return (
          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${colorMap[status]}`}>
            {status}
          </span>
        );
      },
      size: 140,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <button
            onClick={() => openEditPanel(row.original)}
            className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => openDeleteDialog(row.original)}
            className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md transition-colors"
          >
            Delete
          </button>
        </div>
      ),
      enableSorting: false,
      size: 140,
    },
  ], []);

  // Memoized table instance to prevent recreation
  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onRowSelectionChange: setSelectedRowIds,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnSizingChange: setColumnSizing,
    state: {
      sorting,
      pagination,
      rowSelection: selectedRowIds,
      columnVisibility,
      columnSizing,
    },
    enableRowSelection: true,
    enableSorting: true,
    enableColumnResizing: true,
  });

  // Memoized filter options to prevent recreation
  const statusOptions = useMemo(() => {
    const statuses = [...new Set(items.map(item => getStatus(item)))];
    return statuses.map(status => ({ value: status, label: status }));
  }, [items]);

  const typeOptions = useMemo(() => {
    const types = [...new Set(items.map(item => inferType(item.name)))];
    return types.map(type => ({ value: type, label: type }));
  }, [items]);

  function inferType(name: string | undefined | null) {
    if (!name) return 'Other';
    const lower = name.toLowerCase();
    if (lower.includes('meat') || lower.includes('chicken') || lower.includes('beef') || lower.includes('pork')) return 'Meat';
    if (lower.includes('vegetable') || lower.includes('carrot') || lower.includes('onion') || lower.includes('tomato')) return 'Vegetable';
    if (lower.includes('spice') || lower.includes('salt') || lower.includes('pepper') || lower.includes('herb')) return 'Spice';
    if (lower.includes('dairy') || lower.includes('milk') || lower.includes('cheese') || lower.includes('cream')) return 'Dairy';
    if (lower.includes('grain') || lower.includes('rice') || lower.includes('pasta') || lower.includes('flour')) return 'Grain';
    return 'Other';
  }

  // Optimized button handlers with debouncing
  const openEditPanel = useCallback((item: any) => {
    console.log('[InventoryPage] openEditPanel called with:', item);
    setSelectedItem(item);
    setEditForm({ ...item });
    setEditPanelOpen(true);
  }, []);

  const saveEditPanel = useCallback(async () => {
    const userId = currentUser?.id;
    if (!userId || !selectedItem) return;
    
    const idx = items.findIndex((i: any) => String(i.id) === String(selectedItem.id));
    if (idx === -1) return;
    
    const updatedInventory = [...items];
    updatedInventory[idx] = { ...updatedInventory[idx], ...editForm };
    await syncInventory(userId, updatedInventory);
    setEditPanelOpen(false);
    setUpdatedRowId(selectedItem.id);
    setTimeout(() => setUpdatedRowId(null), 1200);
    
    // Update items state directly
    setItems(updatedInventory);
  }, [currentUser?.id, selectedItem, editForm, items, syncInventory]);

  const openDeleteDialog = useCallback((item: any) => {
    console.log('[InventoryPage] openDeleteDialog called with:', item);
    setSelectedItem(item);
    setDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    const userId = currentUser?.id;
    if (!userId || !selectedItem) return;
    
    const newInventory = items.filter((i: any) => String(i.id) !== String(selectedItem.id));
    await syncInventory(userId, newInventory);
    setDeleteDialogOpen(false);
    setSelectedItem(null);
    
    // Update items state directly
    setItems([...newInventory]);
  }, [currentUser?.id, selectedItem, items, syncInventory]);

  const batchDeleteSelected = useCallback(async () => {
    const userId = currentUser?.id;
    if (!userId) return;
    
    const newInventory = items.filter((i: any) => !selectedRowIds[i.id]);
    await syncInventory(userId, newInventory);
    setSelectedRowIds({});
    
    // Update items state directly
    setItems([...newInventory]);
  }, [currentUser?.id, selectedRowIds, items, syncInventory]);

  // Add new item function
  const addNewItem = useCallback(async () => {
    const userId = currentUser?.id;
    if (!userId) return;

    // Validate form
    if (!newItemForm.name.trim() || !newItemForm.quantity || newItemForm.quantity <= 0) {
      alert('Please fill in all required fields (name and quantity)');
      return;
    }

    const newItem = {
      id: Date.now().toString(),
      name: newItemForm.name.trim(),
      quantity: parseInt(newItemForm.quantity),
      unit: newItemForm.unit || 'g',
      category: newItemForm.category || '',
      lowStockThreshold: newItemForm.lowStockThreshold ? parseInt(newItemForm.lowStockThreshold) : undefined,
      expiryDate: newItemForm.expiryDate || undefined,
      quantityUsed: 0,
      totalUsed: 0
    };

    const updatedInventory = [...items, newItem];
    await syncInventory(userId, updatedInventory);

    // Update items state directly
    setItems(updatedInventory);
    
    // Reset form and close dialog
    setNewItemForm({
      name: '',
      quantity: '',
      unit: 'g',
      category: '',
      lowStockThreshold: '',
      expiryDate: ''
    });
    setAddItemDialogOpen(false);
  }, [currentUser?.id, newItemForm, items, syncInventory]);

  // Export functions
  const exportCSV = useCallback(() => {
    const visibleCols = table.getAllLeafColumns().filter(col => col.getIsVisible());
    const headers = visibleCols.map(col => col.columnDef.header as string);
    const rows = table.getRowModel().rows.map(row =>
      visibleCols.map(col => {
        const val = row.getValue(col.id);
        return typeof val === 'string' ? val.replace(/\n/g, ' ') : val;
      })
    );
    let csv = '';
    csv += headers.join(',') + '\n';
    rows.forEach(r => {
      csv += r.map(cell => `"${cell ?? ''}"`).join(',') + '\n';
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'inventory.csv');
  }, [table]);

  const exportPDF = useCallback(() => {
    const doc = new jsPDF();
    const visibleCols = table.getAllLeafColumns().filter(col => col.getIsVisible());
    const headers = visibleCols.map(col => col.columnDef.header as string);
    const rows = table.getRowModel().rows.map(row =>
      visibleCols.map(col => row.getValue(col.id))
    );
    // @ts-ignore
    doc.autoTable({ head: [headers], body: rows });
    doc.save('inventory.pdf');
  }, [table]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearch('');
    setStatusFilter([]);
    setDishFilter([]);
    setTypeFilter([]);
    setExpiryFilter([]);
    setStockFilter('');
    setExpiryColFilter('');
    setUnitColFilter('');
  }, []);

  if (isLoading) {
    return (
      
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      
    );
  }

  if (!currentUser) {
    return (
      
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Please log in to view inventory.</p>
        </div>
      
    );
  }

  if (inventoryError) {
    return (
      
        <div className="flex items-center justify-center h-64">
          <p className="text-red-500">{inventoryError}</p>
        </div>
      
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* Professional Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-green-600 to-green-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Inventory Stock</h1>
              <p className="text-xs text-gray-500">Manage and track your inventory items</p>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAddItemDialogOpen(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
            >
              + Add Item
            </button>
            <button
              onClick={() => window.location.href = '/inventory-import'}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-md transition-colors"
            >
              Import
            </button>
            <button
              onClick={exportCSV}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-md transition-colors"
            >
              Export CSV
            </button>
            <button
              onClick={exportPDF}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-md transition-colors"
            >
              Export PDF
            </button>
            <button
              onClick={refreshInventory}
              disabled={loading}
              className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-6 py-4 bg-white border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Stock Available</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">
                  {items.reduce((sum, item) => sum + (item.quantity || 0), 0).toFixed(2)}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-200 rounded-lg flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-orange-600 uppercase tracking-wide">Stock Used</p>
                <p className="text-2xl font-bold text-orange-900 mt-1">
                  {items.reduce((sum, item) => sum + (item.quantityUsed || 0), 0).toFixed(2)}
                </p>
              </div>
              <div className="w-10 h-10 bg-orange-200 rounded-lg flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-purple-600 uppercase tracking-wide">Total Items</p>
                <p className="text-2xl font-bold text-purple-900 mt-1">{items.length}</p>
              </div>
              <div className="w-10 h-10 bg-purple-200 rounded-lg flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="px-6 py-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col gap-4">
            {/* Search Bar */}
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="relative">
                  <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search ingredients, dishes, or units..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
              <button
                onClick={clearFilters}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear Filters
              </button>
            </div>

            {/* Filters - Professional Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-4 border-t border-gray-200">
              {/* Status Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Status</label>
                <select
                  value={statusFilter[0] || ''}
                  onChange={(e) => {
                    if (e.target.value) {
                      setStatusFilter([e.target.value]);
                    } else {
                      setStatusFilter([]);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white hover:border-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                >
                  <option value="">All Status</option>
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.value}</option>
                  ))}
                </select>
              </div>
              
              {/* Category Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Category</label>
                <select
                  value={typeFilter[0] || ''}
                  onChange={(e) => {
                    if (e.target.value) {
                      setTypeFilter([e.target.value]);
                    } else {
                      setTypeFilter([]);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white hover:border-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                >
                  <option value="">All Categories</option>
                  {typeOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.value}</option>
                  ))}
                </select>
              </div>

              {/* Sort Dropdown */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white hover:border-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                >
                  <option value="expiry">Expiry Date</option>
                  <option value="name">Name</option>
                  <option value="stock">Stock Level</option>
                  <option value="status">Status</option>
                </select>
              </div>
              
              {/* Items Per Page */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Items Per Page</label>
                <select
                  value={pagination.pageSize}
                  onChange={(e) => setPagination({ ...pagination, pageSize: Number(e.target.value), pageIndex: 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white hover:border-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={200}>200</option>
                </select>
              </div>
            </div>
            
            {/* Active Filters Chips */}
            {(statusFilter.length > 0 || typeFilter.length > 0 || search) && (
              <div className="flex flex-wrap items-center gap-2 pt-3 mt-3 border-t border-gray-200">
                <span className="text-xs font-medium text-gray-500">Active Filters:</span>
                
                {/* Search Chip */}
                {search && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-700 border border-blue-300 rounded-md text-xs font-medium">
                    <span>Search: "{search}"</span>
                    <button
                      onClick={() => setSearch('')}
                      className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                )}
                
                {/* Status Chips */}
                {statusFilter.map(status => (
                  <div key={status} className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 border border-green-300 rounded-md text-xs font-medium">
                    <span>Status: {status}</span>
                    <button
                      onClick={() => setStatusFilter(prev => prev.filter(s => s !== status))}
                      className="hover:bg-green-200 rounded-full p-0.5 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ))}
                
                {/* Category Chips */}
                {typeFilter.map(type => (
                  <div key={type} className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-100 text-purple-700 border border-purple-300 rounded-md text-xs font-medium">
                    <span>Category: {type}</span>
                    <button
                      onClick={() => setTypeFilter(prev => prev.filter(t => t !== type))}
                      className="hover:bg-purple-200 rounded-full p-0.5 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ))}
                
                {/* Clear All Button */}
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-700 border border-gray-300 rounded-md text-xs font-medium hover:bg-gray-200 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Clear All
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="px-6 py-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th
                        key={header.id}
                        className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide"
                        style={{ width: header.getSize() }}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {table.getRowModel().rows.map((row, idx) => (
                  <tr
                    key={`${row.original.id || ''}_${idx}`}
                    className={`hover:bg-gray-50 transition-colors ${updatedRowId === row.original.id ? 'bg-green-50' : ''}`}
                  >
                    {row.getVisibleCells().map(cell => (
                      <td
                        key={cell.id}
                        className="px-4 py-3.5 text-sm text-gray-900"
                        style={{ width: cell.column.getSize() }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="px-3 py-2 text-sm font-medium text-gray-700">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </span>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
          
          {Object.keys(selectedRowIds).length > 0 && (
            <button
              onClick={batchDeleteSelected}
              className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Delete Selected ({Object.keys(selectedRowIds).length})
            </button>
          )}
        </div>

        {/* Edit Dialog */}
        <Dialog open={editPanelOpen} onOpenChange={setEditPanelOpen}>
          <DialogContent className="max-w-md">
            <DialogTitle>Edit Item</DialogTitle>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input
                  type="number"
                  value={editForm.quantity || ''}
                  onChange={(e) => setEditForm({ ...editForm, quantity: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                <input
                  type="date"
                  value={editForm.expiryDate ? new Date(editForm.expiryDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => setEditForm({ ...editForm, expiryDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setEditPanelOpen(false)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveEditPanel}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogTitle>Delete Item</DialogTitle>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{selectedItem?.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteDialogOpen(false)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Item Dialog */}
        <Dialog open={addItemDialogOpen} onOpenChange={setAddItemDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogTitle>Add New Inventory Item</DialogTitle>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  value={newItemForm.name}
                  onChange={(e) => setNewItemForm((prev: any) => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter item name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newItemForm.quantity}
                    onChange={(e) => setNewItemForm((prev: any) => ({ ...prev, quantity: e.target.value }))}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit
                  </label>
                  <select
                    value={newItemForm.unit}
                    onChange={(e) => setNewItemForm((prev: any) => ({ ...prev, unit: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="g">g</option>
                    <option value="kg">kg</option>
                    <option value="ml">ml</option>
                    <option value="l">l</option>
                    <option value="oz">oz</option>
                    <option value="lb">lb</option>
                    <option value="cup">cup</option>
                    <option value="tbsp">tbsp</option>
                    <option value="tsp">tsp</option>
                    <option value="pcs">pcs</option>
                    <option value="piece">piece</option>
                    <option value="unit">unit</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={newItemForm.category}
                  onChange={(e) => setNewItemForm((prev: any) => ({ ...prev, category: e.target.value }))}
                  placeholder="e.g., Vegetables, Meat, Dairy"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Low Stock Threshold
                </label>
                <input
                  type="number"
                  min="0"
                  value={newItemForm.lowStockThreshold}
                  onChange={(e) => setNewItemForm((prev: any) => ({ ...prev, lowStockThreshold: e.target.value }))}
                  placeholder="Alert when below this amount"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={newItemForm.expiryDate}
                  onChange={(e) => setNewItemForm((prev: any) => ({ ...prev, expiryDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setAddItemDialogOpen(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={addNewItem}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700"
                >
                  Add Item
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
} 