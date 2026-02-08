/* eslint-disable no-console */
const http = require('http');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const WebSocket = require('ws');

const SERIAL_PORT = process.env.SCALE_SERIAL_PORT || '/dev/cu.usbserial-BG02Q7V9';
const SERIAL_BAUD = Number(process.env.SCALE_BAUD || 9600);
const HTTP_PORT = Number(process.env.SCALE_HTTP_PORT || 8787);
const SCALE_UNIT = process.env.SCALE_UNIT || 'g';
const SCALE_DELIMITER = process.env.SCALE_DELIMITER || '\n';
const SCALE_LOG_RAW = process.env.SCALE_LOG_RAW === 'true';
const SCALE_POLL_COMMAND = process.env.SCALE_POLL_COMMAND || 'SI';
const SCALE_POLL_INTERVAL_MS = Number(process.env.SCALE_POLL_INTERVAL_MS || 1000);

let latestWeight = null;
let latestRaw = null;
let latestTimestamp = null;
let stableWeight = null;

// --- Stabilization config ---
const STABLE_WINDOW = 5;          // number of readings in sliding window
const STABLE_THRESHOLD = 1.0;     // grams – ignore changes smaller than this
const weightBuffer = [];           // ring buffer of recent readings

const extractWeight = (line) => {
  if (!line) return null;
  const normalized = line.replace(/,/g, '.');
  const match = normalized.match(/(-?\d+(?:\.\d+)?)/);
  if (!match) return null;
  const value = Number(match[1]);
  if (Number.isNaN(value)) return null;
  return value;
};

const median = (arr) => {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
};

const stabilize = (rawValue) => {
  weightBuffer.push(rawValue);
  if (weightBuffer.length > STABLE_WINDOW) {
    weightBuffer.shift();
  }
  if (weightBuffer.length < 2) return rawValue;
  const med = median(weightBuffer);
  // Only update stable weight when change exceeds threshold
  if (stableWeight === null || Math.abs(med - stableWeight) >= STABLE_THRESHOLD) {
    stableWeight = Math.round(med * 100) / 100; // round to 0.01g
  }
  return stableWeight;
};

const updateWeight = (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;
  if (SCALE_LOG_RAW) {
    console.log('📥 Scale raw:', trimmed);
  }
  const value = extractWeight(trimmed);
  if (value === null) return;
  latestRaw = trimmed;
  latestTimestamp = new Date().toISOString();

  const stable = stabilize(value);
  // Only broadcast when the stable weight actually changes
  if (latestWeight !== null && stable === latestWeight) return;
  latestWeight = stable;
  broadcast({
    type: 'weight',
    weight: latestWeight,
    unit: SCALE_UNIT,
    raw: latestRaw,
    timestamp: latestTimestamp,
  });
};

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }

  if (req.url === '/weight') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      weight: latestWeight,
      unit: SCALE_UNIT,
      raw: latestRaw,
      stable: true,
      bufferSize: weightBuffer.length,
      timestamp: latestTimestamp,
    }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

const wss = new WebSocket.Server({ server, path: '/ws' });
const sockets = new Set();

const broadcast = (payload) => {
  const message = JSON.stringify(payload);
  sockets.forEach((socket) => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(message);
    }
  });
};

wss.on('connection', (socket) => {
  sockets.add(socket);
  if (latestWeight !== null) {
    socket.send(JSON.stringify({
      type: 'weight',
      weight: latestWeight,
      unit: SCALE_UNIT,
      raw: latestRaw,
      timestamp: latestTimestamp,
    }));
  }
  socket.on('close', () => sockets.delete(socket));
});

// Heartbeat: broadcast latest weight every 2s even when stable,
// so connected clients always show a live reading.
setInterval(() => {
  if (latestWeight === null || sockets.size === 0) return;
  broadcast({
    type: 'weight',
    weight: latestWeight,
    unit: SCALE_UNIT,
    raw: latestRaw,
    timestamp: new Date().toISOString(),
  });
}, 2000);

const port = new SerialPort({
  path: SERIAL_PORT,
  baudRate: SERIAL_BAUD,
  autoOpen: false,
});

const parser = port.pipe(new ReadlineParser({ delimiter: SCALE_DELIMITER }));

const openSerial = () => {
  if (port.isOpen) return;
  port.open((err) => {
    if (err) {
      console.error('Scale serial open error:', err.message);
      setTimeout(openSerial, 2000);
      return;
    }
    console.log(`✅ Scale connected on ${SERIAL_PORT} @ ${SERIAL_BAUD} baud`);

    if (SCALE_POLL_COMMAND) {
      setInterval(() => {
        if (!port.isOpen) return;
        port.write(`${SCALE_POLL_COMMAND}\r\n`);
      }, SCALE_POLL_INTERVAL_MS);
      console.log(`➡ Polling scale with command "${SCALE_POLL_COMMAND}" every ${SCALE_POLL_INTERVAL_MS}ms`);
    }
  });
};

port.on('error', (err) => {
  console.error('Scale serial error:', err.message);
});

port.on('close', () => {
  console.warn('Scale serial closed. Reconnecting...');
  setTimeout(openSerial, 2000);
});

parser.on('data', (line) => {
  updateWeight(line);
});

server.listen(HTTP_PORT, () => {
  console.log(`✅ Scale bridge running on http://localhost:${HTTP_PORT}`);
  console.log(`➡ HTTP endpoint: http://localhost:${HTTP_PORT}/weight`);
  console.log(`➡ WS endpoint: ws://localhost:${HTTP_PORT}/ws`);
});

openSerial();
