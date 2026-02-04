export interface TableDef {
  id: string;
  name: string;
  occupancy: number;
  // Add more table metadata fields as needed
}

export interface AreaDef {
  id: string;
  name: string;
  icon: string;
  maxTables: number;
  tables: TableDef[];
}

export interface DiningSetupData {
  areas: AreaDef[];
}

const STORAGE_KEY = 'diningSetup';

export function getDiningSetup(): DiningSetupData {
  if (typeof window === 'undefined') return { areas: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { areas: [] };
    return JSON.parse(raw);
  } catch {
    return { areas: [] };
  }
}

export function setDiningSetup(data: DiningSetupData) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
} 