# Getting Started with Development

[← Back to README](../README.md)

This guide covers everything you need to know to develop and contribute to Skatly (Finance Manager).

## Prerequisites

### Option 1: Bun (Recommended)

Install Bun for the best development experience:

```bash
curl -fsSL https://bun.sh/install | bash
```

### Option 2: Node.js

Alternatively, you can use Node.js (v18 or higher):

```bash
# Check your Node.js version
node --version
```

## Local Development Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd finance-manager
```

### 2. Install Dependencies

```bash
cd app
bun install

# Or with npm
npm install
```

### 3. Run Development Server

```bash
bun dev

# Or with npm
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### 4. Build Commands

```bash
# Build for production
bun run build

# Start production server
bun start

# Run linter
bun run lint
```

## Project Structure

```
finance-manager/
├── src/                    # Next.js application
│   ├── src/                # Next.js app directory
│   │   ├── page.tsx       # Home page (dashboard)
│   │   ├── layout.tsx     # Root layout with providers
│   │   ├── globals.css    # Global styles
│   │   ├── api/           # Backend API routes
│   │   │   ├── grants/route.ts
│   │   │   ├── import/route.ts
│   │   │   ├── import-pdf/route.ts
│   │   │   ├── transactions/route.ts
│   │   │   ├── tax-calculations/route.ts
│   │   │   ├── clear-all/route.ts
│   │   │   └── llm/       # LLM integration APIs
│   │   ├── components/    # Shared components
│   │   │   ├── Navigation.tsx
│   │   │   ├── WelcomeDialog.tsx
│   │   │   ├── AnalyzeButton.tsx
│   │   │   ├── NotificationBell.tsx
│   │   │   └── NotificationDropdown.tsx
│   │   ├── calendar/      # Calendar page
│   │   ├── reports/       # Reports & analytics page
│   │   ├── imports/       # Import data page
│   │   ├── tax-calculator/ # Tax calculator wizard
│   │   └── settings/      # Settings page
│   ├── lib/               # Shared utilities
│   │   ├── db.ts          # SQLite setup & schema
│   │   ├── excel-parser.ts # Morgan Stanley Excel parsing
│   │   ├── pdf-parser-morgan-stanley.ts # PDF parsing
│   │   ├── currency.ts    # Currency conversion utilities
│   │   ├── tax-calculator-danish.ts # Danish tax logic
│   │   ├── themes.ts      # Dark mode themes
│   │   ├── encryption.ts  # API key encryption
│   │   ├── llm-clients.ts # Claude & Gemini integration
│   │   └── stores/        # Zustand stores
│   │       ├── currency-store.ts
│   │       ├── demo-mode-store.ts
│   │       ├── theme-store.ts
│   │       ├── sidebar-store.ts
│   │       └── notifications-store.ts
│   ├── components/        # shadcn/ui base components
│   │   └── ui/            # Button, Input, Card, etc.
│   ├── public/            # Static assets
│   ├── __tests__/         # Test files
│   ├── scripts/           # Utility scripts
│   ├── data/              # SQLite databases (gitignored)
│   │   ├── finance.db     # Main database
│   │   └── demo.db        # Demo mode database
│   ├── Dockerfile         # Docker image config
│   ├── docker-entrypoint.sh # Container initialization
│   └── package.json       # Dependencies
├── docs/                  # Documentation
│   ├── getting-started-development.md # This file
│   └── configure-llm.md   # LLM setup guide
├── docker-compose.yml     # Docker Compose config
└── README.md              # Main documentation
```

### Key Files Explained

**Database & Backend:**
- `lib/db.ts` - SQLite database initialization and table schemas
- `lib/excel-parser.ts` - Parses Morgan Stanley Excel files
- `lib/pdf-parser-morgan-stanley.ts` - Parses Morgan Stanley PDF statements

**Frontend State:**
- `lib/stores/*` - Zustand stores for global state (theme, currency, demo mode, notifications)

**API Routes:**
- `src/api/grants/route.ts` - Fetch stock grants
- `src/api/transactions/route.ts` - Fetch transactions
- `src/api/import/route.ts` - Upload and parse Excel files
- `src/api/llm/*` - LLM integration endpoints

## Development Workflow

### Making Changes

1. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Your Changes**
   - Edit files in `src/src/` for frontend
   - Edit files in `src/lib/` for utilities
   - Edit files in `src/src/api/` for backend

3. **Test Your Changes**
   ```bash
   bun dev
   # Visit http://localhost:3000 and test manually
   ```

4. **Run Linter**
   ```bash
   bun run lint
   ```

5. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "Description of changes"
   ```

## Testing

### Running Tests

```bash
# Navigate to app directory
cd app

# Run parser tests (fast, works with Bun)
bun run test:parser

# Run all tests
bun test

# Test in watch mode
bun run test:watch

# Test with UI
bun run test:ui
```

### Test Scripts

```bash
# Test Excel file analysis
bun scripts/analyze-excel.ts

# Test import functionality
bun scripts/test-import.ts

# Test clear data
bun scripts/test-clear-data.ts
```

### Test Coverage

- ✅ 16 Excel parser tests (100% passing)
- ✅ 18 Database operation tests
- ✅ API endpoint tests
- ✅ Integration tests

## API Endpoints

### Import Data

Upload Morgan Stanley Excel files:

```bash
POST /api/import
Content-Type: multipart/form-data

# Example with curl
curl -X POST http://localhost:3000/api/import \
  -F "file=@morgan-stanley.xlsx"
```

**Response:**
```json
{
  "success": true,
  "message": "Imported 151 records",
  "recordsImported": 151
}
```

### Import PDF

Upload Morgan Stanley PDF statements:

```bash
POST /api/import-pdf
Content-Type: multipart/form-data

curl -X POST http://localhost:3000/api/import-pdf \
  -F "file=@statement.pdf"
```

### Get All Grants

Retrieve all stock grants:

```bash
GET /api/grants

# Response
{
  "success": true,
  "data": [...],
  "count": 151
}
```

### Get Transactions

Retrieve all transactions:

```bash
GET /api/transactions

# Response
{
  "success": true,
  "data": [...]
}
```

### Tax Calculations

Retrieve tax calculations:

```bash
GET /api/tax-calculations

# Response
{
  "success": true,
  "data": [...]
}
```

### Clear Records

Delete all imported records (keeps database structure):

```bash
POST /api/clear-all

# Response
{
  "success": true,
  "recordsDeleted": 151
}
```

### Delete Database

Permanently delete database files:

```bash
DELETE /api/clear-all

# Response
{
  "success": true,
  "filesDeleted": ["finance.db", "demo.db"]
}
```

### LLM Integration APIs

See [Configure LLM](./configure-llm.md) for LLM-specific API endpoints.

## Data Management

### Database Structure

The application uses **SQLite** with the following tables:

1. **transactions** - All financial activities (buys, sells, vests)
2. **holdings** - Current stock positions with cost basis
3. **stock_grants** - Legacy compatibility table
4. **tax_calculations** - Danish tax calculations by year
5. **llm_settings** - Encrypted LLM API keys
6. **llm_analysis_reports** - AI analysis results

### Clear Data Options

#### 1. Clear Records (Recommended for Regular Cleanup)

- Deletes all imported stock grants and transactions
- Keeps database structure intact
- Runs VACUUM to reclaim space
- Access: Settings → Clear All Records

#### 2. Delete Database (Complete Reset)

- Permanently deletes all database files
- Creates fresh empty database
- Requires typing "DELETE" to confirm
- Access: Settings → Delete Database Files

### Data Privacy

- Database files are automatically excluded from git (`.gitignore`)
- Your personal financial data stays private
- Data is stored locally only (not sent to any server except chosen LLM)
- You can anonymize test data using `bun src/scripts/anonymize-excel.ts`

## Troubleshooting Development Issues

### Database Locked Error

**Problem**: `Error: database is locked`

**Solution**:
1. Stop any running dev servers
2. Close any database browsers (e.g., DB Browser for SQLite)
3. Restart: `bun dev`

### Import Fails

**Problem**: File upload doesn't work or parsing fails

**Solution**:
1. Ensure the Excel file is in Morgan Stanley format
2. Check sample file at `data/morgan-stanley.xlsx`
3. Verify file permissions
4. Check console for specific error messages

### Tests Failing

**Problem**: Some tests don't run with Bun

**Solution**:
- Use `bun run test:parser` for Bun-compatible tests
- Some tests require Node.js runtime
- Check test output for specific failures

### Can't Clear Data

**Problem**: Permission denied when clearing database

**Solution**:
```bash
# Check permissions
ls -la data/

# Fix permissions
chmod 755 data/
chmod 644 data/*.db
```

### TypeScript Errors

**Problem**: Build fails with TypeScript errors

**Solution**:
1. Check for naming conflicts (e.g., recursive calls)
2. Verify all required properties are defined
3. Run `bun run build` to see detailed errors
4. Fix errors before committing

### Port Already in Use

**Problem**: Port 3000 is already in use

**Solution**:
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use a different port
PORT=3001 bun dev
```

## Pages Overview

### Home (`/`)
Dashboard with portfolio overview, summary statistics, and quick navigation links. Includes the "Analyze Portfolio" button for LLM analysis.

### Calendar (`/calendar`)
Visual calendar showing vesting events, transactions, and important dates using FullCalendar.

### Reports (`/reports`)
Comprehensive analytics and visualizations:
- Portfolio value over time
- Holdings by ticker (pie chart)
- Gain/loss distribution
- Capital gain impact breakdown

### Tax Calculator (`/tax-calculator`)
Step-by-step wizard for calculating Danish taxes on stock income:
1. Select year
2. Enter salary and deductions (fradrag)
3. Enter RSU amounts on/not on 7P
4. View tax breakdown (AM-bidrag, bottom tax, top tax, municipal tax)

### Imports (`/imports`)
Upload and manage Excel/PDF file imports from Morgan Stanley:
- Upload Excel files
- Upload PDF statements
- View imported records in tables
- Real-time import feedback

### Settings (`/settings`)
Application settings and data management:
- **AI Analysis Settings**: Configure Claude/Gemini API keys
- **Data Management**: Clear records or delete database
- **Cache Management**: Clear browser cache
- Database information

## Tech Stack Details

### Frontend
- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **UI Library**: React 19.2.3
- **Styling**: Tailwind CSS 4 + shadcn/ui components
- **State Management**: Zustand (theme, currency, demo mode, notifications)
- **Charts**: Highcharts + Highcharts React Official
- **Icons**: Lucide React
- **UI Components**: Radix UI (dialog, label, select, slot)
- **Calendar**: FullCalendar

### Backend
- **Runtime**: Bun (primary, with Node.js support)
- **Framework**: Next.js 16 (API routes)
- **Database**: SQLite with better-sqlite3
- **File Processing**:
  - xlsx (Excel parsing)
  - pdf.js-extract (PDF parsing)
  - canvas (for graphics)
- **Security**: AES-256-GCM encryption for API keys

### DevTools
- **Testing**: Vitest + Bun Test
- **Linting**: ESLint 9 with Next.js config
- **Build**: Next.js standalone build

### Deployment
- **Docker**: Multi-stage Dockerfile with Bun image
- **Orchestration**: Docker Compose

## Danish Tax Context

This application is specifically designed for the Danish tax system:

- **Ligningslov § 28**: Stock options and RSUs are taxed as personal income at vesting
- **Ligningslov § 7P**: Special taxation regime for RSUs (can reduce effective tax rate)
- **Aktieindkomst**: Taxation of dividends and capital gains from stocks
- **SKAT Reporting**: Annual reporting requirements for foreign stock holdings
- **Tax Rates**:
  - AM-bidrag: 8% (labor market contribution)
  - Bottom tax: 12.09%
  - Top tax: 15% (on income above threshold)
  - Municipal tax: ~25% (varies by municipality)

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linter
5. Submit a pull request

## Next Steps

- **Configure LLM**: See [Configure LLM](./configure-llm.md) to set up AI portfolio analysis
- **Read Main README**: Back to [main documentation](../README.md)

## License

Private project for personal use.
