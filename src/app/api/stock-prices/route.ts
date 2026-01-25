import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getStockPrice, getStockPrices, getUserTickers, getPortfolioValue } from '@/lib/stock-prices';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/stock-prices
 * Query params:
 *   - tickers: Comma-separated list of tickers (e.g., "MSFT,NVDA,AAPL")
 *   - all: Get prices for all user holdings (true/false)
 *   - refresh: Force refresh cache (true/false)
 */
export async function GET(request: NextRequest) {
  try {
    // Detect demo mode from cookie
    const cookieStore = await cookies();
    const demoModeCookie = cookieStore.get('demoMode');
    const isDemoMode = demoModeCookie?.value === 'true';

    const searchParams = request.nextUrl.searchParams;
    const tickersParam = searchParams.get('tickers');
    const all = searchParams.get('all') === 'true';
    const refresh = searchParams.get('refresh') === 'true';

    let tickers: string[] = [];

    // Get all user tickers
    if (all) {
      tickers = await getUserTickers(isDemoMode);
      
      // If no holdings, return empty result instead of error
      if (tickers.length === 0) {
        return NextResponse.json({
          success: true,
          data: {},
          count: 0,
          mode: isDemoMode ? 'demo' : 'live',
          portfolio: {
            totalValueUSD: 0,
            totalValueDKK: 0,
            exchangeRate: 6.9,
          },
          holdings: [],
        });
      }
    }
    // Get specific tickers
    else if (tickersParam) {
      tickers = tickersParam.split(',').map(t => t.trim().toUpperCase());
    }

    // Validate we have tickers (only when not using all=true)
    if (!all && tickers.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameter: tickers or all=true',
        },
        { status: 400 }
      );
    }

    // Fetch prices
    const prices = await getStockPrices(tickers, isDemoMode, refresh);

    // Convert Map to object for JSON response
    const pricesObject: Record<string, any> = {};
    prices.forEach((price, ticker) => {
      pricesObject[ticker] = price;
    });

    // Calculate portfolio value
    const portfolioValue = await getPortfolioValue(isDemoMode, refresh);

    return NextResponse.json({
      success: true,
      data: pricesObject,
      count: prices.size,
      mode: isDemoMode ? 'demo' : 'live',
      portfolio: {
        totalValueUSD: portfolioValue.totalValueUSD,
        totalValueDKK: portfolioValue.totalValueDKK,
        exchangeRate: portfolioValue.exchangeRate,
      },
      holdings: portfolioValue.holdings,
    });
  } catch (error) {
    console.error('Stock prices API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch stock prices',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
