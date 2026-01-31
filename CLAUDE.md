# TaxHelper - Project Guide

## Overview
Tax preparation workflow automation system for Gordon Ulen CPA, built by RaveJedi Labs.

## Tech Stack
- **Frontend**: Next.js 14, React 18, Tailwind CSS (3 separate apps)
- **Backend**: Node.js, Express
- **Database**: Firestore
- **Hosting**: Firebase Hosting (multi-site)
- **Auth**: Firebase Authentication
- **Storage**: Firebase Storage
- **Phone System**: Twilio (Voice, WebSocket streaming)
- **AI Voice Agent**: ElevenLabs Conversational AI

## Firebase Project
- **Project ID**: taxhelper-ravejedilabs
- **Console**: https://console.firebase.google.com/project/taxhelper-ravejedilabs

## Hosting Sites
| Site | Domain | App | Purpose |
|------|--------|-----|---------|
| `gordonulencpa` | gordonulencpa.com | `landing/` | Marketing landing page |
| `gordonulencpa-app` | admin.gordonulencpa.com | `admin/` | Staff admin portal |
| `gordonulencpa-portal` | portal.gordonulencpa.com | `portal/` | Customer portal |

## Project Structure
```
taxhelper/
├── packages/shared/           # Single source of truth
│   ├── openapi.yaml          # API schema (ALL types defined here)
│   └── generated/typescript/ # Auto-generated TypeScript types
├── landing/                   # Marketing landing page
│   ├── app/                  # App router pages
│   └── components/           # Landing page components
├── admin/                     # Staff admin portal
│   ├── app/                  # Dashboard, customers, returns, workflows
│   ├── components/           # AI assistant, admin components
│   └── lib/                  # Firebase config, auth, API client
├── portal/                    # Customer portal
│   ├── app/                  # Customer dashboard, login
│   ├── components/           # Status timeline, etc.
│   └── lib/                  # Firebase config, auth, API client
├── backend/                   # Node.js API
│   └── src/
│       ├── routes/
│       ├── services/
│       ├── middleware/
│       └── types/
├── agents/                    # AI agents
│   └── src/
│       ├── communication/    # Email/SMS automation
│       ├── document_ocr/     # Document processing
│       ├── status_tracker/   # Return status tracking
│       └── models/           # Shared agent models
├── firebase.json             # Firebase multi-site hosting config
├── firestore.rules           # Firestore security rules
└── storage.rules             # Storage security rules
```

## Type Generation
Types auto-generate from OpenAPI schema:
```bash
pnpm generate          # Generate all types
pnpm generate:types    # Generate TypeScript types only
```

Output: `packages/shared/generated/typescript/schema.ts`

## Commands
```bash
# Development
pnpm dev:admin         # Run admin portal (port 3001)
pnpm dev:portal        # Run customer portal (port 3002)
pnpm dev:landing       # Run landing page (port 3002)
pnpm dev:backend       # Run backend API

# Building
pnpm build:admin       # Build admin → build-admin/
pnpm build:portal      # Build portal → build-portal/
pnpm build:landing     # Build landing → build-landing/
pnpm build:all         # Build all 3 frontend apps

# Deployment
pnpm deploy:admin      # Deploy admin to admin.gordonulencpa.com
pnpm deploy:portal     # Deploy portal to portal.gordonulencpa.com
pnpm deploy:landing    # Deploy landing to gordonulencpa.com
pnpm deploy:hosting    # Build and deploy all hosting sites

# Types
pnpm generate          # Regenerate types from OpenAPI
```

## Environment Configuration
**Single `.env` file at project root** - all services read from here.
```bash
cp .env.example .env   # Copy template and fill in values
```

Required secrets:
- Firebase service account credentials
- Twilio account SID, auth token, phone number
- ElevenLabs API key and agent ID
- Anthropic/OpenAI API keys (for agents)

## Architecture Principles
- `packages/shared/openapi.yaml` is the **single source of truth** for all data models
- No redundant type definitions - everything derives from OpenAPI
- All apps import types from `@taxhelper/shared`
- Single `.env` file at root - no scattered env files in subfolders
- **3 separate frontend apps** - admin code is never shipped to customers

## Firebase / Firestore Rules
- **NO EMULATORS. EVER.** Always connect to production Firestore.
- Download service account JSON from Firebase Console and set `GOOGLE_APPLICATION_CREDENTIALS` path
- Set all `NEXT_PUBLIC_FIREBASE_*` values from Firebase Console → Project Settings → Your Apps

## Data Import
- Legacy client data will need transformation to match new schema
- Schema mismatches are expected - all imports go through transform functions
- Key entities: Customer, TaxReturn, Document, Appointment
- Required fields and enum values must be normalized during import

## Incomplete Features (TODOs)
Backend integrations not yet wired up:
- `backend/src/routes/calendly.ts:124,145` - Confirmation/cancellation notifications
- `backend/src/routes/documents.ts:161` - OCR agent trigger
- `backend/src/routes/communications.ts:55` - Email/SMS service integration
- `backend/src/routes/twilio.ts:203-344` - Transcription follow-ups, staff routing
- `backend/src/routes/returns.ts:135` - Communication agent on status change

Admin:
- `admin/app/(dashboard)/documents/page.tsx` - Upload modal for customer/year selection
- Kanban board uses mock data fallback when API unavailable
