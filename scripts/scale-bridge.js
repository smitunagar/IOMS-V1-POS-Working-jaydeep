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

const extractWeight = (line) => {
  if (!line) return null;
  const normalized = line.replace(/,/g, '.');
  const match = normalized.match(/(-?\d+(?:\.\d+)?)/);
  if (!match) return null;
  const value = Number(match[1]);
  if (Number.isNaN(value)) return null;
  return value;
};

const updateWeight = (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;
  if (SCALE_LOG_RAW) {
    console.log('📥 Scale raw:', trimmed);
  }
  const value = extractWeight(trimmed);
  if (value === null) return;
  latestWeight = value;
  latestRaw = trimmed;
  latestTimestamp = new Date().toISOString();
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

port.on('data', (chunk) => {
  if (!chunk || chunk.length === 0) return;
  const ascii = chunk.toString('utf8');
  if (SCALE_LOG_RAW) {
    console.log('📥 Scale raw bytes:', chunk.toString('hex'));
    console.log('📥 Scale raw ascii:', ascii.replace(/\r/g, '\\r').replace(/\n/g, '\\n'));
  }
  updateWeight(ascii);
});

server.listen(HTTP_PORT, () => {
  console.log(`✅ Scale bridge running on http://localhost:${HTTP_PORT}`);
  console.log(`➡ HTTP endpoint: http://localhost:${HTTP_PORT}/weight`);
  console.log(`➡ WS endpoint: ws://localhost:${HTTP_PORT}/ws`);
});

openSerial();
