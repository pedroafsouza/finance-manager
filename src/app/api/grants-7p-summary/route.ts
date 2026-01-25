import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/grants-7p-summary
 * Returns the total cost basis of shares covered and not covered by 7P
 */
export async function GET(request: NextRequest) {
  try {
    await initDb();
    const db = await getDb();

    // Get totals for 7P and non-7P shares
    const result = db.prepare(`
      SELECT 
        COALESCE(SUM(CASE WHEN covered_by_7p = 1 THEN adjusted_cost_basis ELSE 0 END), 0) as total_on_7p,
        COALESCE(SUM(CASE WHEN covered_by_7p = 0 OR covered_by_7p IS NULL THEN adjusted_cost_basis ELSE 0 END), 0) as total_not_on_7p
      FROM stock_grants
    `).get() as { total_on_7p: number; total_not_on_7p: number };

    db.close();

    return NextResponse.json({
      success: true,
      data: {
        amountOn7p: result.total_on_7p || 0,
        amountNotOn7p: result.total_not_on_7p || 0,
      },
    });
  } catch (error) {
    console.error('7P summary error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch 7P summary' },
      { status: 500 }
    );
  }
}
