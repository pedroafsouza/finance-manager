'use client';

import { useEffect } from 'react';
import { useNotificationsStore } from '@/lib/stores/notifications-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingDown, TrendingUp, Minus, Sparkles, AlertTriangle, Lightbulb } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export default function NotificationDropdown({ onClose }: Props) {
  const { notifications, fetchNotifications, markAsRead } = useNotificationsStore();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleNotificationClick = (id: number, isRead: boolean) => {
    if (!isRead) {
      markAsRead(id);
    }
  };

  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation.toLowerCase()) {
      case 'buy':
        return <TrendingUp className="h-5 w-5 text-green-600" />;
      case 'sell':
        return <TrendingDown className="h-5 w-5 text-red-600" />;
      case 'hold':
        return <Minus className="h-5 w-5 text-blue-600" />;
      default:
        return <Sparkles className="h-5 w-5" />;
    }
  };

  const getConfidenceBadge = (confidence: string) => {
    const variants = {
      high: 'default',
      medium: 'secondary',
      low: 'outline',
    } as const;

    return (
      <Badge variant={variants[confidence.toLowerCase() as keyof typeof variants] || 'outline'}>
        {confidence}
      </Badge>
    );
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card className="w-[400px] max-h-[600px] overflow-hidden shadow-xl">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center justify-between">
          <span>AI Analysis Reports</span>
          <Badge variant="secondary">{notifications.length}</Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        <div className="max-h-[500px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No analysis reports yet</p>
              <p className="text-sm mt-2">
                Configure AI in Settings and run your first analysis
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-accent cursor-pointer transition-colors ${
                    !notification.is_read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification.id, notification.is_read)}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getRecommendationIcon(notification.recommendation)}
                      <span className="font-semibold capitalize">
                        {notification.recommendation}
                      </span>
                      {getConfidenceBadge(notification.confidence_level)}
                    </div>
                    {!notification.is_read && (
                      <Badge variant="destructive" className="ml-2">New</Badge>
                    )}
                  </div>

                  {/* Provider & Time */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <Sparkles className="h-3 w-3" />
                    <span className="capitalize">{notification.llm_provider}</span>
                    <span>•</span>
                    <span>{formatTimeAgo(notification.created_at)}</span>
                  </div>

                  {/* Reasoning Preview */}
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {notification.reasoning}
                  </p>

                  {/* Risk & Opportunities Count */}
                  <div className="flex gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 text-orange-600" />
                      <span>{notification.risk_factors.length} risks</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Lightbulb className="h-3 w-3 text-yellow-600" />
                      <span>{notification.opportunities.length} opportunities</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
