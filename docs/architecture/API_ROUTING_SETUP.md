# API Routing Setup Documentation

## Overview
This document describes the API routing architecture that separates client-side Next.js API routes from server-side business logic.

## Architecture Pattern

```
Frontend (React) 
    ↓
Next.js API Routes (/app/api/*)
    ↓
Server-side Business Logic (/server/api/*)
    ↓
External Services (Gemini AI, Database, etc.)
```

## Directory Structure

### Client-side API Routes (`src/app/api/`)
- **Purpose**: Next.js API routes that handle HTTP requests
- **Responsibilities**: 
  - Request validation
  - Authentication/authorization
  - Proxying to server-side logic
  - Response formatting

### Server-side Business Logic (`src/server/api/`)
- **Purpose**: Contains the actual business logic and data processing
- **Responsibilities**:
  - Core functionality implementation
  - External API integrations
  - Database operations
  - File processing

## Implemented API Routes

### 1. Menu Upload APIs

#### `/api/uploadMenu` (POST)
- **Client Route**: `src/app/api/uploadMenu/route.ts`
- **Server Logic**: `src/server/api/uploadMenu/route.ts`
- **Functionality**: AI-powered PDF menu extraction using Gemini
- **Features**:
  - PDF file processing
  - Manual data input
  - Text data extraction
  - CSV export
  - Gemini AI integration

#### `/api/menuUpload` (POST)
- **Client Route**: `src/app/api/menuUpload/route.ts`
- **Server Logic**: `src/server/api/menuUpload/route.ts`
- **Functionality**: Alternative menu upload processing
- **Features**:
  - Form data handling
  - Multiple file format support
  - OCR fallback processing

## Usage Examples

### Frontend API Call
```typescript
const response = await fetch('/api/uploadMenu', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    file: base64Data,
    userId: currentUser.id
  })
});
```

### Server-side Implementation
```typescript
// In src/server/api/uploadMenu/route.ts
export async function POST(request: NextRequest) {
  // Business logic implementation
  const result = await extractMenuWithGemini(pdfBuffer);
  return NextResponse.json(result);
}
```

## Benefits of This Architecture

1. **Separation of Concerns**: Clear separation between API routing and business logic
2. **Reusability**: Server-side logic can be reused across different API endpoints
3. **Testability**: Business logic can be tested independently
4. **Maintainability**: Easier to maintain and update specific components
5. **Scalability**: Can easily add new API routes or modify existing ones

## Environment Configuration

The system uses environment variables from `.env.local`:
- `GEMINI_API_KEY`: For AI-powered menu extraction
- `GOOGLE_API_KEY`: Alternative API key
- `AI_MODEL`: Model configuration (default: gemini-2.5-flash)

## Testing

### Test API Endpoints
```bash
# Test uploadMenu endpoint
curl -X POST http://localhost:3000/api/uploadMenu \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'

# Test menuUpload endpoint  
curl -X POST http://localhost:3000/api/menuUpload \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

## Next Steps

1. Add more API proxy routes as needed
2. Implement proper error handling and logging
3. Add API rate limiting and security measures
4. Create comprehensive API documentation
5. Add unit tests for both client and server-side code

## File Locations

- **Client API Routes**: `src/app/api/*/route.ts`
- **Server Business Logic**: `src/server/api/*/route.ts`
- **Shared Libraries**: `src/server/lib/*`
- **Configuration**: `.env.local`
