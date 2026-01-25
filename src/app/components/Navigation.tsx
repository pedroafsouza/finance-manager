'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Header from './Header';
import { useDemoModeStore } from '@/lib/stores/demo-mode-store';
import { useThemeStore } from '@/lib/stores/theme-store';
import { useSidebarStore } from '@/lib/stores/sidebar-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Home,
  Calendar,
  BarChart3,
  Upload,
  Settings,
  Sun,
  Moon,
  Eye,
  User,
  X,
  Calculator,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Navigation() {
  const pathname = usePathname();
  const { isDemoMode } = useDemoModeStore();
  const { isDarkMode, toggleTheme } = useThemeStore();
  const { isOpen: isMenuOpen, setOpen: setMenuOpen } = useSidebarStore();

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
      {/* Header */}
      <Header />

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
