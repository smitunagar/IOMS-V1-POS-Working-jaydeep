# IOMS Project Architecture Guidelines

## 🏗️ **Folder Structure & Responsibilities**

### **Frontend Layer (`src/app/`)**
- **Purpose**: Next.js App Router pages and API proxies
- **Contains**:
  - Page components (`src/app/*/page.tsx`)
  - API proxy endpoints (`src/app/api/*/route.ts`)
  - Layout components (`src/app/layout.tsx`)
  - Static assets and styling

### **Backend Layer (`src/server/`)**
- **Purpose**: Server-side business logic and data processing
- **Contains**:
  - Business logic APIs (`src/server/api/*/route.ts`)
  - Database services (`src/server/lib/`)
  - Data processing utilities
  - External service integrations

## 📋 **Development Rules**

### ✅ **DO:**
1. **Create proxy endpoints** in `src/app/api/` that forward requests to `src/server/api/`
2. **Keep all business logic** in `src/server/` folder
3. **Maintain clean separation** between frontend and backend
4. **Use existing server-side APIs** as the source of truth
5. **Follow the proxy pattern** for all API calls

### ❌ **DON'T:**
1. **Never modify** existing files in `src/server/api/` unless absolutely necessary
2. **Don't put business logic** in `src/app/api/` proxy endpoints
3. **Don't duplicate** server-side functionality in app layer
4. **Don't bypass** the server layer for complex operations

## 🔄 **Request Flow Pattern**

```
Frontend Component
    ↓ HTTP Request
App Router API Proxy (src/app/api/)
    ↓ Forward Request
Server API (src/server/api/)
    ↓ Process Business Logic
Database/External Services
    ↓ Return Response
Server API
    ↓ Return Response
App Router API Proxy
    ↓ Return Response
Frontend Component
```

## 📁 **File Organization Examples**

### **Correct Structure:**
```
src/
├── app/                          # Frontend Layer
│   ├── api/                      # API Proxies Only
│   │   ├── orders/route.ts       # Proxy to server/api/orders
│   │   ├── tables/route.ts       # Proxy to server/api/tables
│   │   └── inventory/route.ts    # Proxy to server/api/inventory
│   ├── orders/page.tsx           # Frontend page
│   └── layout.tsx                # App layout
└── server/                       # Backend Layer
    ├── api/                      # Business Logic APIs
    │   ├── orders/route.ts       # Actual orders logic
    │   ├── tables/route.ts       # Actual tables logic
    │   └── inventory/route.ts    # Actual inventory logic
    └── lib/                      # Utilities & services
        ├── database.ts
        └── menuService.ts
```

### **Proxy Endpoint Template:**
```typescript
// src/app/api/[endpoint]/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/[endpoint]`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
```

## 🎯 **Key Principles**

1. **Separation of Concerns**: Frontend handles UI, backend handles business logic
2. **Single Source of Truth**: Server-side APIs contain the actual implementation
3. **Proxy Pattern**: App Router APIs are thin proxies that forward requests
4. **Maintainability**: Changes to business logic only happen in server layer
5. **Scalability**: Easy to add new features without breaking existing structure

## 🔍 **Code Review Checklist**

Before making changes, ensure:
- [ ] New API endpoints are created in correct folder (`app/api/` for proxies, `server/api/` for logic)
- [ ] No business logic is added to proxy endpoints
- [ ] Existing server-side code is not modified unnecessarily
- [ ] Request flow follows the established pattern
- [ ] Error handling is consistent across layers
- [ ] TypeScript types are properly defined

---

**Remember**: This architecture ensures clean separation, maintainability, and scalability. Always follow these guidelines when making changes to the codebase.
