// Client-side proxy for dining setup storage service
// This file provides client-side access to dining setup functionality
// by calling the server-side API endpoints

export interface AreaDef {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  type: 'dining' | 'bar' | 'kitchen' | 'waiting' | 'outdoor';
}

export interface TableDef {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  seats: number;
  shape: 'rectangle' | 'circle' | 'oval';
  areaId: string;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  color: string;
}

export interface DiningSetup {
  id: string;
  name: string;
  areas: AreaDef[];
  tables: TableDef[];
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export async function getDiningSetup(setupId?: string): Promise<DiningSetup | null> {
  try {
    const url = setupId ? `/api/dining/setup/${setupId}` : '/api/dining/setup/active';
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch dining setup');
    }
    const data = await response.json();
    return data.setup;
  } catch (error) {
    console.error('Error fetching dining setup:', error);
    return null;
  }
}

export async function setDiningSetup(setup: Omit<DiningSetup, 'id' | 'createdAt' | 'updatedAt'>): Promise<DiningSetup | null> {
  try {
    const response = await fetch('/api/dining/setup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(setup),
    });
    if (!response.ok) {
      throw new Error('Failed to save dining setup');
    }
    const data = await response.json();
    return data.setup;
  } catch (error) {
    console.error('Error saving dining setup:', error);
    return null;
  }
}

export async function updateDiningSetup(setupId: string, updates: Partial<DiningSetup>): Promise<DiningSetup | null> {
  try {
    const response = await fetch(`/api/dining/setup/${setupId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      throw new Error('Failed to update dining setup');
    }
    const data = await response.json();
    return data.setup;
  } catch (error) {
    console.error('Error updating dining setup:', error);
    return null;
  }
}

export async function deleteDiningSetup(setupId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/dining/setup/${setupId}`, {
      method: 'DELETE',
    });
    return response.ok;
  } catch (error) {
    console.error('Error deleting dining setup:', error);
    return false;
  }
}

export async function getAllDiningSetups(): Promise<DiningSetup[]> {
  try {
    const response = await fetch('/api/dining/setup');
    if (!response.ok) {
      throw new Error('Failed to fetch dining setups');
    }
    const data = await response.json();
    return data.setups || [];
  } catch (error) {
    console.error('Error fetching dining setups:', error);
    return [];
  }
}

export async function activateDiningSetup(setupId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/dining/setup/${setupId}/activate`, {
      method: 'POST',
    });
    return response.ok;
  } catch (error) {
    console.error('Error activating dining setup:', error);
    return false;
  }
}











