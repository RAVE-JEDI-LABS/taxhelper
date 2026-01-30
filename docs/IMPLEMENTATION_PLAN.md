# Gordon Ulen CPA - Tax Helper Application

## Project Overview
Full-stack tax preparation workflow automation system for Gordon Ulen CPA firm.

## Tech Stack
- **Frontend**: Next.js (TypeScript)
- **Backend**: TypeScript (Node.js/Express or tRPC) on Cloud Run
- **AI Agents**: Python (LangChain + LangGraph) - Claude + OpenAI
- **Database**: Firestore
- **Auth**: Firebase Auth
- **Hosting**: Firebase/GCP
- **API Schema**: OpenAPI 3.0 (auto-generates TypeScript types + Python contracts)

## Project Structure
```
taxhelper/
├── packages/
│   └── shared/
│       ├── openapi.yaml          # Single source of truth for API schema
│       ├── generated/
│       │   ├── typescript/       # Auto-generated TS types & API client
│       │   └── python/           # Auto-generated Python models & client
│       └── scripts/
│           └── generate.sh       # Script to regenerate contracts
├── frontend/                     # Next.js (TypeScript)
│   ├── app/
│   │   ├── (auth)/              # Login/register
│   │   ├── admin/               # Admin dashboard
│   │   ├── kanban/              # Feature tracking board (draggable)
│   │   ├── workflows/           # Workflow documentation view
│   │   └── portal/              # Client portal
│   ├── components/
│   └── lib/
│       └── api/                 # Uses generated TypeScript client
├── backend/                      # TypeScript (Express/tRPC)
│   ├── src/
│   │   ├── routes/              # REST API endpoints
│   │   ├── services/            # Business logic
│   │   ├── middleware/          # Auth, validation
│   │   └── types/               # Uses generated TypeScript types
│   └── Dockerfile               # Cloud Run deployment
├── agents/                       # Python (LangChain/LangGraph)
│   ├── src/
│   │   ├── document_ocr/        # Document scanning & extraction
│   │   ├── communication/       # Client email/SMS automation
│   │   ├── status_tracker/      # CCH status automation
│   │   └── models/              # Uses generated Python models
│   ├── requirements.txt
│   └── Dockerfile               # Cloud Run deployment
└── docs/
    └── workflows/               # Workflow documentation (29 files)
```

## OpenAPI Schema (packages/shared/openapi.yaml)

Single source of truth that generates:
1. **TypeScript types** - for frontend + backend
2. **Python Pydantic models** - for agents
3. **API clients** - for both languages

### Code Generation Tools
- `openapi-typescript` - generates TS types
- `openapi-generator` or `datamodel-code-generator` - generates Python Pydantic models

### Schema Overview

```yaml
openapi: 3.0.3
info:
  title: Gordon Ulen CPA Tax Helper API
  version: 1.0.0

components:
  schemas:
    # Customers
    Address:
      type: object
      properties:
        type: { enum: [home, mailing, business] }
        street: { type: string }
        city: { type: string }
        state: { type: string }
        zip: { type: string }

    BankingInfo:
      type: object
      properties:
        routingNumber: { type: string }
        accountNumber: { type: string }
        lastVerified: { type: string, format: date-time }

    Customer:
      type: object
      required: [firstName, lastName, email]
      properties:
        id: { type: string }
        firstName: { type: string }
        lastName: { type: string }
        email: { type: string, format: email }
        phone: { type: string }
        addresses: { type: array, items: { $ref: '#/components/schemas/Address' } }
        entityType: { enum: [individual, s-corp, partnership, c-corp, llc, schedule-c] }
        ein: { type: string }
        ssnEncrypted: { type: string }
        assignedPreparer: { type: string }
        bankingInfo: { $ref: '#/components/schemas/BankingInfo' }
        portalAccess: { type: boolean }
        createdAt: { type: string, format: date-time }
        updatedAt: { type: string, format: date-time }

    # Documents
    Document:
      type: object
      properties:
        id: { type: string }
        customerId: { type: string }
        taxYear: { type: integer }
        type: { enum: [w2, 1099-r, 1099-g, 1099-int, 1099-div, 1099-nec, k1, other] }
        fileName: { type: string }
        fileUrl: { type: string }
        uploadedAt: { type: string, format: date-time }
        uploadedBy: { type: string }
        ocrExtracted: { type: boolean }
        extractedData: { type: object }
        status: { enum: [pending, processed, verified] }

    # Tax Returns
    RoutingSheet:
      type: object
      properties:
        dropOffDate: { type: string, format: date-time }
        inPersonOrDropOff: { enum: [in-person, drop-off, portal] }
        missingDocuments: { type: array, items: { type: string } }
        notes: { type: string }

    Payment:
      type: object
      properties:
        amount: { type: number }
        status: { enum: [pending, partial, paid] }
        method: { enum: [cash, check, card, square] }
        paidAt: { type: string, format: date-time }

    TaxReturn:
      type: object
      properties:
        id: { type: string }
        customerId: { type: string }
        taxYear: { type: integer }
        returnType: { enum: ['1040', '1120', '1120s', '1065', '990'] }
        status: { enum: [intake, documents_pending, documents_complete, in_preparation,
                        review_needed, waiting_on_client, ready_for_signing, completed,
                        filed, picked_up, extension_needed, extension_filed] }
        assignedPreparer: { type: string }
        dueDate: { type: string, format: date-time }
        extensionFiled: { type: boolean }
        extensionDate: { type: string, format: date-time }
        routingSheet: { $ref: '#/components/schemas/RoutingSheet' }
        payment: { $ref: '#/components/schemas/Payment' }
        createdAt: { type: string, format: date-time }
        updatedAt: { type: string, format: date-time }

    # Appointments
    Appointment:
      type: object
      properties:
        id: { type: string }
        customerId: { type: string }
        type: { enum: [tax_prep, drop_off, pick_up, signing, consultation] }
        scheduledAt: { type: string, format: date-time }
        duration: { type: integer }
        assignedTo: { type: string }
        status: { enum: [scheduled, confirmed, completed, cancelled, no_show] }
        reminderSent: { type: boolean }
        notes: { type: string }

    # Communications
    Communication:
      type: object
      properties:
        id: { type: string }
        customerId: { type: string }
        type: { enum: [email, sms, call] }
        direction: { enum: [inbound, outbound] }
        subject: { type: string }
        content: { type: string }
        sentAt: { type: string, format: date-time }
        status: { enum: [sent, delivered, failed] }
        triggeredBy: { enum: [manual, automation, agent] }

    # Kanban
    KanbanFeature:
      type: object
      properties:
        id: { type: string }
        title: { type: string }
        description: { type: string }
        workflow: { type: string }
        status: { enum: [backlog, in_progress, review, done] }
        priority: { enum: [low, medium, high] }
        order: { type: integer }
        createdAt: { type: string, format: date-time }
        updatedAt: { type: string, format: date-time }

    # Users (Staff)
    User:
      type: object
      properties:
        id: { type: string }
        email: { type: string, format: email }
        displayName: { type: string }
        role: { enum: [admin, preparer, front_desk] }
        createdAt: { type: string, format: date-time }

paths:
  /api/customers:
    get: { ... }
    post: { ... }
  /api/customers/{id}:
    get: { ... }
    patch: { ... }
    delete: { ... }
  /api/documents:
    get: { ... }
    post: { ... }
  /api/documents/upload:
    post: { ... }
  /api/returns:
    get: { ... }
    post: { ... }
  /api/returns/{id}/status:
    patch: { ... }
  /api/appointments:
    get: { ... }
    post: { ... }
  /api/communications/send:
    post: { ... }
  /api/kanban:
    get: { ... }
  /api/kanban/{id}:
    patch: { ... }
```

## Routes

### Frontend Routes
- `/` - Landing page
- `/login` - Firebase Auth login
- `/admin` - Admin dashboard (staff only)
- `/admin/customers` - Customer management
- `/admin/returns` - Tax return tracking
- `/admin/documents` - Document management
- `/kanban` - Feature tracking board (draggable)
- `/workflows` - Workflow documentation viewer
- `/portal` - Client portal (document upload, status check)

## AI Agents (Python - LangChain/LangGraph)

### 1. Document OCR Agent
- Accepts uploaded documents (W-2, 1099, etc.)
- Uses Claude Vision for OCR
- Extracts structured data (uses generated Pydantic models)
- Auto-classifies document type
- Stores extracted data via API
- **Replaces GruntWorx** - saves $0.45/page

### 2. Client Communication Agent
- Triggered by status changes
- Generates personalized messages (Claude/GPT-4)
- Sends via email/SMS
- Templates for each status

### 3. Status Tracking Agent
- Monitors document uploads
- Auto-updates return status
- Flags missing documents
- Deadline monitoring
- Extension identification

### 4. Phone AI Agent (Twilio + ElevenLabs)
- Handles incoming phone calls automatically
- Classifies caller intent (scheduling, status, documents, billing, new client)
- Can resolve common requests without human intervention
- Transfers to human staff when needed
- Logs all calls to Firestore and syncs to CCH
- Voicemail transcription and follow-up task creation

## Workflows to Implement (29 total)

### Front Desk (12)
1. Start of Day Procedures
2. Incoming Phone Call Workflow
3. Client Walk-In / Appointment Check-In
4. Client File Retrieval
5. Routing Sheet Creation
6. Client Drop-Off Workflow
7. CCH Software Logging
8. Client Portal Support
9. Tax Organizer Process
10. Client Pick-Up & Signing Workflow
11. Payment Processing
12. End of Day Procedures

### Office Automation (8)
1. Document Scanning & Data Extraction
2. Portal Document Readiness Notification
3. Tax Return Routing & Status Tracking
4. Payment Automation & Tracking
5. Appointment Scheduling & Management
6. Extension Tracking & Execution
7. Client Status Communication
8. Management Dashboard & Reporting

### Business Clients (9)
1. Business Client Intake & Profile Management
2. Document Collection & Missing Document Tracking
3. Extension Identification & Tracking
4. Business Return Routing & Status Tracking
5. Annual Report & Compliance Tracking
6. Banking & Routing Information Maintenance
7. 1099 Preparation & Communication
8. Client Status Communication
9. Management Dashboard & Reporting

## Key Systems Integration
- **CCH Wolters Kluwer Practice Management** - Primary for AR/returns
- **Drake** - Tax preparation software
- **Square** - Payment processing
- **DocuSign** - E-signatures
- **Twilio** - Phone system and call routing
- **ElevenLabs** - AI voice agent for phone call handling
- **Calendly** - All appointment scheduling (tax prep, drop-off, pick-up, signing, consultation)

## Client Document Intake Split

**Current Reality:**
- **50% In-Person** - Clients walk in with physical paper documents
- **50% Portal** - Clients upload documents digitally through client portal

**In-Person Bottleneck:**
When clients bring physical documents, Gordon Ulen staff must:
1. Accept documents from client
2. Manually scan each page using office scanner
3. Upload scanned images to system
4. Process through OCR
5. File physical documents

This scanning step is a significant bottleneck during tax season, especially with high walk-in volume. **Future enhancement:** Streamline the physical-to-digital workflow (mobile scanning, batch processing, etc.)

## GruntWorx Replacement
Tax Helper's AI OCR Agent replaces GruntWorx functionality:
- **Problem:** GruntWorx charges $0.45 per page for document scanning/OCR
- **Solution:** Built-in AI-powered OCR using Claude Vision at no per-page cost
- **Savings:** ~$2,000+ per tax season for typical CPA firm

## Implementation Order
1. Create project structure (packages, frontend, backend, agents, docs)
2. Write OpenAPI schema (openapi.yaml)
3. Generate TypeScript + Python contracts
4. Set up Firebase project (Auth, Firestore)
5. Build Next.js frontend shell (routes, auth)
6. Build TypeScript backend (Express)
7. Implement Kanban board
8. Create workflow documentation pages
9. Build Python AI agents
10. Connect integrations

## Verification
- OpenAPI schema validates
- Generated types compile (TS) and import (Python)
- Firebase Auth working
- Firestore CRUD operations
- Kanban drag-and-drop
- Workflow documentation display
- Document upload with OCR
- Client communication automation
