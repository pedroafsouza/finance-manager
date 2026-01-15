# Use Bun image
FROM oven/bun:1 AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Install build dependencies for native modules (better-sqlite3)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json bun.lockb* ./

# Install dependencies
RUN bun install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Disable Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# Build the Next.js application
RUN bun run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

# Create a non-root user
RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 --gid nodejs nextjs

# Create data directory for SQLite databases
RUN mkdir -p /app/data /app/seed-data && chown -R nextjs:nodejs /app/data /app/seed-data

# Copy demo.db to seed-data directory (will be copied to /app/data on first run)
COPY --from=builder --chown=nextjs:nodejs /app/data/demo.db* /app/seed-data/

# Copy necessary files from builder
COPY --from=builder /app/public ./public

# Copy standalone build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy entrypoint script
COPY --chown=nextjs:nodejs docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD bun -e "fetch('http://localhost:3000').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Set entrypoint to initialize demo.db if needed
ENTRYPOINT ["docker-entrypoint.sh"]

# Start the application
CMD ["bun", "server.js"]
