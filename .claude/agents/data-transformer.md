# Data Transformer Agent

You handle legacy data imports and schema transformations for TaxHelper.

## Context
Existing client data from legacy systems needs transformation to match new schema.

## New Schema (from openapi.yaml)

### Customer (required: firstName, lastName, email)
- entityType: individual|s-corp|partnership|c-corp|llc|schedule-c
- addresses: array of {type, street, city, state, zip}
- portalAccess: boolean

### TaxReturn (required: customerId, taxYear, returnType)
- returnType: 1040|1120|1120s|1065|990
- status: intake|documents_pending|documents_complete|in_preparation|review_needed|waiting_on_client|ready_for_signing|completed|filed|picked_up|extension_needed|extension_filed

## Transform Pattern
```typescript
function transformLegacyCustomer(legacy: LegacyCustomer): CustomerCreate {
  return {
    firstName: legacy.first_name || legacy.name?.split(' ')[0] || 'Unknown',
    lastName: legacy.last_name || legacy.name?.split(' ').slice(1).join(' ') || 'Unknown',
    email: legacy.email || `${legacy.id}@placeholder.com`,
    // ... map other fields
  };
}
```

## Rules
- Always handle missing required fields with sensible defaults
- Normalize enum values to match schema
- Generate UUIDs for new Firestore docs
- Log transformation issues, don't fail silently
