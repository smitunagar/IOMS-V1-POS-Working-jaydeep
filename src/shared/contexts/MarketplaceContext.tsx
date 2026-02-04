'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

export interface App {
  id: string
  name: string
  description: string
  category: string
  icon: string
  status: 'available' | 'coming-soon' | 'beta'
  features: string[]
  rating: number
  downloads: number
  price: 'free' | 'premium' | 'enterprise' | 'freemium'
  tags: string[]
  route: string
  isInstalled: boolean
}

interface MarketplaceContextType {
  apps: App[]
  installedApps: App[]
  searchQuery: string
  selectedCategory: string
  setSearchQuery: (query: string) => void
  setSelectedCategory: (category: string) => void
  installApp: (appId: string) => void
  uninstallApp: (appId: string) => void
  getFilteredApps: () => App[]
}

const MarketplaceContext = createContext<MarketplaceContextType | undefined>(undefined)

const defaultApps: App[] = [
  {
    id: 'ioms',
    name: 'IOMS',
    description: 'Integrated Operations Management System - Complete business solution with POS, inventory management, analytics, payment processing, and more.',
    category: 'Business Management',
    icon: '🏢',
    status: 'available',
    features: [
      'Point of Sale (POS)',
      'Inventory Management', 
      'Real-time Analytics',
      'Payment Processing',
      'Barcode Scanning',
      'Multi-location Support',
      'Customer Management',
      'Employee Management',
      'Financial Reporting',
      'AI-Powered Insights'
    ],
    rating: 4.9,
    downloads: 25420,
    price: 'enterprise',
    tags: ['pos', 'inventory', 'analytics', 'ai', 'management', 'business'],
    route: '/apps/ioms',
    isInstalled: false
  },
  {
    id: 'inventory-pro',
    name: 'Inventory Pro',
    description: 'Comprehensive inventory management with smart forecasting, automated reordering, and detailed reporting.',
    category: 'Inventory Management',
    icon: '📦',
    status: 'available',
    features: ['Smart Forecasting', 'Automated Reordering', 'Barcode Management', 'Multi-warehouse', 'Real-time Tracking'],
    rating: 4.6,
    downloads: 8920,
    price: 'premium',
    tags: ['inventory', 'forecasting', 'automation'],
    route: '/apps/inventory-pro',
    isInstalled: false
  },
  {
    id: 'analytics-dashboard',
    name: 'Analytics Dashboard',
    description: 'Powerful business intelligence platform with customizable dashboards and advanced reporting capabilities.',
    category: 'Analytics',
    icon: '📊',
    status: 'available',
    features: ['Custom Dashboards', 'Real-time Reports', 'Data Visualization', 'Export Capabilities', 'Mobile Access'],
    rating: 4.7,
    downloads: 12340,
    price: 'premium',
    tags: ['analytics', 'dashboard', 'reports'],
    route: '/apps/analytics-dashboard',
    isInstalled: false
  },
  {
    id: 'customer-crm',
    name: 'Customer CRM',
    description: 'Complete customer relationship management with lead tracking, sales pipeline, and customer insights.',
    category: 'Customer Management',
    icon: '👥',
    status: 'coming-soon',
    features: ['Lead Management', 'Sales Pipeline', 'Customer Insights', 'Email Integration', 'Task Management'],
    rating: 0,
    downloads: 0,
    price: 'premium',
    tags: ['crm', 'customers', 'sales'],
    route: '/apps/customer-crm',
    isInstalled: false
  },
  {
    id: 'hr-management',
    name: 'HR Management',
    description: 'Comprehensive human resources platform with employee management, payroll, and performance tracking.',
    category: 'Human Resources',
    icon: '👨‍💼',
    status: 'beta',
    features: ['Employee Management', 'Payroll Processing', 'Performance Tracking', 'Time Tracking', 'Benefits Management'],
    rating: 4.2,
    downloads: 2340,
    price: 'enterprise',
    tags: ['hr', 'employees', 'payroll'],
    route: '/apps/hr-management',
    isInstalled: false
  },
  {
    id: 'smart-chef-bot',
    name: 'SmartChefBot',
    description: 'AI-powered culinary assistant that suggests recipes, manages ingredients, and optimizes kitchen operations.',
    category: 'Productivity',
    icon: '👨‍🍳',
    status: 'available',
    features: ['Recipe Generation', 'Ingredient Substitution', 'Nutritional Analysis', 'Meal Planning', 'Kitchen Inventory Sync', 'Dietary Preferences'],
    rating: 4.8,
    downloads: 5670,
    price: 'freemium',
    tags: ['ai', 'recipes', 'cooking', 'nutrition', 'kitchen'],
    route: '/smart-chef-pod',
    isInstalled: false
  },
  {
    id: 'waste-watchdog',
    name: 'WasteWatchDog',
    description: 'Intelligent food waste tracking and reduction system with predictive analytics and sustainability reporting.',
    category: 'Analytics',
    icon: '♻️',
    status: 'beta',
    features: ['Waste Tracking', 'Predictive Analytics', 'Sustainability Reports', 'Cost Analysis', 'Automated Alerts', 'Compliance Monitoring'],
    rating: 4.4,
    downloads: 1890,
    price: 'premium',
    tags: ['waste', 'sustainability', 'analytics', 'compliance', 'cost-savings'],
    route: '/apps/waste-watchdog',
    isInstalled: false
  }
]

export function MarketplaceProvider({ children }: { children: React.ReactNode }) {
  const [apps, setApps] = useState<App[]>(defaultApps)
  const [installedApps, setInstalledApps] = useState<App[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')

  useEffect(() => {
    // Load installed apps from localStorage
    const savedInstalledApps = localStorage.getItem('webmesiter360-installed-apps')
    if (savedInstalledApps) {
      const installedAppIds = JSON.parse(savedInstalledApps)
      const installed = apps.filter(app => installedAppIds.includes(app.id))
      setInstalledApps(installed)
      
      // Update apps with installation status
      setApps(prevApps => 
        prevApps.map(app => ({
          ...app,
          isInstalled: installedAppIds.includes(app.id)
        }))
      )
    }
  }, [])

  const installApp = (appId: string) => {
    const app = apps.find(a => a.id === appId)
    if (app && !app.isInstalled) {
      setInstalledApps(prev => [...prev, app])
      setApps(prevApps => 
        prevApps.map(app => 
          app.id === appId ? { ...app, isInstalled: true } : app
        )
      )
      
      // Save to localStorage
      const currentInstalled = installedApps.map(a => a.id)
      localStorage.setItem('webmesiter360-installed-apps', JSON.stringify([...currentInstalled, appId]))
    }
  }

  const uninstallApp = (appId: string) => {
    setInstalledApps(prev => prev.filter(app => app.id !== appId))
    setApps(prevApps => 
      prevApps.map(app => 
        app.id === appId ? { ...app, isInstalled: false } : app
      )
    )
    
    // Update localStorage
    const currentInstalled = installedApps.filter(app => app.id !== appId).map(a => a.id)
    localStorage.setItem('webmesiter360-installed-apps', JSON.stringify(currentInstalled))
  }

  const getFilteredApps = () => {
    let filtered = apps

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(app => app.category === selectedCategory)
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(app => 
        app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    return filtered
  }

  const value: MarketplaceContextType = {
    apps,
    installedApps,
    searchQuery,
    selectedCategory,
    setSearchQuery,
    setSelectedCategory,
    installApp,
    uninstallApp,
    getFilteredApps
  }

  return (
    <MarketplaceContext.Provider value={value}>
      {children}
    </MarketplaceContext.Provider>
  )
}

export function useMarketplace() {
  const context = useContext(MarketplaceContext)
  if (context === undefined) {
    throw new Error('useMarketplace must be used within a MarketplaceProvider')
  }
  return context
} 