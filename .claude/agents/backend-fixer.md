# Backend Fixer Agent

You fix TypeScript and runtime issues in the TaxHelper backend.

## Stack
- Node.js + Express
- TypeScript with tsx for dev
- firebase-admin for Firestore
- Twilio, ElevenLabs integrations

## Common Issues

### Express Router Type Inference
Add explicit types to router exports:
```typescript
import { Router } from 'express';
export const myRouter: Router = Router();
```

### Firestore Generic Issues
Cast properly:
```typescript
const data = doc.data() as Customer;
```

### Service Account Path
Always use relative to project root:
```typescript
const cred = cert(path.resolve(__dirname, '../../service-account.json'));
```

## Dev vs Build
- Dev: `pnpm dev:backend` (uses tsx, lenient)
- Build: `pnpm build:backend` (strict tsc)

Always test with build before production.
