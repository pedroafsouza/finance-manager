import { NextRequest, NextResponse } from 'next/server';
import {
  getExchangeRate,
  getCachedRates,
  prefetchRatesForRange,
  fetchRateFromNationalbank,
} from '@/lib/exchange-rates';
import { initDb } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/exchange-rates
 * Query params:
 *   - date: Get rate for specific date (YYYY-MM-DD)
 *   - start_date & end_date: Prefetch rates for range
 *   - list: Get all cached rates
 */
export async function GET(request: NextRequest) {
  try {
    await initDb();

    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const list = searchParams.get('list');

    // List all cached rates
    if (list === 'true') {
      const limit = parseInt(searchParams.get('limit') || '100');
      const rates = await getCachedRates(limit);

      return NextResponse.json({
        success: true,
        data: rates,
        count: rates.length,
      });
    }

    // Prefetch range
    if (startDate && endDate) {
      const count = await prefetchRatesForRange(startDate, endDate);

      return NextResponse.json({
        success: true,
        message: `Prefetched ${count} exchange rates`,
        count,
      });
    }

    // Get single rate
    if (date) {
      const manualRate = searchParams.get('manual_rate');
      const rate = await getExchangeRate(
        date,
        manualRate ? parseFloat(manualRate) : undefined
      );

      return NextResponse.json({
        success: true,
        date,
        usd_to_dkk: rate,
      });
    }

    // No params - return error
    return NextResponse.json(
      {
        success: false,
        error: 'Missing required parameter: date, list=true, or start_date+end_date',
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('Exchange rate API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch exchange rates',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/exchange-rates
 * Body: { date: string, manual_rate: number }
 * Manually set exchange rate for a specific date
 */
export async function POST(request: NextRequest) {
  try {
    await initDb();

    const body = await request.json();
    const { date, manual_rate } = body;

    if (!date || !manual_rate) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: date, manual_rate' },
        { status: 400 }
      );
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { success: false, error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Validate rate
    const rate = parseFloat(manual_rate);
    if (isNaN(rate) || rate <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid exchange rate' },
        { status: 400 }
      );
    }

    // Save manual rate
    await getExchangeRate(date, rate);

    return NextResponse.json({
      success: true,
      message: 'Exchange rate saved',
      date,
      usd_to_dkk: rate,
    });
  } catch (error) {
    console.error('Exchange rate POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save exchange rate',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
