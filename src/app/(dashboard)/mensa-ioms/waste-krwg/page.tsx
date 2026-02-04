"use client";

import { 
  Leaf, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle,
  Scale,
  FileText,
  Calculator,
  Download,
  UserCheck
} from "lucide-react";
import Link from "next/link";

export default function WasteKrWGPage() {
  const workflowStates = [
    {
      id: 'start',
      name: 'Waste Start',
      type: 'Screen',
      description: 'Select waste type: Pre-consumer, Buffet, Plate',
      status: 'placeholder',
      options: ['Pre-consumer', 'Buffet', 'Plate']
    },
    {
      id: 'source-decision',
      name: 'Waste Source Decision',
      type: 'Decision Node',
      description: 'If plate waste → requires diner count / If pre-consumer → requires recipe link',
      status: 'placeholder',
      branches: [
        'Plate waste → requires diner count',
        'Pre-consumer → requires recipe link'
      ]
    },
    {
      id: 'category',
      name: 'Waste Category Screen',
      type: 'Screen',
      description: 'Select category (KrWG aligned)',
      status: 'placeholder',
      requirement: 'KrWG aligned categories'
    },
    {
      id: 'weight-entry',
      name: 'Weight Entry',
      type: 'Screen',
      description: 'Numeric input',
      status: 'placeholder',
      validation: 'Validation: positive number only'
    },
    {
      id: 'reason-entry',
      name: 'Reason Entry',
      type: 'Screen',
      description: 'Decision: avoidable / unavoidable',
      status: 'placeholder',
      decision: 'Avoidable / Unavoidable'
    },
    {
      id: 'validation',
      name: 'Validation State',
      type: 'Screen',
      description: 'Ensures: Weight, Category, Reason, Source linkage',
      status: 'placeholder',
      checks: ['Weight', 'Category', 'Reason', 'Source linkage']
    },
    {
      id: 'kpi-calculation',
      name: 'Waste Intensity KPI Calculation',
      type: 'Auto Calculation',
      description: 'Calculates: Waste per meal, Waste per dish, Waste intensity index',
      status: 'placeholder',
      calculations: ['Waste per meal', 'Waste per dish', 'Waste intensity index']
    },
    {
      id: 'approval',
      name: 'Approval Node',
      type: 'Decision Screen',
      description: 'Kitchen Approve / Reject',
      status: 'placeholder',
      decision: 'Kitchen Approve / Reject',
      loop: 'Reject loops back to Weight or Category'
    },
    {
      id: 'manager-approval',
      name: 'Manager Approval',
      type: 'Escalation Screen',
      description: 'Required for: Missing meal data, Outliers, High waste events',
      status: 'placeholder',
      triggers: ['Missing meal data', 'Outliers', 'High waste events']
    },
    {
      id: 'krwg-export',
      name: 'KrWG Export',
      type: 'Export Screen',
      description: 'Generates CSV/PDF',
      status: 'placeholder',
      formats: ['CSV', 'PDF'],
      requirement: 'Export blocked until 100% required fields complete'
    },
    {
      id: 'archive',
      name: 'Archive State',
      type: 'Terminal Screen',
      description: 'Final state after export',
      status: 'placeholder'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F7] p-6">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/mensa-ioms"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-wm-blue mb-4 transition-colors"
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">Back to Mensa IOMS</span>
          </Link>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Leaf className="w-7 h-7 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-4xl font-headline font-black text-wm-blue tracking-tight">
                Waste & KrWG
              </h1>
              <p className="text-gray-600 mt-1 font-sans">
                Waste tracking and KrWG compliance system
              </p>
            </div>
          </div>
        </div>

        {/* Workflow Overview */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-enterprise p-8 mb-8">
          <h2 className="font-headline font-black text-xl text-wm-blue mb-6 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Workflow Pattern
          </h2>
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-100">
            <p className="text-sm text-gray-700 font-sans leading-relaxed mb-4">
              <strong className="font-black text-wm-blue">Input</strong> → Classify → Validate → Calculate → Approve → Export
            </p>
            <p className="text-xs text-gray-600 font-medium">
              Workflow shape: input → classify → validate → calculate → approve → export.
            </p>
          </div>
        </div>

        {/* Workflow States */}
        <div className="space-y-4 mb-8">
          <h2 className="font-headline font-black text-xl text-wm-blue mb-4">
            Workflow States
          </h2>
          {workflowStates.map((state, idx) => (
            <div
              key={state.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center shrink-0 font-black text-sm">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-headline font-black text-lg text-wm-blue">
                      {state.name}
                    </h3>
                    <span className="px-2.5 py-1 bg-gray-100 text-gray-500 text-[10px] font-black uppercase tracking-wider rounded-full">
                      {state.type}
                    </span>
                    <span className="px-2.5 py-1 bg-orange-100 text-orange-600 text-[10px] font-black uppercase tracking-wider rounded-full">
                      Placeholder
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3 font-sans">
                    {state.description}
                  </p>
                  {state.options && (
                    <div className="mb-3">
                      <p className="text-xs font-bold text-gray-500 mb-2">Options:</p>
                      <div className="flex flex-wrap gap-2">
                        {state.options.map((option, oIdx) => (
                          <span
                            key={oIdx}
                            className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg border border-blue-200"
                          >
                            {option}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {state.branches && (
                    <div className="mb-3">
                      <p className="text-xs font-bold text-gray-500 mb-2">Branches:</p>
                      <div className="space-y-1">
                        {state.branches.map((branch, bIdx) => (
                          <div
                            key={bIdx}
                            className="px-2.5 py-1 bg-yellow-50 text-yellow-700 text-xs font-medium rounded-lg border border-yellow-200"
                          >
                            {branch}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {state.requirement && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                      <p className="text-xs font-bold text-blue-800 mb-1">Requirement:</p>
                      <p className="text-xs text-blue-700">{state.requirement}</p>
                    </div>
                  )}
                  {state.validation && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                      <p className="text-xs font-bold text-green-800 mb-1">Validation:</p>
                      <p className="text-xs text-green-700">{state.validation}</p>
                    </div>
                  )}
                  {state.decision && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                      <p className="text-xs font-bold text-yellow-800 mb-1">Decision:</p>
                      <p className="text-xs text-yellow-700">{state.decision}</p>
                    </div>
                  )}
                  {state.checks && (
                    <div className="mb-3">
                      <p className="text-xs font-bold text-gray-500 mb-2">Validation Checks:</p>
                      <div className="flex flex-wrap gap-2">
                        {state.checks.map((check, cIdx) => (
                          <span
                            key={cIdx}
                            className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-lg border border-green-200"
                          >
                            {check}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {state.calculations && (
                    <div className="mb-3">
                      <p className="text-xs font-bold text-gray-500 mb-2">Calculations:</p>
                      <div className="flex flex-wrap gap-2">
                        {state.calculations.map((calc, calcIdx) => (
                          <span
                            key={calcIdx}
                            className="px-2.5 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded-lg border border-purple-200"
                          >
                            {calc}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {state.loop && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                      <p className="text-xs font-bold text-blue-800 mb-1">Loop:</p>
                      <p className="text-xs text-blue-700">{state.loop}</p>
                    </div>
                  )}
                  {state.triggers && (
                    <div className="mb-3">
                      <p className="text-xs font-bold text-gray-500 mb-2">Triggers:</p>
                      <div className="flex flex-wrap gap-2">
                        {state.triggers.map((trigger, tIdx) => (
                          <span
                            key={tIdx}
                            className="px-2.5 py-1 bg-red-50 text-red-700 text-xs font-medium rounded-lg border border-red-200"
                          >
                            {trigger}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {state.formats && (
                    <div className="mb-3">
                      <p className="text-xs font-bold text-gray-500 mb-2">Export Formats:</p>
                      <div className="flex flex-wrap gap-2">
                        {state.formats.map((format, fIdx) => (
                          <span
                            key={fIdx}
                            className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-lg border border-indigo-200"
                          >
                            {format}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {state.requirement && state.id === 'krwg-export' && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-xs font-bold text-red-800 mb-1">Blocking Requirement:</p>
                      <p className="text-xs text-red-700">{state.requirement}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Key Features */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-enterprise p-8">
          <h2 className="font-headline font-black text-xl text-wm-blue mb-6 flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Key Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
              <Scale className="w-5 h-5 text-wm-teal shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-wm-blue mb-1">Weight Entry</p>
                <p className="text-xs text-gray-600">Numeric input with positive number validation</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-wm-teal shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-wm-blue mb-1">KrWG Alignment</p>
                <p className="text-xs text-gray-600">Category selection aligned with KrWG standards</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
              <Calculator className="w-5 h-5 text-wm-teal shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-wm-blue mb-1">KPI Auto Calculation</p>
                <p className="text-xs text-gray-600">Waste per meal, per dish, and intensity index</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
              <Download className="w-5 h-5 text-wm-teal shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-wm-blue mb-1">KrWG Export</p>
                <p className="text-xs text-gray-600">CSV/PDF export with 100% field completion requirement</p>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}

