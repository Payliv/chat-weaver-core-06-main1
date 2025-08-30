import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, Zap, Shield, Star } from 'lucide-react';

interface Plan {
  id: string;
  basePrice: number;
  users: string;
  models: string;
  images: string;
  tts: string;
  minutes: string;
  limits: string;
  key: string;
  icon: React.ElementType;
  popular: boolean;
  monthlyPrice: number;
  threeMonthlyPrice: number;
  twelveMonthlyPrice: number;
}

interface PlanDuration {
  value: 'monthly' | 'threeMonthly' | 'twelveMonthly';
  label: string;
  months: number;
  discount: number;
}

interface SubState {
  subscribed: boolean;
  subscription_tier: string | null;
}

interface SubscriptionPlansSectionProps {
  plans: Plan[];
  selectedDuration: 'monthly' | 'threeMonthly' | 'twelveMonthly';
  onDurationChange: (duration: 'monthly' | 'threeMonthly' | 'twelveMonthly') => void;
  startCheckout: (planKey: string) => void;
  loading: boolean;
  currentPlanKey: string | null;
  sub: SubState;
  PLAN_DURATIONS: PlanDuration[];
}

export const SubscriptionPlansSection: React.FC<SubscriptionPlansSectionProps> = ({
  plans,
  selectedDuration,
  onDurationChange,
  startCheckout,
  loading,
  currentPlanKey,
  sub,
  PLAN_DURATIONS,
}) => {
  return (
    <section className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground mb-2">Plans d'abonnement</h2>
        <p className="text-muted-foreground">Accédez à toutes les fonctionnalités premium</p>
      </div>
      
      <div className="flex justify-center mb-6">
        <Tabs value={selectedDuration} onValueChange={(value) => onDurationChange(value as any)}>
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            {PLAN_DURATIONS.map(duration => (
              <TabsTrigger key={duration.value} value={duration.value}>
                {duration.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = currentPlanKey === plan.key;
          const IconComponent = plan.icon;
          const priceKey = `${selectedDuration}Price` as keyof typeof plan;
          const currentPrice = plan[priceKey];
          const durationInfo = PLAN_DURATIONS.find(d => d.value === selectedDuration);
          
          return (
            <Card key={plan.id} className={`relative p-6 transition-all duration-300 hover:shadow-lg ${
              plan.popular ? 'ring-2 ring-primary shadow-primary/20' : ''
            } ${isCurrent ? 'bg-primary/5 border-primary' : 'bg-card hover:bg-card/80'}`}>
              {plan.popular && (
                <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary">
                  Populaire
                </Badge>
              )}
              {durationInfo?.discount > 0 && (
                <Badge className="absolute top-4 right-4 bg-green-500 text-white">
                  -{Math.round(durationInfo.discount * 100)}%
                </Badge>
              )}
              
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <IconComponent className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">{plan.id}</h3>
                  {isCurrent && <Badge variant="secondary" className="mt-1">Actuel</Badge>}
                </div>
              </div>
              
              <div className="mb-6">
                {plan.key === 'enterprise' ? (
                  <div className="text-2xl font-bold text-foreground">Sur devis</div>
                ) : (
                  <>
                    <div className="text-3xl font-bold text-foreground">
                      {currentPrice.toLocaleString()} FCFA
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {selectedDuration === 'monthly' ? '/mois' : `/${durationInfo?.months} mois`}
                    </div>
                    {durationInfo?.discount > 0 && (
                      <p className="text-xs text-muted-foreground line-through">
                        {(plan.basePrice * durationInfo.months).toLocaleString()} FCFA
                      </p>
                    )}
                  </>
                )}
              </div>
              
              <ul className="space-y-3 mb-8 text-sm">
                <li className="flex items-start gap-2">
                  <div className="w-1 h-1 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                  <span>Utilisateurs: {plan.users}</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1 h-1 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                  <span>Modèles IA: {plan.models}</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1 h-1 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                  <span>Images DALL·E 3: {plan.images}</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1 h-1 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                  <span>Text-to-Voice: {plan.tts}</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1 h-1 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                  <span>Minutes TTS: {plan.minutes}</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1 h-1 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                  <span>{plan.limits}</span>
                </li>
              </ul>
              
              <Button
                disabled={loading || isCurrent}
                onClick={() => startCheckout(plan.key)}
                className="w-full"
                variant={plan.popular ? "default" : "outline"}
              >
                {plan.key === 'enterprise' 
                  ? 'Nous contacter' 
                  : isCurrent 
                    ? 'Plan actuel' 
                    : sub.subscribed 
                      ? 'Mettre à niveau' 
                      : 'Choisir ce plan'
                }
              </Button>
            </Card>
          );
        })}
      </div>
    </section>
  );
};