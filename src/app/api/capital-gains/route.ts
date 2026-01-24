import { NextRequest, NextResponse } from 'next/server';
import {
  calculateCapitalGainsReport,
  updateCostBasisMethod,
  getPortfolioPositions,
} from '@/lib/capital-gains-calculator';
import { initDb } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/capital-gains?year=2024
 * Generate capital gains report for Danish tax return (Box 454)
 */
export async function GET(request: NextRequest) {
  try {
    await initDb();

    const searchParams = request.nextUrl.searchParams;
    const yearParam = searchParams.get('year');
    const action = searchParams.get('action');

    // Get portfolio positions
    if (action === 'positions') {
      const positions = await getPortfolioPositions();
      return NextResponse.json({
        success: true,
        data: positions,
      });
    }

    // Generate report
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

    const report = await calculateCapitalGainsReport(year);

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('Capital gains API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate capital gains report',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/capital-gains
 * Body: { ticker: string, method: 'lot-based' | 'average-cost' }
 * Update cost basis method for a ticker
 */
export async function POST(request: NextRequest) {
  try {
    await initDb();

    const body = await request.json();
    const { ticker, method } = body;

    if (!ticker || !method) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: ticker, method' },
        { status: 400 }
      );
    }

    if (method !== 'lot-based' && method !== 'average-cost') {
      return NextResponse.json(
        { success: false, error: 'Invalid method. Must be "lot-based" or "average-cost"' },
        { status: 400 }
      );
    }

    await updateCostBasisMethod(ticker, method);

    return NextResponse.json({
      success: true,
      message: `Cost basis method updated to ${method} for ${ticker}`,
    });
  } catch (error) {
    console.error('Capital gains POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update cost basis method',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
