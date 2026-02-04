import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TableNode {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  shape: 'round' | 'square' | 'rect';
  capacity: number;
  seats: number;
  label?: string;
  zoneId?: string;
  childIds?: string[]; // For merged tables
  metadata?: Record<string, any>;
}

export interface Zone {
  id: string;
  name: string;
  color: string;
  visible: boolean;
}

export interface TableState {
  id: string;
  status: 'FREE' | 'SEATED' | 'DIRTY' | 'RESERVED';
  updatedAt: string;
}

export interface LayoutHistory {
  timestamp: string;
  tables: TableNode[];
  zones: Zone[];
  action: string;
}

interface TableStore {
  // Layout state
  tables: TableNode[];
  zones: Zone[];
  selectedTable: TableNode | null;
  isDragging: boolean;
  snapToGrid: boolean;
  gridSize: number;
  canvasSize: { width: number; height: number };
  layoutVersion: number;
  
  // Real-time status
  tableStates: Record<string, TableState>;
  
  // Draft management
  hasDraft: boolean;
  draftSavedAt: string | null;
  lastActivatedAt: string | null;
  
  // History for undo/redo
  history: LayoutHistory[];
  historyIndex: number;
  maxHistoryLength: number;
  
  // Validation state
  validationErrors: string[];
  
  // Actions
  addTable: (table: Omit<TableNode, 'id'>) => string;
  updateTable: (id: string, updates: Partial<TableNode>) => void;
  deleteTable: (id: string) => void;
  selectTable: (id: string | null) => void;
  moveTable: (id: string, x: number, y: number) => void;
  resizeTable: (id: string, w: number, h: number) => void;
  nudgeTable: (id: string, direction: 'up' | 'down' | 'left' | 'right') => void;
  
  // Zone management
  addZone: (zone: Omit<Zone, 'id'>) => string;
  updateZone: (id: string, updates: Partial<Zone>) => void;
  deleteZone: (id: string) => void;
  assignTableToZone: (tableId: string, zoneId: string | null) => void;
  toggleZoneVisibility: (zoneId: string) => void;
  
  // Status management
  updateTableStatus: (tableId: string, status: TableState['status']) => void;
  
  // Layout management
  saveDraft: () => Promise<void>;
  loadDraft: () => Promise<void>;
  clearDraft: () => void;
  activateLayout: () => Promise<void>;
  
  // Merge/Split operations
  mergeTables: (tableId1: string, tableId2: string) => string | null;
  splitTable: (mergedTableId: string) => boolean;
  canMergeTables: (tableId1: string, tableId2: string) => boolean;
  
  // History management
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  addToHistory: (action: string) => void;
  
  // Validation
  validateLayout: () => string[];
  hasValidationErrors: () => boolean;
  
  // Utility
  getTableById: (id: string) => TableNode | undefined;
  getTablesInZone: (zoneId: string) => TableNode[];
  hasOverlap: (tableId?: string) => boolean;
  hasOverlaps: () => boolean;
  generateNextTableId: () => string;
  snapPosition: (x: number, y: number) => { x: number; y: number };
  isWithinCanvas: (x: number, y: number, w: number, h: number) => boolean;
  getAdjacentTables: (tableId: string) => TableNode[];
  
  // Reset
  reset: () => void;
}

const initialState = {
  tables: [],
  zones: [
    { id: 'indoor', name: 'Indoor', color: '#3B82F6', visible: true },
    { id: 'patio', name: 'Patio', color: '#10B981', visible: true },
    { id: 'bar', name: 'Bar', color: '#F59E0B', visible: true },
  ],
  selectedTable: null,
  isDragging: false,
  snapToGrid: true,
  gridSize: 8,
  canvasSize: { width: 1200, height: 800 },
  layoutVersion: 1,
  tableStates: {},
  hasDraft: false,
  draftSavedAt: null,
  lastActivatedAt: null,
  history: [],
  historyIndex: -1,
  maxHistoryLength: 20,
  validationErrors: [],
};

export const useTableStore = create<TableStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      addTable: (tableData) => {
        const id = get().generateNextTableId();
        const newTable: TableNode = {
          ...tableData,
          id,
          seats: tableData.capacity,
          label: id,
        };
        
        set((state) => {
          const newState = {
            tables: [...state.tables, newTable],
            hasDraft: true,
            layoutVersion: state.layoutVersion + 1,
          };
          get().addToHistory('ADD_TABLE');
          return newState;
        });
        
        return id;
      },
      
      updateTable: (id, updates) => {
        set((state) => {
          const updatedTables = state.tables.map((table) =>
            table.id === id ? { ...table, ...updates } : table
          );
          
          get().addToHistory('UPDATE_TABLE');
          
          return {
            tables: updatedTables,
            hasDraft: true,
            layoutVersion: state.layoutVersion + 1,
          };
        });
      },
      
      deleteTable: (id) => {
        set((state) => {
          get().addToHistory('DELETE_TABLE');
          
          return {
            tables: state.tables.filter((table) => table.id !== id),
            selectedTable: state.selectedTable?.id === id ? null : state.selectedTable,
            hasDraft: true,
            layoutVersion: state.layoutVersion + 1,
          };
        });
      },
      
      selectTable: (id) => {
        const table = id ? get().getTableById(id) : null;
        set({ selectedTable: table });
      },
      
      moveTable: (id, x, y) => {
        const { snapPosition, snapToGrid, isWithinCanvas } = get();
        const table = get().getTableById(id);
        if (!table) return;
        
        const snappedPos = snapToGrid ? snapPosition(x, y) : { x, y };
        
        // Ensure table stays within canvas bounds
        if (!isWithinCanvas(snappedPos.x, snappedPos.y, table.w, table.h)) {
          return;
        }
        
        set((state) => ({
          tables: state.tables.map((table) =>
            table.id === id ? { ...table, x: snappedPos.x, y: snappedPos.y } : table
          ),
          hasDraft: true,
          layoutVersion: state.layoutVersion + 1,
        }));
      },
      
      resizeTable: (id, w, h) => {
        const { gridSize, snapToGrid } = get();
        const minSize = gridSize * 6; // Minimum 48px
        
        const snappedW = snapToGrid ? Math.round(w / gridSize) * gridSize : w;
        const snappedH = snapToGrid ? Math.round(h / gridSize) * gridSize : h;
        
        set((state) => ({
          tables: state.tables.map((table) =>
            table.id === id ? { 
              ...table, 
              w: Math.max(snappedW, minSize), 
              h: Math.max(snappedH, minSize) 
            } : table
          ),
          hasDraft: true,
          layoutVersion: state.layoutVersion + 1,
        }));
      },
      
      nudgeTable: (id, direction) => {
        const { gridSize } = get();
        const table = get().getTableById(id);
        if (!table) return;
        
        let newX = table.x;
        let newY = table.y;
        
        switch (direction) {
          case 'up': newY -= gridSize; break;
          case 'down': newY += gridSize; break;
          case 'left': newX -= gridSize; break;
          case 'right': newX += gridSize; break;
        }
        
        get().moveTable(id, newX, newY);
      },
      
      addZone: (zoneData) => {
        const id = crypto.randomUUID();
        const newZone: Zone = { id, ...zoneData };
        
        set((state) => ({
          zones: [...state.zones, newZone],
        }));
        
        return id;
      },
      
      updateZone: (id, updates) => {
        set((state) => ({
          zones: state.zones.map((zone) =>
            zone.id === id ? { ...zone, ...updates } : zone
          ),
        }));
      },
      
      deleteZone: (id) => {
        set((state) => ({
          zones: state.zones.filter((zone) => zone.id !== id),
          // Remove zone assignment from tables
          tables: state.tables.map((table) =>
            table.zoneId === id ? { ...table, zoneId: undefined } : table
          ),
        }));
      },
      
      assignTableToZone: (tableId, zoneId) => {
        set((state) => ({
          tables: state.tables.map((table) =>
            table.id === tableId ? { ...table, zoneId: zoneId || undefined } : table
          ),
          hasDraft: true,
          layoutVersion: state.layoutVersion + 1,
        }));
      },
      
      toggleZoneVisibility: (zoneId) => {
        set((state) => ({
          zones: state.zones.map((zone) =>
            zone.id === zoneId ? { ...zone, visible: !zone.visible } : zone
          ),
        }));
      },
      
      updateTableStatus: (tableId, status) => {
        set((state) => ({
          tableStates: {
            ...state.tableStates,
            [tableId]: {
              id: tableId,
              status,
              updatedAt: new Date().toISOString(),
            },
          },
        }));
      },
      
      saveDraft: async () => {
        const state = get();
        try {
          const response = await fetch('/api/pos/floor/layout/draft', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-tenant-id': 'default-tenant', // TODO: Get from auth context
            },
            body: JSON.stringify({
              floorId: 'main-floor',
              layoutDraft: {
                tables: state.tables,
                zones: state.zones,
              },
              version: state.layoutVersion,
            }),
          });
          
          if (!response.ok) {
            throw new Error('Failed to save draft');
          }
          
          const data = await response.json();
          
          set({
            hasDraft: true,
            draftSavedAt: new Date().toISOString(),
            layoutVersion: data.version || state.layoutVersion,
          });
        } catch (error) {
          console.error('Error saving draft:', error);
          throw error;
        }
      },
      
      loadDraft: async () => {
        try {
          const response = await fetch('/api/pos/floor/layout/draft?floorId=main-floor', {
            headers: {
              'x-tenant-id': 'default-tenant',
            },
          });
          
          if (!response.ok) {
            throw new Error('Failed to load draft');
          }
          
          const data = await response.json();
          
          if (data.layoutDraft) {
            set({
              tables: data.layoutDraft.tables || [],
              zones: data.layoutDraft.zones || [],
              layoutVersion: data.version || 1,
              hasDraft: true,
              draftSavedAt: data.updatedAt,
            });
          }
        } catch (error) {
          console.error('Error loading draft:', error);
          throw error;
        }
      },
      
      clearDraft: () => {
        set({
          hasDraft: false,
          draftSavedAt: null,
        });
      },
      
      activateLayout: async () => {
        const state = get();
        
        // Validate before activation
        const errors = get().validateLayout();
        if (errors.length > 0) {
          throw new Error(`Cannot activate layout with errors: ${errors.join(', ')}`);
        }
        
        try {
          const response = await fetch('/api/pos/floor/layout/activate', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'x-tenant-id': 'default-tenant',
            },
            body: JSON.stringify({
              floorId: 'main-floor',
              expectVersion: state.layoutVersion,
            }),
          });
          
          if (!response.ok) {
            throw new Error('Failed to activate layout');
          }
          
          set({
            hasDraft: false,
            lastActivatedAt: new Date().toISOString(),
          });
        } catch (error) {
          console.error('Error activating layout:', error);
          throw error;
        }
      },
      
      // Merge/Split operations
      mergeTables: (tableId1, tableId2) => {
        const { canMergeTables, generateNextTableId } = get();
        
        if (!canMergeTables(tableId1, tableId2)) {
          return null;
        }
        
        const table1 = get().getTableById(tableId1);
        const table2 = get().getTableById(tableId2);
        
        if (!table1 || !table2) return null;
        
        const mergedId = generateNextTableId();
        const mergedTable: TableNode = {
          id: mergedId,
          x: Math.min(table1.x, table2.x),
          y: Math.min(table1.y, table2.y),
          w: Math.max(table1.x + table1.w, table2.x + table2.w) - Math.min(table1.x, table2.x),
          h: Math.max(table1.y + table1.h, table2.y + table2.h) - Math.min(table1.y, table2.y),
          shape: 'rect', // Merged tables are always rectangular
          capacity: table1.capacity + table2.capacity,
          seats: table1.seats + table2.seats,
          label: `${table1.label || table1.id}+${table2.label || table2.id}`,
          zoneId: table1.zoneId || table2.zoneId,
          childIds: [tableId1, tableId2],
          metadata: {
            merged: true,
            originalTables: [
              { ...table1 },
              { ...table2 },
            ],
          },
        };
        
        set((state) => {
          get().addToHistory('MERGE_TABLES');
          
          return {
            tables: [
              ...state.tables.filter(t => t.id !== tableId1 && t.id !== tableId2),
              mergedTable,
            ],
            hasDraft: true,
            layoutVersion: state.layoutVersion + 1,
          };
        });
        
        return mergedId;
      },
      
      splitTable: (mergedTableId) => {
        const mergedTable = get().getTableById(mergedTableId);
        
        if (!mergedTable?.childIds || !mergedTable.metadata?.originalTables) {
          return false;
        }
        
        const originalTables = mergedTable.metadata.originalTables as TableNode[];
        
        set((state) => {
          get().addToHistory('SPLIT_TABLE');
          
          return {
            tables: [
              ...state.tables.filter(t => t.id !== mergedTableId),
              ...originalTables,
            ],
            hasDraft: true,
            layoutVersion: state.layoutVersion + 1,
          };
        });
        
        return true;
      },
      
      canMergeTables: (tableId1, tableId2) => {
        const adjacentTables = get().getAdjacentTables(tableId1);
        return adjacentTables.some(table => table.id === tableId2);
      },
      
      // History management
      undo: () => {
        const state = get();
        if (!get().canUndo()) return;
        
        const targetIndex = state.historyIndex - 1;
        const targetState = state.history[targetIndex];
        
        set({
          tables: targetState.tables,
          zones: targetState.zones,
          historyIndex: targetIndex,
          hasDraft: true,
          layoutVersion: state.layoutVersion + 1,
        });
      },
      
      redo: () => {
        const state = get();
        if (!get().canRedo()) return;
        
        const targetIndex = state.historyIndex + 1;
        const targetState = state.history[targetIndex];
        
        set({
          tables: targetState.tables,
          zones: targetState.zones,
          historyIndex: targetIndex,
          hasDraft: true,
          layoutVersion: state.layoutVersion + 1,
        });
      },
      
      canUndo: () => {
        const state = get();
        return state.historyIndex > 0;
      },
      
      canRedo: () => {
        const state = get();
        return state.historyIndex < state.history.length - 1;
      },
      
      addToHistory: (action) => {
        const state = get();
        const historyEntry: LayoutHistory = {
          timestamp: new Date().toISOString(),
          tables: [...state.tables],
          zones: [...state.zones],
          action,
        };
        
        // Remove any history after current index (for new branches)
        const newHistory = state.history.slice(0, state.historyIndex + 1);
        newHistory.push(historyEntry);
        
        // Limit history size
        if (newHistory.length > state.maxHistoryLength) {
          newHistory.shift();
        }
        
        set({
          history: newHistory,
          historyIndex: newHistory.length - 1,
        });
      },
      
      // Validation
      validateLayout: () => {
        const errors: string[] = [];
        const { tables, hasOverlaps } = get();
        
        // Check for overlaps
        if (hasOverlaps()) {
          errors.push('Tables cannot overlap');
        }
        
        // Check for invalid capacities
        const invalidCapacity = tables.find(t => t.capacity < 1);
        if (invalidCapacity) {
          errors.push(`Table ${invalidCapacity.id} must have capacity ≥ 1`);
        }
        
        // Check for tables outside canvas
        const outsideCanvas = tables.find(t => !get().isWithinCanvas(t.x, t.y, t.w, t.h));
        if (outsideCanvas) {
          errors.push(`Table ${outsideCanvas.id} is outside canvas bounds`);
        }
        
        // Check for duplicate IDs (shouldn't happen, but safety check)
        const ids = tables.map(t => t.id);
        const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
        if (duplicateIds.length > 0) {
          errors.push(`Duplicate table IDs found: ${duplicateIds.join(', ')}`);
        }
        
        set({ validationErrors: errors });
        return errors;
      },
      
      hasValidationErrors: () => {
        return get().validateLayout().length > 0;
      },
      
      // Utility functions
      getTableById: (id) => {
        return get().tables.find((table) => table.id === id);
      },
      
      getTablesInZone: (zoneId) => {
        return get().tables.filter((table) => table.zoneId === zoneId);
      },
      
      hasOverlap: (excludeTableId) => {
        const { tables } = get();
        const tablesToCheck = excludeTableId 
          ? tables.filter((t) => t.id !== excludeTableId)
          : tables;
        
        for (let i = 0; i < tablesToCheck.length; i++) {
          for (let j = i + 1; j < tablesToCheck.length; j++) {
            const t1 = tablesToCheck[i];
            const t2 = tablesToCheck[j];
            
            // AABB collision detection
            if (
              t1.x < t2.x + t2.w &&
              t1.x + t1.w > t2.x &&
              t1.y < t2.y + t2.h &&
              t1.y + t1.h > t2.y
            ) {
              return true;
            }
          }
        }
        
        return false;
      },
      
      hasOverlaps: () => {
        const { tables } = get();
        
        for (let i = 0; i < tables.length; i++) {
          for (let j = i + 1; j < tables.length; j++) {
            const t1 = tables[i];
            const t2 = tables[j];
            
            // AABB collision detection
            if (
              t1.x < t2.x + t2.w &&
              t1.x + t1.w > t2.x &&
              t1.y < t2.y + t2.h &&
              t1.y + t1.h > t2.y
            ) {
              return true;
            }
          }
        }
        
        return false;
      },
      
      generateNextTableId: () => {
        const { tables } = get();
        const existingNumbers = tables
          .map((t) => t.id)
          .filter((id) => id.startsWith('T'))
          .map((id) => parseInt(id.substring(1), 10))
          .filter((n) => !isNaN(n));
        
        const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
        return `T${nextNumber}`;
      },
      
      snapPosition: (x, y) => {
        const { gridSize } = get();
        return {
          x: Math.round(x / gridSize) * gridSize,
          y: Math.round(y / gridSize) * gridSize,
        };
      },
      
      isWithinCanvas: (x, y, w, h) => {
        const { canvasSize } = get();
        return (
          x >= 0 &&
          y >= 0 &&
          x + w <= canvasSize.width &&
          y + h <= canvasSize.height
        );
      },
      
      getAdjacentTables: (tableId) => {
        const table = get().getTableById(tableId);
        if (!table) return [];
        
        const { tables } = get();
        const adjacencyThreshold = 16; // 2 grid units
        
        return tables.filter(t => {
          if (t.id === tableId) return false;
          
          // Check if tables are adjacent (within threshold)
          const horizontallyAdjacent = (
            Math.abs(t.x + t.w - table.x) <= adjacencyThreshold ||
            Math.abs(table.x + table.w - t.x) <= adjacencyThreshold
          ) && (
            (t.y <= table.y + table.h && t.y + t.h >= table.y)
          );
          
          const verticallyAdjacent = (
            Math.abs(t.y + t.h - table.y) <= adjacencyThreshold ||
            Math.abs(table.y + table.h - t.y) <= adjacencyThreshold
          ) && (
            (t.x <= table.x + table.w && t.x + t.w >= table.x)
          );
          
          return horizontallyAdjacent || verticallyAdjacent;
        });
      },
      
      reset: () => {
        set(initialState);
      },
    }),
    {
      name: 'table-management-store',
      partialize: (state) => ({
        tables: state.tables,
        zones: state.zones,
        hasDraft: state.hasDraft,
        draftSavedAt: state.draftSavedAt,
        lastActivatedAt: state.lastActivatedAt,
        snapToGrid: state.snapToGrid,
        gridSize: state.gridSize,
        canvasSize: state.canvasSize,
        layoutVersion: state.layoutVersion,
        history: state.history.slice(-10), // Keep last 10 history entries
        historyIndex: Math.max(0, state.historyIndex - (state.history.length - 10)),
      }),
    }
  )
);
