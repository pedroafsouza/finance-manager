import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Initialize database if not exists
    await initDb();

    const db = await getDb();

    const grants = db.prepare(`
      SELECT * FROM stock_grants
      ORDER BY acquisition_date DESC, ticker
    `).all();

    db.close();

    return NextResponse.json({
      success: true,
      data: grants,
      count: grants.length,
    });
  } catch (error) {
    console.error('Fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch grants', details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await initDb();
    const db = await getDb();

    const body = await request.json();
    const { id, covered_by_7p } = body;

    if (id === undefined || covered_by_7p === undefined) {
      return NextResponse.json(
        { error: 'Missing id or covered_by_7p field' },
        { status: 400 }
      );
    }

    db.prepare('UPDATE stock_grants SET covered_by_7p = ? WHERE id = ?').run(
      covered_by_7p ? 1 : 0,
      id
    );

    db.close();

    return NextResponse.json({
      success: true,
      message: '7P status updated',
    });
  } catch (error) {
    console.error('Update error:', error);
    return NextResponse.json(
      { error: 'Failed to update grant', details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    await initDb();
    const db = await getDb();

    // Clear all imported data from all tables
    db.prepare('DELETE FROM stock_grants').run();
    db.prepare('DELETE FROM holdings').run();
    db.prepare('DELETE FROM transactions').run();
    db.close();

    return NextResponse.json({
      success: true,
      message: 'All imported data deleted',
    });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete data', details: (error as Error).message },
      { status: 500 }
    );
  }
}
