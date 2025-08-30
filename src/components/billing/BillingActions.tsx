import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface BillingActionsProps {
  onRefresh: () => void;
  loading: boolean;
  minutesLoading: boolean;
}

export const BillingActions: React.FC<BillingActionsProps> = ({ onRefresh, loading, minutesLoading }) => {
  return (
    <section className="flex justify-center gap-4 pt-8">
      <Button variant="outline" onClick={onRefresh} disabled={loading || minutesLoading}>
        Actualiser le statut
      </Button>
    </section>
  );
};