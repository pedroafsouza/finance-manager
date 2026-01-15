import { NextRequest, NextResponse } from 'next/server';
import { parseMorganStanleyExcel } from '@/lib/excel-parser';
import { getDb, initDb } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Initialize database if not exists
    await initDb();

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Parse Excel file
    const grants = parseMorganStanleyExcel(buffer);

    if (grants.length === 0) {
      return NextResponse.json({ error: 'No data found in file' }, { status: 400 });
    }

    // Insert into database
    const db = await getDb();

    const insertStmt = db.prepare(`
      INSERT INTO stock_grants (
        ticker, acquisition_date, lot_number, capital_gain_impact,
        adjusted_gain_loss, adjusted_cost_basis, adjusted_cost_basis_per_share,
        total_shares, current_price_per_share, current_value
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((grants) => {
      for (const grant of grants) {
        insertStmt.run(
          grant.ticker,
          grant.acquisitionDate.toISOString(),
          grant.lotNumber,
          grant.capitalGainImpact,
          grant.adjustedGainLoss,
          grant.adjustedCostBasis,
          grant.adjustedCostBasisPerShare,
          grant.totalShares,
          grant.currentPricePerShare,
          grant.currentValue
        );
      }
    });

    insertMany(grants);
    db.close();

    return NextResponse.json({
      success: true,
      message: `Imported ${grants.length} stock grants`,
      count: grants.length,
    });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: 'Failed to import file', details: (error as Error).message },
      { status: 500 }
    );
  }
}
