# Document Scanning & Data Extraction

## Purpose
Efficiently scan and extract data from tax documents using Tax Helper's AI-powered OCR, ensuring accurate data capture for tax preparation.

## Document Intake Reality

**Client Split:**
- **50% In-Person** - Clients walk in with physical paper documents
- **50% Portal** - Clients upload documents digitally

**The In-Person Bottleneck:**
When clients bring physical documents, staff must manually scan each page before OCR can process them. During peak tax season, this creates a significant bottleneck:
- Multiple clients dropping off at same time
- Stack of documents waiting to be scanned
- Delays in getting documents to preparers

**Future Enhancement:** Streamline physical-to-digital workflow (mobile scanning app, batch processing station, etc.)

## Why Tax Helper OCR?
**Replaces GruntWorx** - GruntWorx charges $0.45 per page, which adds up significantly during tax season. Tax Helper's built-in OCR provides the same functionality at no per-page cost.

## Scanning Methods

### Method 1: Tax Helper AI OCR (Primary Method)
Our AI-powered document extraction using Claude Vision - **replaces GruntWorx at no per-page cost**.

**Supported Documents:**
- W-2
- 1099 (all types: R, G, INT, DIV, NEC, MISC)
- K-1 (Partnership, S-Corp, Trust)
- 1098 (Mortgage Interest)
- 1095-A (Health Insurance)
- Most standard tax forms

**Procedure:**
1. Scan document using office scanner
2. Upload to Tax Helper via:
   - Client portal (client self-upload)
   - Admin dashboard (staff upload)
   - Drag-and-drop interface
3. System automatically:
   - Detects document type
   - Extracts all data fields
   - Validates against expected formats
4. Review extracted data in dashboard
5. Correct any errors (usually minimal)
6. Mark as verified
7. Export to Drake (manual entry or future integration)

**Quality Tips:**
- Remove staples before scanning
- Scan originals when possible (not copies)
- Ensure documents are not folded
- 300 DPI recommended for best results
- Check scanner glass for smudges

### Method 2: Manual Entry
For documents that cannot be processed automatically or unusual forms.

**Procedure:**
1. Open Drake
2. Navigate to appropriate form
3. Manually enter data from source document
4. Double-check all amounts
5. Scan document to client folder for records

## Document Organization

### Digital Filing Structure
```
/Clients/
  /[ClientName_ID]/
    /2024/
      /W2/
      /1099/
      /K1/
      /Other/
    /2023/
    /Prior/
```

### Physical Filing
1. After scanning, stamp "SCANNED [DATE]"
2. Place in client folder
3. File folder in appropriate drawer:
   - Active (current year, in progress)
   - Pending Pick-up
   - Completed/Filed

## Quality Control

### Verification Checklist
- [ ] All pages scanned
- [ ] Image quality is readable
- [ ] Extracted amounts match source
- [ ] Document type correctly identified
- [ ] Client ID correctly assigned
- [ ] Year correctly assigned

### Common Errors
1. **Wrong SSN/EIN** - Verify last 4 digits match
2. **Transposed numbers** - Double-check amounts over $1,000
3. **Missing pages** - Check for multi-page documents
4. **Wrong year** - Verify tax year on each document

## Integration Notes

### CCH Status Update
After scanning, update CCH:
- Change status from "Intake" to "Documents Pending" or "Documents Complete"
- Note which documents were received

### Drake Integration
Currently, extracted data is entered manually into Drake:
1. Review extracted data in Tax Helper
2. Open corresponding Drake form
3. Enter data from Tax Helper display
4. Verify amounts match

**Future Enhancement:** Direct Drake import integration planned.

### Cost Savings vs GruntWorx
| Volume | GruntWorx Cost | Tax Helper Cost |
|--------|----------------|-----------------|
| 100 pages | $45 | $0 |
| 500 pages | $225 | $0 |
| 1,000 pages | $450 | $0 |
| 5,000 pages | $2,250 | $0 |

*Tax Helper uses flat-rate AI API costs, not per-page pricing.*

## Notes
- Scan documents same day as receipt
- Never leave unscanned documents overnight
- Report scanner issues immediately
- Back up scanned files daily
- Tax Helper OCR typically processes documents in under 10 seconds
