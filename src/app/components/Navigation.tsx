'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import NotificationBell from './NotificationBell';
import { useDemoModeStore } from '@/lib/stores/demo-mode-store';
import { useThemeStore } from '@/lib/stores/theme-store';
import { useSidebarStore } from '@/lib/stores/sidebar-store';
import { useCurrencyStore } from '@/lib/stores/currency-store';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Home,
  Calendar,
  BarChart3,
  Upload,
  Settings,
  Menu,
  Sun,
  Moon,
  Eye,
  User,
  X,
  Calculator,
  DollarSign,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Navigation() {
  const pathname = usePathname();
  const { isDemoMode, toggleDemoMode } = useDemoModeStore();
  const { isDarkMode, toggleTheme, setTheme } = useThemeStore();
  const { isOpen: isMenuOpen, toggle: toggleMenu, setOpen: setMenuOpen } = useSidebarStore();
  const { currency, setCurrency } = useCurrencyStore();

  useEffect(() => {
    // Initialize theme on mount
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && systemPrefersDark);

    setTheme(shouldBeDark);
  }, [setTheme]);

  const navLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/calendar', label: 'Calendar', icon: Calendar },
    { href: '/reports', label: 'Reports', icon: BarChart3 },
    { href: '/tax-calculator', label: 'Tax Calculator', icon: Calculator },
    { href: '/imports', label: 'Import Data', icon: Upload },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <>
      {/* Top Navigation Bar */}
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
                      <DollarSign className="h-4 w-4" />
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

              {/* Dark Mode Toggle */}
              {/* Notification Bell */}
              <NotificationBell />

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

      {/* Sidebar Overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Side Panel Menu */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-full w-64 bg-card border-r transform transition-transform duration-300 ease-in-out',
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Menu Header */}
          <div className="flex items-center justify-between border-b p-4 h-16">
            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                SK
              </div>
              <span className="font-semibold">Skatly</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    'flex items-center space-x-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors',
                    isActive(link.href)
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Menu Footer */}
          <div className="border-t p-4 space-y-3">
            {/* Demo Mode Indicator */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Mode</span>
              <Badge variant={isDemoMode ? 'default' : 'secondary'}>
                {isDemoMode ? (
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    Demo
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    Live
                  </span>
                )}
              </Badge>
            </div>

            {/* Dark Mode Toggle */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {isDarkMode ? 'Dark Mode' : 'Light Mode'}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleTheme}
                className="h-8"
              >
                {isDarkMode ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
