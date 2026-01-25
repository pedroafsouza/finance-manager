import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';
import {
  parseCurrentHoldings,
  parsePreviousHoldings,
  toCapitalGainImpact,
  FidelityCurrentHolding,
  FidelityPreviousHolding,
} from '@/lib/csv-parser-fidelity';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    await initDb();

    const formData = await request.formData();
    const currentFile = formData.get('currentFile') as File | null;
    const previousFile = formData.get('previousFile') as File | null;
    const ticker = (formData.get('ticker') as string) || 'UNKNOWN';

    if (!currentFile && !previousFile) {
      return NextResponse.json(
        { success: false, error: 'At least one CSV file must be provided' },
        { status: 400 }
      );
    }

    let currentHoldings: FidelityCurrentHolding[] = [];
    let previousHoldings: FidelityPreviousHolding[] = [];

    // Parse current holdings file
    if (currentFile) {
      if (!currentFile.name.endsWith('.csv')) {
        return NextResponse.json(
          { success: false, error: 'Current holdings file must be a CSV' },
          { status: 400 }
        );
      }
      const content = await currentFile.text();
      currentHoldings = parseCurrentHoldings(content, ticker);
      console.log(`Parsed ${currentHoldings.length} current holdings`);
    }

    // Parse previous holdings file
    if (previousFile) {
      if (!previousFile.name.endsWith('.csv')) {
        return NextResponse.json(
          { success: false, error: 'Previous holdings file must be a CSV' },
          { status: 400 }
        );
      }
      const content = await previousFile.text();
      previousHoldings = parsePreviousHoldings(content, ticker);
      console.log(`Parsed ${previousHoldings.length} previous holdings`);
    }

    const db = await getDb();

    try {
      db.exec('BEGIN TRANSACTION');

      // Insert current holdings into holdings and stock_grants tables
      const insertHolding = db.prepare(`
        INSERT INTO holdings (
          ticker, acquisition_date, lot_number, capital_gain_impact,
          adjusted_gain_loss, adjusted_cost_basis, adjusted_cost_basis_per_share,
          total_shares, current_price_per_share, current_value
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const insertGrant = db.prepare(`
        INSERT INTO stock_grants (
          ticker, acquisition_date, lot_number, capital_gain_impact,
          adjusted_gain_loss, adjusted_cost_basis, adjusted_cost_basis_per_share,
          total_shares, current_price_per_share, current_value, import_source
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      let lotNumber = 1;
      for (const holding of currentHoldings) {
        const currentPricePerShare = holding.quantity > 0 
          ? holding.current_value / holding.quantity 
          : 0;

        insertHolding.run(
          holding.ticker,
          holding.acquisition_date,
          lotNumber,
          toCapitalGainImpact(holding.holding_period),
          holding.gain_loss,
          holding.cost_basis,
          holding.cost_basis_per_share,
          holding.quantity,
          currentPricePerShare,
          holding.current_value
        );

        insertGrant.run(
          holding.ticker,
          holding.acquisition_date,
          lotNumber,
          toCapitalGainImpact(holding.holding_period),
          holding.gain_loss,
          holding.cost_basis,
          holding.cost_basis_per_share,
          holding.quantity,
          currentPricePerShare,
          holding.current_value,
          'fidelity-csv'
        );

        lotNumber++;
      }

      // Insert previous holdings as transactions (sold shares)
      const insertTransaction = db.prepare(`
        INSERT INTO transactions (
          entry_date, activity_type, ticker, lot_number,
          num_shares, share_price, book_value, market_value, cash_value
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const holding of previousHoldings) {
        const sharePrice = holding.quantity > 0 
          ? holding.proceeds / holding.quantity 
          : 0;

        insertTransaction.run(
          holding.date_sold,
          'Sale',
          holding.ticker,
          null, // lot number unknown for sold shares
          holding.quantity,
          sharePrice,
          holding.cost_basis,
          holding.proceeds,
          holding.proceeds
        );
      }

      db.exec('COMMIT');

      return NextResponse.json({
        success: true,
        message: 'Fidelity CSV imported successfully',
        currentHoldings: currentHoldings.length,
        previousHoldings: previousHoldings.length,
        count: currentHoldings.length + previousHoldings.length,
      });
    } catch (dbError) {
      db.exec('ROLLBACK');
      console.error('Database error:', dbError);
      return NextResponse.json(
        { success: false, error: 'Failed to save data to database' },
        { status: 500 }
      );
    } finally {
      db.close();
    }
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to import Fidelity CSV' },
      { status: 500 }
    );
  }
}
