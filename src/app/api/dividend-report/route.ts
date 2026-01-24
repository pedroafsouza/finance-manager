import { NextRequest, NextResponse } from 'next/server';
import { calculateDividendTaxReport } from '@/lib/dividend-calculator';
import { initDb } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/dividend-report?year=2024&is_us_person=false&irs_tax_paid=1000
 * Generate dividend tax report for Danish tax return
 */
export async function GET(request: NextRequest) {
  try {
    await initDb();

    const searchParams = request.nextUrl.searchParams;
    const yearParam = searchParams.get('year');
    const isUsPersonParam = searchParams.get('is_us_person');
    const irsTaxPaidParam = searchParams.get('irs_tax_paid');

    if (!yearParam) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameter: year' },
        { status: 400 }
      );
    }

    const year = parseInt(yearParam);
    if (isNaN(year) || year < 2000 || year > 2100) {
      return NextResponse.json(
        { success: false, error: 'Invalid year' },
        { status: 400 }
      );
    }

    const isUsPerson = isUsPersonParam === 'true';
    const irsTaxPaid = irsTaxPaidParam ? parseFloat(irsTaxPaidParam) : undefined;

    // Generate report
    const report = await calculateDividendTaxReport(year, isUsPerson, irsTaxPaid);

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('Dividend report error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate dividend report',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
