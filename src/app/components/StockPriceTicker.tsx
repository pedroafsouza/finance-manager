'use client';

import { useEffect, useState } from 'react';
import { useStockPricesStore, StockPrice } from '@/lib/stores/stock-prices-store';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function StockPriceTicker() {
  const { prices, isLoading, error, fetchPrices } = useStockPricesStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  // Fetch prices on mount and set up auto-refresh
  useEffect(() => {
    fetchPrices();

    // Auto-refresh every 5 minutes
    const refreshInterval = setInterval(() => {
      fetchPrices();
    }, 5 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, [fetchPrices]);

  // Rotate through tickers every 10 seconds
  useEffect(() => {
    if (prices.size === 0) return;

    const rotateInterval = setInterval(() => {
      setIsVisible(false);

      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % prices.size);
        setIsVisible(true);
      }, 300); // Wait for fade out
    }, 10000);

    return () => clearInterval(rotateInterval);
  }, [prices.size]);

  // Don't render if loading, error, or no prices
  if (isLoading || error || prices.size === 0) {
    return null;
  }

  // Get current ticker to display
  const priceArray = Array.from(prices.values());
  const currentPrice = priceArray[currentIndex];

  if (!currentPrice) return null;

  const isPositive = currentPrice.changePercent >= 0;

  return (
    <div className="hidden lg:flex items-center gap-2 mx-4">
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/10 backdrop-blur-sm transition-opacity duration-300',
          isVisible ? 'opacity-100' : 'opacity-0'
        )}
      >
        {/* Ticker Symbol */}
        <span className="font-semibold text-white text-sm">
          {currentPrice.ticker}
        </span>

        {/* Price */}
        <span className="text-white text-sm">
          ${currentPrice.price.toFixed(2)}
        </span>

        {/* Change with icon */}
        <div
          className={cn(
            'flex items-center gap-1 text-sm font-medium',
            isPositive ? 'text-green-300' : 'text-red-300'
          )}
        >
          {isPositive ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          <span>
            {isPositive ? '+' : ''}
            {currentPrice.changePercent.toFixed(2)}%
          </span>
        </div>

        {/* Dot indicator for multiple tickers */}
        {prices.size > 1 && (
          <div className="flex gap-1 ml-1">
            {Array.from({ length: Math.min(prices.size, 5) }).map((_, idx) => (
              <div
                key={idx}
                className={cn(
                  'h-1 w-1 rounded-full transition-colors',
                  idx === currentIndex ? 'bg-white' : 'bg-white/30'
                )}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
