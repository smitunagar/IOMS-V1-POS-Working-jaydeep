'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  CreditCard, Upload, BarChart3, MapPin, ChefHat, Package, 
  Users, FileText, Settings, Scan, Plus, X, GripVertical,
  Edit3, Trash2
} from 'lucide-react'
import { 
  QuickAction, 
  getUserQuickActions, 
  saveUserQuickActions, 
  getAvailableActionsForAdding,
  removeQuickAction,
  updateQuickActionOrder
} from '@/server/lib/quickActionsRegistry'

const iconMap: Record<string, any> = {
  CreditCard,
  Upload,
  BarChart3,
  MapPin,
  ChefHat,
  Package,
  Users,
  FileText,
  Settings,
  Scan
}

const colorClasses = {
  blue: 'bg-blue-50 border-blue-200 hover:border-blue-300 text-blue-600',
  green: 'bg-green-50 border-green-200 hover:border-green-300 text-green-600',
  purple: 'bg-purple-50 border-purple-200 hover:border-purple-300 text-purple-600',
  orange: 'bg-orange-50 border-orange-200 hover:border-orange-300 text-orange-600',
  indigo: 'bg-indigo-50 border-indigo-200 hover:border-indigo-300 text-indigo-600',
  red: 'bg-red-50 border-red-200 hover:border-red-300 text-red-600',
  yellow: 'bg-yellow-50 border-yellow-200 hover:border-yellow-300 text-yellow-600',
  pink: 'bg-pink-50 border-pink-200 hover:border-pink-300 text-pink-600',
  gray: 'bg-gray-50 border-gray-200 hover:border-gray-300 text-gray-600',
  cyan: 'bg-cyan-50 border-cyan-200 hover:border-cyan-300 text-cyan-600'
}

interface QuickActionsProps {
  className?: string
}

export default function QuickActions({ className = '' }: QuickActionsProps) {
  const [quickActions, setQuickActions] = useState<QuickAction[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [draggedItem, setDraggedItem] = useState<string | null>(null)

  useEffect(() => {
    setQuickActions(getUserQuickActions());
  }, []);

  const handleRemoveAction = (actionId: string) => {
    removeQuickAction(actionId)
    setQuickActions(getUserQuickActions())
  }

  const handleAddAction = (action: QuickAction) => {
    const currentActions = getUserQuickActions()
    const newAction: QuickAction = {
      ...action,
      isEnabled: true,
      order: currentActions.length + 1
    }
    
    const updatedActions = [...currentActions, newAction]
    saveUserQuickActions(updatedActions)
    setQuickActions(updatedActions)
    setShowAddModal(false)
  }

  const handleDragStart = (e: React.DragEvent, actionId: string) => {
    setDraggedItem(actionId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetActionId: string) => {
    e.preventDefault()
    if (!draggedItem || draggedItem === targetActionId) return

    const draggedIndex = quickActions.findIndex(action => action.id === draggedItem)
    const targetIndex = quickActions.findIndex(action => action.id === targetActionId)
    
    const newActions = [...quickActions]
    const [draggedAction] = newActions.splice(draggedIndex, 1)
    newActions.splice(targetIndex, 0, draggedAction)
    
    // Update order numbers
    const updatedActions = newActions.map((action, index) => ({
      ...action,
      order: index + 1
    }))
    
    saveUserQuickActions(updatedActions)
    setQuickActions(updatedActions)
    setDraggedItem(null)
  }

  const availableActions = getAvailableActionsForAdding()

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            <span>{isEditing ? 'Done' : 'Customize'}</span>
          </button>
          {isEditing && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Action</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quickActions.map((action) => {
          const IconComponent = iconMap[action.icon]
          return (
            <div
              key={action.id}
              draggable={isEditing}
              onDragStart={(e) => handleDragStart(e, action.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, action.id)}
              className={`relative ${isEditing ? 'cursor-move' : ''}`}
            >
              <Link
                href={action.href}
                className={`flex items-center p-4 rounded-lg border-2 transition-colors ${colorClasses[action.color]}`}
              >
                {isEditing && (
                  <div className="absolute -top-2 -left-2 flex items-center space-x-1">
                    <GripVertical className="w-4 h-4 text-gray-400" />
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        handleRemoveAction(action.id)
                      }}
                      className="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <IconComponent className="w-6 h-6 mr-3" />
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">{action.title}</h3>
                  <p className="text-sm text-gray-600">{action.description}</p>
                </div>
              </Link>
            </div>
          )
        })}
      </div>

      {/* Add Action Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Quick Action</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {availableActions.map((action) => {
                const IconComponent = iconMap[action.icon]
                return (
                  <button
                    key={action.id}
                    onClick={() => handleAddAction(action)}
                    className="w-full flex items-center p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors text-left"
                  >
                    <IconComponent className={`w-5 h-5 mr-3 ${colorClasses[action.color].split(' ')[0]}`} />
                    <div>
                      <h4 className="font-medium text-gray-900">{action.title}</h4>
                      <p className="text-sm text-gray-600">{action.description}</p>
                    </div>
                  </button>
                )
              })}
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 