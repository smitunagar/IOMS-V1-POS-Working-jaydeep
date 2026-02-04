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
import { procurementWorkflowService, QuotationRequest, OwnerApproval, PurchaseOrder } from '@/lib/procurementWorkflowService';

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
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Enhanced state management
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [managementVendors, setManagementVendors] = useState<VendorManagementVendor[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [quotationRequests, setQuotationRequests] = useState<QuotationRequest[]>([]);
  const [ownerApprovals, setOwnerApprovals] = useState<OwnerApproval[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [analytics, setAnalytics] = useState<ProcurementAnalytics | null>(null);
  
  // Modal states
  const [showAddVendorModal, setShowAddVendorModal] = useState(false);
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showVendorDetails, setShowVendorDetails] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<VendorManagementVendor | null>(null);
  const [selectedQuotation, setSelectedQuotation] = useState<QuotationRequest | null>(null);
  
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
    loadSupplyData();
    loadProcurementData();
  }, []);

  const loadProcurementData = async () => {
    try {
      // Load procurement workflow data
      const quotations = await procurementWorkflowService.getQuotationRequests();
      const approvals: any[] = []; // Owner approvals not implemented yet
      const orders = await procurementWorkflowService.getPurchaseOrders();
      
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
        membershipNumber: 'RW2024001'
      },
      {
        id: 'vendor_002',
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
        products: ['Organic Products', 'Local Specialties', 'Bakery Items', 'Deli Products'],
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
        membershipNumber: 'ED2024002'
      }
    ];
    
    setManagementVendors(managementVendorsData);
  };

  const calculateProcurementAnalytics = () => {
    const analyticsData: ProcurementAnalytics = {
      totalSpend: 45320.75,
      averageOrderValue: 385.50,
      onTimeDeliveryRate: 94.2,
      costSavings: 3250.80,
      vendorCount: managementVendors.length,
      activeQuotations: quotationRequests.filter(q => q.status === 'pending').length,
      pendingApprovals: ownerApprovals.length,
      completedOrders: purchaseOrders.filter(o => o.status === 'delivered').length
    };
    
    setAnalytics(analyticsData);
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
            <TabsTrigger value="vendors">Vendor Management</TabsTrigger>
            <TabsTrigger value="inventory">Inventory Monitor</TabsTrigger>
            <TabsTrigger value="quotations">Quotations</TabsTrigger>
            <TabsTrigger value="approvals">Approvals</TabsTrigger>
            <TabsTrigger value="orders">Purchase Orders</TabsTrigger>
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
                          Status: {quotation.status} | Requested: {quotation.requestedDate}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">Supplier: {quotation.supplierId}</p>
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
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Purchase Orders</h2>
              <p className="text-gray-600 mb-4">Complete purchase order management with tracking, delivery status, and vendor communication.</p>
              
              <div className="space-y-4">
                {purchaseOrders.map((order) => (
                  <div key={order.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">PO #{order.id.slice(-6)}</h4>
                        <p className="text-sm text-gray-600">
                          Status: {order.status} | Total: €{order.totalAmount}
                        </p>
                        <p className="text-sm text-gray-600">Supplier: {order.supplierId}</p>
                        <p className="text-sm text-gray-600">Created: {new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                      <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'}>
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
                {purchaseOrders.length === 0 && (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">No purchase orders yet</p>
                    <Button className="mt-4">Create First PO</Button>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
