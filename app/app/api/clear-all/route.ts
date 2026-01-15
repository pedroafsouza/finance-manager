import { NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';
import * as fs from 'fs';
import * as path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    // Initialize database if not exists
    initDb();
    const db = getDb();

    // Get count before deletion
    const countBefore = db.prepare('SELECT COUNT(*) as count FROM stock_grants').get() as { count: number };

    // Delete all records
    db.prepare('DELETE FROM stock_grants').run();

    // Vacuum the database to reclaim space
    db.exec('VACUUM');

    db.close();

    return NextResponse.json({
      success: true,
      message: 'All data cleared successfully',
      recordsDeleted: countBefore.count,
    });
  } catch (error) {
    console.error('Clear error:', error);
    return NextResponse.json(
      { error: 'Failed to clear data', details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const dbPath = path.join(process.cwd(), 'data', 'finance.db');
    const dbShmPath = `${dbPath}-shm`;
    const dbWalPath = `${dbPath}-wal`;

    let deletedFiles = [];

    // Delete main database file
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
      deletedFiles.push('finance.db');
    }

    // Delete shared memory file
    if (fs.existsSync(dbShmPath)) {
      fs.unlinkSync(dbShmPath);
      deletedFiles.push('finance.db-shm');
    }

    // Delete write-ahead log file
    if (fs.existsSync(dbWalPath)) {
      fs.unlinkSync(dbWalPath);
      deletedFiles.push('finance.db-wal');
    }

    if (deletedFiles.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No database files found to delete',
        filesDeleted: [],
      });
    }

    // Reinitialize database
    initDb();

    return NextResponse.json({
      success: true,
      message: 'Database files deleted and reinitialized',
      filesDeleted: deletedFiles,
    });
  } catch (error) {
    console.error('Delete database error:', error);
    return NextResponse.json(
      { error: 'Failed to delete database files', details: (error as Error).message },
      { status: 500 }
    );
  }
}
