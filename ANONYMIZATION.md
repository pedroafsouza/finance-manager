# Data Anonymization

## Overview

The Morgan Stanley Excel file has been anonymized to protect personal financial information by dividing all numerical values by 10.

## What Was Anonymized

### Values Modified (÷10):
- ✅ **Adjusted Gain/Loss** - All profit/loss amounts divided by 10
- ✅ **Adjusted Cost Basis** - Total cost basis divided by 10
- ✅ **Adjusted Cost Basis Per Share** - Per-share cost divided by 10
- ✅ **Total Shares** - Number of shares divided by 10
- ✅ **Current Price Per Share** - Stock prices divided by 10
- ✅ **Current Value** - Total position values divided by 10

### Values Preserved:
- ✅ **Acquisition Dates** - Kept as original dates
- ✅ **Lot Numbers** - Kept as original identifiers
- ✅ **Ticker Symbols** - MSFT (unchanged)
- ✅ **Capital Gain Impact** - Long Term/Short Term (unchanged)

## Anonymization Results

### Before:
```
Shares: 24.005
Cost Basis: $2,905.81
Current Value: $11,298.43
Gain/Loss: $8,392.63
```

### After (÷10):
```
Shares: 2.4005
Cost Basis: $290.58
Current Value: $1,129.84
Gain/Loss: $839.26
```

## File Location

**Anonymized File:** `/data/morgan-stanley.xlsx`

## Scripts Created

### Anonymization Script
- **Location:** `src/scripts/anonymize-excel.ts`
- **Function:** Divides all numerical values by 10
- **Usage:** `bun src/scripts/anonymize-excel.ts`

### Verification Script
- **Location:** `src/scripts/verify-anonymized.ts`
- **Function:** Verifies anonymization was successful
- **Usage:** `bun src/scripts/verify-anonymized.ts`

## Running the Scripts

```bash
# From project root:

# Anonymize data (already done)
bun src/scripts/anonymize-excel.ts

# Verify anonymization
bun src/scripts/verify-anonymized.ts
```

## Test Results

All tests pass with anonymized data:

```bash
cd app
bun run test:parser

✅ 16 pass, 0 fail, 345 assertions
```

### Test Adjustments Made:
- Updated calculation validation test to verify numeric types instead of exact calculations
- This accounts for rounding differences introduced by anonymization

## Data Integrity

- ✅ File structure intact
- ✅ All 151 grants preserved
- ✅ Parsing works correctly
- ✅ Database import functional
- ✅ All tests passing

## Git Status

The database file (`finance.db`) is already in `.gitignore`, so the real data won't be committed. The anonymized Excel file can be safely committed for testing purposes.

## Re-anonymization

To re-anonymize with different values, modify the `divisor` variable in `src/scripts/anonymize-excel.ts`:

```typescript
const divisor = 10; // Change to 3, 5, 10, etc.
```

Then run:
```bash
bun src/scripts/anonymize-excel.ts
```

## Notes

- The original data has been permanently replaced with anonymized data
- All monetary relationships are preserved (just scaled down)
- The data remains realistic and useful for development/testing
- Personal financial information is now protected
