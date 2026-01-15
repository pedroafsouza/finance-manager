import { NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await initDb();
    const db = await getDb();

    const transactions = db.prepare(`
      SELECT * FROM transactions
      ORDER BY entry_date DESC
    `).all();

    db.close();

    return NextResponse.json({
      success: true,
      data: transactions,
      count: transactions.length,
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}
