import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// Types
export interface Table3D {
  id: string;
  number: string;
  seats: number;
  status: 'FREE' | 'SEATED' | 'DIRTY' | 'RESERVED';
  zone?: string;
  shape: 'circle' | 'square' | 'rectangle';
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  depth: number;
  rotation: number;
  childIds?: string[]; // For merged tables
  parentId?: string;   // For split tables
}

export interface Chair3D {
  id: string;
  tableId: string;
  x: number;
  y: number;
  z: number;
  rotation: number;
  seatNumber: number;
}

export interface Wall3D {
  id: string;
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  depth: number;
  rotation: number;
  color: string;
  material: string;
}

export interface Fixture3D {
  id: string;
  type: 'door' | 'window' | 'bar' | 'restroom' | 'stage' | 'column' | 'kitchen';
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  depth: number;
  rotation: number;
  label?: string;
  meta?: Record<string, any>;
}

export interface Zone3D {
  id: string;
  name: string;
  color: string;
  tableIds: string[];
  boundary: { x: number; y: number }[];
}

export interface FloorPlan3D {
  id: string;
  name: string;
  width: number;
  height: number;
  depth: number;
  scale: number;
  gridSize: number;
  walls: Wall3D[];
  zones: Zone3D[];
  metadata?: Record<string, any>;
}

export interface Camera3D {
  position: [number, number, number];
  target: [number, number, number];
  zoom: number;
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  action: string;
  data: any;
  description: string;
}

// Store interface
interface TableManagementStore {
  // State
  floorPlan: FloorPlan3D;
  tables: Table3D[];
  chairs: Chair3D[];
  fixtures: Fixture3D[];
  selectedObject: Table3D | Fixture3D | null;
  selectedObjectType: 'table' | 'fixture' | null;
  dragState: {
    isDragging: boolean;
    objectId: string | null;
    objectType: 'table' | 'fixture' | null;
    startPosition: { x: number; y: number; z: number };
    offset: { x: number; y: number; z: number };
  };
  camera: Camera3D;
  mode: '2D' | '3D';
  editMode: 'select' | 'add-table' | 'add-wall' | 'add-fixture' | 'measure';
  snapToGrid: boolean;
  showGrid: boolean;
  showMiniMap: boolean;
  
  // History for undo/redo
  history: HistoryEntry[];
  historyIndex: number;
  maxHistorySize: number;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  lastSaved: Date | null;
  isDirty: boolean;
  version: number;
  
  // Actions
  setFloorPlan: (floorPlan: FloorPlan3D) => void;
  updateFloorPlan: (updates: Partial<FloorPlan3D>) => void;
  
  // Table Management
  addTable: (table: Omit<Table3D, 'id'>) => void;
  updateTable: (id: string, updates: Partial<Table3D>) => void;
  deleteTable: (id: string) => void;
  mergeTable: (sourceId: string, targetId: string) => void;
  splitTable: (id: string, newTableData: Omit<Table3D, 'id' | 'parentId'>[]) => void;
  duplicateTable: (id: string) => void;
  
  // Chair Management
  updateChairsForTable: (tableId: string) => void;
  generateChairPositions: (table: Table3D) => Chair3D[];
  
  // Fixture Management
  addFixture: (fixture: Omit<Fixture3D, 'id'>) => void;
  updateFixture: (id: string, updates: Partial<Fixture3D>) => void;
  deleteFixture: (id: string) => void;
  
  // Wall Management
  addWall: (wall: Omit<Wall3D, 'id'>) => void;
  updateWall: (id: string, updates: Partial<Wall3D>) => void;
  deleteWall: (id: string) => void;
  
  // Selection
  selectObject: (object: Table3D | Fixture3D | null, type: 'table' | 'fixture' | null) => void;
  clearSelection: () => void;
  
  // Drag & Drop
  startDrag: (objectId: string, objectType: 'table' | 'fixture', startPosition: { x: number; y: number; z: number }, offset: { x: number; y: number; z: number }) => void;
  updateDrag: (newPosition: { x: number; y: number; z: number }) => void;
  endDrag: () => void;
  
  // Camera
  updateCamera: (camera: Partial<Camera3D>) => void;
  resetCamera: () => void;
  focusOnObject: (objectId: string, objectType: 'table' | 'fixture') => void;
  
  // Mode & Settings
  setMode: (mode: '2D' | '3D') => void;
  setEditMode: (mode: 'select' | 'add-table' | 'add-wall' | 'add-fixture' | 'measure') => void;
  toggleSnapToGrid: () => void;
  toggleGrid: () => void;
  toggleMiniMap: () => void;
  
  // History Management
  addToHistory: (action: string, data: any, description: string) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearHistory: () => void;
  
  // Utility
  checkCollisions: (objectId: string, position: { x: number; y: number; z: number }, size: { width: number; height: number; depth: number }) => boolean;
  snapToGridPosition: (position: { x: number; y: number; z: number }) => { x: number; y: number; z: number };
  generateUniqueTableNumber: () => string;
  calculateFloorUtilization: () => { utilization: number; totalArea: number; occupiedArea: number; walkwayArea: number };
  
  // Persistence
  saveLayout: () => Promise<void>;
  loadLayout: (layoutId: string) => Promise<void>;
  exportLayout: (format: 'json' | 'gltf' | 'pdf') => Promise<string>;
  importLayout: (data: string, format: 'json' | 'gltf') => Promise<void>;
  
  // Real-time updates
  updateTableStatus: (tableId: string, status: Table3D['status']) => void;
  subscribeToStatusUpdates: () => void;
  unsubscribeFromStatusUpdates: () => void;
}

// Default values
const defaultFloorPlan: FloorPlan3D = {
  id: 'main-floor',
  name: 'Main Dining Area',
  width: 40,
  height: 30,
  depth: 3,
  scale: 1,
  gridSize: 1,
  walls: [],
  zones: [],
  metadata: {}
};

const defaultCamera: Camera3D = {
  position: [0, 20, 20],
  target: [0, 0, 0],
  zoom: 1
};

// Store implementation
export const useTableManagementStore = create<TableManagementStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    floorPlan: defaultFloorPlan,
    tables: [],
    chairs: [],
    fixtures: [],
    selectedObject: null,
    selectedObjectType: null,
    dragState: {
      isDragging: false,
      objectId: null,
      objectType: null,
      startPosition: { x: 0, y: 0, z: 0 },
      offset: { x: 0, y: 0, z: 0 }
    },
    camera: defaultCamera,
    mode: '3D',
    editMode: 'select',
    snapToGrid: true,
    showGrid: true,
    showMiniMap: true,
    
    history: [],
    historyIndex: -1,
    maxHistorySize: 20,
    
    isLoading: false,
    error: null,
    lastSaved: null,
    isDirty: false,
    version: 1,

    // Actions implementation
    setFloorPlan: (floorPlan) => {
      set({ floorPlan, isDirty: true });
      get().addToHistory('SET_FLOOR_PLAN', floorPlan, `Set floor plan: ${floorPlan.name}`);
    },

    updateFloorPlan: (updates) => {
      const currentPlan = get().floorPlan;
      const newPlan = { ...currentPlan, ...updates };
      set({ floorPlan: newPlan, isDirty: true });
      get().addToHistory('UPDATE_FLOOR_PLAN', updates, 'Updated floor plan');
    },

    addTable: (tableData) => {
      const id = `table-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const table: Table3D = { ...tableData, id };
      
      set(state => ({
        tables: [...state.tables, table],
        isDirty: true
      }));
      
      // Generate chairs for the new table
      get().updateChairsForTable(id);
      get().addToHistory('ADD_TABLE', table, `Added table ${table.number}`);
    },

    updateTable: (id, updates) => {
      set(state => ({
        tables: state.tables.map(table => 
          table.id === id ? { ...table, ...updates } : table
        ),
        isDirty: true
      }));
      
      // Update chairs if seat count changed
      if (updates.seats !== undefined) {
        get().updateChairsForTable(id);
      }
      
      get().addToHistory('UPDATE_TABLE', { id, updates }, `Updated table ${id}`);
    },

    deleteTable: (id) => {
      const table = get().tables.find(t => t.id === id);
      if (!table) return;
      
      set(state => ({
        tables: state.tables.filter(t => t.id !== id),
        chairs: state.chairs.filter(c => c.tableId !== id),
        selectedObject: state.selectedObject?.id === id ? null : state.selectedObject,
        selectedObjectType: state.selectedObject?.id === id ? null : state.selectedObjectType,
        isDirty: true
      }));
      
      get().addToHistory('DELETE_TABLE', table, `Deleted table ${table.number}`);
    },

    mergeTable: (sourceId, targetId) => {
      const sourceTable = get().tables.find(t => t.id === sourceId);
      const targetTable = get().tables.find(t => t.id === targetId);
      
      if (!sourceTable || !targetTable) return;
      
      const mergedTable: Table3D = {
        ...targetTable,
        seats: sourceTable.seats + targetTable.seats,
        childIds: [sourceId, targetId],
        width: Math.max(sourceTable.width, targetTable.width),
        height: Math.max(sourceTable.height, targetTable.height)
      };
      
      set(state => ({
        tables: state.tables.filter(t => t.id !== sourceId).map(t => 
          t.id === targetId ? mergedTable : t
        ),
        chairs: state.chairs.filter(c => c.tableId !== sourceId),
        isDirty: true
      }));
      
      get().updateChairsForTable(targetId);
      get().addToHistory('MERGE_TABLES', { sourceId, targetId }, `Merged tables ${sourceTable.number} and ${targetTable.number}`);
    },

    splitTable: (id, newTableData) => {
      const originalTable = get().tables.find(t => t.id === id);
      if (!originalTable) return;
      
      const newTables = newTableData.map((data, index) => ({
        ...data,
        id: `${id}-split-${index + 1}`,
        parentId: id
      }));
      
      set(state => ({
        tables: [
          ...state.tables.filter(t => t.id !== id),
          ...newTables
        ],
        chairs: state.chairs.filter(c => c.tableId !== id),
        isDirty: true
      }));
      
      // Generate chairs for new tables
      newTables.forEach(table => get().updateChairsForTable(table.id));
      get().addToHistory('SPLIT_TABLE', { originalId: id, newTables }, `Split table ${originalTable.number}`);
    },

    duplicateTable: (id) => {
      const originalTable = get().tables.find(t => t.id === id);
      if (!originalTable) return;
      
      const duplicatedTable: Table3D = {
        ...originalTable,
        id: `table-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        number: get().generateUniqueTableNumber(),
        x: originalTable.x + 2,
        y: originalTable.y + 2
      };
      
      get().addTable(duplicatedTable);
    },

    updateChairsForTable: (tableId) => {
      const table = get().tables.find(t => t.id === tableId);
      if (!table) return;
      
      const newChairs = get().generateChairPositions(table);
      
      set(state => ({
        chairs: [
          ...state.chairs.filter(c => c.tableId !== tableId),
          ...newChairs
        ]
      }));
    },

    generateChairPositions: (table) => {
      const chairs: Chair3D[] = [];
      const chairSpacing = 0.8; // meters
      const tableRadius = Math.max(table.width, table.height) / 2 + 0.5;
      
      if (table.shape === 'circle') {
        for (let i = 0; i < table.seats; i++) {
          const angle = (i / table.seats) * Math.PI * 2;
          chairs.push({
            id: `chair-${table.id}-${i}`,
            tableId: table.id,
            x: table.x + Math.cos(angle) * tableRadius,
            y: table.y + Math.sin(angle) * tableRadius,
            z: table.z,
            rotation: angle + Math.PI,
            seatNumber: i + 1
          });
        }
      } else {
        // Rectangular/square tables - distribute around perimeter
        const perimeter = 2 * (table.width + table.height);
        const seatsPerSide = Math.ceil(table.seats / 4);
        
        for (let i = 0; i < table.seats; i++) {
          const side = Math.floor(i / seatsPerSide);
          const positionOnSide = i % seatsPerSide;
          let x = table.x, y = table.y, rotation = 0;
          
          switch (side) {
            case 0: // Top
              x = table.x - table.width/2 + (positionOnSide / seatsPerSide) * table.width;
              y = table.y - table.height/2 - 0.5;
              rotation = Math.PI/2;
              break;
            case 1: // Right
              x = table.x + table.width/2 + 0.5;
              y = table.y - table.height/2 + (positionOnSide / seatsPerSide) * table.height;
              rotation = Math.PI;
              break;
            case 2: // Bottom
              x = table.x + table.width/2 - (positionOnSide / seatsPerSide) * table.width;
              y = table.y + table.height/2 + 0.5;
              rotation = -Math.PI/2;
              break;
            case 3: // Left
              x = table.x - table.width/2 - 0.5;
              y = table.y + table.height/2 - (positionOnSide / seatsPerSide) * table.height;
              rotation = 0;
              break;
          }
          
          chairs.push({
            id: `chair-${table.id}-${i}`,
            tableId: table.id,
            x, y, z: table.z,
            rotation,
            seatNumber: i + 1
          });
        }
      }
      
      return chairs;
    },

    addFixture: (fixtureData) => {
      const id = `fixture-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const fixture: Fixture3D = { ...fixtureData, id };
      
      set(state => ({
        fixtures: [...state.fixtures, fixture],
        isDirty: true
      }));
      
      get().addToHistory('ADD_FIXTURE', fixture, `Added ${fixture.type} fixture`);
    },

    updateFixture: (id, updates) => {
      set(state => ({
        fixtures: state.fixtures.map(fixture => 
          fixture.id === id ? { ...fixture, ...updates } : fixture
        ),
        isDirty: true
      }));
      
      get().addToHistory('UPDATE_FIXTURE', { id, updates }, `Updated fixture ${id}`);
    },

    deleteFixture: (id) => {
      const fixture = get().fixtures.find(f => f.id === id);
      if (!fixture) return;
      
      set(state => ({
        fixtures: state.fixtures.filter(f => f.id !== id),
        selectedObject: state.selectedObject?.id === id ? null : state.selectedObject,
        selectedObjectType: state.selectedObject?.id === id ? null : state.selectedObjectType,
        isDirty: true
      }));
      
      get().addToHistory('DELETE_FIXTURE', fixture, `Deleted ${fixture.type} fixture`);
    },

    addWall: (wallData) => {
      const id = `wall-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const wall: Wall3D = { ...wallData, id };
      
      set(state => ({
        floorPlan: {
          ...state.floorPlan,
          walls: [...state.floorPlan.walls, wall]
        },
        isDirty: true
      }));
      
      get().addToHistory('ADD_WALL', wall, 'Added wall');
    },

    updateWall: (id, updates) => {
      set(state => ({
        floorPlan: {
          ...state.floorPlan,
          walls: state.floorPlan.walls.map(wall => 
            wall.id === id ? { ...wall, ...updates } : wall
          )
        },
        isDirty: true
      }));
      
      get().addToHistory('UPDATE_WALL', { id, updates }, `Updated wall ${id}`);
    },

    deleteWall: (id) => {
      const wall = get().floorPlan.walls.find(w => w.id === id);
      if (!wall) return;
      
      set(state => ({
        floorPlan: {
          ...state.floorPlan,
          walls: state.floorPlan.walls.filter(w => w.id !== id)
        },
        isDirty: true
      }));
      
      get().addToHistory('DELETE_WALL', wall, 'Deleted wall');
    },

    selectObject: (object, type) => {
      set({ selectedObject: object, selectedObjectType: type });
    },

    clearSelection: () => {
      set({ selectedObject: null, selectedObjectType: null });
    },

    startDrag: (objectId, objectType, startPosition, offset) => {
      set({
        dragState: {
          isDragging: true,
          objectId,
          objectType,
          startPosition,
          offset
        }
      });
    },

    updateDrag: (newPosition) => {
      const { dragState } = get();
      if (!dragState.isDragging || !dragState.objectId) return;
      
      const adjustedPosition = {
        x: newPosition.x - dragState.offset.x,
        y: newPosition.y - dragState.offset.y,
        z: newPosition.z - dragState.offset.z
      };
      
      const snappedPosition = get().snapToGrid ? get().snapToGridPosition(adjustedPosition) : adjustedPosition;
      
      if (dragState.objectType === 'table') {
        get().updateTable(dragState.objectId, snappedPosition);
      } else if (dragState.objectType === 'fixture') {
        get().updateFixture(dragState.objectId, snappedPosition);
      }
    },

    endDrag: () => {
      set({
        dragState: {
          isDragging: false,
          objectId: null,
          objectType: null,
          startPosition: { x: 0, y: 0, z: 0 },
          offset: { x: 0, y: 0, z: 0 }
        }
      });
    },

    updateCamera: (camera) => {
      set(state => ({
        camera: { ...state.camera, ...camera }
      }));
    },

    resetCamera: () => {
      set({ camera: defaultCamera });
    },

    focusOnObject: (objectId, objectType) => {
      let object;
      if (objectType === 'table') {
        object = get().tables.find(t => t.id === objectId);
      } else if (objectType === 'fixture') {
        object = get().fixtures.find(f => f.id === objectId);
      }
      
      if (object) {
        get().updateCamera({
          target: [object.x, object.y, object.z],
          position: [object.x, object.y + 10, object.z + 10]
        });
      }
    },

    setMode: (mode) => set({ mode }),
    setEditMode: (editMode) => set({ editMode }),
    toggleSnapToGrid: () => set(state => ({ snapToGrid: !state.snapToGrid })),
    toggleGrid: () => set(state => ({ showGrid: !state.showGrid })),
    toggleMiniMap: () => set(state => ({ showMiniMap: !state.showMiniMap })),

    addToHistory: (action, data, description) => {
      const entry: HistoryEntry = {
        id: `history-${Date.now()}`,
        timestamp: Date.now(),
        action,
        data: JSON.parse(JSON.stringify(data)), // Deep clone
        description
      };
      
      set(state => {
        const newHistory = state.history.slice(0, state.historyIndex + 1);
        newHistory.push(entry);
        
        if (newHistory.length > state.maxHistorySize) {
          newHistory.shift();
        }
        
        return {
          history: newHistory,
          historyIndex: newHistory.length - 1
        };
      });
    },

    undo: () => {
      const { history, historyIndex } = get();
      if (historyIndex <= 0) return;
      
      const entry = history[historyIndex - 1];
      // TODO: Implement state restoration based on entry.action
      
      set({ historyIndex: historyIndex - 1 });
    },

    redo: () => {
      const { history, historyIndex } = get();
      if (historyIndex >= history.length - 1) return;
      
      const entry = history[historyIndex + 1];
      // TODO: Implement state restoration based on entry.action
      
      set({ historyIndex: historyIndex + 1 });
    },

    canUndo: () => get().historyIndex > 0,
    canRedo: () => get().historyIndex < get().history.length - 1,
    clearHistory: () => set({ history: [], historyIndex: -1 }),

    checkCollisions: (objectId, position, size) => {
      const { tables, fixtures } = get();
      
      for (const table of tables) {
        if (table.id === objectId) continue;
        
        const distance = Math.sqrt(
          Math.pow(table.x - position.x, 2) + 
          Math.pow(table.y - position.y, 2)
        );
        
        const minDistance = (Math.max(table.width, table.height) + Math.max(size.width, size.height)) / 2 + 0.5;
        
        if (distance < minDistance) return true;
      }
      
      for (const fixture of fixtures) {
        if (fixture.id === objectId) continue;
        
        // Simple AABB collision detection
        if (position.x < fixture.x + fixture.width &&
            position.x + size.width > fixture.x &&
            position.y < fixture.y + fixture.height &&
            position.y + size.height > fixture.y) {
          return true;
        }
      }
      
      return false;
    },

    snapToGridPosition: (position) => {
      const { floorPlan } = get();
      const gridSize = floorPlan.gridSize;
      
      return {
        x: Math.round(position.x / gridSize) * gridSize,
        y: Math.round(position.y / gridSize) * gridSize,
        z: Math.round(position.z / gridSize) * gridSize
      };
    },

    generateUniqueTableNumber: () => {
      const { tables } = get();
      const existingNumbers = new Set(tables.map(t => t.number));
      
      for (let i = 1; i <= 999; i++) {
        const number = `T${i}`;
        if (!existingNumbers.has(number)) {
          return number;
        }
      }
      
      return `T${Date.now()}`;
    },

    calculateFloorUtilization: () => {
      const { floorPlan, tables } = get();
      const totalArea = floorPlan.width * floorPlan.height;
      
      const occupiedArea = tables.reduce((sum, table) => {
        return sum + (table.width * table.height);
      }, 0);
      
      const utilization = totalArea > 0 ? (occupiedArea / totalArea) * 100 : 0;
      const walkwayArea = totalArea - occupiedArea;
      
      return {
        utilization,
        totalArea,
        occupiedArea,
        walkwayArea
      };
    },

    saveLayout: async () => {
      set({ isLoading: true, error: null });
      
      try {
        const state = get();
        const layoutData = {
          floorPlan: state.floorPlan,
          tables: state.tables,
          fixtures: state.fixtures,
          version: state.version + 1
        };
        
        // TODO: Implement actual API call
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
        
        set({ 
          isLoading: false, 
          lastSaved: new Date(), 
          isDirty: false,
          version: state.version + 1
        });
      } catch (error) {
        set({ 
          isLoading: false, 
          error: error instanceof Error ? error.message : 'Failed to save layout'
        });
      }
    },

    loadLayout: async (layoutId) => {
      set({ isLoading: true, error: null });
      
      try {
        // TODO: Implement actual API call
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
        
        set({ isLoading: false });
      } catch (error) {
        set({ 
          isLoading: false, 
          error: error instanceof Error ? error.message : 'Failed to load layout'
        });
      }
    },

    exportLayout: async (format) => {
      // TODO: Implement export functionality
      return 'exported-data';
    },

    importLayout: async (data, format) => {
      // TODO: Implement import functionality
    },

    updateTableStatus: (tableId, status) => {
      get().updateTable(tableId, { status });
    },

    subscribeToStatusUpdates: () => {
      // TODO: Implement WebSocket subscription
    },

    unsubscribeFromStatusUpdates: () => {
      // TODO: Implement WebSocket unsubscription
    }
  }))
);

// Selectors
export const useFloorPlan = () => useTableManagementStore(state => state.floorPlan);
export const useTables = () => useTableManagementStore(state => state.tables);
export const useChairs = () => useTableManagementStore(state => state.chairs);
export const useFixtures = () => useTableManagementStore(state => state.fixtures);
export const useSelectedObject = () => useTableManagementStore(state => ({ 
  object: state.selectedObject, 
  type: state.selectedObjectType 
}));
export const useDragState = () => useTableManagementStore(state => state.dragState);
export const useCamera = () => useTableManagementStore(state => state.camera);
export const useEditMode = () => useTableManagementStore(state => state.editMode);
export const useHistory = () => useTableManagementStore(state => ({
  history: state.history,
  historyIndex: state.historyIndex,
  canUndo: state.canUndo(),
  canRedo: state.canRedo()
}));
