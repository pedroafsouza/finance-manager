import { NextRequest, NextResponse } from 'next/server';
import { getCalculationsDb, initLiveCalculationsDb, initDemoCalculationsDb } from '@/lib/db';
import { calculateDanishTax, type TaxInput } from '@/lib/tax-calculator-danish';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Helper to initialize the correct calculations database
async function initCalculationsDb() {
  let isDemoMode = false;
  try {
    const cookieStore = await cookies();
    const demoModeCookie = cookieStore.get('demoMode');
    isDemoMode = demoModeCookie?.value === 'true';
  } catch (error) {
    isDemoMode = false;
  }

  if (isDemoMode) {
    initDemoCalculationsDb();
  } else {
    initLiveCalculationsDb();
  }
}

// Helper to convert snake_case database fields to camelCase
function convertDbRowToCamelCase(row: any) {
  return {
    id: row.id,
    year: row.year,
    yearlySalaryDkk: row.yearly_salary_dkk,
    fradragDkk: row.fradrag_dkk,
    amountOn7pDkk: row.amount_on_7p_dkk,
    amountNotOn7pDkk: row.amount_not_on_7p_dkk,
    microsoftAllowance7pDkk: row.microsoft_allowance_7p_dkk,
    preferredCurrency: row.preferred_currency,
    usdToDkkRate: row.usd_to_dkk_rate,
    calculatedTaxDkk: row.calculated_tax_dkk,
    amBidragDkk: row.am_bidrag_dkk,
    bottomTaxDkk: row.bottom_tax_dkk,
    topTaxDkk: row.top_tax_dkk,
    municipalTaxDkk: row.municipal_tax_dkk,
    totalTaxDkk: row.total_tax_dkk,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// GET - Fetch all tax calculations
export async function GET() {
  try {
    await initCalculationsDb();
    const db = await getCalculationsDb();

    const calculations = db.prepare(`
      SELECT * FROM tax_calculations
      ORDER BY year DESC
    `).all();

    db.close();

    // Convert snake_case to camelCase
    const formattedCalculations = calculations.map(convertDbRowToCamelCase);

    return NextResponse.json({
      success: true,
      data: formattedCalculations,
      count: formattedCalculations.length,
    });
  } catch (error) {
    console.error('Error fetching tax calculations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tax calculations' },
      { status: 500 }
    );
  }
}

// POST - Create new tax calculation
export async function POST(request: NextRequest) {
  try {
    await initCalculationsDb();
    const body = await request.json();

    const {
      year,
      yearlySalaryDkk,
      fradragDkk,
      amountOn7pDkk,
      amountNotOn7pDkk,
      microsoftAllowance7pDkk,
      preferredCurrency = 'DKK',
      usdToDkkRate = 6.9,
      notes = '',
    } = body;

    // Validate required fields
    if (!year || yearlySalaryDkk === undefined || fradragDkk === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Calculate taxes
    const taxInput: TaxInput = {
      yearlySalaryDkk,
      fradragDkk,
      amountOn7pDkk: amountOn7pDkk || 0,
      amountNotOn7pDkk: amountNotOn7pDkk || 0,
      microsoftAllowance7pDkk: microsoftAllowance7pDkk || 0,
      year,
    };

    const taxResult = calculateDanishTax(taxInput);

    const db = await getCalculationsDb();

    try {
      const stmt = db.prepare(`
        INSERT INTO tax_calculations (
          year, yearly_salary_dkk, fradrag_dkk,
          amount_on_7p_dkk, amount_not_on_7p_dkk, microsoft_allowance_7p_dkk,
          preferred_currency, usd_to_dkk_rate,
          calculated_tax_dkk, am_bidrag_dkk, bottom_tax_dkk, top_tax_dkk,
          municipal_tax_dkk, total_tax_dkk, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        year,
        yearlySalaryDkk,
        fradragDkk,
        amountOn7pDkk || 0,
        amountNotOn7pDkk || 0,
        microsoftAllowance7pDkk || 0,
        preferredCurrency,
        usdToDkkRate,
        taxResult.totalTax,
        taxResult.amBidrag,
        taxResult.bottomTax,
        taxResult.topTax,
        taxResult.municipalTax,
        taxResult.totalTax,
        notes
      );

      db.close();

      return NextResponse.json({
        success: true,
        message: 'Tax calculation created successfully',
        id: result.lastInsertRowid,
        calculation: taxResult,
      });
    } catch (dbError: any) {
      db.close();
      if (dbError.message?.includes('UNIQUE constraint failed')) {
        return NextResponse.json(
          { success: false, error: `Tax calculation for year ${year} already exists` },
          { status: 409 }
        );
      }
      throw dbError;
    }
  } catch (error) {
    console.error('Error creating tax calculation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create tax calculation' },
      { status: 500 }
    );
  }
}

// PUT - Update existing tax calculation
export async function PUT(request: NextRequest) {
  try {
    await initCalculationsDb();
    const body = await request.json();

    const {
      id,
      year,
      yearlySalaryDkk,
      fradragDkk,
      amountOn7pDkk,
      amountNotOn7pDkk,
      microsoftAllowance7pDkk,
      preferredCurrency = 'DKK',
      usdToDkkRate = 6.9,
      notes = '',
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing ID' },
        { status: 400 }
      );
    }

    // Calculate taxes
    const taxInput: TaxInput = {
      yearlySalaryDkk,
      fradragDkk,
      amountOn7pDkk: amountOn7pDkk || 0,
      amountNotOn7pDkk: amountNotOn7pDkk || 0,
      microsoftAllowance7pDkk: microsoftAllowance7pDkk || 0,
      year,
    };

    const taxResult = calculateDanishTax(taxInput);

    const db = await getCalculationsDb();

    const stmt = db.prepare(`
      UPDATE tax_calculations
      SET yearly_salary_dkk = ?,
          fradrag_dkk = ?,
          amount_on_7p_dkk = ?,
          amount_not_on_7p_dkk = ?,
          microsoft_allowance_7p_dkk = ?,
          preferred_currency = ?,
          usd_to_dkk_rate = ?,
          calculated_tax_dkk = ?,
          am_bidrag_dkk = ?,
          bottom_tax_dkk = ?,
          top_tax_dkk = ?,
          municipal_tax_dkk = ?,
          total_tax_dkk = ?,
          notes = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const result = stmt.run(
      yearlySalaryDkk,
      fradragDkk,
      amountOn7pDkk || 0,
      amountNotOn7pDkk || 0,
      microsoftAllowance7pDkk || 0,
      preferredCurrency,
      usdToDkkRate,
      taxResult.totalTax,
      taxResult.amBidrag,
      taxResult.bottomTax,
      taxResult.topTax,
      taxResult.municipalTax,
      taxResult.totalTax,
      notes,
      id
    );

    db.close();

    if (result.changes === 0) {
      return NextResponse.json(
        { success: false, error: 'Tax calculation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Tax calculation updated successfully',
      calculation: taxResult,
    });
  } catch (error) {
    console.error('Error updating tax calculation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update tax calculation' },
      { status: 500 }
    );
  }
}

// DELETE - Delete tax calculation
export async function DELETE(request: NextRequest) {
  try {
    await initCalculationsDb();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing ID' },
        { status: 400 }
      );
    }

    const db = await getCalculationsDb();

    const stmt = db.prepare('DELETE FROM tax_calculations WHERE id = ?');
    const result = stmt.run(id);

    db.close();

    if (result.changes === 0) {
      return NextResponse.json(
        { success: false, error: 'Tax calculation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Tax calculation deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting tax calculation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete tax calculation' },
      { status: 500 }
    );
  }
}
