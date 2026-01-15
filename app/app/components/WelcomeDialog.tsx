'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  Calculator,
  TrendingUp,
  Lock,
  Eye,
  User,
  Rocket,
  Settings
} from 'lucide-react';

export default function WelcomeDialog() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if user has visited before
    const hasVisited = localStorage.getItem('hasVisited');
    if (!hasVisited) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('hasVisited', 'true');
    localStorage.setItem('visitedAt', new Date().toISOString());
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
            <TrendingUp className="h-8 w-8" />
          </div>
          <DialogTitle className="text-center text-3xl">
            Welcome to Skatly! 🇩🇰
          </DialogTitle>
          <DialogDescription className="text-center">
            Your personal assistant for managing RSU stock grants and Danish taxes
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Features Grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-base">Import Data</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Upload Morgan Stanley PDF files and track your RSU grants
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-green-600" />
                  <CardTitle className="text-base">Tax Calculations</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Calculate Danish taxes on stock compensation and capital gains
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                  <CardTitle className="text-base">Track Portfolio</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Monitor your vesting schedules and portfolio value over time
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-orange-600" />
                  <CardTitle className="text-base">Private & Secure</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  All data stays local on your device, nothing sent to servers
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Demo Mode Info */}
          <Card className="border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950/30">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <CardTitle className="text-base">Try Demo Mode First</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Not ready to import your data? Toggle <strong>Demo Mode</strong> in the top right corner to explore the app with sample anonymized data. You can switch back anytime!
              </p>
              <div className="flex items-center gap-2 text-xs">
                <Badge variant="default" className="gap-1">
                  <Eye className="h-3 w-3" />
                  Demo
                </Badge>
                <span className="text-muted-foreground">= Sample data</span>
                <span className="mx-1">|</span>
                <Badge variant="secondary" className="gap-1">
                  <User className="h-3 w-3" />
                  Live
                </Badge>
                <span className="text-muted-foreground">= Your data</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Start */}
          <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Rocket className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <CardTitle className="text-base">Quick Start Guide</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-muted-foreground">1.</span>
                  <span>Toggle <strong>Demo Mode</strong> to try the app with sample data, or</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-muted-foreground">2.</span>
                  <span>Navigate to <strong>Import Data</strong> to upload your Morgan Stanley PDF file</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-muted-foreground">3.</span>
                  <span>View your grants, transactions, and tax reports across the app</span>
                </li>
              </ol>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild className="flex-1">
              <Link href="/imports" onClick={handleClose}>
                <Upload className="mr-2 h-4 w-4" />
                Get Started - Import Data
              </Link>
            </Button>
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Explore App
            </Button>
          </div>

          {/* Footer note */}
          <p className="text-center text-xs text-muted-foreground">
            This dialog will only show once. You can always access help from the Settings page.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
