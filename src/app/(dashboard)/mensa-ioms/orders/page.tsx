"use client";

import { AppLayout } from "@/shared/components/layout/AppLayout";
import { useState, useEffect } from "react";
import {
  ShoppingCart,
  Search,
  Filter,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Package,
  Users,
  TrendingUp,
  FileText,
  Download,
  Eye,
  MoreVertical,
  ClipboardList,
  Building2,
  Mail,
  Phone,
  MapPin,
  Save,
  X,
  Loader2,
  QrCode,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/server/lib/utils";
import { QRScanner } from "./components/QRScanner";
import { getPilotOrders, seedMensaPilotData } from "@/features/mensa-pilot/pilotData";

interface Order {
  id: string;
  orderNumber: string;
  institution: string;
  date: string;
  time: string;
  status: string;
  items: number;
  itemNames: string;
  total: string;
  studentEmail?: string;
  studentId?: string;
  paymentMethod?: string;
  transactionId?: string;
  source?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function MensaOrdersPage() {
  const [activeTab, setActiveTab] = useState<'pre-order' | 'create-new'>('pre-order');
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scannedQRCode, setScannedQRCode] = useState<string | null>(null);
  const isMensaPilot = process.env.NEXT_PUBLIC_MENSA_PILOT === 'true';

  useEffect(() => {
    if (!isMensaPilot) return;
    const userId = typeof window !== 'undefined' ? (localStorage.getItem('userId') || 'default_user') : 'default_user';
    seedMensaPilotData(userId);
    setOrders(getPilotOrders(userId));
    setIsLoading(false);
  }, [isMensaPilot]);

  // Fetch scheduled orders from API
  useEffect(() => {
    if (isMensaPilot) return;
    const fetchOrders = async () => {
      if (activeTab !== 'pre-order') return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const params = new URLSearchParams();
        if (statusFilter !== 'all') {
          params.append('status', statusFilter);
        }
        if (searchQuery) {
          params.append('search', searchQuery);
        }

        const response = await fetch(`/api/mensa-orders/scheduled?${params.toString()}`);
        const data = await response.json();

        if (data.success) {
          setOrders(data.data || []);
        } else {
          setError(data.message || 'Failed to fetch orders');
          setOrders([]);
        }
      } catch (err: any) {
        console.error('Error fetching orders:', err);
        setError(err.message || 'Failed to fetch orders');
        setOrders([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [activeTab, statusFilter, searchQuery]);

  // Filter orders client-side (additional filtering if needed)
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.institution.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.itemNames.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    
    const styles: Record<string, string> = {
      scheduled: "bg-blue-50 text-blue-700 border-blue-200",
      pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
      processing: "bg-indigo-50 text-indigo-700 border-indigo-200",
      completed: "bg-green-50 text-green-700 border-green-200",
      cancelled: "bg-red-50 text-red-700 border-red-200",
      confirmed: "bg-green-50 text-green-700 border-green-200",
      ready: "bg-emerald-50 text-emerald-700 border-emerald-200",
    };

    const labels: Record<string, string> = {
      scheduled: "Scheduled",
      pending: "Pending",
      processing: "Processing",
      completed: "Completed",
      cancelled: "Cancelled",
      confirmed: "Confirmed",
      ready: "Ready",
    };

    const style = styles[statusLower] || "bg-gray-50 text-gray-700 border-gray-200";
    const label = labels[statusLower] || status;

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-bold border ${style}`}
      >
        {label}
      </span>
    );
  };

  // Format time for display
  const formatTime = (time: string) => {
    if (!time) return '';
    // If time is in HH:MM:SS format, convert to HH:MM AM/PM
    if (time.includes(':')) {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    }
    return time;
  };

  // Format number in German metric system (replace '.' with ',')
  const formatGermanNumber = (value: string | number, decimals: number = 2): string => {
    if (!value && value !== 0) return '';
    
    // If it's already a string with German format, just ensure proper decimals
    if (typeof value === 'string') {
      // Remove currency symbols and whitespace
      let cleanValue = value.replace(/€/g, '').trim();
      
      // Replace comma with period for parsing (in case it's already in German format)
      cleanValue = cleanValue.replace(',', '.');
      
      const numValue = parseFloat(cleanValue);
      
      if (!isNaN(numValue)) {
        // Format with specified decimals and replace '.' with ','
        return numValue.toFixed(decimals).replace('.', ',');
      }
      
      // If parsing failed, try to extract number from string
      const match = cleanValue.match(/[\d.]+/);
      if (match) {
        const extracted = parseFloat(match[0]);
        if (!isNaN(extracted)) {
          return extracted.toFixed(decimals).replace('.', ',');
        }
      }
      
      return value; // Return original if we can't parse
    }
    
    // If it's a number, format directly
    return value.toFixed(decimals).replace('.', ',');
  };

  // Format currency value in German format
  const formatGermanCurrency = (value: string | number): string => {
    // Extract numeric value and format it
    let numericValue: number;
    
    if (typeof value === 'string') {
      // Remove currency symbols and whitespace, replace comma with period for parsing
      const cleanValue = value.replace(/€/g, '').trim().replace(',', '.');
      numericValue = parseFloat(cleanValue);
      
      if (isNaN(numericValue)) {
        // If we can't parse, try to extract number
        const match = value.match(/[\d.,]+/);
        if (match) {
          numericValue = parseFloat(match[0].replace(',', '.'));
        } else {
          return value; // Return original if we can't parse
        }
      }
    } else {
      numericValue = value;
    }
    
    // Format with 2 decimals and replace '.' with ','
    const formatted = numericValue.toFixed(2).replace('.', ',');
    return `€${formatted}`;
  };

  // Handle QR code scan success
  const handleQRScanSuccess = async (decodedText: string) => {
    setScannedQRCode(decodedText);
    setShowQRScanner(false);

    try {
      // Parse QR code data - it might be JSON or just the order number
      let orderNumber: string;
      
      try {
        // Try to parse as JSON first
        const qrData = JSON.parse(decodedText);
        orderNumber = qrData.orderNumber || qrData.order_id || decodedText;
      } catch {
        // If not JSON, assume the QR code contains the order number directly
        orderNumber = decodedText.trim();
      }

      // Validate order number format (basic check)
      if (!orderNumber || orderNumber.length < 3) {
        alert('Invalid QR code: Order number not found or too short');
        return;
      }

      // Update order status from scheduled to completed
      const response = await fetch('/api/mensa-orders/update-status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderNumber: orderNumber,
          status: 'completed',
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Refresh orders list to show updated status
        const params = new URLSearchParams();
        if (statusFilter !== 'all') {
          params.append('status', statusFilter);
        }
        if (searchQuery) {
          params.append('search', searchQuery);
        }

        const ordersResponse = await fetch(`/api/mensa-orders/scheduled?${params.toString()}`);
        const ordersData = await ordersResponse.json();

        if (ordersData.success) {
          setOrders(ordersData.data || []);
        }

        // The success message will be shown in the green banner
      } else {
        // Show error message
        const errorMsg = data.error || data.message || 'Failed to update order status';
        alert(`Error: ${errorMsg}`);
        setScannedQRCode(null); // Clear the scanned code on error
      }
    } catch (error: any) {
      console.error('Error processing QR code:', error);
      alert(`Error processing QR code: ${error.message || 'Unknown error'}`);
    }
  };

  // Create New Order Form State
  const [newOrder, setNewOrder] = useState({
    institution: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    deliveryDate: "",
    deliveryTime: "",
    notes: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setNewOrder((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateOrder = () => {
    // TODO: Implement order creation logic
    console.log("Creating order:", newOrder);
    alert("Order creation functionality will be implemented");
  };

  const stats = {
    total: orders.length,
    scheduled: orders.filter((o) => o.status?.toLowerCase() === "scheduled").length,
    pending: orders.filter((o) => o.status?.toLowerCase() === "pending").length,
    processing: orders.filter((o) => o.status?.toLowerCase() === "processing").length,
    completed: orders.filter((o) => o.status?.toLowerCase() === "completed" || o.status?.toLowerCase() === "confirmed").length,
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#F5F5F7] p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-headline font-black text-wm-blue mb-2">
                Mensa Orders
              </h1>
              <p className="text-gray-600">
                Manage and track orders for Mensa clients
              </p>
            </div>
            <button
              onClick={() => setShowQRScanner(!showQRScanner)}
              className="flex items-center gap-2 px-6 py-3 bg-wm-teal hover:bg-[#238b7e] text-white font-bold rounded-xl transition-colors shadow-lg hover:shadow-xl"
            >
              <QrCode className="w-5 h-5" />
              {showQRScanner ? 'Hide' : 'Scan'} QR Code
            </button>
          </div>

          {/* Stats Cards - Only show on Pre-Order tab */}
          {activeTab === 'pre-order' && !isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-gray-600">Total Orders</span>
                  <ShoppingCart className="w-5 h-5 text-wm-blue" />
                </div>
                <p className="text-3xl font-black text-wm-blue">{stats.total}</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-gray-600">Scheduled</span>
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-3xl font-black text-blue-600">{stats.scheduled || 0}</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-gray-600">Processing</span>
                  <Package className="w-5 h-5 text-indigo-600" />
                </div>
                <p className="text-3xl font-black text-indigo-600">{stats.processing}</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-gray-600">Completed</span>
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-3xl font-black text-green-600">{stats.completed}</p>
              </div>
            </div>
          )}
        </div>

        {/* QR Scanner Section */}
        {showQRScanner && (
          <div className="mb-6">
            <QRScanner
              onScanSuccess={handleQRScanSuccess}
              onClose={() => setShowQRScanner(false)}
            />
          </div>
        )}

        {/* Scanned QR Code Result */}
        {scannedQRCode && !showQRScanner && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <span className="font-bold text-green-700 block">QR Code Scanned Successfully</span>
                  <span className="text-sm text-green-600 font-mono">{scannedQRCode}</span>
                  <span className="text-xs text-green-500 block mt-1">Order status updated to Completed</span>
                </div>
              </div>
              <button
                onClick={() => setScannedQRCode(null)}
                className="p-1 hover:bg-green-100 rounded transition-colors"
              >
                <X className="w-4 h-4 text-green-600" />
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('pre-order')}
              className={cn(
                "flex-1 px-6 py-4 font-bold text-sm transition-colors relative",
                activeTab === 'pre-order'
                  ? "text-wm-blue border-b-2 border-wm-blue"
                  : "text-gray-600 hover:text-wm-blue"
              )}
            >
              <div className="flex items-center justify-center gap-2">
                <ClipboardList className="w-5 h-5" />
                <span>Pre-Order</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('create-new')}
              className={cn(
                "flex-1 px-6 py-4 font-bold text-sm transition-colors relative",
                activeTab === 'create-new'
                  ? "text-wm-blue border-b-2 border-wm-blue"
                  : "text-gray-600 hover:text-wm-blue"
              )}
            >
              <div className="flex items-center justify-center gap-2">
                <Plus className="w-5 h-5" />
                <span>Create New Order</span>
              </div>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'pre-order' && (
          <>
            {/* Filters and Search */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by order number, pickup location, or items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-wm-blue focus:border-transparent text-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-gray-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-wm-blue focus:border-transparent text-sm font-bold"
                  >
                <option value="all">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="confirmed">Confirmed</option>
                <option value="ready">Ready</option>
                <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-enterprise overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-wm-blue">Scheduled Orders</h2>
              </div>
              {isLoading ? (
                <div className="p-12 text-center">
                  <Loader2 className="w-12 h-12 animate-spin text-wm-blue mx-auto mb-4" />
                  <p className="text-gray-500 font-bold">Loading orders...</p>
                </div>
              ) : error ? (
                <div className="p-12 text-center">
                  <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <p className="text-red-500 font-bold">Error loading orders</p>
                  <p className="text-sm text-gray-500 mt-2">{error}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                          Order Number
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                          Pickup Location
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                          Scheduled Date & Time
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                          Items
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                          Total
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredOrders.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center justify-center">
                              <ShoppingCart className="w-12 h-12 text-gray-300 mb-4" />
                              <p className="text-gray-500 font-bold">No orders found</p>
                              <p className="text-sm text-gray-400 mt-1">
                                {searchQuery || statusFilter !== 'all' 
                                  ? 'Try adjusting your search or filters'
                                  : 'No scheduled orders available'}
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredOrders.map((order) => (
                          <tr
                            key={order.id}
                            className="hover:bg-gray-50 transition-colors cursor-pointer"
                          >
                            <td className="px-6 py-4">
                              <span className="font-bold text-wm-blue">{order.orderNumber}</span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                <span className="font-medium text-gray-900">{order.institution}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <div>
                                  <span className="text-sm font-medium text-gray-900">{order.date}</span>
                                  <br />
                                  <span className="text-xs text-gray-500">{formatTime(order.time)}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div>
                                {order.itemNames ? (
                                  <>
                                    <span className="text-sm font-medium text-gray-900 block">
                                      {order.itemNames}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      ({order.items} {order.items === 1 ? 'item' : 'items'})
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-sm font-medium text-gray-900">
                                    {order.items} {order.items === 1 ? 'item' : 'items'}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-bold text-wm-blue">{formatGermanCurrency(order.total)}</span>
                            </td>
                            <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <button
                                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                  title="View Details"
                                >
                                  <Eye className="w-4 h-4 text-gray-600" />
                                </button>
                                <button
                                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                  title="More Options"
                                >
                                  <MoreVertical className="w-4 h-4 text-gray-600" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'create-new' && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-enterprise p-8">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-wm-blue mb-6">Create New Order</h2>
              
              <div className="space-y-6">
                {/* Institution Information */}
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-wm-blue mb-4 flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Institution Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Institution Name *
                      </label>
                      <input
                        type="text"
                        value={newOrder.institution}
                        onChange={(e) => handleInputChange('institution', e.target.value)}
                        placeholder="e.g., University Hospital Berlin"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-wm-blue focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Contact Person *
                      </label>
                      <input
                        type="text"
                        value={newOrder.contactPerson}
                        onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                        placeholder="e.g., Dr. Maria Schmidt"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-wm-blue focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email *
                      </label>
                      <input
                        type="email"
                        value={newOrder.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="contact@institution.de"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-wm-blue focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Phone *
                      </label>
                      <input
                        type="tel"
                        value={newOrder.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="+49 30 12345678"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-wm-blue focus:border-transparent"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Delivery Address *
                      </label>
                      <input
                        type="text"
                        value={newOrder.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        placeholder="Street Address, City, Postal Code"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-wm-blue focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Delivery Information */}
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-wm-blue mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Delivery Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Delivery Date *
                      </label>
                      <input
                        type="date"
                        value={newOrder.deliveryDate}
                        onChange={(e) => handleInputChange('deliveryDate', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-wm-blue focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Delivery Time *
                      </label>
                      <input
                        type="time"
                        value={newOrder.deliveryTime}
                        onChange={(e) => handleInputChange('deliveryTime', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-wm-blue focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Notes */}
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-wm-blue mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Additional Notes
                  </h3>
                  <textarea
                    value={newOrder.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Add any special instructions, dietary requirements, or notes for this order..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-wm-blue focus:border-transparent resize-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-4 pt-4">
                  <button
                    onClick={() => {
                      setNewOrder({
                        institution: "",
                        contactPerson: "",
                        email: "",
                        phone: "",
                        address: "",
                        deliveryDate: "",
                        deliveryTime: "",
                        notes: "",
                      });
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5" />
                    Clear Form
                  </button>
                  <button
                    onClick={handleCreateOrder}
                    className="flex items-center gap-2 px-6 py-3 bg-wm-blue hover:bg-[#23294a] text-white font-bold rounded-xl transition-colors shadow-lg hover:shadow-xl"
                  >
                    <Save className="w-5 h-5" />
                    Create Order
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

