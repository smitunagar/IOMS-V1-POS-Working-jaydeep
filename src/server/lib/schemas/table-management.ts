import { z } from 'zod';

// Core Table Schema
export const TableShapeSchema = z.enum(['round', 'square', 'rect']);
export const TableStatusSchema = z.enum(['FREE', 'SEATED', 'DIRTY', 'RESERVED']);

export const TableSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  x: z.number().min(0),
  y: z.number().min(0),
  z: z.number().default(0),
  w: z.number().positive(),
  h: z.number().positive(),
  rotation: z.number().default(0),
  shape: TableShapeSchema,
  capacity: z.number().int().min(1).max(20),
  seats: z.number().int().min(1).max(20),
  zone: z.string().optional(),
  status: TableStatusSchema.default('FREE'),
  childIds: z.array(z.string()).optional(),
  parentId: z.string().optional(),
  isVisible: z.boolean().default(true),
  metadata: z.record(z.any()).optional()
});

export const ZoneSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  isVisible: z.boolean().default(true),
  bounds: z.object({
    x: z.number(),
    y: z.number(),
    w: z.number().positive(),
    h: z.number().positive()
  }).optional()
});

export const FixtureSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(['door', 'window', 'bar', 'restroom', 'stage', 'column', 'wall']),
  x: z.number(),
  y: z.number(),
  z: z.number().default(0),
  w: z.number().positive(),
  h: z.number().positive(),
  d: z.number().default(0),
  rotation: z.number().default(0),
  metadata: z.record(z.any()).optional()
});

// Layout Schema
export const FloorLayoutSchema = z.object({
  tables: z.array(TableSchema),
  zones: z.array(ZoneSchema),
  fixtures: z.array(FixtureSchema),
  gridSize: z.number().positive().default(20),
  floorBounds: z.object({
    width: z.number().positive(),
    height: z.number().positive()
  }),
  metadata: z.record(z.any()).optional()
});

// API Request Schemas
export const SaveDraftRequestSchema = z.object({
  floorId: z.string().min(1),
  layout: FloorLayoutSchema,
  version: z.number().int().positive().optional(),
  force: z.boolean().default(false)
});

export const ActivateLayoutRequestSchema = z.object({
  floorId: z.string().min(1),
  expectVersion: z.number().int().positive()
});

export const CreateTableRequestSchema = z.object({
  x: z.number().min(0),
  y: z.number().min(0),
  shape: TableShapeSchema,
  capacity: z.number().int().min(1).max(20).optional(),
  zone: z.string().optional()
});

export const UpdateTableRequestSchema = z.object({
  x: z.number().min(0).optional(),
  y: z.number().min(0).optional(),
  z: z.number().optional(),
  rotation: z.number().optional(),
  capacity: z.number().int().min(1).max(20).optional(),
  zone: z.string().optional(),
  status: TableStatusSchema.optional()
});

export const MergeTablesRequestSchema = z.object({
  tableIds: z.array(z.string()).min(2),
  newPosition: z.object({
    x: z.number(),
    y: z.number()
  }).optional()
});

export const ReservationSchema = z.object({
  tableId: z.string().min(1),
  customerName: z.string().min(1),
  partySize: z.number().int().min(1),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  notes: z.string().optional()
});

export const CreateReservationRequestSchema = ReservationSchema;

// QR Code Generation Schema
export const QRGenerationRequestSchema = z.object({
  tableId: z.string().min(1),
  format: z.enum(['PNG', 'PDF', 'BOTH']).default('BOTH'),
  size: z.enum(['SMALL', 'MEDIUM', 'LARGE']).default('MEDIUM'),
  includeQRCode: z.boolean().default(true),
  customText: z.string().optional()
});

// Scanning Session Schema
export const CreateScanSessionRequestSchema = z.object({
  floorId: z.string().min(1),
  mode: z.enum(['ROOMPLAN', 'WEBXR', 'PHOTOGRAM']),
  metadata: z.record(z.any()).optional()
});

// Import Schema
export const ImportLayoutRequestSchema = z.object({
  floorId: z.string().min(1),
  source: z.enum(['GLTF', 'USDZ', 'IMAGE', 'JSON']),
  data: z.union([
    z.string(), // URL or base64
    FloorLayoutSchema // Direct JSON
  ]),
  calibration: z.object({
    scale: z.number().positive().default(1),
    offsetX: z.number().default(0),
    offsetY: z.number().default(0),
    rotation: z.number().default(0)
  }).optional()
});

// WebSocket Event Schemas
export const TableEventSchema = z.object({
  type: z.enum([
    'TABLE_CREATED',
    'TABLE_UPDATED', 
    'TABLE_DELETED',
    'TABLE_STATUS_CHANGED',
    'RESERVATION_ASSIGNED',
    'LAYOUT_ACTIVATED',
    'TABLES_MERGED',
    'TABLE_SPLIT'
  ]),
  tableId: z.string().optional(),
  tableIds: z.array(z.string()).optional(),
  data: z.record(z.any()),
  timestamp: z.string().datetime(),
  userId: z.string().optional(),
  tenantId: z.string()
});

// Error Response Schema
export const ErrorResponseSchema = z.object({
  error: z.string(),
  code: z.enum([
    'DUPLICATE_TABLE_ID',
    'INVALID_DRAFT', 
    'STALE_VERSION',
    'CONFLICT',
    'UNAUTHENTICATED',
    'FORBIDDEN',
    'OVERLAP_DETECTED',
    'RESERVATION_CONFLICT',
    'INVALID_ZONE',
    'MISSING_RESOURCE'
  ]),
  message: z.string(),
  details: z.record(z.any()).optional()
});

// Type exports
export type Table = z.infer<typeof TableSchema>;
export type Zone = z.infer<typeof ZoneSchema>;
export type Fixture = z.infer<typeof FixtureSchema>;
export type FloorLayout = z.infer<typeof FloorLayoutSchema>;
export type TableEvent = z.infer<typeof TableEventSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type CreateTableRequest = z.infer<typeof CreateTableRequestSchema>;
export type UpdateTableRequest = z.infer<typeof UpdateTableRequestSchema>;
export type CreateReservationRequest = z.infer<typeof CreateReservationRequestSchema>;
export type QRGenerationRequest = z.infer<typeof QRGenerationRequestSchema>;
