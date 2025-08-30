import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';

interface SubState {
  subscribed: boolean;
  subscription_tier: string | null;
  subscription_end: string | null;
  minutes_balance?: number;
}

interface CurrentSubscriptionCardProps {
  sub: SubState;
}

export const CurrentSubscriptionCard: React.FC<CurrentSubscriptionCardProps> = ({ sub }) => {
  if (!sub.subscribed) return null;

  return (
    <Card className="p-6 bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
      <CardContent className="p-0 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Plan actuel</h2>
          <p className="text-2xl font-bold text-primary">{sub.subscription_tier || '—'}</p>
          {sub.subscription_end && (
            <p className="text-sm text-muted-foreground">
              Renouvellement le {new Date(sub.subscription_end).toLocaleDateString()}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Minutes disponibles</p>
          <p className="text-3xl font-bold text-secondary">{sub.minutes_balance || 0}</p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            minutes TTS
          </div>
        </div>
      </CardContent>
    </Card>
  );
};