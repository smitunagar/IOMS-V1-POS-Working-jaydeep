'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { AppLayout } from '@/shared/components/layout/AppLayout';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { useToast } from '@/shared/hooks/use-toast';
import { Switch } from '@/shared/components/ui/switch';
import { Separator } from '@/shared/components/ui/separator';
import { cn } from '@/server/lib/utils';
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Palette,
  Globe,
  Database,
  Save,
  CreditCard,
  Check,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';

interface SettingsData {
  personal: {
    name: string;
    email: string;
    phone: string;
    language: string;
    timezone: string;
  };
  restaurant: {
    name: string;
    address: string;
    phone: string;
    email: string;
    currency: string;
    taxRate: string;
  };
  notifications: {
    orderAlerts: boolean;
    lowStock: boolean;
    newReservation: boolean;
    emailNotifications: boolean;
  };
  display: {
    theme: string;
    compactMode: boolean;
    showImages: boolean;
  };
  payments: {
    acceptedMethods: string[];
    defaultMethod: string;
    quickAccess1: string;
    quickAccess2: string;
    amountPaidNotification: string;
    allowRefundProcessing: boolean;
    skipAmountPrompt: boolean;
    enableAdvancedCheckSplitting: boolean;
    allowOnlyWholeAmounts: boolean;
    deactivateAutoChangeCalculation: boolean;
    printFinalCheckAfterReceipt: boolean;
    captureSignatureOnTerminal: boolean;
    activateMoneyBackOnMealVouchers: boolean;
    enableTippingOnTerminal: boolean;
    allowTippingAtPayment: boolean;
    tipsProvidedAfterPayment: boolean;
    receiptLogo: string | null;
  };
}

export default function MensaIOMSSettingsPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const [activeSection, setActiveSection] = useState<'personal' | 'restaurant' | 'notifications' | 'display' | 'payments'>('personal');
  const [settings, setSettings] = useState<SettingsData>({
    personal: {
      name: currentUser?.name || '',
      email: currentUser?.email || '',
      phone: '',
      language: 'en',
      timezone: 'UTC',
    },
    restaurant: {
      name: 'My Institution',
      address: '',
      phone: '',
      email: '',
      currency: 'EUR',
      taxRate: '10',
    },
    notifications: {
      orderAlerts: true,
      lowStock: true,
      newReservation: true,
      emailNotifications: false,
    },
    display: {
      theme: 'light',
      compactMode: false,
      showImages: true,
    },
    payments: {
      acceptedMethods: ['cash', 'creditCard'],
      defaultMethod: 'cash',
      quickAccess1: 'creditCard',
      quickAccess2: 'tapToPay',
      amountPaidNotification: 'dontShow',
      allowRefundProcessing: false,
      skipAmountPrompt: false,
      enableAdvancedCheckSplitting: false,
      allowOnlyWholeAmounts: false,
      deactivateAutoChangeCalculation: false,
      printFinalCheckAfterReceipt: true,
      captureSignatureOnTerminal: true,
      activateMoneyBackOnMealVouchers: false,
      enableTippingOnTerminal: false,
      allowTippingAtPayment: false,
      tipsProvidedAfterPayment: false,
      receiptLogo: null,
    },
  });

  // Load settings from localStorage with mensa prefix
  useEffect(() => {
    try {
      const userId = currentUser?.id || 'default_user';
      const settingsKey = `mensa_ioms_settings_${userId}`;
      const storedSettings = localStorage.getItem(settingsKey);
      
      if (storedSettings) {
        const parsed = JSON.parse(storedSettings);
        setSettings({
          ...settings,
          ...parsed,
          personal: {
            ...settings.personal,
            ...parsed.personal,
            name: currentUser?.name || parsed.personal?.name || '',
            email: currentUser?.email || parsed.personal?.email || '',
          },
          payments: {
            ...settings.payments,
            ...parsed.payments,
          },
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }, [currentUser]);

  const handleSaveSettings = () => {
    try {
      const userId = currentUser?.id || 'default_user';
      const settingsKey = `mensa_ioms_settings_${userId}`;
      localStorage.setItem(settingsKey, JSON.stringify(settings));

      toast({
        title: 'Success',
        description: 'Settings saved successfully!',
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const sections = [
    {
      id: 'personal' as const,
      label: 'Personal',
      icon: User,
    },
    {
      id: 'restaurant' as const,
      label: 'Institution',
      icon: Globe,
    },
    {
      id: 'notifications' as const,
      label: 'Notifications',
      icon: Bell,
    },
    {
      id: 'payments' as const,
      label: 'Payments',
      icon: CreditCard,
    },
    {
      id: 'display' as const,
      label: 'Display',
      icon: Palette,
    },
  ];

  return (
    <AppLayout pageTitle="Settings">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gray-100 rounded-xl">
              <SettingsIcon className="h-8 w-8 text-gray-700" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600">Manage your account and system preferences</p>
            </div>
          </div>

          {/* Horizontal Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex gap-1">
              {sections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={cn(
                      "group flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-all border-b-2 -mb-px",
                      isActive
                        ? "border-gray-900 text-gray-900"
                        : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{section.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <Card className="shadow-sm rounded-xl overflow-hidden border border-gray-200">
          <CardContent className="p-6">
            {/* Personal Settings */}
            {activeSection === 'personal' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Personal Information
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="personal-name">Full Name</Label>
                        <Input
                          id="personal-name"
                          value={settings.personal.name}
                          onChange={(e) => setSettings({
                            ...settings,
                            personal: { ...settings.personal, name: e.target.value }
                          })}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="personal-phone">Phone Number</Label>
                        <Input
                          id="personal-phone"
                          type="tel"
                          value={settings.personal.phone}
                          onChange={(e) => setSettings({
                            ...settings,
                            personal: { ...settings.personal, phone: e.target.value }
                          })}
                          placeholder="+1234567890"
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="personal-email">Email Address</Label>
                      <Input
                        id="personal-email"
                        type="email"
                        value={settings.personal.email}
                        onChange={(e) => setSettings({
                          ...settings,
                          personal: { ...settings.personal, email: e.target.value }
                        })}
                        className="mt-1"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="language">Language</Label>
                        <Select
                          value={settings.personal.language}
                          onValueChange={(value) => setSettings({
                            ...settings,
                            personal: { ...settings.personal, language: value }
                          })}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="es">Spanish</SelectItem>
                            <SelectItem value="fr">French</SelectItem>
                            <SelectItem value="de">German</SelectItem>
                            <SelectItem value="it">Italian</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="timezone">Timezone</Label>
                        <Select
                          value={settings.personal.timezone}
                          onValueChange={(value) => setSettings({
                            ...settings,
                            personal: { ...settings.personal, timezone: value }
                          })}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="UTC">UTC</SelectItem>
                            <SelectItem value="America/New_York">Eastern Time</SelectItem>
                            <SelectItem value="America/Chicago">Central Time</SelectItem>
                            <SelectItem value="America/Denver">Mountain Time</SelectItem>
                            <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                            <SelectItem value="Europe/London">London</SelectItem>
                            <SelectItem value="Europe/Paris">Paris</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Restaurant/Institution Settings */}
            {activeSection === 'restaurant' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Institution Information
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="restaurant-name">Institution Name</Label>
                      <Input
                        id="restaurant-name"
                        value={settings.restaurant.name}
                        onChange={(e) => setSettings({
                          ...settings,
                          restaurant: { ...settings.restaurant, name: e.target.value }
                        })}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="restaurant-address">Address</Label>
                      <Input
                        id="restaurant-address"
                        value={settings.restaurant.address}
                        onChange={(e) => setSettings({
                          ...settings,
                          restaurant: { ...settings.restaurant, address: e.target.value }
                        })}
                        placeholder="123 Main St, City, Country"
                        className="mt-1"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="restaurant-phone">Phone Number</Label>
                        <Input
                          id="restaurant-phone"
                          type="tel"
                          value={settings.restaurant.phone}
                          onChange={(e) => setSettings({
                            ...settings,
                            restaurant: { ...settings.restaurant, phone: e.target.value }
                          })}
                          placeholder="+1234567890"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="restaurant-email">Email</Label>
                        <Input
                          id="restaurant-email"
                          type="email"
                          value={settings.restaurant.email}
                          onChange={(e) => setSettings({
                            ...settings,
                            restaurant: { ...settings.restaurant, email: e.target.value }
                          })}
                          placeholder="info@institution.com"
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="currency">Currency</Label>
                        <Select
                          value={settings.restaurant.currency}
                          onValueChange={(value) => setSettings({
                            ...settings,
                            restaurant: { ...settings.restaurant, currency: value }
                          })}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="EUR">EUR (€)</SelectItem>
                            <SelectItem value="USD">USD ($)</SelectItem>
                            <SelectItem value="GBP">GBP (£)</SelectItem>
                            <SelectItem value="INR">INR (₹)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="tax-rate">Tax Rate (%)</Label>
                        <Input
                          id="tax-rate"
                          type="number"
                          step="0.1"
                          value={settings.restaurant.taxRate}
                          onChange={(e) => setSettings({
                            ...settings,
                            restaurant: { ...settings.restaurant, taxRate: e.target.value }
                          })}
                          placeholder="10"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notification Settings */}
            {activeSection === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notification Preferences
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-gray-200">
                      <div>
                        <Label className="font-medium">Order Alerts</Label>
                        <p className="text-xs text-gray-600 mt-1">
                          Get notified when new orders are placed
                        </p>
                      </div>
                      <Switch
                        checked={settings.notifications.orderAlerts}
                        onCheckedChange={(checked) => setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, orderAlerts: checked }
                        })}
                      />
                    </div>

                    <div className="flex items-center justify-between py-3 border-b border-gray-200">
                      <div>
                        <Label className="font-medium">Low Stock Alerts</Label>
                        <p className="text-xs text-gray-600 mt-1">
                          Get notified when inventory items run low
                        </p>
                      </div>
                      <Switch
                        checked={settings.notifications.lowStock}
                        onCheckedChange={(checked) => setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, lowStock: checked }
                        })}
                      />
                    </div>

                    <div className="flex items-center justify-between py-3 border-b border-gray-200">
                      <div>
                        <Label className="font-medium">New Reservations</Label>
                        <p className="text-xs text-gray-600 mt-1">
                          Get notified when new reservations are made
                        </p>
                      </div>
                      <Switch
                        checked={settings.notifications.newReservation}
                        onCheckedChange={(checked) => setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, newReservation: checked }
                        })}
                      />
                    </div>

                    <div className="flex items-center justify-between py-3">
                      <div>
                        <Label className="font-medium">Email Notifications</Label>
                        <p className="text-xs text-gray-600 mt-1">
                          Receive email notifications for important events
                        </p>
                      </div>
                      <Switch
                        checked={settings.notifications.emailNotifications}
                        onCheckedChange={(checked) => setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, emailNotifications: checked }
                        })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payments Settings - Same as regular settings */}
            {activeSection === 'payments' && (
              <div className="space-y-8">
                {/* Accepted Payment Methods */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Accepted payment methods</h3>
                  <p className="text-xs text-gray-600 mb-4">Select payment methods</p>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { id: 'cash', label: 'Cash' },
                      { id: 'invoice', label: 'Invoice' },
                      { id: 'creditCard', label: 'Credit Card' },
                      { id: 'terminal', label: 'Terminal' },
                      { id: 'manualEntry', label: 'Manual Entry' },
                      { id: 'tapToPay', label: 'Tap to Pay' },
                    ].map((method) => (
                      <button
                        key={method.id}
                        onClick={() => {
                          const currentMethods = settings.payments.acceptedMethods;
                          const newMethods = currentMethods.includes(method.id)
                            ? currentMethods.filter((m) => m !== method.id)
                            : [...currentMethods, method.id];
                          setSettings({
                            ...settings,
                            payments: { ...settings.payments, acceptedMethods: newMethods },
                          });
                        }}
                        className={cn(
                          "px-5 py-2.5 rounded-xl border text-sm font-medium transition-all",
                          settings.payments.acceptedMethods.includes(method.id)
                            ? "bg-blue-50 border-blue-500 text-blue-700 shadow-sm"
                            : "bg-white border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50"
                        )}
                      >
                        {method.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Payment Screen Configuration */}
                <div className="space-y-2">
                  <p className="text-xs text-gray-600">
                    Choose the payment method that will be selected by default when opening the payment screen.
                  </p>
                  <div className="flex items-center gap-4">
                    <Label className="text-sm font-medium w-40">Default method</Label>
                    <Select
                      value={settings.payments.defaultMethod}
                      onValueChange={(value) =>
                        setSettings({
                          ...settings,
                          payments: { ...settings.payments, defaultMethod: value },
                        })
                      }
                    >
                      <SelectTrigger className="w-56">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="creditCard">Credit Card</SelectItem>
                        <SelectItem value="invoice">Invoice</SelectItem>
                        <SelectItem value="terminal">Terminal</SelectItem>
                        <SelectItem value="manualEntry">Manual Entry</SelectItem>
                        <SelectItem value="tapToPay">Tap to Pay</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Main Screen Quick Payment Buttons */}
                <div className="space-y-2">
                  <p className="text-xs text-gray-600">
                    To quickly access common payment methods, up to two buttons can be pinned as shortcuts to the main screen keypad.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <Label className="text-sm font-medium w-56">Quick access payment shortcut 1</Label>
                      <Select
                        value={settings.payments.quickAccess1}
                        onValueChange={(value) =>
                          setSettings({
                            ...settings,
                            payments: { ...settings.payments, quickAccess1: value },
                          })
                        }
                      >
                        <SelectTrigger className="w-56">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="creditCard">Credit Card</SelectItem>
                          <SelectItem value="invoice">Invoice</SelectItem>
                          <SelectItem value="terminal">Terminal</SelectItem>
                          <SelectItem value="manualEntry">Manual Entry</SelectItem>
                          <SelectItem value="tapToPay">Tap to Pay</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-4">
                      <Label className="text-sm font-medium w-56">Quick access payment shortcut 2</Label>
                      <Select
                        value={settings.payments.quickAccess2}
                        onValueChange={(value) =>
                          setSettings({
                            ...settings,
                            payments: { ...settings.payments, quickAccess2: value },
                          })
                        }
                      >
                        <SelectTrigger className="w-56">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="creditCard">Credit Card</SelectItem>
                          <SelectItem value="invoice">Invoice</SelectItem>
                          <SelectItem value="terminal">Terminal</SelectItem>
                          <SelectItem value="manualEntry">Manual Entry</SelectItem>
                          <SelectItem value="tapToPay">Tap to Pay</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Amount Paid Notification */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Select duration of amount paid notification</Label>
                  <Select
                    value={settings.payments.amountPaidNotification}
                    onValueChange={(value) =>
                      setSettings({
                        ...settings,
                        payments: { ...settings.payments, amountPaidNotification: value },
                      })
                    }
                  >
                    <SelectTrigger className="w-64">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dontShow">Don't show</SelectItem>
                      <SelectItem value="2s">2 seconds</SelectItem>
                      <SelectItem value="5s">5 seconds</SelectItem>
                      <SelectItem value="10s">10 seconds</SelectItem>
                      <SelectItem value="15s">15 seconds</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator className="my-6" />

                {/* Payment Options */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">PAYMENT OPTIONS</h3>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between py-2">
                        <Label className="text-sm font-medium">Allow refund processing on POS</Label>
                        <Switch
                          checked={settings.payments.allowRefundProcessing}
                          onCheckedChange={(checked) =>
                            setSettings({
                              ...settings,
                              payments: { ...settings.payments, allowRefundProcessing: checked },
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <Label className="text-sm font-medium">Skip amount prompt at payment</Label>
                        <Switch
                          checked={settings.payments.skipAmountPrompt}
                          onCheckedChange={(checked) =>
                            setSettings({
                              ...settings,
                              payments: { ...settings.payments, skipAmountPrompt: checked },
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <Label className="text-sm font-medium">Enable advanced check splitting</Label>
                        <Switch
                          checked={settings.payments.enableAdvancedCheckSplitting}
                          onCheckedChange={(checked) =>
                            setSettings({
                              ...settings,
                              payments: { ...settings.payments, enableAdvancedCheckSplitting: checked },
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <Label className="text-sm font-medium">Allow only whole amounts on the payment keypad</Label>
                        <Switch
                          checked={settings.payments.allowOnlyWholeAmounts}
                          onCheckedChange={(checked) =>
                            setSettings({
                              ...settings,
                              payments: { ...settings.payments, allowOnlyWholeAmounts: checked },
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between py-2">
                        <Label className="text-sm font-medium">Deactivate automatic change calculation on cash transactions</Label>
                        <Switch
                          checked={settings.payments.deactivateAutoChangeCalculation}
                          onCheckedChange={(checked) =>
                            setSettings({
                              ...settings,
                              payments: { ...settings.payments, deactivateAutoChangeCalculation: checked },
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <Label className="text-sm font-medium">Print final check after the receipt</Label>
                        <Switch
                          checked={settings.payments.printFinalCheckAfterReceipt}
                          onCheckedChange={(checked) =>
                            setSettings({
                              ...settings,
                              payments: { ...settings.payments, printFinalCheckAfterReceipt: checked },
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <Label className="text-sm font-medium">Capture signature on terminal when supported</Label>
                        <Switch
                          checked={settings.payments.captureSignatureOnTerminal}
                          onCheckedChange={(checked) =>
                            setSettings({
                              ...settings,
                              payments: { ...settings.payments, captureSignatureOnTerminal: checked },
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <div className="flex-1 pr-4">
                          <Label className="text-sm font-medium">Activate money back on meal vouchers</Label>
                          <p className="text-xs text-gray-500 mt-1">Generate a QR code to give holders a credit for the difference.</p>
                        </div>
                        <Switch
                          checked={settings.payments.activateMoneyBackOnMealVouchers}
                          onCheckedChange={(checked) =>
                            setSettings({
                              ...settings,
                              payments: { ...settings.payments, activateMoneyBackOnMealVouchers: checked },
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                {/* Tips Section */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">TIPS</h3>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between py-2">
                        <Label className="text-sm font-medium">Enable tipping on terminal when supported</Label>
                        <Switch
                          checked={settings.payments.enableTippingOnTerminal}
                          onCheckedChange={(checked) =>
                            setSettings({
                              ...settings,
                              payments: { ...settings.payments, enableTippingOnTerminal: checked },
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between py-2">
                        <div className="flex-1 pr-4">
                          <Label className="text-sm font-medium">Allow tipping at payment</Label>
                          <p className="text-xs text-gray-500 mt-1">POS users can add tips at payment.</p>
                        </div>
                        <Switch
                          checked={settings.payments.allowTippingAtPayment}
                          onCheckedChange={(checked) =>
                            setSettings({
                              ...settings,
                              payments: { ...settings.payments, allowTippingAtPayment: checked },
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <Label className="text-sm font-medium">Tips are provided after payment</Label>
                        <Switch
                          checked={settings.payments.tipsProvidedAfterPayment}
                          onCheckedChange={(checked) =>
                            setSettings({
                              ...settings,
                              payments: { ...settings.payments, tipsProvidedAfterPayment: checked },
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                {/* Receipt Options */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">RECEIPT OPTIONS</h3>
                  <p className="text-xs text-gray-600 mb-4">
                    Customize receipts printed by the payment terminal linked to this payment method. More options for receipt printing can be found in Configurations &gt; Printing and Printing &gt; Receipts.
                  </p>
                  <div className="grid grid-cols-2 gap-6">
                    {/* Image Upload Area */}
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Refund on commit failure</Label>
                      <div className="space-y-3">
                        <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
                          <li>Upload a JPEG or PNG file</li>
                          <li>Use a black-and-white image at least 240x384px (colour images will be converted to grayscale)</li>
                          <li>Use a landscape image for efficient cropping</li>
                        </ul>
                        <div
                          className={cn(
                            "border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer transition-colors",
                            "hover:border-gray-400 hover:bg-gray-50"
                          )}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const file = e.dataTransfer.files[0];
                            if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                const result = event.target?.result as string;
                                setSettings({
                                  ...settings,
                                  payments: { ...settings.payments, receiptLogo: result },
                                });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/jpeg,image/png';
                            input.onchange = (e) => {
                              const file = (e.target as HTMLInputElement).files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  const result = event.target?.result as string;
                                  setSettings({
                                    ...settings,
                                    payments: { ...settings.payments, receiptLogo: result },
                                  });
                                };
                                reader.readAsDataURL(file);
                              }
                            };
                            input.click();
                          }}
                        >
                          {settings.payments.receiptLogo ? (
                            <div className="space-y-2">
                              <img
                                src={settings.payments.receiptLogo}
                                alt="Receipt logo"
                                className="max-h-32 mx-auto rounded"
                              />
                              <p className="text-xs text-gray-600">Click to change image</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <Upload className="h-8 w-8 mx-auto text-gray-400" />
                              <p className="text-sm text-gray-600">Drag and drop an image or browse to choose a file</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Receipt Preview */}
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Receipt Preview</Label>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="bg-white border border-gray-300 rounded p-4 max-w-xs mx-auto shadow-sm">
                          {/* Logo Area */}
                          <div className="h-16 border-2 border-dashed border-gray-300 rounded mb-3 flex items-center justify-center bg-gray-50">
                            {settings.payments.receiptLogo ? (
                              <img
                                src={settings.payments.receiptLogo}
                                alt="Logo"
                                className="max-h-12 max-w-full object-contain"
                              />
                            ) : (
                              <span className="text-xs text-gray-400">YOUR LOGO HERE</span>
                            )}
                          </div>
                          
                          {/* Cardholder Copy */}
                          <div className="text-center text-xs font-semibold mb-3 pb-2 border-b border-gray-300">
                            CARDHOLDER COPY
                          </div>

                          {/* Transaction Details */}
                          <div className="text-xs space-y-1">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="text-gray-600">Date</div>
                              <div className="text-right">29.08.2023</div>
                              <div className="text-gray-600">Time</div>
                              <div className="text-right">15:34:59</div>
                              <div className="text-gray-600">Card</div>
                              <div className="text-right">****9999</div>
                              <div className="text-gray-600">PAN seq</div>
                              <div className="text-right">33</div>
                              <div className="text-gray-600">Pref. name</div>
                              <div className="text-right">mc en gör gop</div>
                              <div className="text-gray-600">Card type</div>
                              <div className="text-right">mc</div>
                              <div className="text-gray-600">Payment method</div>
                              <div className="text-right">mc</div>
                              <div className="text-gray-600">Payment variant</div>
                              <div className="text-right">mc</div>
                              <div className="text-gray-600">Entry mode</div>
                              <div className="text-right">Contactless chip</div>
                              <div className="text-gray-600">AID</div>
                              <div className="text-right">A000000004101001</div>
                              <div className="text-gray-600">MID</div>
                              <div className="text-right">50</div>
                              <div className="text-gray-600">TID</div>
                              <div className="text-right">V400m-347133042</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Display Settings */}
            {activeSection === 'display' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Display Preferences
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="theme">Theme</Label>
                      <Select
                        value={settings.display.theme}
                        onValueChange={(value) => setSettings({
                          ...settings,
                          display: { ...settings.display, theme: value }
                        })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                          <SelectItem value="auto">Auto (System)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between py-3 border-b border-gray-200">
                      <div>
                        <Label className="font-medium">Compact Mode</Label>
                        <p className="text-xs text-gray-600 mt-1">
                          Use compact layout to fit more content on screen
                        </p>
                      </div>
                      <Switch
                        checked={settings.display.compactMode}
                        onCheckedChange={(checked) => setSettings({
                          ...settings,
                          display: { ...settings.display, compactMode: checked }
                        })}
                      />
                    </div>

                    <div className="flex items-center justify-between py-3">
                      <div>
                        <Label className="font-medium">Show Menu Images</Label>
                        <p className="text-xs text-gray-600 mt-1">
                          Display images in menu items (may affect performance)
                        </p>
                      </div>
                      <Switch
                        checked={settings.display.showImages}
                        onCheckedChange={(checked) => setSettings({
                          ...settings,
                          display: { ...settings.display, showImages: checked }
                        })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

          </CardContent>

          {/* Save Button - Always visible at bottom */}
          <div className="border-t border-gray-200 p-6 bg-gray-50 rounded-b-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Database className="h-4 w-4" />
                <span>Changes are saved locally</span>
              </div>
              <Button onClick={handleSaveSettings} className="bg-gray-900 hover:bg-gray-800 rounded-lg">
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}

