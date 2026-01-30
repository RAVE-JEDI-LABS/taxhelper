#!/bin/bash

# Code generation script for TypeScript and Python contracts from OpenAPI schema
# This script generates type-safe clients for both frontend/backend (TypeScript) and agents (Python)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SHARED_DIR="$(dirname "$SCRIPT_DIR")"
OPENAPI_FILE="$SHARED_DIR/openapi.yaml"
TS_OUTPUT="$SHARED_DIR/generated/typescript"
PY_OUTPUT="$SHARED_DIR/generated/python"

echo "Generating code from OpenAPI schema..."
echo "Schema: $OPENAPI_FILE"

# Create output directories
mkdir -p "$TS_OUTPUT"
mkdir -p "$PY_OUTPUT"

# Generate TypeScript types
echo ""
echo "Generating TypeScript types..."
if command -v npx &> /dev/null; then
    npx openapi-typescript "$OPENAPI_FILE" -o "$TS_OUTPUT/schema.ts"
    echo "TypeScript types generated at $TS_OUTPUT/schema.ts"
else
    echo "Warning: npx not found. Install Node.js to generate TypeScript types."
fi

# Generate Python Pydantic models
echo ""
echo "Generating Python Pydantic models..."
if command -v datamodel-codegen &> /dev/null; then
    datamodel-codegen \
        --input "$OPENAPI_FILE" \
        --input-file-type openapi \
        --output "$PY_OUTPUT/models.py" \
        --output-model-type pydantic_v2.BaseModel \
        --use-annotated \
        --field-constraints \
        --use-double-quotes \
        --target-python-version 3.11
    echo "Python models generated at $PY_OUTPUT/models.py"
elif command -v pip &> /dev/null; then
    echo "datamodel-codegen not found. Install with: pip install datamodel-code-generator"
else
    echo "Warning: Python not properly configured for code generation."
fi

echo ""
echo "Code generation complete!"
