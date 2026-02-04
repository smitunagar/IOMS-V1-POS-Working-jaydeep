import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  Table, 
  Zone, 
  Fixture, 
  FloorLayout, 
  TableEvent,
  TableShapeSchema,
  TableStatusSchema 
} from '@/lib/schemas/table-management';
import { createOverlapWorker, createChairLayoutWorker } from '@/server/lib/workers/table-workers';

// Constants
const DEFAULT_SIZES = {
  round: { w: 80, h: 80 },
  square: { w: 80, h: 80 },
  rect: { w: 120, h: 80 }
};

const GRID_SIZES = [8, 12, 16, 20, 24] as const;
const MAX_HISTORY_SIZE = 50;

// Utility Functions
function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

function generateTableId(tables: Table[]): string {
  const existingNumbers = tables
    .map(t => t.label)
    .filter(label => /^T\d+$/.test(label))
    .map(label => parseInt(label.substring(1)))
    .filter(num => !isNaN(num));
  
  const maxNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
  return `T${maxNumber + 1}`;
}

function hasTableIdDuplicates(tables: Table[]): boolean {
  const ids = tables.map(t => t.id);
  return new Set(ids).size !== ids.length;
}

// Enhanced Types
export interface TableStoreState {
  // Core State
  tables: Table[];
  zones: Zone[];
  fixtures: Fixture[];
  selectedTableIds: string[];
  selectedTablesForMerge: string[];
  
  // Layout State
  isDraftMode: boolean;
  layoutVersion: number;
  isDirty: boolean;
  gridSize: number;
  snapToGrid: boolean;
  floorBounds: { width: number; height: number };
  
  // UI State
  isLoading: boolean;
  error: string | null;
  validationErrors: string[];
  overlappingTableIds: string[][];
  viewMode: '2D' | '3D';
  showGrid: boolean;
  showZones: boolean;
  
  // History Management
  history: Array<{ tables: Table[]; zones: Zone[]; fixtures: Fixture[] }>;
  historyIndex: number;
  
  // WebSocket & Real-time
  wsConnected: boolean;
  tableStates: Record<string, 'FREE' | 'SEATED' | 'DIRTY' | 'RESERVED'>;
  
  // Workers
  overlapWorker: Worker | null;
  chairWorker: Worker | null;
  
  // Computed Properties
  canUndo: boolean;
  canRedo: boolean;
  hasOverlaps: boolean;
  totalTables: number;
  totalCapacity: number;
  availableTables: number;
}

export interface TableStoreActions {
  // Table Management
  addTable: (params: { x: number; y: number; shape: Table['shape']; capacity?: number; zone?: string }) => void;
  updateTable: (id: string, updates: Partial<Table>) => void;
  deleteTable: (id: string) => void;
  duplicateTable: (id: string) => void;
  moveTable: (id: string, x: number, y: number, z?: number) => void;
  rotateTable: (id: string, rotation: number) => void;
  resizeTable: (id: string, w: number, h: number) => void;
  
  // Selection Management
  selectTable: (id: string | null) => void;
  selectMultipleTables: (ids: string[]) => void;
  toggleTableSelection: (id: string) => void;
  clearSelection: () => void;
  
  // Zone Management
  addZone: (zone: Omit<Zone, 'id'>) => void;
  updateZone: (id: string, updates: Partial<Zone>) => void;
  deleteZone: (id: string) => void;
  assignTableToZone: (tableId: string, zoneId: string) => void;
  
  // Fixture Management
  addFixture: (fixture: Omit<Fixture, 'id'>) => void;
  updateFixture: (id: string, updates: Partial<Fixture>) => void;
  deleteFixture: (id: string) => void;
  
  // Merge/Split Operations
  mergeTables: (tableIds: string[]) => void;
  splitTable: (mergedTableId: string) => void;
  canMergeTables: (tableIds: string[]) => boolean;
  
  // Layout Management
  saveDraft: (floorId: string) => Promise<void>;
  loadDraft: (floorId: string) => Promise<void>;
  activateLayout: (floorId: string) => Promise<void>;
  rollbackLayout: (floorId: string) => Promise<void>;
  importLayout: (layout: FloorLayout) => void;
  exportLayout: () => FloorLayout;
  
  // History Management
  undo: () => void;
  redo: () => void;
  saveToHistory: () => void;
  clearHistory: () => void;
  
  // Validation & Overlap Detection
  validateLayout: () => { isValid: boolean; errors: string[] };
  checkOverlaps: () => void;
  resolveOverlap: (tableId1: string, tableId2: string) => void;
  
  // Grid & Positioning
  setGridSize: (size: number) => void;
  toggleSnapToGrid: () => void;
  nudgeTable: (id: string, direction: 'up' | 'down' | 'left' | 'right') => void;
  alignTables: (tableIds: string[], alignment: 'left' | 'right' | 'top' | 'bottom' | 'center') => void;
  distributeTablesEvenly: (tableIds: string[], axis: 'horizontal' | 'vertical') => void;
  
  // View Management
  setViewMode: (mode: '2D' | '3D') => void;
  toggleGrid: () => void;
  toggleZones: () => void;
  resetView: () => void;
  
  // Real-time Status
  updateTableStatus: (tableId: string, status: Table['status']) => void;
  updateTableStates: (states: Record<string, 'FREE' | 'SEATED' | 'DIRTY' | 'RESERVED'>) => void;
  
  // WebSocket Management
  connectWebSocket: () => void;
  disconnectWebSocket: () => void;
  handleTableEvent: (event: TableEvent) => void;
  
  // Utility Functions
  getTable: (id: string) => Table | undefined;
  getTablesInZone: (zoneId: string) => Table[];
  getOverlappingTables: (tableId: string) => Table[];
  findNearestTable: (x: number, y: number) => Table | undefined;
  
  // Cleanup
  cleanup: () => void;
  init?: () => void;
}

export type TableStore = TableStoreState & TableStoreActions;

// Initial state with production-ready sample data
const initialState: TableStoreState = {
  tables: [
    {
      id: 'table-1',
      label: 'T1',
      x: 200,
      y: 150,
      z: 0,
      w: 80,
      h: 80,
      rotation: 0,
      shape: 'round',
      capacity: 4,
      seats: 4,
      status: 'FREE',
      zone: 'main-dining',
      isVisible: true,
      metadata: {}
    },
    {
      id: 'table-2',
      label: 'T2',
      x: 350,
      y: 200,
      z: 0,
      w: 80,
      h: 80,
      rotation: 0,
      shape: 'square',
      capacity: 4,
      seats: 4,
      status: 'SEATED',
      zone: 'main-dining',
      isVisible: true,
      metadata: {}
    },
    {
      id: 'table-3',
      label: 'T3',
      x: 500,
      y: 150,
      z: 0,
      w: 120,
      h: 80,
      rotation: 0,
      shape: 'rect',
      capacity: 6,
      seats: 6,
      status: 'RESERVED',
      zone: 'vip-section',
      isVisible: true,
      metadata: {}
    }
  ],
  zones: [
    {
      id: 'main-dining',
      name: 'Main Dining Area',
      bounds: { x: 0, y: 0, w: 600, h: 400 },
      color: '#3b82f6',
      isVisible: true
    },
    {
      id: 'vip-section',
      name: 'VIP Section',
      bounds: { x: 450, y: 0, w: 300, h: 200 },
      color: '#8b5cf6',
      isVisible: true
    }
  ],
  fixtures: [],
  selectedTableIds: [],
  selectedTablesForMerge: [],
  isDraftMode: true,
  layoutVersion: 1,
  isDirty: false,
  gridSize: 20,
  snapToGrid: true,
  floorBounds: { width: 1200, height: 800 },
  isLoading: false,
  error: null,
  validationErrors: [],
  overlappingTableIds: [],
  viewMode: '3D',
  showGrid: true,
  showZones: true,
  history: [],
  historyIndex: -1,
  wsConnected: false,
  tableStates: {},
  overlapWorker: null,
  chairWorker: null,
  canUndo: false,
  canRedo: false,
  hasOverlaps: false,
  totalTables: 3,
  totalCapacity: 14,
  availableTables: 1
};

export const useTableStore = create<TableStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Initialize workers
      init: () => {
        const state = get();
        if (typeof window !== 'undefined' && !state.overlapWorker) {
          try {
            const overlapWorker = createOverlapWorker();
            const chairWorker = createChairLayoutWorker();
            
            overlapWorker.onmessage = (e) => {
              const { overlaps } = e.data;
              set({ 
                overlappingTableIds: overlaps,
                hasOverlaps: overlaps.length > 0,
                validationErrors: overlaps.length > 0 ? ['Tables are overlapping'] : []
              });
            };
            
            set({ overlapWorker, chairWorker });
          } catch (error) {
            console.warn('Failed to initialize workers:', error);
          }
        }
      },

      // Table Management
      addTable: ({ x, y, shape, capacity, zone }) => {
        const state = get();
        const gridSize = state.snapToGrid ? state.gridSize : 1;
        const sizes = DEFAULT_SIZES[shape];
        
        const newTable: Table = {
          id: crypto.randomUUID(),
          label: generateTableId(state.tables),
          x: snapToGrid(x, gridSize),
          y: snapToGrid(y, gridSize),
          z: 0,
          w: sizes.w,
          h: sizes.h,
          rotation: 0,
          shape,
          capacity: capacity || (shape === 'rect' ? 6 : 4),
          seats: capacity || (shape === 'rect' ? 6 : 4),
          status: 'FREE',
          zone,
          isVisible: true,
          metadata: {}
        };

        const newTables = [...state.tables, newTable];
        
        // Check for duplicates and overlaps
        if (hasTableIdDuplicates(newTables)) {
          set({ error: 'Duplicate table ID detected' });
          return;
        }

        set({ 
          tables: newTables, 
          isDirty: true,
          totalTables: newTables.length,
          totalCapacity: newTables.reduce((sum, t) => sum + t.capacity, 0)
        });
        
        get().saveToHistory();
        get().checkOverlaps();
      },

      updateTable: (id, updates) => {
        const state = get();
        const tables = state.tables.map(table => 
          table.id === id ? { ...table, ...updates, updatedAt: new Date() } : table
        );
        
        set({ 
          tables, 
          isDirty: true,
          totalCapacity: tables.reduce((sum, t) => sum + t.capacity, 0)
        });
        
        get().checkOverlaps();
      },

      deleteTable: (id) => {
        const state = get();
        const tables = state.tables.filter(table => table.id !== id);
        
        set({ 
          tables,
          selectedTableIds: state.selectedTableIds.filter(selectedId => selectedId !== id),
          isDirty: true,
          totalTables: tables.length,
          totalCapacity: tables.reduce((sum, t) => sum + t.capacity, 0)
        });
        
        get().saveToHistory();
        get().checkOverlaps();
      },

      duplicateTable: (id) => {
        const state = get();
        const originalTable = state.tables.find(t => t.id === id);
        if (!originalTable) return;

        const newTable: Table = {
          ...originalTable,
          id: crypto.randomUUID(),
          label: generateTableId(state.tables),
          x: originalTable.x + 50,
          y: originalTable.y + 50,
          isVisible: true,
          metadata: {}
        };

        const newTables = [...state.tables, newTable];
        set({ 
          tables: newTables,
          isDirty: true,
          totalTables: newTables.length,
          totalCapacity: newTables.reduce((sum, t) => sum + t.capacity, 0)
        });
        
        get().saveToHistory();
        get().checkOverlaps();
      },

      moveTable: (id, x, y, z = 0) => {
        const state = get();
        const gridSize = state.snapToGrid ? state.gridSize : 1;
        
        get().updateTable(id, {
          x: snapToGrid(Math.max(0, x), gridSize),
          y: snapToGrid(Math.max(0, y), gridSize),
          z
        });
      },

      rotateTable: (id, rotation) => {
        get().updateTable(id, { rotation: rotation % 360 });
      },

      resizeTable: (id, w, h) => {
        get().updateTable(id, { w: Math.max(40, w), h: Math.max(40, h) });
      },

      // Selection Management
      selectTable: (id) => {
        set({ selectedTableIds: id ? [id] : [] });
      },

      selectMultipleTables: (ids) => {
        set({ selectedTableIds: ids });
      },

      toggleTableSelection: (id) => {
        const state = get();
        const isSelected = state.selectedTableIds.includes(id);
        
        if (isSelected) {
          set({ selectedTableIds: state.selectedTableIds.filter(selectedId => selectedId !== id) });
        } else {
          set({ selectedTableIds: [...state.selectedTableIds, id] });
        }
      },

      clearSelection: () => {
        set({ selectedTableIds: [], selectedTablesForMerge: [] });
      },

      // Zone Management
      addZone: (zoneData) => {
        const state = get();
        const newZone: Zone = {
          ...zoneData,
          id: crypto.randomUUID()
        };
        
        set({ 
          zones: [...state.zones, newZone],
          isDirty: true
        });
        
        get().saveToHistory();
      },

      updateZone: (id, updates) => {
        const state = get();
        const zones = state.zones.map(zone => 
          zone.id === id ? { ...zone, ...updates, updatedAt: new Date() } : zone
        );
        
        set({ zones, isDirty: true });
      },

      deleteZone: (id) => {
        const state = get();
        const zones = state.zones.filter(zone => zone.id !== id);
        const tables = state.tables.map(table => 
          table.zone === id ? { ...table, zone: undefined } : table
        );
        
        set({ zones, tables, isDirty: true });
        get().saveToHistory();
      },

      assignTableToZone: (tableId, zoneId) => {
        get().updateTable(tableId, { zone: zoneId });
      },

      // Fixture Management
      addFixture: (fixtureData) => {
        const state = get();
        const newFixture: Fixture = {
          ...fixtureData,
          id: crypto.randomUUID()
        };
        
        set({ 
          fixtures: [...state.fixtures, newFixture],
          isDirty: true
        });
        
        get().saveToHistory();
      },

      updateFixture: (id, updates) => {
        const state = get();
        const fixtures = state.fixtures.map(fixture => 
          fixture.id === id ? { ...fixture, ...updates, updatedAt: new Date() } : fixture
        );
        
        set({ fixtures, isDirty: true });
      },

      deleteFixture: (id) => {
        const state = get();
        const fixtures = state.fixtures.filter(fixture => fixture.id !== id);
        
        set({ fixtures, isDirty: true });
        get().saveToHistory();
      },

      // Merge/Split Operations
      mergeTables: (tableIds) => {
        const state = get();
        const tablesToMerge = state.tables.filter(t => tableIds.includes(t.id));
        
        if (tablesToMerge.length < 2) return;
        
        // Calculate merged position (center of all tables)
        const avgX = tablesToMerge.reduce((sum, t) => sum + t.x + t.w/2, 0) / tablesToMerge.length;
        const avgY = tablesToMerge.reduce((sum, t) => sum + t.y + t.h/2, 0) / tablesToMerge.length;
        const totalCapacity = tablesToMerge.reduce((sum, t) => sum + t.capacity, 0);
        
        const mergedTable: Table = {
          id: crypto.randomUUID(),
          label: `M${tablesToMerge.map(t => t.label).join('-')}`,
          x: avgX - 60,
          y: avgY - 40,
          z: 0,
          w: 120,
          h: 80,
          rotation: 0,
          shape: 'rect',
          capacity: totalCapacity,
          seats: totalCapacity,
          status: 'FREE',
          zone: tablesToMerge[0].zone,
          isVisible: true,
          metadata: {}
        };
        
        const tables = [
          ...state.tables.filter(t => !tableIds.includes(t.id)),
          mergedTable
        ];
        
        set({ 
          tables,
          selectedTableIds: [mergedTable.id],
          selectedTablesForMerge: [],
          isDirty: true,
          totalCapacity: tables.reduce((sum, t) => sum + t.capacity, 0)
        });
        
        get().saveToHistory();
        get().checkOverlaps();
      },

      splitTable: (mergedTableId) => {
        const state = get();
        const mergedTable = state.tables.find(t => t.id === mergedTableId);
        
        if (!mergedTable) return;
        
        // Create split tables (simplified - in production, store original positions)
        const numTables = Math.max(2, Math.floor(mergedTable.capacity / 4));
        const restoredTables: Table[] = [];
        
        for (let i = 0; i < numTables; i++) {
          restoredTables.push({
            id: crypto.randomUUID(),
            label: generateTableId([...state.tables, ...restoredTables]),
            x: mergedTable.x + (i * 100),
            y: mergedTable.y,
            z: 0,
            w: 80,
            h: 80,
            rotation: 0,
            shape: 'round',
            capacity: Math.floor(mergedTable.capacity / numTables),
            seats: Math.floor(mergedTable.capacity / numTables),
            status: 'FREE',
            zone: mergedTable.zone,
            isVisible: true,
            metadata: {}
          });
        }
        
        const tables = [
          ...state.tables.filter(t => t.id !== mergedTableId),
          ...restoredTables
        ];
        
        set({ 
          tables,
          selectedTableIds: restoredTables.map(t => t.id),
          isDirty: true,
          totalTables: tables.length,
          totalCapacity: tables.reduce((sum, t) => sum + t.capacity, 0)
        });
        
        get().saveToHistory();
        get().checkOverlaps();
      },

      canMergeTables: (tableIds) => {
        const state = get();
        const tables = state.tables.filter(t => tableIds.includes(t.id));
        return tables.length >= 2 && tables.every(t => t.status === 'FREE');
      },

      // Layout Management
      saveDraft: async (floorId) => {
        const state = get();
        set({ isLoading: true, error: null });

        try {
          const layout = get().exportLayout();
          
          const response = await fetch('/api/pos/floor/layout/draft', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-tenant-id': 'default',
              'If-Match': state.layoutVersion.toString()
            },
            body: JSON.stringify({
              floorId,
              layout
            })
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to save draft');
          }

          const result = await response.json();
          
          set({ 
            isLoading: false, 
            isDirty: false,
            layoutVersion: result.version || state.layoutVersion + 1
          });
        } catch (error) {
          set({ 
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to save draft'
          });
        }
      },

      loadDraft: async (floorId) => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch(`/api/pos/floor/layout/draft?floorId=${floorId}`, {
            headers: {
              'x-tenant-id': 'default'
            }
          });

          if (response.status === 404) {
            // No draft exists, continue with current state
            set({ isLoading: false });
            return;
          }

          if (!response.ok) {
            throw new Error('Failed to load draft');
          }

          const { layout, version } = await response.json();
          
          if (layout) {
            set({
              tables: layout.tables || [],
              zones: layout.zones || [],
              fixtures: layout.fixtures || [],
              gridSize: layout.gridSize || 20,
              floorBounds: layout.floorBounds || { width: 1200, height: 800 },
              layoutVersion: version || 1,
              isDirty: false,
              isLoading: false,
              totalTables: (layout.tables || []).length,
              totalCapacity: (layout.tables || []).reduce((sum: number, t: Table) => sum + t.capacity, 0)
            });
            
            get().checkOverlaps();
          }
        } catch (error) {
          set({ 
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to load draft'
          });
        }
      },

      activateLayout: async (floorId) => {
        const state = get();
        const validation = get().validateLayout();
        
        if (!validation.isValid) {
          set({ error: 'Cannot activate layout with validation errors' });
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const response = await fetch('/api/pos/floor/layout/activate', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'x-tenant-id': 'default'
            },
            body: JSON.stringify({
              floorId,
              expectVersion: state.layoutVersion
            })
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to activate layout');
          }

          const result = await response.json();
          
          set({ 
            isLoading: false, 
            isDraftMode: false,
            layoutVersion: result.version || state.layoutVersion + 1
          });
        } catch (error) {
          set({ 
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to activate layout'
          });
        }
      },

      rollbackLayout: async (floorId) => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch('/api/pos/floor/layout/rollback', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-tenant-id': 'default'
            },
            body: JSON.stringify({ floorId })
          });

          if (!response.ok) {
            throw new Error('Failed to rollback layout');
          }

          await get().loadDraft(floorId);
          set({ isLoading: false });
        } catch (error) {
          set({ 
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to rollback layout'
          });
        }
      },

      importLayout: (layout) => {
        set({
          tables: layout.tables || [],
          zones: layout.zones || [],
          fixtures: layout.fixtures || [],
          gridSize: layout.gridSize || 20,
          floorBounds: layout.floorBounds || { width: 1200, height: 800 },
          isDirty: true,
          totalTables: (layout.tables || []).length,
          totalCapacity: (layout.tables || []).reduce((sum, t) => sum + t.capacity, 0)
        });
        
        get().saveToHistory();
        get().checkOverlaps();
      },

      exportLayout: () => {
        const state = get();
        return {
          tables: state.tables,
          zones: state.zones,
          fixtures: state.fixtures,
          gridSize: state.gridSize,
          floorBounds: state.floorBounds,
          metadata: {
            version: state.layoutVersion,
            exportedAt: new Date().toISOString(),
            totalTables: state.totalTables,
            totalCapacity: state.totalCapacity
          }
        };
      },

      // History Management
      saveToHistory: () => {
        const state = get();
        const currentState = {
          tables: [...state.tables],
          zones: [...state.zones],
          fixtures: [...state.fixtures]
        };
        
        const newHistory = state.history.slice(0, state.historyIndex + 1);
        newHistory.push(currentState);
        
        if (newHistory.length > MAX_HISTORY_SIZE) {
          newHistory.shift();
        }
        
        set({
          history: newHistory,
          historyIndex: newHistory.length - 1,
          canUndo: true,
          canRedo: false
        });
      },

      undo: () => {
        const state = get();
        if (state.historyIndex > 0) {
          const previousState = state.history[state.historyIndex - 1];
          
          set({
            tables: previousState.tables,
            zones: previousState.zones,
            fixtures: previousState.fixtures,
            historyIndex: state.historyIndex - 1,
            canUndo: state.historyIndex - 1 > 0,
            canRedo: true,
            isDirty: true,
            totalTables: previousState.tables.length,
            totalCapacity: previousState.tables.reduce((sum, t) => sum + t.capacity, 0)
          });
          
          get().checkOverlaps();
        }
      },

      redo: () => {
        const state = get();
        if (state.historyIndex < state.history.length - 1) {
          const nextState = state.history[state.historyIndex + 1];
          
          set({
            tables: nextState.tables,
            zones: nextState.zones,
            fixtures: nextState.fixtures,
            historyIndex: state.historyIndex + 1,
            canUndo: true,
            canRedo: state.historyIndex + 1 < state.history.length - 1,
            isDirty: true,
            totalTables: nextState.tables.length,
            totalCapacity: nextState.tables.reduce((sum, t) => sum + t.capacity, 0)
          });
          
          get().checkOverlaps();
        }
      },

      clearHistory: () => {
        set({
          history: [],
          historyIndex: -1,
          canUndo: false,
          canRedo: false
        });
      },

      // Validation & Overlap Detection
      validateLayout: () => {
        const state = get();
        const errors: string[] = [];
        
        // Check for duplicate IDs
        if (hasTableIdDuplicates(state.tables)) {
          errors.push('Duplicate table IDs detected');
        }
        
        // Check for overlaps
        if (state.hasOverlaps) {
          errors.push('Tables are overlapping');
        }
        
        // Check table positions are within bounds
        const outOfBounds = state.tables.filter(table => 
          table.x < 0 || table.y < 0 || 
          table.x + table.w > state.floorBounds.width ||
          table.y + table.h > state.floorBounds.height
        );
        
        if (outOfBounds.length > 0) {
          errors.push(`${outOfBounds.length} table(s) are outside floor bounds`);
        }
        
        // Check for tables without zones if zones are required
        const tablesWithoutZones = state.tables.filter(table => !table.zone);
        if (state.zones.length > 0 && tablesWithoutZones.length > 0) {
          errors.push(`${tablesWithoutZones.length} table(s) need zone assignment`);
        }
        
        return {
          isValid: errors.length === 0,
          errors
        };
      },

      checkOverlaps: () => {
        const state = get();
        if (state.overlapWorker) {
          state.overlapWorker.postMessage({
            tables: state.tables,
            action: 'checkOverlaps'
          });
        }
      },

      resolveOverlap: (tableId1, tableId2) => {
        const state = get();
        const table1 = state.tables.find(t => t.id === tableId1);
        const table2 = state.tables.find(t => t.id === tableId2);
        
        if (table1 && table2) {
          // Simple resolution: move table2 to the right
          get().moveTable(tableId2, table2.x + table1.w + 20, table2.y);
        }
      },

      // Grid & Positioning
      setGridSize: (size) => {
        set({ gridSize: size, isDirty: true });
      },

      toggleSnapToGrid: () => {
        const state = get();
        set({ snapToGrid: !state.snapToGrid });
      },

      nudgeTable: (id, direction) => {
        const state = get();
        const table = state.tables.find(t => t.id === id);
        if (!table) return;
        
        const nudgeDistance = state.gridSize;
        let newX = table.x;
        let newY = table.y;
        
        switch (direction) {
          case 'up':
            newY = Math.max(0, table.y - nudgeDistance);
            break;
          case 'down':
            newY = Math.min(state.floorBounds.height - table.h, table.y + nudgeDistance);
            break;
          case 'left':
            newX = Math.max(0, table.x - nudgeDistance);
            break;
          case 'right':
            newX = Math.min(state.floorBounds.width - table.w, table.x + nudgeDistance);
            break;
        }
        
        get().moveTable(id, newX, newY);
      },

      alignTables: (tableIds, alignment) => {
        const state = get();
        const tables = state.tables.filter(t => tableIds.includes(t.id));
        if (tables.length < 2) return;
        
        let referenceValue: number;
        
        switch (alignment) {
          case 'left':
            referenceValue = Math.min(...tables.map(t => t.x));
            tables.forEach(table => get().moveTable(table.id, referenceValue, table.y));
            break;
          case 'right':
            referenceValue = Math.max(...tables.map(t => t.x + t.w));
            tables.forEach(table => get().moveTable(table.id, referenceValue - table.w, table.y));
            break;
          case 'top':
            referenceValue = Math.min(...tables.map(t => t.y));
            tables.forEach(table => get().moveTable(table.id, table.x, referenceValue));
            break;
          case 'bottom':
            referenceValue = Math.max(...tables.map(t => t.y + t.h));
            tables.forEach(table => get().moveTable(table.id, table.x, referenceValue - table.h));
            break;
          case 'center':
            const centerX = tables.reduce((sum, t) => sum + t.x + t.w/2, 0) / tables.length;
            const centerY = tables.reduce((sum, t) => sum + t.y + t.h/2, 0) / tables.length;
            tables.forEach(table => get().moveTable(table.id, centerX - table.w/2, centerY - table.h/2));
            break;
        }
        
        get().saveToHistory();
      },

      distributeTablesEvenly: (tableIds, axis) => {
        const state = get();
        const tables = state.tables.filter(t => tableIds.includes(t.id));
        if (tables.length < 3) return;
        
        tables.sort((a, b) => axis === 'horizontal' ? a.x - b.x : a.y - b.y);
        
        const first = tables[0];
        const last = tables[tables.length - 1];
        
        if (axis === 'horizontal') {
          const totalDistance = (last.x + last.w) - first.x;
          const spacing = totalDistance / (tables.length - 1);
          
          tables.forEach((table, index) => {
            if (index > 0 && index < tables.length - 1) {
              const newX = first.x + (spacing * index);
              get().moveTable(table.id, newX, table.y);
            }
          });
        } else {
          const totalDistance = (last.y + last.h) - first.y;
          const spacing = totalDistance / (tables.length - 1);
          
          tables.forEach((table, index) => {
            if (index > 0 && index < tables.length - 1) {
              const newY = first.y + (spacing * index);
              get().moveTable(table.id, table.x, newY);
            }
          });
        }
        
        get().saveToHistory();
      },

      // View Management
      setViewMode: (mode) => {
        set({ viewMode: mode });
      },

      toggleGrid: () => {
        const state = get();
        set({ showGrid: !state.showGrid });
      },

      toggleZones: () => {
        const state = get();
        set({ showZones: !state.showZones });
      },

      resetView: () => {
        set({
          selectedTableIds: [],
          selectedTablesForMerge: [],
          error: null
        });
      },

      // Real-time Status
      updateTableStatus: (tableId, status) => {
        get().updateTable(tableId, { status });
        
        const state = get();
        set({
          tableStates: {
            ...state.tableStates,
            [tableId]: status
          },
          availableTables: state.tables.filter(t => t.status === 'FREE').length
        });
      },

      updateTableStates: (states) => {
        set({ 
          tableStates: states,
          availableTables: Object.values(states).filter(status => status === 'FREE').length
        });
      },

      // WebSocket Management
      connectWebSocket: () => {
        if (typeof window !== 'undefined') {
          // WebSocket implementation would go here
          set({ wsConnected: true });
        }
      },

      disconnectWebSocket: () => {
        set({ wsConnected: false });
      },

      handleTableEvent: (event) => {
        switch (event.type) {
          case 'TABLE_STATUS_CHANGED':
            if (event.tableId) {
              get().updateTableStatus(event.tableId, event.data.status);
            }
            break;
          case 'LAYOUT_ACTIVATED':
            set({ isDraftMode: false });
            break;
          // Add more event handlers as needed
        }
      },

      // Utility Functions
      getTable: (id) => {
        const state = get();
        return state.tables.find(t => t.id === id);
      },

      getTablesInZone: (zoneId) => {
        const state = get();
        return state.tables.filter(t => t.zone === zoneId);
      },

      getOverlappingTables: (tableId) => {
        const state = get();
        const overlaps = state.overlappingTableIds.filter(pair => pair.includes(tableId));
        const overlappingIds = overlaps.flat().filter(id => id !== tableId);
        return state.tables.filter(t => overlappingIds.includes(t.id));
      },

      findNearestTable: (x, y) => {
        const state = get();
        return state.tables.reduce((nearest, table) => {
          const centerX = table.x + table.w / 2;
          const centerY = table.y + table.h / 2;
          const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
          
          if (!nearest || distance < nearest.distance) {
            return { table, distance };
          }
          
          return nearest;
        }, null as { table: Table; distance: number } | null)?.table;
      },

      // Cleanup
      cleanup: () => {
        const state = get();
        if (state.overlapWorker) {
          state.overlapWorker.terminate();
        }
        if (state.chairWorker) {
          state.chairWorker.terminate();
        }
        set({ overlapWorker: null, chairWorker: null });
      }
    }),
    {
      name: 'table-management-store',
      partialize: (state) => ({
        tables: state.tables,
        zones: state.zones,
        fixtures: state.fixtures,
        gridSize: state.gridSize,
        snapToGrid: state.snapToGrid,
        viewMode: state.viewMode,
        showGrid: state.showGrid,
        showZones: state.showZones,
        floorBounds: state.floorBounds
      })
    }
  )
);

// Initialize workers on mount
if (typeof window !== 'undefined') {
  useTableStore.getState().init?.();
}
