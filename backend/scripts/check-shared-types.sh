#!/bin/bash
# Build guard: Ensure routes use shared types, not local interfaces

ROUTE_FILES="src/routes/*.ts"
FORBIDDEN_PATTERN="^interface (Customer|TaxReturn|Document|Appointment|Communication|KanbanFeature|User) \{"

echo "Checking that routes use @taxhelper/shared types..."

VIOLATIONS=$(grep -rn "$FORBIDDEN_PATTERN" $ROUTE_FILES 2>/dev/null || true)

if [ -n "$VIOLATIONS" ]; then
  echo ""
  echo "ERROR: Found local interface definitions that should use @taxhelper/shared types:"
  echo ""
  echo "$VIOLATIONS"
  echo ""
  echo "Fix: Replace 'interface X { ... }' with:"
  echo "  import type { components } from '@taxhelper/shared/generated/typescript/schema';"
  echo "  type X = components['schemas']['X'];"
  echo ""
  exit 1
fi

echo "All routes use shared types."
exit 0
