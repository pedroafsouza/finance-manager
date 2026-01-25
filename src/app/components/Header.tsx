'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import NotificationBell from './NotificationBell';
import { useDemoModeStore } from '@/lib/stores/demo-mode-store';
import { useThemeStore } from '@/lib/stores/theme-store';
import { useSidebarStore } from '@/lib/stores/sidebar-store';
import { useCurrencyStore } from '@/lib/stores/currency-store';
import { useStockPricesStore } from '@/lib/stores/stock-prices-store';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Menu,
  Sun,
  Moon,
  Eye,
  User,
  DollarSign,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Header() {
  const { isDemoMode, toggleDemoMode } = useDemoModeStore();
  const { isDarkMode, toggleTheme, setTheme } = useThemeStore();
  const { toggle: toggleMenu, isOpen: isMenuOpen } = useSidebarStore();
  const { currency, setCurrency } = useCurrencyStore();
  const { prices, portfolioValueUSD, portfolioValueDKK, exchangeRate, fetchPrices } = useStockPricesStore();

  useEffect(() => {
    // Initialize theme on mount
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && systemPrefersDark);

    setTheme(shouldBeDark);
  }, [setTheme]);

  // Fetch prices on mount
  useEffect(() => {
    fetchPrices();

    // Auto-refresh every 10 minutes (matches cache TTL)
    const interval = setInterval(() => {
      fetchPrices();
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchPrices]);

  // Convert prices Map to array
  const pricesArray = Array.from(prices.values());

  // Select the correct portfolio value based on currency
  const portfolioValue = currency === 'USD' ? portfolioValueUSD : portfolioValueDKK;
 

  return (
    <nav
      style={{
        background: 'linear-gradient(to right, rgb(37, 99, 235), rgb(79, 70, 229))',
        backgroundColor: 'rgb(37, 99, 235)',
        color: 'white'
      }}
      className="fixed left-0 right-0 top-0 z-50 border-b border-blue-700 dark:border-blue-900 shadow-lg"
    >
      <div className="px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Left: Burger Menu & Logo */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMenu}
              aria-label="Toggle menu"
              className="text-white hover:bg-white/20"
            >
              <Menu className="h-5 w-5" />
            </Button>

            <Link
              href="/"
              className={cn(
                "flex items-center space-x-2 transition-opacity duration-200",
                isMenuOpen ? "opacity-0 pointer-events-none" : "opacity-100"
              )}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-blue-600 font-bold text-sm shadow-sm">
                SK
              </div>
              <span className="font-semibold text-white">Skatly</span>
            </Link>
          </div>

          {/* Center: Portfolio Value & Stock Tickers */}
          <div className="hidden lg:flex items-center gap-6">
            {/* Portfolio Value */}
            {portfolioValue > 0 && (
              <div className="flex flex-col items-end">
                <span className="text-xs text-white/70">Portfolio Value</span>
                <span className="text-lg font-bold text-white">
                  {currency === 'USD' ? '$' : 'kr. '}
                  {portfolioValue.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            )}

            {/* Stock Tickers */}
            {pricesArray.length > 0 && (
              <div className="flex items-center gap-3">
                {pricesArray.slice(0, 3).map((stock, index) => {
                  console.log(`Rendering stock ${index}:`, stock);

                  try {
                    const isPositive = stock.changePercent >= 0;
                    console.log(`Stock ${stock.ticker} - isPositive:`, isPositive, 'changePercent:', stock.changePercent);

                    return (
                      <div
                        key={stock.ticker}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/10 backdrop-blur-sm"
                      >
                        {/* Ticker */}
                        <span className="font-semibold text-white text-sm">
                          {stock.ticker}
                        </span>

                        {/* Price */}
                        <span className="text-white text-sm">
                          ${stock.price.toFixed(2)}
                        </span>

                        {/* Change */}
                        <div
                          className={cn(
                            'flex items-center gap-1 text-xs font-medium',
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
                            {stock.changePercent.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    );
                  } catch (error) {
                    console.error(`Error rendering stock ${index}:`, error);
                    console.error('Stock data:', stock);
                    return null;
                  }
                })}
              </div>
            )}
          </div>

          {/* Right: Currency, Demo Mode & Dark Mode Controls */}
          <div className="flex items-center gap-2">
            {/* Currency Select */}
            <Select
              value={currency}
              onValueChange={(value) => setCurrency(value as 'USD' | 'DKK')}
            >
              <SelectTrigger className="w-[100px] h-9 bg-white/90 text-gray-900 border-white/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <span>USD</span>
                  </div>
                </SelectItem>
                <SelectItem value="DKK">
                  <div className="flex items-center gap-2">
                    <span className="h-4 w-4 flex items-center justify-center text-sm font-medium">kr</span>
                    <span>DKK</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Demo Mode Select */}
            <Select
              value={isDemoMode ? 'demo' : 'live'}
              onValueChange={(value) => {
                if ((value === 'demo') !== isDemoMode) {
                  toggleDemoMode();
                }
              }}
            >
              <SelectTrigger className="w-[120px] h-9 bg-white/90 text-gray-900 border-white/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="demo">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    <span>Demo</span>
                  </div>
                </SelectItem>
                <SelectItem value="live">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>Live</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Notification Bell */}
            <NotificationBell />

            {/* Dark Mode Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              className="text-white hover:bg-white/20"
            >
              {isDarkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
