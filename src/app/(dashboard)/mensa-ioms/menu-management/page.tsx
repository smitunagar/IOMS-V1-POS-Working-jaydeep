"use client";

import { AppLayout } from "@/shared/components/layout/AppLayout";
import { 
  UtensilsCrossed, 
  ArrowLeft,
  FileText,
  ChefHat,
  ShieldCheck,
  FolderOpen,
  PlusCircle,
  Search,
  Edit,
  Copy,
  Archive,
  Download,
  Upload,
  Settings
} from "lucide-react";
import Link from "next/link";

export default function MenuManagementPage() {
  return (
    <AppLayout pageTitle="Menu Management">
      <div className="min-h-screen bg-[#F5F5F7] p-6">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/mensa-ioms/dashboard"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-wm-blue mb-4 transition-colors"
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">Back to Dashboard</span>
          </Link>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <UtensilsCrossed className="w-7 h-7 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-4xl font-headline font-black text-wm-blue tracking-tight">
                Menu Management Workflow
              </h1>
              <p className="text-gray-600 mt-1 font-sans">
                Complete workflow for menu creation, compliance, and approval
              </p>
            </div>
          </div>
        </div>

        {/* Menu Management Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Menu Repository Card */}
          <Link href="/mensa-ioms/menu-management/repository" className="block group">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-enterprise overflow-hidden hover:shadow-xl transition-shadow cursor-pointer h-full">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
                  <FolderOpen className="w-7 h-7 text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="text-2xl font-headline font-black text-white mb-1">
                    Menu Repository
                  </h2>
                  <p className="text-sm text-white/90 font-sans">
                    Access and manage existing menu configurations
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <Search className="w-5 h-5 text-wm-blue shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm text-wm-blue mb-1">Menu Search & Discovery</p>
                    <p className="text-xs text-gray-600">Advanced search, filter, and browse existing menu templates and configurations</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <Edit className="w-5 h-5 text-wm-blue shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm text-wm-blue mb-1">Menu Editing & Updates</p>
                    <p className="text-xs text-gray-600">Modify existing menus, update dishes, adjust pricing, and manage seasonal changes</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <Copy className="w-5 h-5 text-wm-blue shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm text-wm-blue mb-1">Menu Duplication & Templates</p>
                    <p className="text-xs text-gray-600">Clone menus, create templates, and reuse configurations across locations</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <Archive className="w-5 h-5 text-wm-blue shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm text-wm-blue mb-1">Menu Versioning & History</p>
                    <p className="text-xs text-gray-600">Track changes, view version history, and restore previous menu configurations</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <Download className="w-5 h-5 text-wm-blue shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm text-wm-blue mb-1">Menu Export & Reporting</p>
                    <p className="text-xs text-gray-600">Generate reports, export to PDF/CSV, and share menu configurations</p>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-100">
                <span className="text-xs text-gray-400 font-medium">Enterprise Menu Management</span>
              </div>
            </div>
            </div>
          </Link>

          {/* Menu Creation Suite Card */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-enterprise overflow-hidden">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
                  <PlusCircle className="w-7 h-7 text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="text-2xl font-headline font-black text-white mb-1">
                    Menu Creation Suite
                  </h2>
                  <p className="text-sm text-white/90 font-sans">
                    Build new menus with guided workflows
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <FileText className="w-5 h-5 text-wm-teal shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm text-wm-blue mb-1">Guided Menu Builder</p>
                    <p className="text-xs text-gray-600">Step-by-step wizard for creating menus with compliance checks and validation</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <ChefHat className="w-5 h-5 text-wm-teal shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm text-wm-blue mb-1">Dish & Ingredient Management</p>
                    <p className="text-xs text-gray-600">Add dishes, manage ingredients, set portions, and configure nutritional data</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <ShieldCheck className="w-5 h-5 text-wm-teal shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm text-wm-blue mb-1">Compliance Validation</p>
                    <p className="text-xs text-gray-600">Real-time allergen tracking, DGE nutrition validation, and regulatory compliance checks</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <Upload className="w-5 h-5 text-wm-teal shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm text-wm-blue mb-1">Recipe Import & Integration</p>
                    <p className="text-xs text-gray-600">Import recipes from external sources, upload PDFs, and integrate with inventory systems</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <Settings className="w-5 h-5 text-wm-teal shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm text-wm-blue mb-1">Approval Workflow Configuration</p>
                    <p className="text-xs text-gray-600">Set up daily/weekly approval processes, assign reviewers, and configure escalation paths</p>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-100">
                <span className="text-xs text-gray-400 font-medium">Enterprise Menu Creation</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
