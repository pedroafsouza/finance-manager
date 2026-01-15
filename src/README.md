# Skatly - Danish Tax & RSU Manager

A Next.js application built with Bun to help manage taxes and RSU (Restricted Stock Unit) stock grants in Denmark, particularly for employees of tech companies.

## Features

- **RSU Tracking**: Monitor vesting schedules and track your RSU grants
- **Tax Calculation**: Automatically calculate Danish taxes on stock compensation and capital gains
- **SKAT Integration**: Generate reports ready for annual tax filing with SKAT (Danish Tax Authority)
- **Data Management**: Comprehensive settings for managing imported data safely

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Runtime**: Bun
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: SQLite (better-sqlite3)
- **Linting**: ESLint
- **Testing**: Vitest + Bun Test

## Getting Started

### Prerequisites

- **Option 1 (Local Development)**: Bun (install via `curl -fsSL https://bun.sh/install | bash`)
- **Option 2 (Docker)**: Docker and Docker Compose

### Running with Docker (Recommended for Production)

The easiest way to run Skatly is using Docker:

```bash
# Using Docker Compose (recommended)
docker-compose up -d

# Or build and run manually
docker build -t skatly .
docker run -d \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  --name skatly-app \
  skatly
```

The application will be available at [http://localhost:3000](http://localhost:3000).

**Volume Persistence**: The `./data` directory is mounted as a volume to persist your SQLite databases (both `finance.db` and `demo.db`) across container restarts.

**Managing the Container**:
```bash
# View logs
docker-compose logs -f

# Stop the application
docker-compose down

# Restart the application
docker-compose restart

# Rebuild after code changes
docker-compose up -d --build
```

### Local Development

```bash
# Install dependencies
bun install

# Run development server
bun dev

# Build for production
bun run build

# Start production server
bun start

# Run linter
bun run lint

# Run tests
bun run test:parser
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Pages

### Home (`/`)
Landing page with overview of features and navigation.

### Imports (`/imports`)
Upload and manage Excel file imports from Morgan Stanley:
- Upload Excel files
- View imported stock grants in a table
- Real-time import feedback

### Settings (`/settings`)
Data management and application settings:
- **Clear All Records**: Delete imported data (keeps database structure)
- **Delete Database Files**: Complete database reset (requires confirmation)
- **Clear Browser Cache**: Clear local browser data
- Database information

## Project Structure

```
app/
├── app/                    # Next.js app directory
│   ├── page.tsx           # Home page
│   ├── imports/           # Import page
│   ├── settings/          # Settings page
│   ├── api/               # API routes
│   │   ├── import/        # Excel import endpoint
│   │   ├── grants/        # Data retrieval endpoint
│   │   └── clear-all/     # Data clearing endpoint
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── lib/                   # Shared utilities
│   ├── db.ts             # Database utilities
│   └── excel-parser.ts   # Excel parsing logic
├── scripts/              # Utility scripts
│   ├── analyze-excel.ts  # Excel format analysis
│   ├── test-import.ts    # Import testing
│   ├── test-clear-data.ts # Clear functionality testing
│   ├── anonymize-excel.ts # Data anonymization
│   └── verify-anonymized.ts # Anonymization verification
├── __tests__/            # Test files
│   ├── excel-parser.test.ts
│   ├── db.test.ts
│   ├── api.test.ts
│   └── integration.test.ts
├── data/                 # SQLite database (gitignored)
│   └── finance.db
└── public/               # Static assets
```

## Danish Tax Context

This application is specifically designed for the Danish tax system:

- **Ligningslov § 28**: Stock options and RSUs are taxed as personal income at vesting
- **Aktiesparekonto**: Special investment account with simplified taxation
- **Aktieindkomst**: Taxation of dividends and capital gains from stocks
- **SKAT Reporting**: Annual reporting requirements for foreign stock holdings

## API Endpoints

### Import Data
```bash
POST /api/import
Content-Type: multipart/form-data

# Upload Excel file
curl -X POST http://localhost:3000/api/import \
  -F "file=@morgan-stanley.xlsx"
```

### Get All Grants
```bash
GET /api/grants

# Response: { success: true, data: [...], count: 151 }
```

### Clear Records
```bash
POST /api/clear-all

# Deletes all records, keeps database structure
```

### Delete Database
```bash
DELETE /api/clear-all

# Permanently deletes database files
```

## Data Management

### Clear Data Options

1. **Clear Records** (Recommended for regular cleanup)
   - Deletes all imported stock grants
   - Keeps database structure intact
   - Runs VACUUM to reclaim space
   - Access: Settings → Clear All Records

2. **Delete Database** (Complete reset)
   - Permanently deletes all database files
   - Creates fresh empty database
   - Requires typing "DELETE" to confirm
   - Access: Settings → Delete Database Files

### Data Privacy

- Database files are automatically excluded from git (`.gitignore`)
- Your personal financial data stays private
- Data is stored locally only (not sent to any server)
- You can anonymize test data using `bun app/scripts/anonymize-excel.ts`

## Testing

```bash
# Run parser tests (fast, works with Bun)
bun run test:parser

# Test Excel file analysis
bun app/scripts/analyze-excel.ts

# Test import functionality
bun app/scripts/test-import.ts

# Test clear data
bun app/scripts/test-clear-data.ts

# Test in watch mode
bun run test:watch

# Test with UI
bun run test:ui
```

Test coverage:
- ✅ 16 Excel parser tests (100% passing)
- ✅ 18 Database operation tests
- ✅ API endpoint tests
- ✅ Integration tests

## Scripts

### Excel Analysis
```bash
bun app/scripts/analyze-excel.ts
```
Analyzes the Morgan Stanley Excel format and shows structure.

### Data Anonymization
```bash
bun app/scripts/anonymize-excel.ts
```
Divides all numerical values by 10 to protect personal data.

### Import Testing
```bash
bun app/scripts/test-import.ts
```
Tests the complete import workflow programmatically.

### Clear Testing
```bash
bun app/scripts/test-clear-data.ts
```
Tests the data clearing functionality.

## Documentation

- **[TASKS.md](../docs/TASKS.md)** - Development tasks and progress tracking
- **[TEST_SUMMARY.md](../docs/TEST_SUMMARY.md)** - Test suite summary
- **[ANONYMIZATION.md](../docs/ANONYMIZATION.md)** - Data anonymization guide
- **[CLEAR_DATA_FEATURE.md](../docs/CLEAR_DATA_FEATURE.md)** - Clear data feature documentation
- **[__tests__/README.md](./__tests__/README.md)** - Testing guide

## Contributing

This project is in active development. Contributions and suggestions are welcome.

## License

Private project for personal use.

## Troubleshooting

### Docker Issues

#### Container won't start
Check logs: `docker-compose logs -f`

#### Database locked error in Docker
Ensure only one container instance is running: `docker ps`

#### Port already in use
Change the port mapping in `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"  # Changed from 3000:3000
```

#### Data not persisting
Verify the volume mount is correct and the `./data` directory exists with proper permissions:
```bash
mkdir -p data
chmod 755 data
```

### Local Development Issues

#### Database locked error
Stop any running dev servers and restart: `bun dev`

#### Import fails
Check that the Excel file is in Morgan Stanley format. See sample at `data/morgan-stanley.xlsx`

#### Tests failing
Some tests require Node.js runtime. Use `bun run test:parser` for Bun-compatible tests.

#### Can't clear data
Make sure you have write permissions to the `data/` directory.

## Next Steps

Future enhancements planned:
- Phase 2: Danish tax calculations
- Phase 3: SKAT report generation
- Phase 4: Additional Excel format support
- Phase 5: Analytics and visualization

## Support

For questions or issues, refer to the documentation files or create an issue in the repository.
