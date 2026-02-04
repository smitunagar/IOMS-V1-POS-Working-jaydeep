"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Progress } from '@/shared/components/ui/progress';
import { 
  ArrowLeft,
  Truck,
  Package,
  Clock,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Users,
  Calendar,
  RefreshCw,
  Download,
  Plus,
  Search,
  Filter,
  Star,
  AlertTriangle,
  FileText,
  Mail,
  Phone,
  MapPin,
  Globe,
  Activity,
  Settings,
  Bell,
  Target,
  Send,
  Eye,
  ExternalLink,
  PlusCircle,
  Edit2,
  Trash2,
  Upload,
  History,
  Store,
  ChevronRight,
  X,
  Lightbulb,
  Paperclip
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { procurementWorkflowService, QuotationRequest, OwnerApproval, PurchaseOrder } from '@/server/lib/procurementWorkflowService';
import { crossModuleIntegration, SmartProcurementRecommendation } from '@/server/lib/crossModuleIntegration';
import { useSupplySync } from '@/features/supply-sync/SupplySyncContext';
import { useWasteWatchDog } from '@/features/waste-watchdog/WasteWatchDogContext';

// Enhanced vendor and supply chain interfaces
interface Vendor {
  id: string;
  name: string;
  location: string;
  distance: number;
  rating: number;
  deliveryTime: string;
  reliability: number;
  priceIndex: number;
  specialties: string[];
  lastOrderDate: string;
  paymentTerms: string;
  minimumOrder: number;
  currency: string;
}

interface VendorManagementVendor {
  id: string;
  name: string;
  category: string;
  contactInfo: {
    email: string;
    phone: string;
    address: string;
    website?: string;
  };
  contacts: VendorContact[];
  products: string[];
  performance: VendorPerformance;
  status: 'active' | 'inactive' | 'pending';
  createdDate: string;
  lastOrderDate?: string;
  totalOrders: number;
  averageOrderValue: number;
  paymentTerms: string;
  deliveryRadius: string;
  minimumOrder: number;
  notes: string;
  logo?: string;
  membershipNumber?: string;
}

interface VendorContact {
  name: string;
  email: string;
  phone: string;
  position: string;
}

interface VendorPerformance {
  reliability: number;
  qualityScore: number;
  deliveryTime: number;
  priceCompetitiveness: number;
  responseTime: number;
}

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  reorderPoint: number;
  maxStock: number;
  unit: string;
  averageUsage: number;
  lastRestocked: string;
  preferredVendor: string;
  unitCost: number;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
}

interface ProcurementAnalytics {
  totalSpend: number;
  averageOrderValue: number;
  onTimeDeliveryRate: number;
  costSavings: number;
  vendorCount: number;
  activeQuotations: number;
  pendingApprovals: number;
  completedOrders: number;
}

export default function SupplySyncPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Context integration
  const { isActive: isSupplySyncActive, setSupplySyncActive, addInventoryAlert } = useSupplySync();
  const { isActive: isWasteWatchDogActive } = useWasteWatchDog();
  
  // Enhanced state management
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [managementVendors, setManagementVendors] = useState<VendorManagementVendor[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [quotationRequests, setQuotationRequests] = useState<QuotationRequest[]>([]);
  const [ownerApprovals, setOwnerApprovals] = useState<OwnerApproval[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [pendingReorderItems, setPendingReorderItems] = useState<Array<{
    id: string;
    itemName: string;
    quantity: number;
    unit: string;
    unitCost: number;
    category: string;
    vendor: string;
    vendorId: string;
    vendorPrice: number;
    timestamp: string;
  }>>([]);
  const [analytics, setAnalytics] = useState<ProcurementAnalytics | null>(null);
  const [smartRecommendations, setSmartRecommendations] = useState<SmartProcurementRecommendation[]>([]);
  
  // Modal states
  const [showAddVendorModal, setShowAddVendorModal] = useState(false);
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showVendorDetails, setShowVendorDetails] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<VendorManagementVendor | null>(null);
  const [selectedQuotation, setSelectedQuotation] = useState<QuotationRequest | null>(null);
  
  // Reorder dialog state
  const [showReorderDialog, setShowReorderDialog] = useState(false);
  const [selectedReorderItem, setSelectedReorderItem] = useState<InventoryItem | null>(null);
  const [reorderQuantity, setReorderQuantity] = useState<string>('');
  const [selectedReorderVendor, setSelectedReorderVendor] = useState<string>('');
  const [vendorPrices, setVendorPrices] = useState<Record<string, number>>({});
  
  // Form states
  const [newVendorData, setNewVendorData] = useState({
    name: '',
    category: '',
    contactInfo: {
      email: '',
      phone: '',
      address: '',
      website: ''
    },
    products: [] as string[],
    paymentTerms: '',
    deliveryRadius: '',
    minimumOrder: 0,
    notes: ''
  });
  const [newVendorProductInput, setNewVendorProductInput] = useState('');
  const [isAddingVendor, setIsAddingVendor] = useState(false);

  useEffect(() => {
    // Load vendors immediately (synchronous)
    loadVendorManagementData();
    
    // Load other data
    loadSupplyData();
    loadProcurementData();
    loadSmartRecommendations();
    loadPendingReorderItems();
    
    // Activate SupplySync if not already active
    if (!isSupplySyncActive) {
      setSupplySyncActive(true);
    }
  }, []);

  // Ensure vendors are loaded when dialog opens
  useEffect(() => {
    if (showReorderDialog && managementVendors.length === 0) {
      loadVendorManagementData();
    }
  }, [showReorderDialog]);

  const loadPendingReorderItems = () => {
    // Load pending reorder items from localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('supply-sync-pending-orders');
      if (stored) {
        try {
          const items = JSON.parse(stored);
          // Ensure all items have the new fields (for backward compatibility)
          const normalizedItems = items.map((item: any) => ({
            ...item,
            vendorId: item.vendorId || item.vendor?.toLowerCase().replace(/\s+/g, '-') || '',
            vendorPrice: item.vendorPrice || item.unitCost || 0
          }));
          setPendingReorderItems(normalizedItems);
        } catch (error) {
          console.error('Failed to load pending reorder items:', error);
        }
      }
    }
  };

  const loadSmartRecommendations = async () => {
    try {
      const recommendations = await crossModuleIntegration.getWasteOptimizedProcurementRecommendations();
      setSmartRecommendations(recommendations);
    } catch (error) {
      console.error('Failed to load smart recommendations:', error);
    }
  };

  const loadProcurementData = async () => {
    try {
      // Load procurement workflow data
      const quotations = await procurementWorkflowService.getAllQuotationRequests();
      const approvals: any[] = []; // Owner approvals not implemented yet
      const orders = await procurementWorkflowService.getAllPurchaseOrders();
      
      setQuotationRequests(quotations);
      setOwnerApprovals(approvals);
      setPurchaseOrders(orders);
      
      // Load vendor management data
      loadVendorManagementData();
      
      // Calculate analytics
      calculateProcurementAnalytics();
      
    } catch (error) {
      console.error('Failed to load procurement data:', error);
    }
  };

  const loadVendorManagementData = () => {
    const managementVendorsData: VendorManagementVendor[] = [
      {
        id: 'vendor_001',
        name: 'METRO Cash & Carry',
        category: 'Wholesale',
        contactInfo: {
          email: 'b2b@metro.de',
          phone: '+49 211 6886-0',
          address: 'Metro-Straße 1, 40235 Düsseldorf, Germany',
          website: 'https://www.metro.de'
        },
        contacts: [
          {
            name: 'Thomas Müller',
            email: 'thomas.mueller@metro.de',
            phone: '+49 211 6886-1001',
            position: 'B2B Account Manager'
          }
        ],
        products: ['Fresh Produce', 'Dairy Products', 'Meat & Poultry', 'Frozen Foods', 'Beverages', 'Dry Goods', 'Cleaning Supplies'],
        performance: {
          reliability: 96,
          qualityScore: 90,
          deliveryTime: 1,
          priceCompetitiveness: 95,
          responseTime: 2
        },
        status: 'active',
        createdDate: '2024-01-10',
        lastOrderDate: '2025-08-20',
        totalOrders: 245,
        averageOrderValue: 850.00,
        paymentTerms: '14 days',
        deliveryRadius: '150km',
        minimumOrder: 300,
        notes: 'Leading wholesale supplier for restaurants. Best prices for bulk orders. Excellent delivery reliability.',
        logo: '/logos/metro.svg',
        membershipNumber: 'MT2024001'
      },
      {
        id: 'vendor_002',
        name: 'REWE Group',
        category: 'Supermarket Chain',
        contactInfo: {
          email: 'b2b@rewe-group.com',
          phone: '+49 221 149-0',
          address: 'Domstraße 20, 50668 Köln, Germany',
          website: 'https://www.rewe-group.com'
        },
        contacts: [
          {
            name: 'Marcus Weber',
            email: 'marcus.weber@rewe.de',
            phone: '+49 221 149-1001',
            position: 'B2B Sales Manager'
          }
        ],
        products: ['Fresh Produce', 'Dairy Products', 'Meat & Poultry', 'Frozen Foods', 'Beverages'],
        performance: {
          reliability: 94,
          qualityScore: 92,
          deliveryTime: 2,
          priceCompetitiveness: 88,
          responseTime: 4
        },
        status: 'active',
        createdDate: '2024-01-15',
        lastOrderDate: '2025-08-20',
        totalOrders: 156,
        averageOrderValue: 450.75,
        paymentTerms: '30 days',
        deliveryRadius: '100km',
        minimumOrder: 200,
        notes: 'Preferred vendor for bulk groceries. Excellent fresh produce quality.',
        logo: '/logos/rewe.svg',
        membershipNumber: 'RW2024002'
      },
      {
        id: 'vendor_003',
        name: 'EDEKA',
        category: 'Supermarket Chain',
        contactInfo: {
          email: 'business@edeka.de',
          phone: '+49 40 6377-0',
          address: 'New-York-Ring 6, 22297 Hamburg, Germany',
          website: 'https://www.edeka.de'
        },
        contacts: [
          {
            name: 'Anna Schmidt',
            email: 'anna.schmidt@edeka.de',
            phone: '+49 40 6377-2001',
            position: 'Commercial Sales'
          }
        ],
        products: ['Organic Products', 'Local Specialties', 'Bakery Items', 'Deli Products', 'Fresh Produce'],
        performance: {
          reliability: 91,
          qualityScore: 95,
          deliveryTime: 3,
          priceCompetitiveness: 85,
          responseTime: 6
        },
        status: 'active',
        createdDate: '2024-02-01',
        lastOrderDate: '2025-08-18',
        totalOrders: 89,
        averageOrderValue: 320.50,
        paymentTerms: '45 days',
        deliveryRadius: '80km',
        minimumOrder: 150,
        notes: 'Excellent for organic and specialty products. Higher quality, premium pricing.',
        logo: '/logos/edeka.svg',
        membershipNumber: 'ED2024003'
      },
      {
        id: 'vendor_004',
        name: 'ALDI Nord',
        category: 'Discount Supermarket',
        contactInfo: {
          email: 'b2b@aldi-nord.de',
          phone: '+49 201 8596-0',
          address: 'Eckenbergstraße 16, 45307 Essen, Germany',
          website: 'https://www.aldi-nord.de'
        },
        contacts: [
          {
            name: 'Klaus Fischer',
            email: 'klaus.fischer@aldi-nord.de',
            phone: '+49 201 8596-2001',
            position: 'Business Sales'
          }
        ],
        products: ['Fresh Produce', 'Dairy Products', 'Frozen Foods', 'Beverages', 'Dry Goods'],
        performance: {
          reliability: 88,
          qualityScore: 85,
          deliveryTime: 2,
          priceCompetitiveness: 98,
          responseTime: 3
        },
        status: 'active',
        createdDate: '2024-02-15',
        lastOrderDate: '2025-08-19',
        totalOrders: 112,
        averageOrderValue: 280.00,
        paymentTerms: '14 days',
        deliveryRadius: '60km',
        minimumOrder: 100,
        notes: 'Best prices for budget-conscious restaurants. Limited product range but excellent value.',
        logo: '/logos/aldi.svg',
        membershipNumber: 'AL2024004'
      },
      {
        id: 'vendor_005',
        name: 'LIDL',
        category: 'Discount Supermarket',
        contactInfo: {
          email: 'business@lidl.de',
          phone: '+49 7132 30-0',
          address: 'Stiftsbergstraße 1, 74172 Neckarsulm, Germany',
          website: 'https://www.lidl.de'
        },
        contacts: [
          {
            name: 'Sabine Hoffmann',
            email: 'sabine.hoffmann@lidl.de',
            phone: '+49 7132 30-2001',
            position: 'B2B Coordinator'
          }
        ],
        products: ['Fresh Produce', 'Dairy Products', 'Meat & Poultry', 'Frozen Foods', 'Beverages'],
        performance: {
          reliability: 87,
          qualityScore: 86,
          deliveryTime: 2,
          priceCompetitiveness: 97,
          responseTime: 4
        },
        status: 'active',
        createdDate: '2024-03-01',
        lastOrderDate: '2025-08-17',
        totalOrders: 98,
        averageOrderValue: 265.00,
        paymentTerms: '14 days',
        deliveryRadius: '70km',
        minimumOrder: 120,
        notes: 'Competitive pricing with good quality. Popular choice for mid-range restaurants.',
        logo: '/logos/lidl.svg',
        membershipNumber: 'LI2024005'
      },
      {
        id: 'vendor_006',
        name: 'Selgros Cash & Carry',
        category: 'Wholesale',
        contactInfo: {
          email: 'info@selgros.de',
          phone: '+49 30 2089-0',
          address: 'Selgros-Weg 1, 13439 Berlin, Germany',
          website: 'https://www.selgros.de'
        },
        contacts: [
          {
            name: 'Michael Braun',
            email: 'michael.braun@selgros.de',
            phone: '+49 30 2089-3001',
            position: 'Account Manager'
          }
        ],
        products: ['Fresh Produce', 'Dairy Products', 'Meat & Poultry', 'Frozen Foods', 'Beverages', 'Dry Goods'],
        performance: {
          reliability: 93,
          qualityScore: 88,
          deliveryTime: 1,
          priceCompetitiveness: 92,
          responseTime: 3
        },
        status: 'active',
        createdDate: '2024-03-10',
        lastOrderDate: '2025-08-21',
        totalOrders: 134,
        averageOrderValue: 680.00,
        paymentTerms: '21 days',
        deliveryRadius: '120km',
        minimumOrder: 250,
        notes: 'Reliable wholesale supplier with good prices. Strong in fresh produce and meat.',
        logo: '/logos/selgros.svg',
        membershipNumber: 'SG2024006'
      },
      {
        id: 'vendor_007',
        name: 'Fleischwaren Müller',
        category: 'Specialty Meat Supplier',
        contactInfo: {
          email: 'info@fleischwaren-mueller.de',
          phone: '+49 89 1234-5678',
          address: 'Fleischerstraße 15, 80331 München, Germany',
          website: 'https://www.fleischwaren-mueller.de'
        },
        contacts: [
          {
            name: 'Hans Müller',
            email: 'hans.mueller@fleischwaren-mueller.de',
            phone: '+49 89 1234-5679',
            position: 'Owner'
          }
        ],
        products: ['Meat & Poultry', 'Sausages', 'Cured Meats'],
        performance: {
          reliability: 90,
          qualityScore: 98,
          deliveryTime: 1,
          priceCompetitiveness: 75,
          responseTime: 2
        },
        status: 'active',
        createdDate: '2024-04-01',
        lastOrderDate: '2025-08-20',
        totalOrders: 67,
        averageOrderValue: 420.00,
        paymentTerms: '30 days',
        deliveryRadius: '50km',
        minimumOrder: 150,
        notes: 'Premium quality meat supplier. Local butcher with excellent quality but higher prices.',
        logo: '/logos/mueller-meat.svg',
        membershipNumber: 'FM2024007'
      },
      {
        id: 'vendor_008',
        name: 'Bio-Hof Schmidt',
        category: 'Organic Farm',
        contactInfo: {
          email: 'bestellung@biohof-schmidt.de',
          phone: '+49 40 9876-5432',
          address: 'Bauernweg 12, 22395 Hamburg, Germany',
          website: 'https://www.biohof-schmidt.de'
        },
        contacts: [
          {
            name: 'Maria Schmidt',
            email: 'maria.schmidt@biohof-schmidt.de',
            phone: '+49 40 9876-5433',
            position: 'Farm Manager'
          }
        ],
        products: ['Organic Fresh Produce', 'Organic Dairy Products', 'Organic Eggs'],
        performance: {
          reliability: 85,
          qualityScore: 99,
          deliveryTime: 3,
          priceCompetitiveness: 70,
          responseTime: 5
        },
        status: 'active',
        createdDate: '2024-04-15',
        lastOrderDate: '2025-08-18',
        totalOrders: 45,
        averageOrderValue: 380.00,
        paymentTerms: '30 days',
        deliveryRadius: '40km',
        minimumOrder: 100,
        notes: 'Premium organic produce. Highest quality but premium pricing. Seasonal availability.',
        logo: '/logos/biohof-schmidt.svg',
        membershipNumber: 'BH2024008'
      }
    ];
    
    setManagementVendors(managementVendorsData);
    console.log('Vendors loaded:', managementVendorsData.length);
  };

  const calculateProcurementAnalytics = () => {
    const analyticsData: ProcurementAnalytics = {
      totalSpend: 45320.75,
      averageOrderValue: 385.50,
      onTimeDeliveryRate: 94.2,
      costSavings: 3250.80,
      vendorCount: managementVendors.length,
      activeQuotations: quotationRequests.filter(q => q.status !== 'expired').length,
      pendingApprovals: ownerApprovals.length, // All approvals pending for now
      completedOrders: purchaseOrders.filter(o => o.status === 'delivered').length
    };
    
    setAnalytics(analyticsData);
  };

  // Get vendor prices for an item based on category and vendor pricing strategy
  const getVendorPrices = (item: InventoryItem) => {
    const prices: Record<string, number> = {};
    const basePrice = item.unitCost;
    
    // Category-based price multipliers (realistic German market prices)
    const categoryMultipliers: Record<string, number> = {
      'Fresh Produce': 1.0,
      'Dairy': 1.0,
      'Meat & Poultry': 1.0,
      'Frozen Foods': 0.95,
      'Beverages': 1.0,
      'Dry Goods': 0.9
    };
    
    managementVendors.forEach(vendor => {
      let finalPrice = basePrice;
      
      // Apply category multiplier
      const categoryMultiplier = categoryMultipliers[item.category] || 1.0;
      finalPrice = basePrice * categoryMultiplier;
      
      // Vendor-specific pricing strategy based on price competitiveness
      const priceCompetitiveness = vendor.performance.priceCompetitiveness / 100;
      
      // METRO - Best wholesale prices (5-10% below base)
      if (vendor.id === 'vendor_001') {
        finalPrice = basePrice * 0.92; // 8% discount for wholesale
      }
      // REWE - Standard pricing (slightly above base)
      else if (vendor.id === 'vendor_002') {
        finalPrice = basePrice * 1.05; // 5% premium
      }
      // EDEKA - Premium pricing (10-15% above base for quality)
      else if (vendor.id === 'vendor_003') {
        finalPrice = basePrice * 1.12; // 12% premium for quality
      }
      // ALDI - Best discount prices (10-15% below base)
      else if (vendor.id === 'vendor_004') {
        finalPrice = basePrice * 0.88; // 12% discount
      }
      // LIDL - Competitive discount (8-12% below base)
      else if (vendor.id === 'vendor_005') {
        finalPrice = basePrice * 0.90; // 10% discount
      }
      // Selgros - Good wholesale prices (3-7% below base)
      else if (vendor.id === 'vendor_006') {
        finalPrice = basePrice * 0.95; // 5% discount
      }
      // Specialty Meat - Premium pricing (15-20% above base)
      else if (vendor.id === 'vendor_007') {
        finalPrice = basePrice * 1.18; // 18% premium for specialty
      }
      // Organic Farm - Premium organic pricing (20-25% above base)
      else if (vendor.id === 'vendor_008') {
        finalPrice = basePrice * 1.22; // 22% premium for organic
      }
      // Default: Use price competitiveness score
      else {
        finalPrice = basePrice * (1 + (1 - priceCompetitiveness) * 0.2);
      }
      
      // Ensure minimum price
      prices[vendor.id] = Math.max(0.5, Math.round(finalPrice * 100) / 100);
    });
    
    return prices;
  };

  // Handle reorder submission
  const handleReorderSubmit = () => {
    if (!selectedReorderItem || !reorderQuantity || parseFloat(reorderQuantity) <= 0 || !selectedReorderVendor) {
      return;
    }

    const quantity = parseFloat(reorderQuantity);
    const itemName = selectedReorderItem.name;
    const selectedVendorData = managementVendors.find(v => v.id === selectedReorderVendor);
    const vendorPrice = vendorPrices[selectedReorderVendor] || selectedReorderItem.unitCost;

    if (!selectedVendorData) {
      return;
    }

    // Create the reorder item
    const reorderItem = {
      id: `reorder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      itemName: itemName,
      quantity: quantity,
      unit: selectedReorderItem.unit,
      unitCost: vendorPrice,
      category: selectedReorderItem.category,
      vendor: selectedVendorData.name,
      vendorId: selectedVendorData.id,
      vendorPrice: vendorPrice,
      timestamp: new Date().toISOString()
    };

    // Add to pending reorder items state
    setPendingReorderItems(prev => [...prev, reorderItem]);

    // Store in localStorage for persistence
    const existingOrders = JSON.parse(localStorage.getItem('supply-sync-pending-orders') || '[]');
    existingOrders.push(reorderItem);
    localStorage.setItem('supply-sync-pending-orders', JSON.stringify(existingOrders));

    // Switch to orders tab to show the new item
    setActiveTab('orders');
    
    // Close dialog and reset state
    setShowReorderDialog(false);
    setSelectedReorderItem(null);
    setReorderQuantity('');
    setSelectedReorderVendor('');
    setVendorPrices({});
  };

  // Remove pending reorder item
  const handleRemovePendingReorder = (id: string) => {
    setPendingReorderItems(prev => prev.filter(item => item.id !== id));
    
    // Update localStorage
    const updated = pendingReorderItems.filter(item => item.id !== id);
    localStorage.setItem('supply-sync-pending-orders', JSON.stringify(updated));
  };

  // Convert pending reorder items to purchase order
  const handleCreatePOFromPending = () => {
    if (pendingReorderItems.length === 0) return;
    
    // Group items by vendor (using vendorId if available, otherwise vendor name)
    const itemsByVendor = pendingReorderItems.reduce((acc, item) => {
      const vendorKey = item.vendorId || item.vendor;
      if (!acc[vendorKey]) {
        acc[vendorKey] = [];
      }
      acc[vendorKey].push(item);
      return acc;
    }, {} as Record<string, typeof pendingReorderItems>);

    // Create purchase orders for each vendor
    Object.entries(itemsByVendor).forEach(([vendorKey, items]) => {
      const vendorData = managementVendors.find(v => v.id === vendorKey || v.name === vendorKey || v.id === items[0]?.vendorId);
      const vendorName = vendorData?.name || items[0]?.vendor || vendorKey;
      const vendorId = vendorData?.id || items[0]?.vendorId || vendorKey;
      
      const subtotal = items.reduce((sum, item) => sum + (item.quantity * (item.vendorPrice || item.unitCost)), 0);
      const tax = subtotal * 0.19; // 19% VAT for Germany
      const totalAmount = subtotal + tax;
      
      const newPO: PurchaseOrder = {
        id: `po-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        orderNumber: `PO-${Date.now()}`,
        quotationRequestId: '',
        vendorId: vendorId,
        vendorName: vendorName,
        items: items.map((item, idx) => ({
          id: `item-${idx}`,
          itemName: item.itemName,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.vendorPrice || item.unitCost,
          totalPrice: item.quantity * (item.vendorPrice || item.unitCost)
        })),
        subtotal: subtotal,
        tax: tax,
        totalAmount: totalAmount,
        paymentTerms: vendorData?.paymentTerms || '30 days',
        deliveryAddress: 'Restaurant Address',
        expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'draft',
        createdBy: 'system',
        createdAt: new Date().toISOString()
      };

      setPurchaseOrders(prev => [...prev, newPO]);
    });

    // Clear pending items
    setPendingReorderItems([]);
    localStorage.removeItem('supply-sync-pending-orders');
  };

  const loadSupplyData = async () => {
    try {
      setLoading(true);
      
      // Sample vendor data
      const vendorData: Vendor[] = [
        {
          id: 'v1',
          name: 'REWE',
          location: 'Cologne, Germany',
          distance: 2.5,
          rating: 4.8,
          deliveryTime: '2-4 hours',
          reliability: 95,
          priceIndex: 88,
          specialties: ['Fresh Produce', 'Dairy', 'Meat'],
          lastOrderDate: '2025-08-20',
          paymentTerms: '30 days',
          minimumOrder: 200,
          currency: 'EUR'
        },
        {
          id: 'v2',
          name: 'EDEKA',
          location: 'Hamburg, Germany',
          distance: 5.1,
          rating: 4.6,
          deliveryTime: '4-6 hours',
          reliability: 92,
          priceIndex: 91,
          specialties: ['Organic', 'Local Specialties', 'Bakery'],
          lastOrderDate: '2025-08-18',
          paymentTerms: '45 days',
          minimumOrder: 150,
          currency: 'EUR'
        },
        {
          id: 'v3',
          name: 'ALDI',
          location: 'Essen, Germany',
          distance: 8.3,
          rating: 4.2,
          deliveryTime: '6-8 hours',
          reliability: 88,
          priceIndex: 85,
          specialties: ['Budget Options', 'Frozen Foods', 'Non-perishables'],
          lastOrderDate: '2025-08-15',
          paymentTerms: '14 days',
          minimumOrder: 100,
          currency: 'EUR'
        }
      ];

      // Sample inventory data for monitoring
      const inventoryData: InventoryItem[] = [
        {
          id: 'inv_001',
          name: 'Organic Tomatoes',
          category: 'Fresh Produce',
          currentStock: 15,
          reorderPoint: 25,
          maxStock: 100,
          unit: 'kg',
          averageUsage: 12,
          lastRestocked: '2025-08-18',
          preferredVendor: 'EDEKA',
          unitCost: 3.50,
          urgencyLevel: 'high'
        },
        {
          id: 'inv_002',
          name: 'Fresh Mozzarella',
          category: 'Dairy',
          currentStock: 8,
          reorderPoint: 15,
          maxStock: 50,
          unit: 'pieces',
          averageUsage: 8,
          lastRestocked: '2025-08-19',
          preferredVendor: 'REWE',
          unitCost: 4.25,
          urgencyLevel: 'critical'
        },
        {
          id: 'inv_003',
          name: 'Chicken Breast',
          category: 'Meat & Poultry',
          currentStock: 45,
          reorderPoint: 30,
          maxStock: 80,
          unit: 'kg',
          averageUsage: 18,
          lastRestocked: '2025-08-20',
          preferredVendor: 'REWE',
          unitCost: 8.90,
          urgencyLevel: 'medium'
        }
      ];

      setVendors(vendorData);
      setInventoryItems(inventoryData);
      
    } catch (error) {
      console.error('Failed to load supply data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading SupplySync...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">SupplySync</h1>
              <p className="text-gray-600">Smart Vendor Management & Procurement Automation</p>
            </div>
            <div className="flex space-x-4">
              <Button
                onClick={() => setShowAddVendorModal(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Add Vendor
              </Button>
              <Button
                onClick={() => console.log('Create Quotation')}
                className="bg-green-600 hover:bg-green-700"
              >
                Create Quotation
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Dashboard */}
      {analytics && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Spend</p>
                  <p className="text-2xl font-bold text-gray-900">€{analytics.totalSpend.toLocaleString()}</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Cost Savings</p>
                  <p className="text-2xl font-bold text-green-600">€{analytics.costSavings.toLocaleString()}</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">On-Time Delivery</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.onTimeDeliveryRate}%</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Vendors</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.vendorCount}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="smart-insights">Smart Insights</TabsTrigger>
            <TabsTrigger value="vendors">Vendors</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="quotations">Quotations</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Vendor Performance Chart */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Vendor Performance Overview</h3>
                <div className="space-y-4">
                  {vendors.map((vendor) => (
                    <div key={vendor.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium">{vendor.name}</h4>
                        <p className="text-sm text-gray-600">{vendor.location}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-2">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="font-medium">{vendor.rating}</span>
                        </div>
                        <p className="text-sm text-gray-600">{vendor.reliability}% reliable</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Critical Inventory Alerts */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Critical Inventory Alerts</h3>
                <div className="space-y-3">
                  {inventoryItems.filter(item => item.urgencyLevel === 'critical' || item.urgencyLevel === 'high').map((item) => (
                    <Alert key={item.id} className={`${item.urgencyLevel === 'critical' ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'}`}>
                      <AlertTriangle className={`h-4 w-4 ${item.urgencyLevel === 'critical' ? 'text-red-600' : 'text-yellow-600'}`} />
                      <div>
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-gray-600">
                          Stock: {item.currentStock} {item.unit} (Reorder at: {item.reorderPoint} {item.unit})
                        </p>
                        <p className="text-sm text-gray-600">Preferred Vendor: {item.preferredVendor}</p>
                      </div>
                    </Alert>
                  ))}
                </div>
              </Card>

              {/* Recent Activity */}
              <Card className="p-6 lg:col-span-2">
                <h3 className="text-lg font-semibold mb-4">Recent Procurement Activity</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium">Purchase Order #PO-2025-001 Delivered</p>
                        <p className="text-sm text-gray-600">REWE - Fresh Produce - €245.30</p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">2 hours ago</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Clock className="h-5 w-5 text-yellow-600" />
                      <div>
                        <p className="font-medium">Quotation Request #QR-2025-005 Pending</p>
                        <p className="text-sm text-gray-600">Multiple Vendors - Dairy Products</p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">4 hours ago</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium">New Vendor Added: Local Organic Farm</p>
                        <p className="text-sm text-gray-600">Specialized in organic vegetables</p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">1 day ago</span>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Smart Insights Tab - Cross-Module Integration */}
          <TabsContent value="smart-insights">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Smart Procurement Insights</h2>
                  <p className="text-gray-600">AI-powered recommendations based on waste data and inventory patterns</p>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge variant={isWasteWatchDogActive ? "default" : "secondary"}>
                    WasteWatchDog: {isWasteWatchDogActive ? "Connected" : "Disconnected"}
                  </Badge>
                  <Button onClick={loadSmartRecommendations} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Insights
                  </Button>
                </div>
              </div>

              {/* Cross-Module Analytics */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Cross-Module Performance</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {(() => {
                    const crossAnalytics = { wasteReduction: 23.5, inventoryOptimization: 15.2, costOptimization: 12.7, inventoryEfficiency: 14.8, procurementAccuracy: 91.5, costSavings: 8750.50, efficiencyGain: 18.3 };
                    return (
                      <>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">{crossAnalytics.wasteReduction}%</div>
                          <div className="text-sm text-gray-600">Waste Reduction</div>
                        </div>
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{crossAnalytics.costOptimization}%</div>
                          <div className="text-sm text-gray-600">Cost Optimization</div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">{crossAnalytics.inventoryEfficiency}%</div>
                          <div className="text-sm text-gray-600">Inventory Efficiency</div>
                        </div>
                        <div className="text-center p-4 bg-orange-50 rounded-lg">
                          <div className="text-2xl font-bold text-orange-600">{crossAnalytics.procurementAccuracy}%</div>
                          <div className="text-sm text-gray-600">Procurement Accuracy</div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </Card>

              {/* Smart Recommendations */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Waste-Optimized Procurement Recommendations</h3>
                <div className="space-y-4">
                  {smartRecommendations.map((recommendation, index) => {
                    const priority = recommendation.urgencyScore >= 75 ? 'high' :
                      recommendation.urgencyScore >= 50 ? 'medium' : 'low';

                    return (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <h4 className="font-medium">{recommendation.itemName}</h4>
                              <Badge variant={priority === 'high' ? "destructive" : priority === 'medium' ? "default" : "secondary"}>
                                Priority: {priority}
                              </Badge>
                              {recommendation.wasteOptimized && (
                                <Badge variant="outline" className="bg-green-50 text-green-700">
                                  🌱 Waste Optimized
                                </Badge>
                              )}
                            </div>
                            <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">Recommended Qty:</span>
                                <p className="font-medium">{recommendation.recommendedQuantity} units</p>
                              </div>
                              <div>
                                <span className="text-gray-600">Supplier:</span>
                                <p className="font-medium">{recommendation.preferredVendor || 'TBD'}</p>
                              </div>
                              <div>
                                <span className="text-gray-600">Estimated Cost:</span>
                                <p className="font-medium">€{recommendation.estimatedCost.toFixed(2)}</p>
                              </div>
                            </div>
                            <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                              <span className="font-medium">Reason:</span> {recommendation.reasoning}
                            </div>
                          </div>
                          <div className="ml-4">
                            <Button 
                              size="sm"
                              onClick={() => {
                                console.log('Creating optimized quotation for:', recommendation.itemName);
                                // This would integrate with the procurement workflow
                              }}
                            >
                              Create Quotation
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {smartRecommendations.length === 0 && (
                    <div className="text-center py-8">
                      <Lightbulb className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-600">Loading AI-powered recommendations...</p>
                      <p className="text-sm text-gray-500 mt-2">
                        {isWasteWatchDogActive ? "Analyzing waste patterns and inventory data" : "Connect WasteWatchDog for enhanced insights"}
                      </p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Integration Status */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Module Integration Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">WasteWatchDog</h4>
                        <p className="text-sm text-gray-600">Food waste tracking</p>
                      </div>
                      <Badge variant={isWasteWatchDogActive ? "default" : "secondary"}>
                        {isWasteWatchDogActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    {isWasteWatchDogActive && (
                      <div className="mt-2 text-sm text-green-600">
                        ✓ Optimizing orders based on waste patterns
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Smart Inventory</h4>
                        <p className="text-sm text-gray-600">Inventory management</p>
                      </div>
                      <Badge variant="default">Connected</Badge>
                    </div>
                    <div className="mt-2 text-sm text-green-600">
                      ✓ Real-time stock level monitoring
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Order Management</h4>
                        <p className="text-sm text-gray-600">Order processing</p>
                      </div>
                      <Badge variant="default">Connected</Badge>
                    </div>
                    <div className="mt-2 text-sm text-green-600">
                      ✓ Automated reorder notifications
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Vendor Management Tab */}
          <TabsContent value="vendors">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Vendor Management</h2>
              <p className="text-gray-600 mb-4">Advanced vendor management system with performance tracking, contact management, and automated procurement workflows.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {managementVendors.map((vendor) => (
                  <Card key={vendor.id} className="p-4 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">{vendor.name}</h3>
                      <Badge variant={vendor.status === 'active' ? 'default' : 'secondary'}>
                        {vendor.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{vendor.category}</p>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span>Reliability:</span>
                        <span>{vendor.performance.reliability}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Quality Score:</span>
                        <span>{vendor.performance.qualityScore}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Orders:</span>
                        <span>{vendor.totalOrders}</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full mt-3">
                      View Details
                    </Button>
                  </Card>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Inventory Monitor Tab */}
          <TabsContent value="inventory">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Inventory Monitoring</h2>
              <p className="text-gray-600 mb-4">Real-time inventory level monitoring with automated reorder point alerts and vendor integration.</p>
              
              <div className="space-y-4">
                {inventoryItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          item.urgencyLevel === 'critical' ? 'bg-red-500' :
                          item.urgencyLevel === 'high' ? 'bg-yellow-500' :
                          item.urgencyLevel === 'medium' ? 'bg-blue-500' : 'bg-green-500'
                        }`}></div>
                        <div>
                          <h4 className="font-medium">{item.name}</h4>
                          <p className="text-sm text-gray-600">{item.category}</p>
                        </div>
                      </div>
                      <div className="mt-2 grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Current:</span>
                          <p className="font-medium">{item.currentStock} {item.unit}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Reorder Point:</span>
                          <p className="font-medium">{item.reorderPoint} {item.unit}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Vendor:</span>
                          <p className="font-medium">{item.preferredVendor}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Cost:</span>
                          <p className="font-medium">€{item.unitCost}</p>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      disabled={item.currentStock > item.reorderPoint}
                      className="ml-4"
                      onClick={() => {
                        // Ensure vendors are loaded first
                        if (managementVendors.length === 0) {
                          loadVendorManagementData();
                          // Wait a tick for state to update
                          setTimeout(() => {
                            setSelectedReorderItem(item);
                            setReorderQuantity('');
                            setSelectedReorderVendor('');
                            const prices = getVendorPrices(item);
                            setVendorPrices(prices);
                            setShowReorderDialog(true);
                          }, 10);
                        } else {
                          setSelectedReorderItem(item);
                          setReorderQuantity('');
                          setSelectedReorderVendor('');
                          const prices = getVendorPrices(item);
                          setVendorPrices(prices);
                          setShowReorderDialog(true);
                        }
                      }}
                    >
                      Reorder
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Quotations Tab */}
          <TabsContent value="quotations">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Quotation Management</h2>
              <p className="text-gray-600 mb-4">Automated quotation request system with multi-vendor comparison and approval workflows.</p>
              
              <div className="space-y-4">
                {quotationRequests.map((quotation) => (
                  <div key={quotation.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">Quotation #{quotation.id.slice(-6)}</h4>
                        <p className="text-sm text-gray-600">
                          Status: {quotation.status} | Requested: {quotation.createdAt}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          Preferred Vendor: {quotation.preferredVendors?.[0] || 'Not set'}
                        </p>
                      </div>
                      <Badge variant="outline">{quotation.status}</Badge>
                    </div>
                  </div>
                ))}
                {quotationRequests.length === 0 && (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">No quotation requests yet</p>
                    <Button className="mt-4">Create First Quotation</Button>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Approvals Tab */}
          <TabsContent value="approvals">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Approval Workflow</h2>
              <p className="text-gray-600 mb-4">Owner approval system for purchase orders with automated workflow and notification system.</p>
              
              <div className="space-y-4">
                {/* Owner approvals feature coming soon */}
                {ownerApprovals.length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">No pending approvals</p>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Purchase Orders Tab */}
          <TabsContent value="orders">
            <div className="space-y-6">
              {/* Pending Reorder Items Section */}
              {pendingReorderItems.length > 0 && (
                <Card className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h2 className="text-xl font-bold">Pending Reorder Items</h2>
                      <p className="text-gray-600 text-sm">Items ready to be converted to purchase orders</p>
                    </div>
                    <Button 
                      onClick={handleCreatePOFromPending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Create Purchase Orders
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {pendingReorderItems.map((item) => (
                      <div key={item.id} className="p-4 border rounded-lg bg-blue-50">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <h4 className="font-medium">{item.itemName}</h4>
                              <Badge variant="outline" className="bg-white">
                                {item.category}
                              </Badge>
                            </div>
                            <div className="mt-2 grid grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">Quantity:</span>
                                <p className="font-medium">{item.quantity} {item.unit}</p>
                              </div>
                              <div>
                                <span className="text-gray-600">Unit Price:</span>
                                <p className="font-medium">€{item.vendorPrice.toFixed(2)}/{item.unit}</p>
                                <p className="text-xs text-gray-500 line-through">€{item.unitCost.toFixed(2)}</p>
                              </div>
                              <div>
                                <span className="text-gray-600">Total:</span>
                                <p className="font-medium">€{(item.quantity * item.vendorPrice).toFixed(2)}</p>
                              </div>
                              <div>
                                <span className="text-gray-600">Vendor:</span>
                                <p className="font-medium">{item.vendor}</p>
                                {managementVendors.find(v => v.id === item.vendorId) && (
                                  <div className="flex items-center space-x-1 mt-1">
                                    <Star className="h-3 w-3 text-yellow-400 fill-current" />
                                    <span className="text-xs text-gray-500">
                                      {managementVendors.find(v => v.id === item.vendorId)?.performance.reliability}%
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                              Added: {new Date(item.timestamp).toLocaleString()}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemovePendingReorder(item.id)}
                            className="ml-4 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Purchase Orders Section */}
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-4">Purchase Orders</h2>
                <p className="text-gray-600 mb-4">Complete purchase order management with tracking, delivery status, and vendor communication.</p>
                
                <div className="space-y-4">
                  {purchaseOrders.map((order) => (
                    <div key={order.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{order.orderNumber || `PO #${order.id.slice(-6)}`}</h4>
                          <p className="text-sm text-gray-600">
                            Status: {order.status} | Total: €{order.totalAmount.toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-600">Supplier: {order.vendorName || order.vendorId}</p>
                          <p className="text-sm text-gray-600">Created: {new Date(order.createdAt).toLocaleDateString()}</p>
                          {order.items && order.items.length > 0 && (
                            <div className="mt-2">
                              <p className="text-sm font-medium text-gray-700">Items:</p>
                              <ul className="text-sm text-gray-600 list-disc list-inside">
                                {order.items.map((item, idx) => (
                                  <li key={item.id || idx}>
                                    {item.itemName} - {item.quantity} {item.unit} @ €{item.unitPrice.toFixed(2)} (Total: €{item.totalPrice.toFixed(2)})
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                        <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'}>
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {purchaseOrders.length === 0 && pendingReorderItems.length === 0 && (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-600">No purchase orders yet</p>
                      <p className="text-sm text-gray-500 mt-2">Reorder items from the Inventory tab to create purchase orders</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Reorder Quantity Dialog */}
      <Dialog open={showReorderDialog} onOpenChange={setShowReorderDialog}>
        <DialogContent className="sm:max-w-[500px] z-50">
          <DialogHeader>
            <DialogTitle>Reorder Item</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {selectedReorderItem && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="item-name">Item Name</Label>
                  <Input
                    id="item-name"
                    value={selectedReorderItem.name}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity ({selectedReorderItem.unit})</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    placeholder={`Enter quantity in ${selectedReorderItem.unit}`}
                    value={reorderQuantity}
                    onChange={(e) => setReorderQuantity(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && reorderQuantity && parseFloat(reorderQuantity) > 0 && selectedReorderVendor) {
                        handleReorderSubmit();
                      }
                    }}
                  />
                  <p className="text-sm text-gray-500">
                    Current stock: {selectedReorderItem.currentStock} {selectedReorderItem.unit} | 
                    Reorder point: {selectedReorderItem.reorderPoint} {selectedReorderItem.unit}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vendor">Select Vendor</Label>
                  <Select value={selectedReorderVendor} onValueChange={setSelectedReorderVendor}>
                    <SelectTrigger id="vendor" className="w-full">
                      <SelectValue placeholder="Choose a vendor">
                        {selectedReorderVendor && managementVendors.find(v => v.id === selectedReorderVendor) && (
                          <span>{managementVendors.find(v => v.id === selectedReorderVendor)?.name}</span>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="z-[100] max-h-[400px] w-full">
                      {managementVendors && managementVendors.length > 0 ? (
                        managementVendors.map((vendor) => {
                          const price = vendorPrices[vendor.id] || 0;
                          const totalPrice = reorderQuantity && parseFloat(reorderQuantity) > 0 
                            ? (parseFloat(reorderQuantity) * price).toFixed(2)
                            : '0.00';
                          return (
                            <SelectItem 
                              key={vendor.id} 
                              value={vendor.id}
                              className="cursor-pointer py-2"
                            >
                              <div className="flex flex-col w-full gap-1">
                                <div className="flex justify-between items-center w-full">
                                  <span className="font-semibold text-sm">{vendor.name}</span>
                                  <span className="ml-2 text-sm font-bold text-blue-600">
                                    €{price.toFixed(2)}/{selectedReorderItem.unit}
                                  </span>
                                </div>
                                {reorderQuantity && parseFloat(reorderQuantity) > 0 && (
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-500">Total: €{totalPrice}</span>
                                  </div>
                                )}
                                <div className="flex items-center space-x-2 text-xs text-gray-500">
                                  <span>⭐ {vendor.performance.reliability}%</span>
                                  <span>•</span>
                                  <span>Quality: {vendor.performance.qualityScore}%</span>
                                </div>
                              </div>
                            </SelectItem>
                          );
                        })
                      ) : (
                        <div className="p-2 text-sm text-gray-500">
                          <p>Loading vendors...</p>
                          <p className="text-xs mt-1">If this persists, please refresh the page.</p>
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  {selectedReorderVendor && vendorPrices[selectedReorderVendor] && (
                    <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            {managementVendors.find(v => v.id === selectedReorderVendor)?.name}
                          </p>
                          <p className="text-xs text-gray-600">
                            Unit Price: €{vendorPrices[selectedReorderVendor].toFixed(2)}/{selectedReorderItem.unit}
                          </p>
                          {reorderQuantity && parseFloat(reorderQuantity) > 0 && (
                            <p className="text-sm font-semibold text-blue-600 mt-1">
                              Total: €{(parseFloat(reorderQuantity) * vendorPrices[selectedReorderVendor]).toFixed(2)}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-1 text-xs text-gray-600">
                            <Star className="h-3 w-3 text-yellow-400 fill-current" />
                            <span>
                              {managementVendors.find(v => v.id === selectedReorderVendor)?.performance.reliability}% Reliable
                            </span>
                          </div>
                          <p className="text-xs text-gray-600">
                            Quality: {managementVendors.find(v => v.id === selectedReorderVendor)?.performance.qualityScore}%
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowReorderDialog(false);
                setSelectedReorderItem(null);
                setReorderQuantity('');
                setSelectedReorderVendor('');
                setVendorPrices({});
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReorderSubmit}
              disabled={!reorderQuantity || parseFloat(reorderQuantity) <= 0 || !selectedReorderVendor}
            >
              Add to Orders
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
