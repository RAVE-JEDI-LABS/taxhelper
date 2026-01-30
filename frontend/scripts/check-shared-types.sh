#!/bin/bash
# Build guard: Ensure components use shared types, not local interfaces

FILES="app/**/*.tsx components/**/*.tsx"
FORBIDDEN_PATTERN="^interface (Customer|TaxReturn|Document|Appointment|Communication|KanbanFeature|User) \{"

echo "Checking that frontend uses @taxhelper/shared types..."

VIOLATIONS=$(grep -rn "$FORBIDDEN_PATTERN" $FILES 2>/dev/null || true)

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

echo "All components use shared types."
exit 0
