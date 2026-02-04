'use client';

import Link from 'next/link';
import Image from 'next/image';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Progress } from '@/shared/components/ui/progress';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Label } from '@/shared/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/shared/components/ui/dialog';
import { 
  ShoppingCart, 
  TrendingUp, 
  AlertTriangle, 
  MapPin, 
  Clock, 
  DollarSign,
  Package,
  RefreshCw,
  Bell,
  BarChart3,
  Truck,
  Users,
  Calendar,
  Target,
  Mail,
  Paperclip,
  CheckCircle,
  XCircle,
  FileText,
  Settings,
  Send,
  Eye,
  ExternalLink,
  PlusCircle,
  Edit2,
  Trash2,
  Phone,
  Star,
  Filter,
  Search,
  Download,
  Upload,
  History,
  Link as LinkIcon,
  Store,
  ChevronRight,
  X,
  Lightbulb,
  TrendingDown
} from 'lucide-react';
import { 
  QuotationRequest, 
  QuotationResponse, 
  OwnerApproval, 
  PurchaseOrder,
  TrackingInfo,
  PurchaseOrderItem
} from '@/server/lib/procurementWorkflowService';

interface Vendor {
  id: string;
  name: string;
  location: string;
  distance: number;
  rating: number;
  deliveryTime: string;
  reliability: number;
  priceIndex: number; // 1.0 = baseline, <1.0 = cheaper, >1.0 = more expensive
  specialties: string[];
  lastOrderDate: string;
  paymentTerms: string;
  minimumOrder: number;
  currency: string;
}

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  reorderPoint: number;
  maxStock: number;
  unit: string;
  averageUsage: number; // per day
  lastRestocked: string;
  preferredVendor: string;
  unitCost: number;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
}

interface RestockAlert {
  id: string;
  itemId: string;
  itemName: string;
  currentStock: number;
  reorderPoint: number;
  suggestedQuantity: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  estimatedDaysLeft: number;
  recommendedVendor: string;
  cost: number;
  createdAt: string;
}

interface ProcurementForecast {
  itemName: string;
  predictedNeed: number;
  confidence: number;
  timeframe: string;
  seasonalFactor: number;
  trendDirection: 'up' | 'down' | 'stable';
}

interface VendorEmail {
  id: string;
  vendorId: string;
  vendorName: string;
  vendorEmail: string;
  subject: string;
  content: string;
  sentAt: string;
  status: 'sent' | 'delivered' | 'read' | 'replied';
  orderNumber?: string;
  attachments?: string[];
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

export default function SupplySync() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [restockAlerts, setRestockAlerts] = useState<RestockAlert[]>([]);
  const [forecasts, setForeasts] = useState<ProcurementForecast[]>([]);
  const [quotationRequests, setQuotationRequests] = useState<QuotationRequest[]>([]);
  const [ownerApprovals, setOwnerApprovals] = useState<OwnerApproval[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<string>('');
  const [activeTab, setActiveTab] = useState('alerts');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Vendor Management State
  const [managementVendors, setManagementVendors] = useState<VendorManagementVendor[]>([]);
  const [membershipConnections, setMembershipConnections] = useState<{[key: string]: string}>({});
  const [userMembershipIds, setUserMembershipIds] = useState<{[vendorId: string]: string}>({});
  const [purchaseHistory, setPurchaseHistory] = useState<{[vendorId: string]: any[]}>({});
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedVendorForMembership, setSelectedVendorForMembership] = useState<VendorManagementVendor | null>(null);
  const [selectedVendorHistory, setSelectedVendorHistory] = useState<{vendor: VendorManagementVendor, history: any[]} | null>(null);
  const [membershipInput, setMembershipInput] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  
  // New state for sidebar and comparison features
  const [showVendorSidebar, setShowVendorSidebar] = useState(false);
  const [showPriceComparison, setShowPriceComparison] = useState(false);
  const [comparisonItem, setComparisonItem] = useState<string>('');
  const [priceComparisonData, setPriceComparisonData] = useState<any[]>([]);
  
  // Vendor details modal state
  const [showVendorDetails, setShowVendorDetails] = useState(false);
  const [selectedVendorDetails, setSelectedVendorDetails] = useState<any>(null);
  
  // Add new vendor state
  const [showAddVendorModal, setShowAddVendorModal] = useState(false);
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
  
  // Email and mailbox state
  const [vendorEmails, setVendorEmails] = useState<VendorEmail[]>([]);
  const [showMailbox, setShowMailbox] = useState(false);
  
  // Comparison filter state
  const [comparisonFilter, setComparisonFilter] = useState<'price' | 'delivery' | 'quality' | 'reliability' | 'overall'>('price');
  
  const [workflowSettings, setWorkflowSettings] = useState({
    baseThresholdDays: 15,
    ownerEmail: 'owner@museum-restaurant-hechingen.com',
    autoApprovalLimit: 200
  });

  useEffect(() => {
    // Initialize demo data
    initializeDemoData();
    // Initialize vendor management data
    initializeVendorManagementData();
    // Set up real-time monitoring
    const interval = setInterval(analyzeSupplyChain, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const initializeDemoData = () => {
    // Remove demo vendors - using only main supermarket vendors

    const demoInventory: InventoryItem[] = [
      {
        id: 'i1',
        name: 'Chicken Breast',
        category: 'Meat',
        currentStock: 8,
        reorderPoint: 15,
        maxStock: 50,
        unit: 'kg',
        averageUsage: 12,
        lastRestocked: '2025-07-20',
        preferredVendor: 'v5', // Kaufland
        unitCost: 8.50,
        urgencyLevel: 'critical'
      },
      {
        id: 'i2',
        name: 'Basmati Rice',
        category: 'Grains',
        currentStock: 25,
        reorderPoint: 20,
        maxStock: 100,
        unit: 'kg',
        averageUsage: 8,
        lastRestocked: '2025-07-22',
        preferredVendor: 'v10', // REWE
        unitCost: 3.20,
        urgencyLevel: 'medium'
      },
      {
        id: 'i3',
        name: 'Fresh Tomatoes',
        category: 'Vegetables',
        currentStock: 5,
        reorderPoint: 10,
        maxStock: 30,
        unit: 'kg',
        averageUsage: 6,
        lastRestocked: '2025-07-21',
        preferredVendor: 'v9', // Edeka
        unitCost: 2.80,
        urgencyLevel: 'high'
      },
      {
        id: 'i4',
        name: 'Olive Oil',
        category: 'Oils',
        currentStock: 12,
        reorderPoint: 8,
        maxStock: 24,
        unit: 'L',
        averageUsage: 2,
        lastRestocked: '2025-07-19',
        preferredVendor: 'v9', // Edeka
        unitCost: 15.00,
        urgencyLevel: 'low'
      },
      {
        id: 'i5',
        name: 'Garam Masala',
        category: 'Spices',
        currentStock: 2,
        reorderPoint: 3,
        maxStock: 10,
        unit: 'kg',
        averageUsage: 0.5,
        lastRestocked: '2025-07-10',
        preferredVendor: 'v7', // Aldi
        unitCost: 25.00,
        urgencyLevel: 'high'
      },
      {
        id: 'i6',
        name: 'Premium Beef Steaks',
        category: 'Meat',
        currentStock: 5,
        reorderPoint: 8,
        maxStock: 20,
        unit: 'kg',
        averageUsage: 1.2,
        lastRestocked: '2025-07-20',
        preferredVendor: 'v11', // Frische Metzgerei Wagner
        unitCost: 32.50,
        urgencyLevel: 'medium'
      },
      {
        id: 'i7',
        name: 'Organic Vegetables Mix',
        category: 'Produce',
        currentStock: 3,
        reorderPoint: 5,
        maxStock: 15,
        unit: 'kg',
        averageUsage: 2.0,
        lastRestocked: '2025-07-22',
        preferredVendor: 'v12', // Bauernhof Müller Bio
        unitCost: 8.90,
        urgencyLevel: 'high'
      },
      {
        id: 'i8',
        name: 'Fresh Bread Rolls',
        category: 'Bakery',
        currentStock: 20,
        reorderPoint: 30,
        maxStock: 100,
        unit: 'pieces',
        averageUsage: 25,
        lastRestocked: '2025-07-24',
        preferredVendor: 'v13', // Bäckerei Schmitt
        unitCost: 0.85,
        urgencyLevel: 'medium'
      },
      {
        id: 'i9',
        name: 'Fresh Salmon Fillets',
        category: 'Seafood',
        currentStock: 2,
        reorderPoint: 4,
        maxStock: 12,
        unit: 'kg',
        averageUsage: 1.5,
        lastRestocked: '2025-07-23',
        preferredVendor: 'v14', // Fischhändler Nord
        unitCost: 28.00,
        urgencyLevel: 'critical'
      }
    ];

    const demoAlerts: RestockAlert[] = [
      {
        id: 'a1',
        itemId: 'i1',
        itemName: 'Chicken Breast',
        currentStock: 8,
        reorderPoint: 15,
        suggestedQuantity: 42,
        urgency: 'critical',
        estimatedDaysLeft: 0.7,
        recommendedVendor: 'v5', // Kaufland
        cost: 357.00,
        createdAt: '2025-07-24T09:15:00Z'
      },
      {
        id: 'a2',
        itemId: 'i3',
        itemName: 'Fresh Tomatoes',
        currentStock: 5,
        reorderPoint: 10,
        suggestedQuantity: 25,
        urgency: 'high',
        estimatedDaysLeft: 0.8,
        recommendedVendor: 'v9', // Edeka
        cost: 70.00,
        createdAt: '2025-07-24T08:30:00Z'
      },
      {
        id: 'a3',
        itemId: 'i5',
        itemName: 'Garam Masala',
        currentStock: 2,
        reorderPoint: 3,
        suggestedQuantity: 8,
        urgency: 'high',
        estimatedDaysLeft: 4,
        recommendedVendor: 'v7', // Aldi
        cost: 200.00,
        createdAt: '2025-07-24T07:45:00Z'
      },
      {
        id: 'a4',
        itemId: 'i7',
        itemName: 'Organic Vegetables Mix',
        currentStock: 3,
        reorderPoint: 5,
        suggestedQuantity: 12,
        urgency: 'high',
        estimatedDaysLeft: 1.5,
        recommendedVendor: 'v12', // Bauernhof Müller Bio
        cost: 106.80,
        createdAt: '2025-07-24T10:20:00Z'
      },
      {
        id: 'a5',
        itemId: 'i9',
        itemName: 'Fresh Salmon Fillets',
        currentStock: 2,
        reorderPoint: 4,
        suggestedQuantity: 8,
        urgency: 'critical',
        estimatedDaysLeft: 1.3,
        recommendedVendor: 'v14', // Fischhändler Nord
        cost: 224.00,
        createdAt: '2025-07-24T11:00:00Z'
      }
    ];

    const demoForecasts: ProcurementForecast[] = [
      {
        itemName: 'Chicken Breast',
        predictedNeed: 84,
        confidence: 92,
        timeframe: 'Next 7 days',
        seasonalFactor: 1.1,
        trendDirection: 'up'
      },
      {
        itemName: 'Basmati Rice',
        predictedNeed: 56,
        confidence: 88,
        timeframe: 'Next 7 days',
        seasonalFactor: 1.0,
        trendDirection: 'stable'
      },
      {
        itemName: 'Fresh Tomatoes',
        predictedNeed: 42,
        confidence: 85,
        timeframe: 'Next 7 days',
        seasonalFactor: 1.15,
        trendDirection: 'up'
      }
    ];

    // Demo data for quotation requests with simpler structure
    const demoQuotationRequests: QuotationRequest[] = [
      {
        id: 'q1',
        itemId: 'chicken-1',
        itemName: 'Fresh Chicken',
        quantity: 50,
        unit: 'kg',
        urgencyLevel: 'high',
        requiredDeliveryDate: '2025-01-24T12:00:00Z',
        specifications: 'Grade A, free-range preferred',
        status: 'responses_received',
        preferredVendors: ['v5', 'v9'],
        requestedBy: 'system',
        createdAt: '2025-01-21T08:00:00Z',
        responses: [
          {
            id: 'r1',
            quotationRequestId: 'q1',
            vendorId: 'v5',
            vendorName: 'Kaufland',
            unitPrice: 8.50,
            totalPrice: 425,
            deliveryTime: '2 days',
            validUntil: '2025-01-25',
            paymentTerms: 'Net 30',
            notes: 'Grade A free-range chicken',
            receivedAt: '2025-01-21',
            attachments: [],
            currency: 'EUR',
            qualityScore: 4.5,
            reliabilityScore: 4.2
          }
        ]
      }
    ];

    // Demo data for owner approvals
    const demoOwnerApprovals: OwnerApproval[] = [
      {
        id: 'a1',
        quotationRequestId: 'q1',
        selectedQuotationId: 'r1',
        requestedBy: 'procurement_bot',
        requestedAt: '2025-01-21T10:00:00Z',
        status: 'pending',
        urgencyLevel: 'medium',
        totalAmount: 425,
        justification: 'High quality chicken needed for restaurant operations'
      }
    ];

    // Demo data for purchase orders
    const demoPurchaseOrders: PurchaseOrder[] = [
      {
        id: 'po1',
        orderNumber: 'PO-2025-001',
        quotationRequestId: 'q1',
        vendorId: 'v5',
        vendorName: 'Kaufland',
        items: [
          {
            id: 'poi1',
            itemName: 'Fresh Chicken',
            quantity: 50,
            unit: 'kg',
            unitPrice: 8.50,
            totalPrice: 425,
            specifications: 'Grade A, free-range'
          }
        ],
        totalAmount: 425,
        specialInstructions: 'Deliver to rear entrance',
        status: 'sent',
        createdBy: 'system',
        approvedBy: 'owner',
        subtotal: 425,
        tax: 0,
        paymentTerms: 'Net 30',
        deliveryAddress: 'Restaurant Kitchen, Hechingen',
        expectedDeliveryDate: '2025-01-24T12:00:00Z',
        createdAt: '2025-01-21T12:00:00Z'
      }
    ];

    setVendors([]); // Remove demo vendors - using only main supermarket vendors
    setInventory(demoInventory);
    setRestockAlerts(demoAlerts);
    setForeasts(demoForecasts);
    setQuotationRequests(demoQuotationRequests);
    setOwnerApprovals(demoOwnerApprovals);
    setPurchaseOrders(demoPurchaseOrders);
    
    // Initialize vendor management data
    initializeVendorManagementData();
  };

  const initializeVendorManagementData = () => {
    const managementVendorsData: VendorManagementVendor[] = [
      {
        id: 'v5',
        name: 'Kaufland',
        category: 'Supermarket',
        contactInfo: {
          email: 'info@kaufland.de',
          phone: '+49-800-1528352',
          address: 'Rötelstraße 35, 74172 Neckarsulm, Germany',
          website: 'https://www.kaufland.de/'
        },
        contacts: [
          {
            name: 'Kaufland Support',
            email: 'support@kaufland.de',
            phone: '+49-800-1528352',
            position: 'Customer Service'
          }
        ],
        products: ['Groceries', 'Fresh Produce', 'Household Items'],
        performance: {
          reliability: 95,
          qualityScore: 93,
          deliveryTime: 90,
          priceCompetitiveness: 92,
          responseTime: 90
        },
        status: 'active',
        createdDate: '2024-05-01',
        lastOrderDate: '2025-07-25',
        totalOrders: 0,
        averageOrderValue: 0,
        paymentTerms: 'Net 30',
        deliveryRadius: 'Nationwide',
        minimumOrder: 0,
        notes: 'Direct connection for Kaufland members.',
        logo: '/logos/Kaufland_Deutschland.png',
        membershipNumber: ''
      },
      {
        id: 'v6',
        name: 'Lidl',
        category: 'Supermarket',
        contactInfo: {
          email: 'info@lidl.de',
          phone: '+49-800-4353361',
          address: 'Stiftsbergstraße 1, 74172 Neckarsulm, Germany',
          website: 'https://www.lidl.de/'
        },
        contacts: [
          {
            name: 'Lidl Support',
            email: 'support@lidl.de',
            phone: '+49-800-4353361',
            position: 'Customer Service'
          }
        ],
        products: ['Groceries', 'Fresh Produce', 'Discount Items'],
        performance: {
          reliability: 94,
          qualityScore: 92,
          deliveryTime: 91,
          priceCompetitiveness: 95,
          responseTime: 89
        },
        status: 'active',
        createdDate: '2024-05-01',
        lastOrderDate: '2025-07-25',
        totalOrders: 0,
        averageOrderValue: 0,
        paymentTerms: 'Net 30',
        deliveryRadius: 'Nationwide',
        minimumOrder: 0,
        notes: 'Direct connection for Lidl members.',
        logo: '/logos/png-clipart-lidl-logo-ireland-logo-lidl-symbols-lidl-logo-miscellaneous-cdr-thumbnail.png',
        membershipNumber: ''
      },
      {
        id: 'v7',
        name: 'Aldi',
        category: 'Supermarket',
        contactInfo: {
          email: 'info@aldi.de',
          phone: '+49-800-8002534',
          address: 'Eckenbergstraße 16, 45307 Essen, Germany',
          website: 'https://www.aldi.de/'
        },
        contacts: [
          {
            name: 'Aldi Support',
            email: 'support@aldi.de',
            phone: '+49-800-8002534',
            position: 'Customer Service'
          }
        ],
        products: ['Groceries', 'Fresh Produce', 'Discount Items'],
        performance: {
          reliability: 93,
          qualityScore: 91,
          deliveryTime: 92,
          priceCompetitiveness: 96,
          responseTime: 88
        },
        status: 'active',
        createdDate: '2024-05-01',
        lastOrderDate: '2025-07-25',
        totalOrders: 0,
        averageOrderValue: 0,
        paymentTerms: 'Net 30',
        deliveryRadius: 'Nationwide',
        minimumOrder: 0,
        notes: 'Direct connection for Aldi members.',
        logo: '/logos/67e50408811288e697ea78b5082b3450.png',
        membershipNumber: ''
      },
      {
        id: 'v8',
        name: 'Penny',
        category: 'Supermarket',
        contactInfo: {
          email: 'info@penny.de',
          phone: '+49-221-20199959',
          address: 'Domstraße 20, 50668 Köln, Germany',
          website: 'https://www.penny.de/'
        },
        contacts: [
          {
            name: 'Penny Support',
            email: 'support@penny.de',
            phone: '+49-221-20199959',
            position: 'Customer Service'
          }
        ],
        products: ['Groceries', 'Fresh Produce', 'Discount Items'],
        performance: {
          reliability: 92,
          qualityScore: 90,
          deliveryTime: 90,
          priceCompetitiveness: 94,
          responseTime: 87
        },
        status: 'active',
        createdDate: '2024-05-01',
        lastOrderDate: '2025-07-25',
        totalOrders: 0,
        averageOrderValue: 0,
        paymentTerms: 'Net 30',
        deliveryRadius: 'Nationwide',
        minimumOrder: 0,
        notes: 'Direct connection for Penny members.',
        logo: '/logos/Penny-Logo.svg.png',
        membershipNumber: ''
      },
      {
        id: 'v9',
        name: 'Edeka',
        category: 'Supermarket',
        contactInfo: {
          email: 'info@edeka.de',
          phone: '+49-800-3335253',
          address: 'New-York-Ring 6, 22297 Hamburg, Germany',
          website: 'https://www.edeka.de/'
        },
        contacts: [
          {
            name: 'Edeka Support',
            email: 'support@edeka.de',
            phone: '+49-800-3335253',
            position: 'Customer Service'
          }
        ],
        products: ['Groceries', 'Fresh Produce', 'Household Items'],
        performance: {
          reliability: 96,
          qualityScore: 94,
          deliveryTime: 93,
          priceCompetitiveness: 91,
          responseTime: 91
        },
        status: 'active',
        createdDate: '2024-05-01',
        lastOrderDate: '2025-07-25',
        totalOrders: 0,
        averageOrderValue: 0,
        paymentTerms: 'Net 30',
        deliveryRadius: 'Nationwide',
        minimumOrder: 0,
        notes: 'Direct connection for Edeka members.',
        logo: '/logos/Edeka_Logo_Aktuell.svg.png',
        membershipNumber: ''
      },
      {
        id: 'v10',
        name: 'REWE',
        category: 'Supermarket',
        contactInfo: {
          email: 'info@rewe.de',
          phone: '+49-221-17739933',
          address: 'Domstraße 20, 50668 Köln, Germany',
          website: 'https://www.rewe.de/'
        },
        contacts: [
          {
            name: 'REWE Support',
            email: 'support@rewe.de',
            phone: '+49-221-17739933',
            position: 'Customer Service'
          }
        ],
        products: ['Groceries', 'Fresh Produce', 'Household Items'],
        performance: {
          reliability: 97,
          qualityScore: 95,
          deliveryTime: 94,
          priceCompetitiveness: 90,
          responseTime: 92
        },
        status: 'active',
        createdDate: '2024-05-01',
        lastOrderDate: '2025-07-25',
        totalOrders: 0,
        averageOrderValue: 0,
        paymentTerms: 'Net 30',
        deliveryRadius: 'Nationwide',
        minimumOrder: 0,
        notes: 'Direct connection for REWE members.',
        logo: '/logos/REWE_Dein_Markt-Logo_neu.png',
        membershipNumber: ''
      },
      {
        id: 'v11',
        name: 'Frische Metzgerei Wagner',
        category: 'Local Butcher',
        contactInfo: {
          email: 'info@metzgerei-wagner.de',
          phone: '+49-89-12345678',
          address: 'Hauptstraße 45, 80331 München, Germany',
          website: 'https://www.metzgerei-wagner.de/'
        },
        contacts: [
          {
            name: 'Hans Wagner',
            email: 'hans@metzgerei-wagner.de',
            phone: '+49-89-12345678',
            position: 'Owner/Master Butcher'
          }
        ],
        products: ['Premium Meat', 'Sausages', 'Cold Cuts', 'Organic Meat'],
        performance: {
          reliability: 98,
          qualityScore: 99,
          deliveryTime: 95,
          priceCompetitiveness: 85,
          responseTime: 95
        },
        status: 'active',
        createdDate: '2024-03-15',
        lastOrderDate: '2025-07-20',
        totalOrders: 45,
        averageOrderValue: 180,
        paymentTerms: 'Net 14',
        deliveryRadius: 'Munich Area',
        minimumOrder: 50,
        notes: 'Family-owned butcher shop. Premium quality meat supplier.',
        logo: '/logos/local-butcher.svg',
        membershipNumber: 'MW2024001'
      },
      {
        id: 'v12',
        name: 'Bauernhof Müller Bio',
        category: 'Local Farm',
        contactInfo: {
          email: 'contact@bauernhof-mueller.de',
          phone: '+49-89-87654321',
          address: 'Dorfstraße 23, 85716 Unterschleißheim, Germany',
          website: 'https://www.bauernhof-mueller.de/'
        },
        contacts: [
          {
            name: 'Maria Müller',
            email: 'maria@bauernhof-mueller.de',
            phone: '+49-89-87654321',
            position: 'Farm Owner'
          }
        ],
        products: ['Organic Vegetables', 'Fresh Eggs', 'Dairy Products', 'Herbs'],
        performance: {
          reliability: 96,
          qualityScore: 98,
          deliveryTime: 92,
          priceCompetitiveness: 88,
          responseTime: 94
        },
        status: 'active',
        createdDate: '2024-04-10',
        lastOrderDate: '2025-07-22',
        totalOrders: 28,
        averageOrderValue: 120,
        paymentTerms: 'Net 7',
        deliveryRadius: 'Greater Munich',
        minimumOrder: 30,
        notes: 'Certified organic farm. Fresh daily deliveries.',
        logo: '/logos/local-farm.svg',
        membershipNumber: 'BM2024002'
      },
      {
        id: 'v13',
        name: 'Bäckerei Schmitt',
        category: 'Local Bakery',
        contactInfo: {
          email: 'orders@baeckerei-schmitt.de',
          phone: '+49-89-55566677',
          address: 'Bäckerstraße 12, 80469 München, Germany',
          website: 'https://www.baeckerei-schmitt.de/'
        },
        contacts: [
          {
            name: 'Klaus Schmitt',
            email: 'klaus@baeckerei-schmitt.de',
            phone: '+49-89-55566677',
            position: 'Master Baker'
          }
        ],
        products: ['Fresh Bread', 'Pastries', 'Cakes', 'Gluten-Free Options'],
        performance: {
          reliability: 97,
          qualityScore: 97,
          deliveryTime: 98,
          priceCompetitiveness: 90,
          responseTime: 96
        },
        status: 'active',
        createdDate: '2024-02-20',
        lastOrderDate: '2025-07-24',
        totalOrders: 67,
        averageOrderValue: 85,
        paymentTerms: 'Net 7',
        deliveryRadius: 'Munich City',
        minimumOrder: 25,
        notes: 'Traditional German bakery. Early morning deliveries available.',
        logo: '/logos/local-bakery.svg',
        membershipNumber: 'BS2024003'
      },
      {
        id: 'v14',
        name: 'Fischhändler Nord',
        category: 'Local Fish Market',
        contactInfo: {
          email: 'fresh@fischhändler-nord.de',
          phone: '+49-89-33344455',
          address: 'Marktplatz 8, 80331 München, Germany',
          website: 'https://www.fischhändler-nord.de/'
        },
        contacts: [
          {
            name: 'Stefan Nordhausen',
            email: 'stefan@fischhändler-nord.de',
            phone: '+49-89-33344455',
            position: 'Fish Merchant'
          }
        ],
        products: ['Fresh Fish', 'Seafood', 'Smoked Fish', 'Shellfish'],
        performance: {
          reliability: 95,
          qualityScore: 98,
          deliveryTime: 96,
          priceCompetitiveness: 87,
          responseTime: 93
        },
        status: 'active',
        createdDate: '2024-01-15',
        lastOrderDate: '2025-07-23',
        totalOrders: 39,
        averageOrderValue: 160,
        paymentTerms: 'Net 3',
        deliveryRadius: 'Munich & Surrounding',
        minimumOrder: 40,
        notes: 'Daily fresh fish delivery. Specializes in North Sea fish.',
        logo: '/logos/local-fish.svg',
        membershipNumber: 'FN2024004'
      }
    ];
    
    setManagementVendors(managementVendorsData);
  };

  // Function to convert VendorManagementVendor to Vendor for compatibility
  const convertToVendor = (managementVendor: VendorManagementVendor): Vendor => {
    return {
      id: managementVendor.id,
      name: managementVendor.name,
      location: managementVendor.contactInfo.address,
      distance: 10, // Default distance
      rating: managementVendor.performance.qualityScore / 20, // Convert 100-scale to 5-scale
      deliveryTime: '1-2 days',
      reliability: managementVendor.performance.reliability,
      priceIndex: (100 - managementVendor.performance.priceCompetitiveness) / 100 + 0.8, // Convert to price index
      specialties: managementVendor.products,
      lastOrderDate: managementVendor.lastOrderDate || new Date().toISOString().split('T')[0],
      paymentTerms: managementVendor.paymentTerms,
      minimumOrder: managementVendor.minimumOrder,
      currency: 'EUR'
    };
  };

  // Get all vendors (only main supermarket vendors)
  const getAllVendors = (): Vendor[] => {
    const managementAsVendors = managementVendors.map(convertToVendor);
    return managementAsVendors; // Only return supermarket vendors
  };

  // Function to connect user membership
  const connectMembership = async (vendorId: string, membershipId: string) => {
    if (!membershipId.trim()) {
      alert('Please enter a valid membership ID');
      return;
    }

    setIsConnecting(true);

    try {
      // Simulate API call to verify membership
      const response = await fetch(`/api/vendor-membership/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorId, membershipId })
      });

      if (response.ok) {
        const result = await response.json();
        setUserMembershipIds(prev => ({
          ...prev,
          [vendorId]: membershipId
        }));
        
        // Fetch purchase history
        fetchPurchaseHistory(vendorId, membershipId);
        setShowMembershipModal(false);
        setMembershipInput('');
        alert(`✅ Successfully connected to ${managementVendors.find(v => v.id === vendorId)?.name} membership!`);
      } else {
        // For demo purposes, accept any membership ID
        setUserMembershipIds(prev => ({
          ...prev,
          [vendorId]: membershipId
        }));
        generateDemoPurchaseHistory(vendorId);
        setShowMembershipModal(false);
        setMembershipInput('');
        alert(`✅ Connected to ${managementVendors.find(v => v.id === vendorId)?.name} membership (Demo mode)`);
      }
    } catch (error) {
      // Demo mode - generate sample data
      setUserMembershipIds(prev => ({
        ...prev,
        [vendorId]: membershipId
      }));
      generateDemoPurchaseHistory(vendorId);
      setShowMembershipModal(false);
      setMembershipInput('');
      alert(`✅ Connected to ${managementVendors.find(v => v.id === vendorId)?.name} membership (Demo mode)`);
    } finally {
      setIsConnecting(false);
    }
  };

  // Function to open membership modal
  const openMembershipModal = (vendor: VendorManagementVendor) => {
    setSelectedVendorForMembership(vendor);
    setShowMembershipModal(true);
    setMembershipInput('');
  };

  // Function to open history modal
  const openHistoryModal = (vendorId: string) => {
    const vendor = managementVendors.find(v => v.id === vendorId);
    const history = purchaseHistory[vendorId] || [];
    if (vendor) {
      setSelectedVendorHistory({ vendor, history });
      setShowHistoryModal(true);
    }
  };

  // Generate demo purchase history
  const generateDemoPurchaseHistory = (vendorId: string) => {
    const vendor = managementVendors.find(v => v.id === vendorId);
    if (!vendor) return;

    const demoHistory = [
      {
        date: '2025-07-20',
        amount: 156.78,
        items: ['Fresh Vegetables', 'Dairy Products', 'Household Items'],
        orderNumber: `${vendor.name.substring(0, 3).toUpperCase()}-2025-001`,
        status: 'Delivered'
      },
      {
        date: '2025-07-15',
        amount: 89.45,
        items: ['Groceries', 'Fresh Produce'],
        orderNumber: `${vendor.name.substring(0, 3).toUpperCase()}-2025-002`,
        status: 'Delivered'
      },
      {
        date: '2025-07-10',
        amount: 234.12,
        items: ['Bulk Items', 'Special Offers'],
        orderNumber: `${vendor.name.substring(0, 3).toUpperCase()}-2025-003`,
        status: 'Delivered'
      }
    ];

    setPurchaseHistory(prev => ({
      ...prev,
      [vendorId]: demoHistory
    }));
  };

  // Fetch real purchase history from vendor API
  const fetchPurchaseHistory = async (vendorId: string, membershipId: string) => {
    try {
      const response = await fetch(`/api/vendor-membership/history/${vendorId}/${membershipId}`);
      if (response.ok) {
        const history = await response.json();
        setPurchaseHistory(prev => ({
          ...prev,
          [vendorId]: history.data
        }));
      }
    } catch (error) {
      console.log('Using demo data for purchase history');
      generateDemoPurchaseHistory(vendorId);
    }
  };

  const analyzeSupplyChain = () => {
    setIsAnalyzing(true);
    
    // Simulate real-time analysis
    setTimeout(() => {
      // Update stock levels and alerts
      setInventory(prev => prev.map(item => ({
        ...item,
        currentStock: Math.max(0, item.currentStock - (Math.random() * 0.5))
      })));
      
      setIsAnalyzing(false);
    }, 2000);
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />;
      default: return <BarChart3 className="h-4 w-4 text-blue-500" />;
    }
  };

  const generatePurchaseOrder = async (alertId: string) => {
    const alert = restockAlerts.find(a => a.id === alertId);
    if (!alert) return;

    try {
      setIsAnalyzing(true);
      
      // Call the procurement workflow API to generate PO
      const response = await fetch('/api/supply-sync/purchase-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId: alert.itemId,
          itemName: alert.itemName,
          quantity: alert.suggestedQuantity,
          vendorId: alert.recommendedVendor,
          urgencyLevel: alert.urgency,
          estimatedCost: alert.cost,
          reason: `Auto-generated from restock alert - ${alert.estimatedDaysLeft} days left`
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Send email to vendor
        await sendEmailToVendor(result.data);
        
        // Update purchase orders list
        setPurchaseOrders(prev => [...prev, result.data]);
        
        // Remove the alert since PO is generated
        setRestockAlerts(prev => prev.filter(a => a.id !== alertId));
        
        // Show success notification
        window.alert(`✅ Purchase Order ${result.data.orderNumber} generated and email sent to vendor!`);
        
        // Switch to orders tab to show the new PO
        setActiveTab('orders');
      } else {
        throw new Error('Failed to generate purchase order');
      }
    } catch (error) {
      console.error('Error generating PO:', error);
      window.alert('❌ Failed to generate purchase order. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const sendEmailToVendor = async (purchaseOrder: any) => {
    const vendor = managementVendors.find(v => v.id === purchaseOrder.vendorId);
    if (!vendor) return;

    const emailContent = `
Dear ${vendor.contacts?.[0]?.name || 'Team'},

We hope this email finds you well.

We would like to place a purchase order with ${vendor.name}:

ORDER DETAILS:
Order Number: ${purchaseOrder.orderNumber}
Date: ${new Date(purchaseOrder.orderDate).toLocaleDateString()}

ITEMS REQUESTED:
${purchaseOrder.items.map((item: any) => 
  `• ${item.itemName} - Quantity: ${item.quantity} ${item.unit} - Unit Price: €${item.unitPrice.toFixed(2)}`
).join('\n')}

TOTAL AMOUNT: €${purchaseOrder.totalAmount.toFixed(2)} (including 19% VAT)

DELIVERY INFORMATION:
Address: ${purchaseOrder.deliveryAddress}
Required Date: ${new Date(purchaseOrder.requiredDeliveryDate).toLocaleDateString()}
Special Instructions: ${purchaseOrder.specialInstructions}

PAYMENT TERMS: ${purchaseOrder.paymentTerms}

Please confirm receipt of this order and provide us with:
1. Order confirmation
2. Expected delivery date
3. Any tracking information once shipped

If you have any questions or need clarification, please don't hesitate to contact us.

Thank you for your continued partnership.

Best regards,
Museum Restaurant Hechingen
Supply Management Team

---
This is an automated message from our SupplySync system.
    `.trim();

    const email: VendorEmail = {
      id: `email_${Date.now()}`,
      vendorId: vendor.id,
      vendorName: vendor.name,
      vendorEmail: vendor.contactInfo.email,
      subject: `Purchase Order ${purchaseOrder.orderNumber} - Museum Restaurant Hechingen`,
      content: emailContent,
      sentAt: new Date().toISOString(),
      status: 'sent',
      orderNumber: purchaseOrder.orderNumber,
      attachments: [`PO_${purchaseOrder.orderNumber}.pdf`]
    };

    // Add email to the mailbox
    setVendorEmails(prev => [email, ...prev]);

    // Simulate email delivery status updates
    setTimeout(() => {
      setVendorEmails(prev => prev.map(e => 
        e.id === email.id ? {...e, status: 'delivered'} : e
      ));
    }, 2000);

    setTimeout(() => {
      setVendorEmails(prev => prev.map(e => 
        e.id === email.id ? {...e, status: 'read'} : e
      ));
    }, 5000);
  };

  const getSortedComparisonData = (data: any[], filter: string) => {
    const sorted = [...data];
    
    switch (filter) {
      case 'price':
        return sorted.sort((a, b) => a.price - b.price);
      case 'delivery':
        return sorted.sort((a, b) => a.deliveryDays - b.deliveryDays);
      case 'quality':
        return sorted.sort((a, b) => (b.qualityRating || 0) - (a.qualityRating || 0));
      case 'reliability':
        return sorted.sort((a, b) => (b.reliability || 0) - (a.reliability || 0));
      case 'overall':
        // Overall score based on weighted factors
        return sorted.sort((a, b) => {
          const scoreA = ((a.qualityRating || 0) * 0.3) + ((a.reliability || 0) * 0.3) + 
                        ((10 - a.deliveryDays) * 0.2) + ((10 - (a.price / 10)) * 0.2);
          const scoreB = ((b.qualityRating || 0) * 0.3) + ((b.reliability || 0) * 0.3) + 
                        ((10 - b.deliveryDays) * 0.2) + ((10 - (b.price / 10)) * 0.2);
          return scoreB - scoreA;
        });
      default:
        return sorted;
    }
  };

  const getComparisonFilterIcon = (filter: string) => {
    switch (filter) {
      case 'price':
        return '💰';
      case 'delivery':
        return '🚚';
      case 'quality':
        return '⭐';
      case 'reliability':
        return '🎯';
      case 'overall':
        return '🏆';
      default:
        return '📊';
    }
  };

  const handleVendorComparison = async (itemName: string) => {
    try {
      setIsAnalyzing(true);
      setComparisonItem(itemName);
      
      // Generate mock price comparison data for all vendors
      const mockPriceData = managementVendors.map(vendor => {
        const basePrice = Math.random() * 10 + 2; // Random price between 2-12 EUR
        const reliabilityMultiplier = vendor.performance.reliability / 100;
        const finalPrice = basePrice * (1 + (1 - reliabilityMultiplier) * 0.3);
        const deliveryDays = Math.floor(Math.random() * 5) + 1; // 1-5 days
        const qualityRating = (vendor.performance.qualityScore / 20) + (Math.random() * 1 - 0.5); // Convert to 5-star scale with variation
        
        return {
          vendorId: vendor.id,
          vendorName: vendor.name,
          vendorLogo: vendor.logo,
          price: finalPrice,
          unit: 'kg',
          availability: Math.random() > 0.2 ? 'In Stock' : 'Limited',
          deliveryTime: deliveryDays + ' days',
          deliveryDays: deliveryDays,
          reliability: vendor.performance.reliability,
          qualityRating: Math.max(1, Math.min(5, qualityRating)), // Ensure 1-5 range
          minOrder: vendor.minimumOrder,
          rating: Math.max(1, Math.min(5, qualityRating)), // Ensure 1-5 range
          // Additional details for the vendor details modal
          location: vendor.contactInfo?.address || vendor.deliveryRadius || 'Location not available',
          contact: vendor.contactInfo,
          description: vendor.notes || 'No description available',
          certifications: vendor.category ? [vendor.category] : [],
          paymentTerms: vendor.paymentTerms || '30 days',
          businessHours: '9:00 AM - 5:00 PM', // Default since not in interface
          specialties: vendor.products || [],
          performance: vendor.performance
        };
      });
      
      setPriceComparisonData(mockPriceData);
      setShowPriceComparison(true);
      
    } catch (error) {
      console.error('Error in vendor comparison:', error);
      alert('❌ Failed to load vendor comparison. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Function to handle viewing vendor details
  const handleViewVendorDetails = (vendorData: any) => {
    setSelectedVendorDetails(vendorData);
    setShowVendorDetails(true);
  };

  // Function to reset add vendor form
  const resetAddVendorForm = () => {
    setNewVendorData({
      name: '',
      category: '',
      contactInfo: {
        email: '',
        phone: '',
        address: '',
        website: ''
      },
      products: [],
      paymentTerms: '',
      deliveryRadius: '',
      minimumOrder: 0,
      notes: ''
    });
    setNewVendorProductInput('');
  };

  // Function to handle adding a product to the new vendor
  const handleAddProduct = () => {
    if (newVendorProductInput.trim() && !newVendorData.products.includes(newVendorProductInput.trim())) {
      setNewVendorData(prev => ({
        ...prev,
        products: [...prev.products, newVendorProductInput.trim()]
      }));
      setNewVendorProductInput('');
    }
  };

  // Function to remove a product from the new vendor
  const handleRemoveProduct = (productToRemove: string) => {
    setNewVendorData(prev => ({
      ...prev,
      products: prev.products.filter(product => product !== productToRemove)
    }));
  };

  // Function to handle adding a new vendor
  const handleAddNewVendor = async () => {
    // Validate required fields
    if (!newVendorData.name.trim()) {
      alert('Please enter vendor name');
      return;
    }
    if (!newVendorData.category.trim()) {
      alert('Please select a category');
      return;
    }
    if (!newVendorData.contactInfo.email.trim()) {
      alert('Please enter vendor email');
      return;
    }
    if (!newVendorData.contactInfo.phone.trim()) {
      alert('Please enter vendor phone');
      return;
    }
    if (!newVendorData.contactInfo.address.trim()) {
      alert('Please enter vendor address');
      return;
    }

    setIsAddingVendor(true);

    try {
      // Create new vendor object
      const newVendor: VendorManagementVendor = {
        id: `vendor_${Date.now()}`,
        name: newVendorData.name.trim(),
        category: newVendorData.category.trim(),
        contactInfo: {
          email: newVendorData.contactInfo.email.trim(),
          phone: newVendorData.contactInfo.phone.trim(),
          address: newVendorData.contactInfo.address.trim(),
          website: newVendorData.contactInfo.website.trim()
        },
        contacts: [{
          name: 'Primary Contact',
          email: newVendorData.contactInfo.email.trim(),
          phone: newVendorData.contactInfo.phone.trim(),
          position: 'Primary'
        }],
        products: newVendorData.products,
        performance: {
          reliability: 85, // Default starting values
          qualityScore: 85,
          deliveryTime: 3,
          priceCompetitiveness: 85,
          responseTime: 2
        },
        status: 'pending' as const,
        createdDate: new Date().toISOString(),
        totalOrders: 0,
        averageOrderValue: 0,
        paymentTerms: newVendorData.paymentTerms || '30 days',
        deliveryRadius: newVendorData.deliveryRadius || '50km',
        minimumOrder: newVendorData.minimumOrder || 100,
        notes: newVendorData.notes || '',
        logo: undefined
      };

      // Add to the vendors list
      setManagementVendors(prev => [newVendor, ...prev]);

      // Show success message
      alert(`✅ Vendor "${newVendor.name}" has been successfully added to your vendor network!`);

      // Reset form and close modal
      resetAddVendorForm();
      setShowAddVendorModal(false);

    } catch (error) {
      console.error('Error adding new vendor:', error);
      alert('❌ Failed to add vendor. Please try again.');
    } finally {
      setIsAddingVendor(false);
    }
  };

  const scheduleOrder = async (forecast: ProcurementForecast) => {
    try {
      setIsAnalyzing(true);
      
      // Calculate optimal order timing based on forecast
      const response = await fetch('/api/supply-sync/schedule-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemName: forecast.itemName,
          predictedNeed: forecast.predictedNeed,
          confidence: forecast.confidence,
          timeframe: forecast.timeframe,
          seasonalFactor: forecast.seasonalFactor,
          trendDirection: forecast.trendDirection
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Create a quotation request for the scheduled order
        const quotationRequest = {
          id: `qr_${Date.now()}`,
          itemId: result.data.itemId,
          itemName: forecast.itemName,
          quantity: result.data.recommendedQuantity,
          unit: result.data.unit,
          urgencyLevel: result.data.urgencyLevel,
          requestedVendors: result.data.recommendedVendors,
          requestDate: new Date().toISOString(),
          requiredDeliveryDate: result.data.requiredDeliveryDate,
          specifications: result.data.specifications,
          estimatedBudget: result.data.estimatedBudget,
          status: 'draft',
          responses: [],
          createdBy: 'forecast_system',
          daysUntilStockout: result.data.daysUntilStockout,
          autoGenerated: true,
          preferredVendors: result.data.recommendedVendors,
          requestedBy: 'forecast_system',
          createdAt: new Date().toISOString()
        };
        
        // Add to quotation requests
        setQuotationRequests(prev => [...prev, quotationRequest as QuotationRequest]);
        
        // Switch to quotations tab
        setActiveTab('quotations');
        
        alert(`✅ Order scheduled for ${forecast.itemName}. Quotation request created.`);
      } else {
        throw new Error('Failed to schedule order');
      }
    } catch (error) {
      console.error('Error scheduling order:', error);
      alert('❌ Failed to schedule order. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const requestQuotations = async () => {
    try {
      setIsAnalyzing(true);
      
      // Get items that need restocking
      const itemsNeedingRestock = restockAlerts.map(alert => ({
        itemId: alert.itemId,
        itemName: alert.itemName,
        quantity: alert.suggestedQuantity,
        urgencyLevel: alert.urgency
      }));

      if (itemsNeedingRestock.length === 0) {
        alert('ℹ️ No items currently need restocking.');
        return;
      }

      // Call quotation request API
      const response = await fetch('/api/supply-sync/quotations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: itemsNeedingRestock,
          urgencyLevel: 'high',
          specifications: 'Standard quality requirements'
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Add new quotation requests
        setQuotationRequests(prev => [...prev, ...result.data]);
        
        // Switch to quotations tab
        setActiveTab('quotations');
        
        alert(`✅ Quotation requests sent for ${itemsNeedingRestock.length} items`);
      } else {
        throw new Error('Failed to request quotations');
      }
    } catch (error) {
      console.error('Error requesting quotations:', error);
      alert('❌ Failed to request quotations. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateForecastPO = async (forecast: ProcurementForecast) => {
    try {
      setIsAnalyzing(true);
      
      // Find the best vendor for this item
      const item = inventory.find(i => i.name === forecast.itemName);
      const preferredVendor = getAllVendors().find(v => v.id === item?.preferredVendor) || getAllVendors()[0];
      
      // Generate PO directly from forecast
      const response = await fetch('/api/supply-sync/purchase-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemName: forecast.itemName,
          quantity: forecast.predictedNeed,
          vendorId: preferredVendor.id,
          urgencyLevel: forecast.confidence > 90 ? 'high' : 'medium',
          reason: `Generated from AI forecast - ${forecast.confidence}% confidence`,
          scheduledDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Add to purchase orders
        setPurchaseOrders(prev => [...prev, result.data]);
        
        // Switch to orders tab
        setActiveTab('orders');
        
        alert(`✅ Purchase Order generated from forecast for ${forecast.itemName}`);
      } else {
        throw new Error('Failed to generate PO from forecast');
      }
    } catch (error) {
      console.error('Error generating forecast PO:', error);
      alert('❌ Failed to generate purchase order from forecast. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Render functions for unified view
  const renderRestockAlerts = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          Restock Alerts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {restockAlerts.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No restock alerts at this time</p>
          ) : (
            restockAlerts.map((alert) => {
              const vendor = managementVendors.find(v => v.id === alert.recommendedVendor);
              return (
                <div key={alert.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-medium text-lg">{alert.itemName}</h3>
                      <p className="text-sm text-gray-600">Current: {alert.currentStock} | Reorder: {alert.reorderPoint}</p>
                    </div>
                    <Badge className={`${getUrgencyColor(alert.urgency)} text-white`}>
                      {alert.urgency}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {vendor?.logo && (
                        <Image
                          src={vendor.logo}
                          alt={vendor.name}
                          width={32}
                          height={32}
                          className="rounded object-contain"
                        />
                      )}
                      <div>
                        <p className="text-sm font-medium">{vendor?.name || 'Unknown Vendor'}</p>
                        <p className="text-xs text-gray-500">Suggested: {alert.suggestedQuantity} units</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleVendorComparison(alert.itemName)}
                      >
                        Compare Prices
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => generatePurchaseOrder(alert.id)}
                        disabled={isAnalyzing}
                      >
                        Order Now
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderVendorComparison = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-500" />
          Smart Vendor Comparison
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {managementVendors.slice(0, 4).map((vendor) => {
            const hasConnection = userMembershipIds[vendor.id];
            return (
              <div key={vendor.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-center gap-3 mb-3">
                  {vendor.logo && (
                    <Image
                      src={vendor.logo}
                      alt={vendor.name}
                      width={40}
                      height={40}
                      className="rounded object-contain"
                    />
                  )}
                  <div>
                    <h3 className="font-medium">{vendor.name}</h3>
                    <p className="text-sm text-gray-600">Reliability: {vendor.performance.reliability}%</p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {hasConnection ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => openHistoryModal(vendor.id)}
                    >
                      <History className="h-3 w-3 mr-1" />
                      View History
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => openMembershipModal(vendor)}
                    >
                      <LinkIcon className="h-3 w-3 mr-1" />
                      Connect
                    </Button>
                  )}
                  <Button size="sm" className="flex-1">
                    <ShoppingCart className="h-3 w-3 mr-1" />
                    Order
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );

  const renderVendorManagement = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Store className="h-5 w-5 text-green-500" />
          Vendor Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Vendors</p>
              <p className="text-2xl font-bold text-blue-600">{managementVendors.length}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Connected</p>
              <p className="text-2xl font-bold text-green-600">{Object.keys(userMembershipIds).length}</p>
            </div>
          </div>
          
          {/* Vendor List */}
          <div className="space-y-3">
            {managementVendors.map((vendor) => {
              const hasConnection = userMembershipIds[vendor.id];
              return (
                <div key={vendor.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {vendor.logo && (
                      <Image
                        src={vendor.logo}
                        alt={vendor.name}
                        width={32}
                        height={32}
                        className="rounded object-contain"
                      />
                    )}
                    <div>
                      <p className="font-medium text-sm">{vendor.name}</p>
                      <p className="text-xs text-gray-500">
                        {vendor.performance.reliability}% reliability
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-1">
                    {hasConnection ? (
                      <Badge className="bg-green-100 text-green-800 text-xs">
                        Connected
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs px-2 py-1 h-auto"
                        onClick={() => openMembershipModal(vendor)}
                      >
                        Connect
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderRecommendationEngine = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-blue-500" />
          Smart Chef Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Procurement Insights */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 mb-2">🔍 Procurement Insights</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>• Bulk order rice to save 15%</span>
                <Badge variant="secondary">Cost Saving</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>• Fresh herbs from REWE this week</span>
                <Badge className="bg-green-100 text-green-800">Quality Pick</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>• Stock up before price increase</span>
                <Badge variant="destructive">Urgent</Badge>
              </div>
            </div>
          </div>

          {/* Chef's Menu Suggestions */}
          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg p-4">
            <h3 className="font-medium text-orange-800 mb-2">🍳 Chef's Menu Suggestions</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>• Summer Gazpacho (tomatoes in stock)</span>
                <Badge className="bg-green-100 text-green-800">Ready</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>• Risotto Special (rice available)</span>
                <Badge className="bg-green-100 text-green-800">Ready</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>• Spiced Chicken Curry</span>
                <Badge className="bg-yellow-100 text-yellow-800">Order Spices</Badge>
              </div>
            </div>
          </div>

          {/* Ingredient Intelligence */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 mb-2">🧠 Ingredient Intelligence</h3>
            <div className="space-y-2 text-sm text-blue-700">
              <p>• Fresh tomatoes peak ripeness - perfect for caprese</p>
              <p>• Basmati rice quality excellent at REWE this week</p>
              <p>• Consider stocking premium olive oil for summer dishes</p>
            </div>
          </div>

          {/* Kitchen Optimization */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-medium text-green-800 mb-2">⚡ Kitchen Optimization</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-green-600" />
                <span className="text-sm">Prep vegetables in bulk: Save 2hrs daily</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-green-600" />
                <span className="text-sm">Order meat in larger portions: Save €120/month</span>
              </div>
            </div>
          </div>

          {/* Seasonal Menu Planning */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="font-medium text-purple-800 mb-2">📅 Seasonal Planning</h3>
            <div className="space-y-1 text-sm text-purple-700">
              <p>🌟 <strong>This Week:</strong> Stone fruits in season</p>
              <p>📈 <strong>Trending:</strong> Light Mediterranean dishes</p>
              <p>🍂 <strong>Next Month:</strong> Plan autumn menu transitions</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button 
              size="sm" 
              variant="outline" 
              className="w-full"
              onClick={() => handleVendorComparison('Fresh Herbs')}
            >
              Compare Prices
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="w-full"
              onClick={() => setShowVendorSidebar(true)}
            >
              View Vendors
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderVendorMailbox = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-green-500" />
          Vendor Mailbox
          <Badge variant="secondary" className="ml-auto">
            {vendorEmails.length} emails
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {vendorEmails.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Mail className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No emails sent yet</p>
              <p className="text-sm">Purchase orders will automatically send emails to vendors</p>
            </div>
          ) : (
            <div className="space-y-3">
              {vendorEmails.map((email) => (
                <div key={email.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        email.status === 'sent' ? 'bg-blue-500' :
                        email.status === 'delivered' ? 'bg-orange-500' :
                        email.status === 'read' ? 'bg-green-500' : 'bg-gray-500'
                      }`} />
                      <div>
                        <p className="font-medium text-gray-900">{email.vendorName}</p>
                        <p className="text-sm text-gray-600">{email.vendorEmail}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={
                        email.status === 'sent' ? 'default' :
                        email.status === 'delivered' ? 'secondary' :
                        email.status === 'read' ? 'default' : 'outline'
                      } className={
                        email.status === 'read' ? 'bg-green-100 text-green-800' : ''
                      }>
                        {email.status}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(email.sentAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <p className="font-medium text-gray-800 mb-1">{email.subject}</p>
                    {email.orderNumber && (
                      <p className="text-sm text-blue-600 font-medium">Order: {email.orderNumber}</p>
                    )}
                  </div>
                  
                  <details className="group">
                    <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800 select-none">
                      View Email Content
                      <ChevronRight className="inline h-4 w-4 ml-1 transform group-open:rotate-90 transition-transform" />
                    </summary>
                    <div className="mt-3 p-3 bg-gray-50 rounded border text-sm whitespace-pre-line font-mono text-gray-700">
                      {email.content}
                    </div>
                  </details>
                  
                  {email.attachments && email.attachments.length > 0 && (
                    <div className="mt-3 flex items-center gap-2">
                      <Paperclip className="h-4 w-4 text-gray-400" />
                      <div className="flex gap-2">
                        {email.attachments.map((attachment, index) => (
                          <span key={index} className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {attachment}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 space-y-6 bg-white min-h-screen">
      {/* Simplified Header */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-600 rounded-xl">
            <Package className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">SupplySync Agent</h1>
            <p className="text-lg text-gray-600">Smart Vendor & Supply Chain Management</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Main Vendor Overview */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-700">
              <Store className="h-5 w-5" />
              <span className="font-medium">{managementVendors.length} Connected Vendors</span>
            </div>
          </div>
          
          <Button 
            onClick={() => setShowVendorSidebar(true)}
            variant="outline"
            className="border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            <ChevronRight className="h-4 w-4 mr-2" />
            Vendor Details
          </Button>
          
          <Button 
            onClick={analyzeSupplyChain}
            disabled={isAnalyzing}
            className="bg-blue-600 hover:bg-blue-700 px-6"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
            {isAnalyzing ? 'Analyzing...' : 'Refresh Analysis'}
          </Button>
        </div>
      </div>

      {/* Main Content - Unified View */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Left Column - Alerts & Actions */}
        <div className="xl:col-span-3 space-y-6">
          {renderRestockAlerts()}
          {renderVendorComparison()}
        </div>
        
        {/* Right Column - Recommendation Engine */}
        <div className="space-y-6">
          {renderRecommendationEngine()}
          {renderVendorMailbox()}
        </div>
      </div>

      {/* Membership Connection Modal */}
      <Dialog open={showMembershipModal} onOpenChange={setShowMembershipModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedVendorForMembership?.logo && (
                <Image
                  src={selectedVendorForMembership.logo}
                  alt={selectedVendorForMembership.name}
                  width={32}
                  height={32}
                  className="rounded object-contain"
                />
              )}
              Connect to {selectedVendorForMembership?.name}
            </DialogTitle>
            <DialogDescription>
              Enter your membership ID to connect and access purchase history from {selectedVendorForMembership?.name}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="membershipId">Membership ID</Label>
              <Input
                id="membershipId"
                placeholder={`Enter your ${selectedVendorForMembership?.name} membership ID`}
                value={membershipInput}
                onChange={(e) => setMembershipInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && membershipInput.trim() && selectedVendorForMembership) {
                    connectMembership(selectedVendorForMembership.id, membershipInput);
                  }
                }}
              />
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded-full flex-shrink-0 mt-0.5"></div>
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Demo Mode Available</p>
                  <p>You can enter any membership ID to test the connection. Real API integration will validate actual membership IDs.</p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMembershipModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (membershipInput.trim() && selectedVendorForMembership) {
                  connectMembership(selectedVendorForMembership.id, membershipInput);
                }
              }}
              disabled={!membershipInput.trim() || isConnecting}
            >
              {isConnecting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Connect
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Purchase History Modal */}
      <Dialog open={showHistoryModal} onOpenChange={setShowHistoryModal}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedVendorHistory?.vendor.logo && (
                <Image
                  src={selectedVendorHistory.vendor.logo}
                  alt={selectedVendorHistory.vendor.name}
                  width={32}
                  height={32}
                  className="rounded object-contain"
                />
              )}
              Purchase History - {selectedVendorHistory?.vendor.name}
            </DialogTitle>
            <DialogDescription>
              {userMembershipIds[selectedVendorHistory?.vendor.id || ''] && (
                <Badge className="bg-green-100 text-green-800 mt-2">
                  Connected ID: {userMembershipIds[selectedVendorHistory?.vendor.id || '']}
                </Badge>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedVendorHistory?.history && selectedVendorHistory.history.length > 0 ? (
              <>
                <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Total Orders</p>
                    <p className="text-xl font-bold">{selectedVendorHistory.history.length}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Total Spent</p>
                    <p className="text-xl font-bold">
                      €{selectedVendorHistory.history.reduce((sum, h) => sum + h.amount, 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Avg Order</p>
                    <p className="text-xl font-bold">
                      €{(selectedVendorHistory.history.reduce((sum, h) => sum + h.amount, 0) / selectedVendorHistory.history.length).toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {selectedVendorHistory.history.map((order, index) => (
                    <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">{order.orderNumber}</p>
                          <p className="text-sm text-gray-600">{order.date}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">€{order.amount.toFixed(2)}</p>
                          <Badge 
                            className={order.status === 'Delivered' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                          >
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Items:</p>
                        <div className="flex flex-wrap gap-1">
                          {order.items.map((item: string, itemIndex: number) => (
                            <Badge key={itemIndex} variant="outline" className="text-xs">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingCart className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Purchase History</h3>
                <p className="text-gray-600">
                  No recent purchases found for this vendor. Start shopping to see your history here!
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHistoryModal(false)}>
              Close
            </Button>
            {selectedVendorHistory?.vendor.contactInfo.website && (
              <Button onClick={() => window.open(selectedVendorHistory.vendor.contactInfo.website, '_blank')}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Visit Store
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Vendor Sidebar */}
      <Dialog open={showVendorSidebar} onOpenChange={setShowVendorSidebar}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Store className="h-5 w-5 text-blue-600" />
              Vendor Overview
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <p className="text-sm text-gray-600">Total Vendors</p>
                <p className="text-2xl font-bold text-blue-600">{managementVendors.length}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Connected</p>
                <p className="text-2xl font-bold text-green-600">{Object.keys(userMembershipIds).length}</p>
              </div>
            </div>

            {/* Add New Vendor Button */}
            <div className="flex justify-center">
              <Button 
                onClick={() => {
                  resetAddVendorForm();
                  setShowAddVendorModal(true);
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add New Vendor
              </Button>
            </div>
            
            {/* Vendor List */}
            <div className="space-y-3">
              {managementVendors.map((vendor) => {
                const hasConnection = userMembershipIds[vendor.id];
                return (
                  <div key={vendor.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {vendor.logo && (
                          <Image
                            src={vendor.logo}
                            alt={vendor.name}
                            width={40}
                            height={40}
                            className="rounded object-contain"
                          />
                        )}
                        <div>
                          <p className="font-medium">{vendor.name}</p>
                          <p className="text-sm text-gray-500">
                            {vendor.performance.reliability}% reliability
                          </p>
                        </div>
                      </div>
                      
                      {hasConnection ? (
                        <Badge className="bg-green-100 text-green-800">
                          Connected
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openMembershipModal(vendor)}
                        >
                          Connect
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                      <div>Quality: {vendor.performance.qualityScore}%</div>
                      <div>Price: {vendor.performance.priceCompetitiveness}%</div>
                      <div>Delivery: {vendor.performance.deliveryTime}%</div>
                      <div>Response: {vendor.performance.responseTime}%</div>
                    </div>
                    
                    <div className="flex gap-2 mt-3">
                      {hasConnection && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => openHistoryModal(vendor.id)}
                        >
                          <History className="h-3 w-3 mr-1" />
                          History
                        </Button>
                      )}
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleVendorComparison('All Items')}
                      >
                        <BarChart3 className="h-3 w-3 mr-1" />
                        Prices
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Price Comparison Modal */}
      <Dialog open={showPriceComparison} onOpenChange={setShowPriceComparison}>
        <DialogContent className="sm:max-w-6xl max-h-[85vh] overflow-y-auto">
          <DialogHeader className="pb-2">
            <DialogTitle className="flex items-center gap-3 text-lg">
              <BarChart3 className="h-4 w-4 text-blue-600" />
              Price Comparison - {comparisonItem}
            </DialogTitle>
            <DialogDescription className="text-sm">
              Compare vendors based on different parameters for the best deals.
            </DialogDescription>
          </DialogHeader>
          
          {/* Comparison Filter Buttons */}
          <div className="flex gap-2 p-4 bg-gray-50 rounded-lg border">
            <span className="text-sm font-medium text-gray-700 self-center mr-2">Compare by:</span>
            {[
              { id: 'price', label: 'Best Price', icon: '💰' },
              { id: 'delivery', label: 'Best Delivery', icon: '🚚' },
              { id: 'quality', label: 'Best Quality', icon: '⭐' },
              { id: 'reliability', label: 'Best Reliability', icon: '🎯' },
              { id: 'overall', label: 'Overall Best', icon: '🏆' }
            ].map((filter) => (
              <Button
                key={filter.id}
                size="sm"
                variant={comparisonFilter === filter.id ? 'default' : 'outline'}
                onClick={() => setComparisonFilter(filter.id as any)}
                className="flex items-center gap-1 text-xs"
              >
                <span>{filter.icon}</span>
                {filter.label}
              </Button>
            ))}
          </div>
          
          <div className="space-y-4 pb-4">
            {priceComparisonData.length > 0 ? (
              <div className="grid grid-cols-5 gap-4">
                {getSortedComparisonData(priceComparisonData, comparisonFilter).map((item, index) => (
                  <div key={item.vendorId} className={`border rounded-lg p-4 transition-all ${index === 0 ? 'border-green-500 bg-green-50 shadow-lg' : 'border-gray-200 bg-white hover:shadow-md'}`}>
                    {/* Best Badge for top vendor */}
                    {index === 0 && (
                      <div className="text-center mb-3">
                        <Badge className="bg-green-600 text-white text-xs px-2 py-1">
                          {getComparisonFilterIcon(comparisonFilter)} Best {comparisonFilter === 'price' ? 'Price' : 
                           comparisonFilter === 'delivery' ? 'Delivery' : 
                           comparisonFilter === 'quality' ? 'Quality' : 
                           comparisonFilter === 'reliability' ? 'Reliability' : 'Overall'}
                        </Badge>
                      </div>
                    )}
                    
                    {/* Vendor Logo & Name */}
                    <div className="text-center mb-4">
                      {item.vendorLogo && (
                        <Image
                          src={item.vendorLogo}
                          alt={item.vendorName}
                          width={48}
                          height={48}
                          className="rounded object-contain mx-auto mb-2"
                        />
                      )}
                      <div className="font-semibold text-sm text-gray-900 mb-1">{item.vendorName}</div>
                      <div className="flex items-center justify-center gap-1">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${i < Math.floor(item.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-gray-600 ml-1">({item.reliability}%)</span>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="text-center mb-4">
                      <div className={`text-2xl font-bold mb-1 ${index === 0 ? 'text-green-700' : 'text-gray-800'}`}>
                        €{item.price.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-600">per {item.unit}</div>
                    </div>

                    {/* Availability & Delivery */}
                    <div className="text-center mb-4">
                      <Badge className={`text-xs mb-2 ${item.availability === 'In Stock' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {item.availability}
                      </Badge>
                      <div className="flex items-center justify-center text-xs text-gray-600">
                        <span className="mr-1">🚚</span>
                        {item.deliveryTime}
                      </div>
                    </div>

                    {/* Order Info */}
                    <div className="border-t pt-3">
                      <div className="text-xs text-gray-700 text-center mb-3">
                        Min Order: €{item.minOrder}
                      </div>
                      <div className="space-y-2">
                        <Button size="sm" className="w-full text-xs" variant={index === 0 ? 'default' : 'outline'}>
                          <ShoppingCart className="h-3 w-3 mr-1" />
                          Order Now
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-full text-xs"
                          onClick={() => handleViewVendorDetails(item)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Loading price comparison...</p>
              </div>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setShowPriceComparison(false)} className="text-sm">
              Close
            </Button>
            <Button onClick={() => {
              // Add to cart or generate order for best price
              const bestOption = priceComparisonData[0];
              if (bestOption) {
                alert(`Added ${comparisonItem} from ${bestOption.vendorName} (€${bestOption.price.toFixed(2)}) to order list!`);
              }
            }} className="text-sm">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Order Best Price
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Vendor Details Modal */}
      <Dialog open={showVendorDetails} onOpenChange={setShowVendorDetails}>
        <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader className="pb-4">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <Store className="h-5 w-5 text-blue-600" />
              Vendor Details - {selectedVendorDetails?.vendorName}
            </DialogTitle>
            <DialogDescription className="text-sm">
              Complete vendor information and performance metrics
            </DialogDescription>
          </DialogHeader>
          
          {selectedVendorDetails && (
            <div className="space-y-6">
              {/* Header Section with Logo and Basic Info */}
              <div className="flex items-start gap-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border">
                <div className="flex-shrink-0">
                  {selectedVendorDetails.vendorLogo ? (
                    <Image
                      src={selectedVendorDetails.vendorLogo}
                      alt={selectedVendorDetails.vendorName}
                      width={80}
                      height={80}
                      className="rounded-lg object-contain border-2 border-white shadow-md"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Store className="h-10 w-10 text-blue-600" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedVendorDetails.vendorName}</h3>
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-5 w-5 ${i < Math.floor(selectedVendorDetails.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                        />
                      ))}
                      <span className="ml-2 text-lg font-semibold text-gray-700">
                        {selectedVendorDetails.rating?.toFixed(1)} / 5.0
                      </span>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      {selectedVendorDetails.reliability}% Reliable
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-gray-600">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {selectedVendorDetails.location}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {selectedVendorDetails.businessHours}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    €{selectedVendorDetails.price?.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">per {selectedVendorDetails.unit}</div>
                  <Badge className={`mt-2 ${selectedVendorDetails.availability === 'In Stock' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {selectedVendorDetails.availability}
                  </Badge>
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Contact Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedVendorDetails.contact?.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{selectedVendorDetails.contact.email}</span>
                      </div>
                    )}
                    {selectedVendorDetails.contact?.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{selectedVendorDetails.contact.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{selectedVendorDetails.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{selectedVendorDetails.businessHours}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Order Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4" />
                      Order Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Minimum Order:</span>
                      <span className="text-sm font-medium">€{selectedVendorDetails.minOrder}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Delivery Time:</span>
                      <span className="text-sm font-medium">{selectedVendorDetails.deliveryTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Payment Terms:</span>
                      <span className="text-sm font-medium">{selectedVendorDetails.paymentTerms}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Availability:</span>
                      <Badge className={`${selectedVendorDetails.availability === 'In Stock' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {selectedVendorDetails.availability}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Performance Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Performance Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Quality Score</span>
                        <span>{selectedVendorDetails.performance?.qualityScore}%</span>
                      </div>
                      <Progress value={selectedVendorDetails.performance?.qualityScore} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Delivery Performance</span>
                        <span>{selectedVendorDetails.performance?.deliveryPerformance}%</span>
                      </div>
                      <Progress value={selectedVendorDetails.performance?.deliveryPerformance} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Reliability</span>
                        <span>{selectedVendorDetails.reliability}%</span>
                      </div>
                      <Progress value={selectedVendorDetails.reliability} className="h-2" />
                    </div>
                  </CardContent>
                </Card>

                {/* Specialties and Certifications */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      Specialties & Certifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedVendorDetails.specialties && selectedVendorDetails.specialties.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Specialties:</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedVendorDetails.specialties.map((specialty: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedVendorDetails.certifications && selectedVendorDetails.certifications.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Certifications:</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedVendorDetails.certifications.map((cert: string, index: number) => (
                            <Badge key={index} className="bg-blue-100 text-blue-800 text-xs">
                              {cert}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedVendorDetails.description && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Description:</h4>
                        <p className="text-sm text-gray-600">{selectedVendorDetails.description}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setShowVendorDetails(false)}>
              Close
            </Button>
            <Button onClick={() => {
              if (selectedVendorDetails) {
                alert(`Initiated order process with ${selectedVendorDetails.vendorName}!`);
                setShowVendorDetails(false);
              }
            }}>
              <ShoppingCart className="h-4 w-4 mr-2" />
              Place Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add New Vendor Modal */}
      <Dialog open={showAddVendorModal} onOpenChange={setShowAddVendorModal}>
        <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader className="pb-4">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <PlusCircle className="h-5 w-5 text-blue-600" />
              Add New Vendor
            </DialogTitle>
            <DialogDescription className="text-sm">
              Enter comprehensive vendor information to add them to your supply network
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Store className="h-4 w-4" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="vendor-name">Vendor Name *</Label>
                    <Input
                      id="vendor-name"
                      placeholder="Enter vendor name"
                      value={newVendorData.name}
                      onChange={(e) => setNewVendorData(prev => ({ ...prev, name: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="vendor-category">Category *</Label>
                    <select
                      id="vendor-category"
                      value={newVendorData.category}
                      onChange={(e) => setNewVendorData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full mt-1 p-2 border border-input rounded-md bg-background"
                    >
                      <option value="">Select category</option>
                      <option value="Food & Beverages">Food & Beverages</option>
                      <option value="Meat & Poultry">Meat & Poultry</option>
                      <option value="Dairy Products">Dairy Products</option>
                      <option value="Fresh Produce">Fresh Produce</option>
                      <option value="Bakery & Bread">Bakery & Bread</option>
                      <option value="Seafood">Seafood</option>
                      <option value="Beverages">Beverages</option>
                      <option value="Cleaning Supplies">Cleaning Supplies</option>
                      <option value="Kitchen Equipment">Kitchen Equipment</option>
                      <option value="Packaging">Packaging</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="vendor-notes">Description/Notes</Label>
                  <Textarea
                    id="vendor-notes"
                    placeholder="Enter vendor description, specialties, or additional notes"
                    value={newVendorData.notes}
                    onChange={(e) => setNewVendorData(prev => ({ ...prev, notes: e.target.value }))}
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Phone className="h-4 w-4" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="vendor-email">Email Address *</Label>
                    <Input
                      id="vendor-email"
                      type="email"
                      placeholder="vendor@example.com"
                      value={newVendorData.contactInfo.email}
                      onChange={(e) => setNewVendorData(prev => ({
                        ...prev,
                        contactInfo: { ...prev.contactInfo, email: e.target.value }
                      }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="vendor-phone">Phone Number *</Label>
                    <Input
                      id="vendor-phone"
                      placeholder="+49 123 456 7890"
                      value={newVendorData.contactInfo.phone}
                      onChange={(e) => setNewVendorData(prev => ({
                        ...prev,
                        contactInfo: { ...prev.contactInfo, phone: e.target.value }
                      }))}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="vendor-address">Address *</Label>
                  <Input
                    id="vendor-address"
                    placeholder="Enter full address including city and postal code"
                    value={newVendorData.contactInfo.address}
                    onChange={(e) => setNewVendorData(prev => ({
                      ...prev,
                      contactInfo: { ...prev.contactInfo, address: e.target.value }
                    }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="vendor-website">Website (Optional)</Label>
                  <Input
                    id="vendor-website"
                    placeholder="https://vendor-website.com"
                    value={newVendorData.contactInfo.website}
                    onChange={(e) => setNewVendorData(prev => ({
                      ...prev,
                      contactInfo: { ...prev.contactInfo, website: e.target.value }
                    }))}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Products & Services */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Package className="h-4 w-4" />
                  Products & Services
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="product-input">Add Products/Services</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="product-input"
                      placeholder="Enter product or service name"
                      value={newVendorProductInput}
                      onChange={(e) => setNewVendorProductInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddProduct()}
                    />
                    <Button
                      type="button"
                      onClick={handleAddProduct}
                      variant="outline"
                      disabled={!newVendorProductInput.trim()}
                    >
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {newVendorData.products.length > 0 && (
                  <div>
                    <Label>Added Products/Services:</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {newVendorData.products.map((product, index) => (
                        <Badge key={index} variant="outline" className="flex items-center gap-1">
                          {product}
                          <button
                            type="button"
                            onClick={() => handleRemoveProduct(product)}
                            className="ml-1 text-red-500 hover:text-red-700"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Business Terms */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-4 w-4" />
                  Business Terms
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="payment-terms">Payment Terms</Label>
                    <select
                      id="payment-terms"
                      value={newVendorData.paymentTerms}
                      onChange={(e) => setNewVendorData(prev => ({ ...prev, paymentTerms: e.target.value }))}
                      className="w-full mt-1 p-2 border border-input rounded-md bg-background"
                    >
                      <option value="">Select payment terms</option>
                      <option value="Cash on Delivery">Cash on Delivery</option>
                      <option value="15 days">15 days</option>
                      <option value="30 days">30 days</option>
                      <option value="45 days">45 days</option>
                      <option value="60 days">60 days</option>
                      <option value="90 days">90 days</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="delivery-radius">Delivery Radius</Label>
                    <Input
                      id="delivery-radius"
                      placeholder="e.g., 50km, Local, Regional"
                      value={newVendorData.deliveryRadius}
                      onChange={(e) => setNewVendorData(prev => ({ ...prev, deliveryRadius: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="minimum-order">Minimum Order (€)</Label>
                    <Input
                      id="minimum-order"
                      type="number"
                      placeholder="100"
                      value={newVendorData.minimumOrder || ''}
                      onChange={(e) => setNewVendorData(prev => ({ ...prev, minimumOrder: Number(e.target.value) || 0 }))}
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <DialogFooter className="pt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowAddVendorModal(false);
                resetAddVendorForm();
              }}
              disabled={isAddingVendor}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddNewVendor}
              disabled={isAddingVendor}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isAddingVendor ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Adding Vendor...
                </>
              ) : (
                <>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Vendor
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
