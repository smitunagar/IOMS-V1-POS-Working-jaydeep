import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

export type WasteQueueStatus = 'pending' | 'processing' | 'done' | 'error';

export interface WasteQueueItem {
  id: number;
  imageData: string;
  weightKg: number | null;
  status: WasteQueueStatus;
  createdAt: string;
  updatedAt: string;
  result?: any;
  error?: string | null;
}

const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'waste-queue.sqlite');

let db: Database.Database | null = null;

function getDb() {
  if (!db) {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.exec(`
      CREATE TABLE IF NOT EXISTS waste_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        image_data TEXT NOT NULL,
        weight_kg REAL,
        status TEXT NOT NULL DEFAULT 'pending',
        result_json TEXT,
        error TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
  }
  return db;
}

export function enqueueWaste(imageData: string, weightKg: number | null) {
  const now = new Date().toISOString();
  const stmt = getDb().prepare(
    `INSERT INTO waste_queue (image_data, weight_kg, status, created_at, updated_at)
     VALUES (?, ?, 'pending', ?, ?)`
  );
  const info = stmt.run(imageData, weightKg, now, now);
  return Number(info.lastInsertRowid);
}

export function listWasteQueue(limit = 20): WasteQueueItem[] {
  const stmt = getDb().prepare(
    `SELECT id, image_data, weight_kg, status, result_json, error, created_at, updated_at
     FROM waste_queue
     ORDER BY id DESC
     LIMIT ?`
  );
  return stmt.all(limit).map((row: any) => ({
    id: row.id,
    imageData: row.image_data,
    weightKg: row.weight_kg,
    status: row.status,
    result: row.result_json ? JSON.parse(row.result_json) : undefined,
    error: row.error,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export function getNextPending(): WasteQueueItem | null {
  const stmt = getDb().prepare(
    `SELECT id, image_data, weight_kg, status, result_json, error, created_at, updated_at
     FROM waste_queue
     WHERE status = 'pending'
     ORDER BY id ASC
     LIMIT 1`
  );
  const row = stmt.get() as any;
  if (!row) return null;
  return {
    id: row.id,
    imageData: row.image_data,
    weightKg: row.weight_kg,
    status: row.status,
    result: row.result_json ? JSON.parse(row.result_json) : undefined,
    error: row.error,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  } as WasteQueueItem;
}

export function markProcessing(id: number) {
  const now = new Date().toISOString();
  const stmt = getDb().prepare(
    `UPDATE waste_queue SET status = 'processing', updated_at = ? WHERE id = ?`
  );
  stmt.run(now, id);
}

export function markDone(id: number, result: any) {
  const now = new Date().toISOString();
  const stmt = getDb().prepare(
    `UPDATE waste_queue SET status = 'done', result_json = ?, updated_at = ? WHERE id = ?`
  );
  stmt.run(JSON.stringify(result), now, id);
}

export function markError(id: number, error: string) {
  const now = new Date().toISOString();
  const stmt = getDb().prepare(
    `UPDATE waste_queue SET status = 'error', error = ?, updated_at = ? WHERE id = ?`
  );
  stmt.run(error, now, id);
}
