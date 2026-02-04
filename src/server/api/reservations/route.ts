import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const RESERVATIONS_PATH = path.join(process.cwd(), 'reservations.json');

function readReservations() {
  if (!fs.existsSync(RESERVATIONS_PATH)) return [];
  try {
    const data = fs.readFileSync(RESERVATIONS_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function writeReservations(reservations: any[]) {
  fs.writeFileSync(RESERVATIONS_PATH, JSON.stringify(reservations, null, 2), 'utf-8');
}

export async function GET(req: NextRequest) {
  console.log('[API] /api/reservations GET called at', new Date().toISOString(), '\nStack:', new Error().stack);
  const reservations = readReservations();
  return NextResponse.json({ reservations });
}

export async function POST(req: NextRequest) {
  console.log('[API] /api/reservations POST called at', new Date().toISOString(), '\nStack:', new Error().stack);
  const body = await req.json();
  let reservations = readReservations();
  if (body.action === 'delete' && body.id) {
    reservations = reservations.filter((r: any) => r.id !== body.id);
    writeReservations(reservations);
    return NextResponse.json({ success: true });
  }
  // Add or update
  if (body.reservation) {
    const idx = reservations.findIndex((r: any) => r.id === body.reservation.id);
    if (idx >= 0) {
      reservations[idx] = { ...reservations[idx], ...body.reservation };
    } else {
      reservations.push(body.reservation);
    }
    writeReservations(reservations);
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
} 