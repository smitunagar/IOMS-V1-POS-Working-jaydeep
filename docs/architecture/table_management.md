# Table Management System - File Inventory

## 1. Main Application Page
**File**: `src/app/apps/pos/table-management/page.tsx`
**Purpose**: Main page component with canvas layout and controls
**Key Features**:
- Two-pane layout (canvas + properties panel)
- Add table buttons (Round, Square, Rectangle)
- Layout status indicators
- Success/error messaging

## 2. Core Canvas Components

### FloorEditorCanvas
**File**: `src/components/table-management/FloorEditorCanvas.tsx`
**Purpose**: Main canvas component for table layout editing
**Key Features**:
- Mouse and keyboard interaction handling
- Drag state management
- Zone visualization
- Grid overlay integration
- Table selection logic

### TableNode
**File**: `src/components/table-management/TableNode.tsx`
**Purpose**: Individual table component rendering
**Key Features**:
- Shape-specific styling (round, square, rectangle)
- Status color coding
- Resize handles when selected
- Zone indicators
- Label and capacity display

### GridLayer
**File**: `src/components/table-management/GridLayer.tsx`
**Purpose**: Visual grid overlay for snap-to-grid functionality
**Key Features**:
- Configurable grid size (8px default)
- Horizontal and vertical lines
- Intersection dots
- Responsive to canvas size

### DragController
**File**: `src/components/table-management/DragController.tsx`
**Purpose**: Visual feedback during drag operations
**Key Features**:
- Position indicators
- Drag guidelines
- Visual feedback for drop zones

## 3. UI Components

### ResizeHandle
**File**: `src/components/table-management/ResizeHandle.tsx`
**Purpose**: Interactive resize handles for tables
**Key Features**:
- Multiple positions (bottom-right, bottom, right)
- Cursor styling
- Minimum size constraints
- Real-time resize feedback

### TableLabel
**File**: `src/components/table-management/TableLabel.tsx`
**Purpose**: Display table label and capacity
**Key Features**:
- Centered text layout
- Table ID/label display
- Seat capacity indicator
- Responsive typography

### TableStatusBadge
**File**: `src/components/table-management/TableStatusBadge.tsx`
**Purpose**: Color-coded status indicators
**Key Features**:
- Status mapping (FREE, SEATED, RESERVED, DIRTY)
- Color coding (green, red, blue, orange)
- Hover effects
- Positioned overlay

### TablePropertiesPanel
**File**: `src/components/table-management/TablePropertiesPanel.tsx`
**Purpose**: Side panel for editing table properties
**Key Features**:
- Table label editing
- Capacity adjustment
- Shape selection
- Zone assignment
- Position/size display
- Delete functionality

## 4. Action Components

### SaveDraftButton
**File**: `src/components/table-management/SaveDraftButton.tsx`
**Purpose**: Save current layout as draft
**Key Features**:
- Validation before saving
- Overlap detection
- Success/error states
- API integration
- Loading indicators

### ActivateLayoutButton
**File**: `src/components/table-management/ActivateLayoutButton.tsx`
**Purpose**: Activate layout for live POS use
**Key Features**:
- Confirmation dialog
- Layout validation summary
- Warning messages
- Table count statistics
- Activation workflow

## 5. State Management

### TableStore
**File**: `src/lib/stores/tableStore.ts`
**Purpose**: Zustand store for table management state
**Key Features**:
- Table CRUD operations
- Zone management
- Status tracking
- Layout persistence
- Overlap detection utilities
- Snap-to-grid functions

**Store Structure**:
```typescript
interface TableStore {
  // State
  tables: TableNode[]
  zones: Zone[]
  selectedTable: string | null
  isDragging: boolean
  tableStates: Record<string, TableState>
  
  // Actions
  addTable, updateTable, deleteTable
  selectTable, moveTable, resizeTable
  addZone, updateZone, deleteZone
  updateTableStatus
  hasOverlap, hasOverlaps
  saveDraft, loadDraft, activateLayout
}
```

## 6. API Routes

### Draft Layout API
**File**: `src/app/api/pos/floor/layout/draft/route.ts`
**Purpose**: Save and retrieve draft layouts
**Methods**: POST (save), GET (retrieve)
**Features**:
- Zod validation
- Overlap detection
- Database persistence
- Error handling

### Activate Layout API
**File**: `src/app/api/pos/floor/layout/activate/route.ts`
**Purpose**: Activate layouts for live POS
**Method**: POST
**Features**:
- Layout validation
- Table status initialization
- Archive previous layout
- Transaction safety

### Active Layout API
**File**: `src/app/api/pos/floor/layout/active/route.ts`
**Purpose**: Retrieve active layout with status
**Method**: GET
**Features**:
- Layout data retrieval
- Table status mapping
- Metadata inclusion

## 7. Database Schema

### Enhanced Prisma Schema
**File**: `prisma/schema.prisma`
**New Models**:
```prisma
model FloorLayout {
  id        String   @id @default(cuid())
  tenantId  String
  status    String   // DRAFT, ACTIVE, ARCHIVED
  data      String   // JSON layout data
  metadata  String?  // JSON metadata
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model TableStatus {
  id        String   @id @default(cuid())
  tableId   String   @unique
  tenantId  String
  status    String   // FREE, SEATED, RESERVED, DIRTY
  updatedAt DateTime @updatedAt
  metadata  String?
}

model PosReservation {
  id          String   @id @default(cuid())
  tableId     String
  tenantId    String
  customerName String
  partySize   Int
  reservationTime DateTime
  status      String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## 8. Configuration Files

### Next.js Config
**File**: `next.config.ts`
**Purpose**: Route redirects for backward compatibility
**Redirects**:
- `/dining-area-setup` → `/apps/pos/table-management`
- `/table-management` → `/apps/pos/table-management`

### Package Dependencies
**File**: `package.json`
**New Dependencies**:
- `zustand: ^5.0.2` - State management

## 9. Type Definitions

### Core Interfaces
```typescript
interface TableNode {
  id: string
  x: number, y: number, w: number, h: number
  shape: 'round' | 'square' | 'rect'
  capacity: number
  seats: number
  label?: string
  zoneId?: string
}

interface Zone {
  id: string
  name: string
  color: string
  visible: boolean
}

interface TableState {
  id: string
  status: 'FREE' | 'SEATED' | 'DIRTY' | 'RESERVED'
  updatedAt: string
}
```

## 10. Component Index
**File**: `src/components/table-management/index.ts`
**Purpose**: Centralized exports for all table management components

This comprehensive file structure provides a complete Table Management system with canvas-based editing, real-time validation, and full CRUD operations for restaurant floor layout management.
