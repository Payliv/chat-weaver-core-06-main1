import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';

interface MinutePackage {
  id: string;
  minutes: number;
  price: number;
  pricePerMinute: number;
  popular?: boolean;
}

interface MinutePackagesSectionProps {
  minutePackages: MinutePackage[];
  purchaseMinutes: (packageId: string) => void;
  minutesLoading: boolean;
}

export const MinutePackagesSection: React.FC<MinutePackagesSectionProps> = ({
  minutePackages,
  purchaseMinutes,
  minutesLoading,
}) => {
  return (
    <section className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground mb-2">Minutes supplémentaires</h2>
        <p className="text-muted-foreground">Achetez des minutes TTS à la demande</p>
      </div>
      
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {minutePackages.map((pkg) => (
          <Card key={pkg.id} className={`p-4 transition-all duration-300 hover:shadow-md hover:scale-105 ${
            pkg.popular ? 'ring-2 ring-secondary shadow-secondary/20' : 'hover:bg-card/80'
          }`}>
            {pkg.popular && (
              <Badge variant="secondary" className="mb-3">
                Meilleur rapport
              </Badge>
            )}
            
            <div className="text-center space-y-3">
              <div className="p-3 mx-auto w-fit rounded-full bg-secondary/10">
                <Clock className="h-6 w-6 text-secondary" />
              </div>
              
              <div>
                <div className="text-2xl font-bold text-foreground">{pkg.minutes}</div>
                <div className="text-xs text-muted-foreground">minutes</div>
              </div>
              
              <div>
                <div className="text-xl font-semibold text-foreground">
                  {pkg.price.toLocaleString()} FCFA
                </div>
                <div className="text-xs text-muted-foreground">
                  {pkg.pricePerMinute} FCFA/min
                </div>
              </div>
              
              <Button
                disabled={minutesLoading}
                onClick={() => purchaseMinutes(pkg.id)}
                className="w-full"
                variant={pkg.popular ? "default" : "outline"}
                size="sm"
              >
                Acheter
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
};