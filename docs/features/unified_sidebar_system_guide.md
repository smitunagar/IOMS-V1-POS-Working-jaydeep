# IOMS Unified Sidebar System

## Overview
The IOMS system now features a **unified sidebar navigation** that provides consistent navigation across all modules. This eliminates the dual sidebar issue and creates a cohesive user experience throughout the platform.

## Key Features

### 🎯 **Unified Navigation**
- **Single sidebar** used across all IOMS modules
- **Consistent layout** regardless of which module you're in
- **No more dual sidebars** - problem completely resolved

### 🔧 **Module Toggle System**
- **Settings button** in the sidebar for module management
- **Toggle switches** to show/hide specialized modules
- **Persistent preferences** saved locally
- **Core navigation** always visible (Receptionist, Orders, Inventory, etc.)

### 📱 **Smart Auto-Expansion**
- Modules automatically expand when you navigate to their pages
- **Context-aware navigation** shows where you are
- **Breadcrumb-style** page titles and descriptions

## System Architecture

### Core Components

#### 1. **IOMSLayout** (`/src/components/layout/IOMSLayout.tsx`)
- Main layout wrapper used by all pages
- Includes the unified sidebar and content area
- Automatically handles module expansion based on current route

#### 2. **SidebarContext** (`/src/contexts/SidebarContext.tsx`)
- Global state management for sidebar behavior
- Module visibility toggles
- Persistent state across browser sessions
- Expansion/collapse state management

#### 3. **Sidebar Configuration** (`/src/lib/sidebarConfig.ts`)
- Centralized configuration for all navigation items
- Two main sections: **Core Navigation** and **Specialized Modules**
- Easy to add new modules and menu items

## Navigation Structure

### Core Navigation (Always Visible)
```
🏢 IOMS
├── 👥 Receptionist
│   ├── Customer Management
│   └── Check-in/Check-out
├── 📅 Reservations
│   ├── View Reservations
│   └── Analytics
├── 🛒 Orders
│   ├── Order Entry
│   ├── Order History
│   └── Analytics
├── 📦 Inventory
│   ├── Stock Management
│   ├── Analytics
│   └── Import Data
└── ⚙️ Setup
    ├── Dining Area
    └── Table Management
```

### Specialized Modules (Toggleable)
```
📋 Specialized Modules                   [⚙️ Settings]
├── 🍃 WasteWatchDog ✅                  [Toggle: ON]
│   ├── 📊 Dashboard
│   ├── 📷 Hardware
│   ├── 🛡️ Compliance
│   └── 📄 Reports
├── 📦 SmartInventory                    [Toggle: OFF]
├── 👨‍🍳 SmartChef                         [Toggle: OFF]
├── 🏪 Marketplace ✅                    [Toggle: ON]
└── 💳 POS System ✅                     [Toggle: ON]
```

## Usage Guide

### For End Users

#### **Navigating Between Modules**
1. Click on any module in the sidebar to expand it
2. Select sub-items to navigate to specific pages
3. The sidebar remains **constant** across all navigation
4. No matter where you go, the sidebar structure is **identical**

#### **Managing Module Visibility**
1. Click the **⚙️ Settings** button in the "Specialized Modules" section
2. Use the **toggle switches** to show/hide modules
3. Changes are **automatically saved** and persist across sessions
4. Core navigation items (Receptionist, Orders, etc.) are always visible

#### **Understanding Module States**
- **✅ Enabled**: Module appears in sidebar and can be accessed
- **Toggle OFF**: Module hidden from sidebar
- **Expanded**: Sub-items are visible
- **Collapsed**: Only main module name visible

### For Developers

#### **Adding New Pages**
```tsx
import { IOMSLayout } from '@/components/layout/IOMSLayout';

export default function MyPage() {
  return (
    <IOMSLayout pageTitle="My Page Title">
      <div className="p-6">
        {/* Your page content */}
      </div>
    </IOMSLayout>
  );
}
```

#### **Adding New Modules**
1. Edit `/src/lib/sidebarConfig.ts`
2. Add your module to the `modules` array:
```typescript
{
  title: "My New Module",
  icon: MyIcon,
  isExpandable: true,
  section: 'modules',
  subItems: [
    {
      title: "Feature 1",
      icon: FeatureIcon,
      href: "/apps/mymodule/feature1",
      description: "Feature description"
    }
  ]
}
```

#### **Setting Default Visibility**
In `/src/contexts/SidebarContext.tsx`, update the default visibility:
```typescript
const [moduleVisibility, setModuleVisibilityState] = useState<ModuleVisibility>({
  'My New Module': true, // Default to visible
  // ... other modules
});
```

## Technical Benefits

### 🎯 **Consistency**
- **Single source of truth** for navigation
- **Identical experience** across all modules
- **Predictable behavior** for users

### 🔧 **Maintainability**
- **Centralized configuration** makes updates easy
- **Reusable components** reduce code duplication
- **Type-safe** navigation structure

### 💾 **Performance**
- **Lazy loading** of module content
- **Persistent state** reduces re-renders
- **Optimized** route handling

### 🎨 **User Experience**
- **Toggle control** gives users customization
- **Auto-expansion** provides context awareness
- **Visual consistency** improves usability

## Migration Status

### ✅ **Completed**
- Unified sidebar system implemented
- WasteWatchDog module fully integrated
- Module toggle system functional
- Order Entry page updated
- Inventory page updated
- Receptionist page updated

### 🔄 **Remaining Tasks**
- Update remaining pages to use `IOMSLayout`
- Add more specialized modules as needed
- Enhance module descriptions and icons

## Troubleshooting

### **Module Not Showing**
1. Check if module is enabled in Settings (⚙️ button)
2. Verify module is defined in `sidebarConfig.ts`
3. Check default visibility in `SidebarContext.tsx`

### **Navigation Issues**
1. Ensure page uses `IOMSLayout` wrapper
2. Verify routes in `sidebarConfig.ts` are correct
3. Check for conflicting directory structures

### **State Not Persisting**
1. Check browser localStorage
2. Verify `SidebarContext` is properly wrapped around app
3. Confirm no localStorage quota issues

## Future Enhancements

### **Planned Features**
- 🎨 **Theme customization** for sidebar appearance
- 🔍 **Search functionality** within sidebar
- 📊 **Usage analytics** for module popularity
- 🚀 **Quick actions** panel
- 📱 **Mobile-responsive** sidebar behavior

### **Possible Integrations**
- 🔐 **Role-based** module visibility
- 🌍 **Multi-language** support
- 📈 **Real-time notifications** in sidebar
- 🎯 **Smart recommendations** for relevant modules

---

## Summary

The unified sidebar system successfully resolves the dual sidebar issue while providing:
- **Consistent navigation** across all IOMS modules
- **User control** over module visibility
- **Developer-friendly** architecture for easy expansion
- **Performance optimizations** for better user experience

The system maintains the core POS functionality while seamlessly integrating specialized modules like WasteWatchDog, creating a truly unified enterprise platform.
