# TaxHelper - Project Guide

## Overview
Tax preparation workflow automation system for Gordon Ullen CPA, built by RaveJedi Labs.

## Tech Stack
- **Frontend**: Next.js 14, React 18, Tailwind CSS
- **Backend**: Node.js
- **Database**: Firestore
- **Hosting**: Firebase Hosting
- **Auth**: Firebase Authentication
- **Storage**: Firebase Storage

## Firebase Project
- **Project ID**: taxhelper-ravejedilabs
- **Console**: https://console.firebase.google.com/project/taxhelper-ravejedilabs

## Project Structure
```
taxhelper/
├── packages/shared/           # Single source of truth
│   ├── openapi.yaml          # API schema (ALL types defined here)
│   └── generated/typescript/ # Auto-generated TypeScript types
├── frontend/                  # Next.js app
│   ├── app/                  # App router pages
│   ├── components/           # React components
│   └── lib/                  # Utils, Firebase config, API client
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
├── firebase.json             # Firebase config
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
pnpm dev:frontend      # Run frontend dev server
pnpm build:frontend    # Build frontend
pnpm generate          # Regenerate types from OpenAPI
firebase deploy        # Deploy all Firebase services
```

## Architecture Principles
- `packages/shared/openapi.yaml` is the **single source of truth** for all data models
- No redundant type definitions - everything derives from OpenAPI
- Frontend and backend import types from `@taxhelper/shared`
