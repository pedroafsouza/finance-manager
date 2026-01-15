# Skatly - Danish Tax & RSU Manager

A Next.js application built with Bun to help manage taxes and RSU (Restricted Stock Unit) stock grants in Denmark, particularly for employees of tech companies.

## Features

- **RSU Tracking**: Monitor vesting schedules and track your RSU grants
- **Tax Calculation**: Automatically calculate Danish taxes on stock compensation and capital gains
- **SKAT Integration**: Generate reports ready for annual tax filing with SKAT (Danish Tax Authority)
- **Multi-Currency Support**: Display values in USD or DKK with real-time conversion
- **Data Management**: Comprehensive settings for managing imported data safely
- **Dark Mode**: Full dark mode support with theme persistence

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Runtime**: Bun
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4 with shadcn/ui components
- **State Management**: Zustand
- **Database**: SQLite (better-sqlite3)
- **Charts**: Highcharts
- **Linting**: ESLint
- **Testing**: Vitest + Bun Test

## Getting Started

### Prerequisites

- **Option 1 (Local Development)**: Bun (install via `curl -fsSL https://bun.sh/install | bash`)
- **Option 2 (Docker)**: Docker and Docker Compose

### Running with Docker (Recommended for Production)

The easiest way to run Skatly is using Docker:

```bash
# Navigate to the project root directory
cd /path/to/finance-manager

# Start the application with Docker Compose
docker-compose up -d

# Or build and run manually
docker build -t skatly -f app/Dockerfile ./app
docker run -d \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  --name skatly-app \
  skatly
```

The application will be available at [http://localhost:3000](http://localhost:3000).

**Important**: All Docker configuration files are located in the project root directory:
- `docker-compose.yml` - Docker Compose configuration
- `app/Dockerfile` - Docker image build instructions
- `app/.dockerignore` - Files to exclude from Docker build

Always run docker-compose commands from the project root directory.

**Volume Persistence**: Data is persisted across container restarts and removals. Two options are available:

1. **Bind Mount (Default)**:
   - Data is stored in `./data` directory on your host machine
   - Easy to access, backup, and restore files directly
   - Current configuration: `- ./data:/app/data`
   - Location: `/path/to/finance-manager/data`

2. **Named Volume (Alternative)**:
   - Data is managed by Docker in a named volume
   - Better isolation and performance for production
   - To use: Edit `docker-compose.yml` and switch to named volume configuration
   - Manage with: `docker volume ls`, `docker volume inspect skatly-data`

Both options persist your SQLite databases (`finance.db` and `demo.db`) even if you stop, remove, or recreate the container.

**Demo Database Initialization**: The Docker image includes a demo database with sample data:
- On first run, if `demo.db` doesn't exist, it's automatically initialized from the built-in seed data
- Subsequent restarts skip initialization if `demo.db` already exists
- This ensures new users can immediately explore the app with demo data
- The demo database is included in the Docker image build (stored in `/app/seed-data/`)

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

# Check container status
docker ps | grep skatly

# Verify the application is accessible
curl http://localhost:3000
```

**Health Check**: The container includes a health check that runs every 30 seconds. Wait about 40 seconds after starting for the container to be fully healthy.

**Data Backup**:
```bash
# With bind mount (default) - Simply copy the data directory
cp -r ./data ./data-backup

# With named volume - Export volume data
docker run --rm -v skatly-data:/data -v $(pwd):/backup alpine tar czf /backup/skatly-data-backup.tar.gz /data

# Restore from backup
docker run --rm -v skatly-data:/data -v $(pwd):/backup alpine tar xzf /backup/skatly-data-backup.tar.gz -C /
```

**Testing Volume Persistence**:
```bash
# Stop and remove the container - data persists
docker-compose down
docker-compose up -d

# Your data in finance.db and demo.db will still be there
```

### Local Development

```bash
# Navigate to the app directory
cd app

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
Dashboard with portfolio overview, summary statistics, and quick navigation links.

### Calendar (`/calendar`)
Visual calendar showing vesting events, transactions, and important dates.

### Reports (`/reports`)
Comprehensive analytics and visualizations:
- Portfolio value over time
- Holdings by ticker
- Gain/loss distribution
- Capital gain impact breakdown

### Tax Calculator (`/tax-calculator`)
Step-by-step wizard for calculating Danish taxes on stock income.

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
finance-manager/
├── app/                    # Next.js application
│   ├── app/                # Next.js app directory
│   │   ├── page.tsx       # Home page
│   │   ├── calendar/      # Calendar page
│   │   ├── reports/       # Reports & analytics
│   │   ├── tax-calculator/ # Tax calculator wizard
│   │   ├── imports/       # Import page
│   │   ├── settings/      # Settings page
│   │   ├── api/           # API routes
│   │   ├── components/    # Shared components
│   │   ├── layout.tsx     # Root layout
│   │   └── globals.css    # Global styles
│   ├── lib/               # Shared utilities
│   │   ├── db.ts          # Database utilities
│   │   ├── excel-parser.ts # Excel parsing logic
│   │   ├── currency.ts    # Currency utilities
│   │   └── stores/        # Zustand stores
│   ├── components/        # UI components (shadcn)
│   │   └── ui/            # Base UI components
│   ├── scripts/           # Utility scripts
│   ├── __tests__/         # Test files
│   ├── data/              # SQLite databases
│   ├── Dockerfile         # Docker image configuration
│   ├── .dockerignore      # Docker build exclusions
│   └── docker-entrypoint.sh # Entrypoint script (initializes demo.db)
├── docker-compose.yml     # Docker Compose configuration (root only)
└── README.md              # This file
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

### Get Transactions
```bash
GET /api/transactions

# Response: { success: true, data: [...] }
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
# Navigate to app directory
cd app

# Run parser tests (fast, works with Bun)
bun run test:parser

# Test Excel file analysis
bun scripts/analyze-excel.ts

# Test import functionality
bun scripts/test-import.ts

# Test clear data
bun scripts/test-clear-data.ts

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

## Troubleshooting

### Docker Issues

#### Container won't start
Check logs: `docker-compose logs -f`

#### Build fails with TypeScript errors
If the Docker build fails during the TypeScript compilation step, try:
1. Check for TypeScript errors in your local development environment first: `cd app && bun run build`
2. Common issues:
   - Function naming conflicts (e.g., recursive calls to wrong function)
   - Missing interface properties
   - Incorrect dynamic imports with Next.js
3. Fix the errors locally, then rebuild: `docker-compose up -d --build`

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

Check that the volume is properly mounted:
```bash
# Inspect the container to see volume mounts
docker inspect skatly-app | grep -A 10 Mounts

# List all volumes
docker volume ls

# If using bind mount, check if data directory has files
ls -la ./data/

# If using named volume, inspect volume
docker volume inspect skatly-data
```

#### Volume cleanup (if needed)
```bash
# Remove container and volumes
docker-compose down -v

# Or remove specific volume
docker volume rm skatly-data
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
- Enhanced tax calculation features
- More SKAT report templates
- Additional Excel format support
- Advanced analytics and insights
- PDF export functionality

## Contributing

This project is in active development. Contributions and suggestions are welcome.

## License

Private project for personal use.

## Support

For questions or issues, refer to the documentation files or create an issue in the repository.
