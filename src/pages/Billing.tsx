import { useEffect, useMemo, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { BillingHeader } from '@/components/billing/BillingHeader';
import { CurrentSubscriptionCard } from '@/components/billing/CurrentSubscriptionCard';
import { SubscriptionPlansSection } from '@/components/billing/SubscriptionPlansSection';
import { MinutePackagesSection } from '@/components/billing/MinutePackagesSection';
import { BillingActions } from '@/components/billing/BillingActions';
import { Zap, Shield, Star } from "lucide-react"; // Icons for plans

const setMeta = (name: string, content: string) => {
  let tag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('name', name);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
};

interface SubState {
  subscribed: boolean;
  subscription_tier: string | null;
  subscription_end: string | null;
  minutes_balance?: number;
}

interface MinutePackage {
  id: string;
  minutes: number;
  price: number;
  pricePerMinute: number;
  popular?: boolean;
}

interface PlanDuration {
  value: 'monthly' | 'threeMonthly' | 'twelveMonthly';
  label: string;
  months: number;
  discount: number;
}

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

const PLAN_DURATIONS: PlanDuration[] = [
  { value: 'monthly', label: 'Mensuel', months: 1, discount: 0 },
  { value: 'threeMonthly', label: '3 Mois (-15%)', months: 3, discount: 0.15 },
  { value: 'twelveMonthly', label: '12 Mois (-30%)', months: 12, discount: 0.30 },
];

const basePlans = [
  {
    id: 'Starter',
    basePrice: 7500, // Monthly base price
    users: '1',
    models: 'GPT-5 + GPT-4.1 + O3 + O4-Mini + Deepseek V3 + Gemini Pro + Perplexity',
    images: '10 images / mois',
    tts: 'OpenAI Standard TTS uniquement',
    minutes: '100 min inclus',
    limits: '📱 Génération de contenu Social Media illimitée, 🗣️ Prise de Parole: 5 min/jour, +50 FCFA/min TTS au-delà, +500 FCFA/image',
    key: 'starter',
    icon: Shield,
    popular: false
  },
  {
    id: 'Pro',
    basePrice: 22000,
    users: "Jusqu'à 5",
    models: 'GPT-5 + GPT-4.1 + O3 + O4-Mini + Deepseek V3 + Gemini Pro + Perplexity',
    images: '50 images / mois',
    tts: 'OpenAI HD TTS + Google WaveNet',
    minutes: '500 min inclus',
    limits: '📱 Génération de contenu Social Media illimitée, 🗣️ Prise de Parole: Illimitée, Forfait illimité au-delà, images illimitées',
    key: 'pro',
    icon: Zap,
    popular: true
  },
  {
    id: 'Business',
    basePrice: 55000,
    users: "Jusqu'à 20",
    models: 'GPT-5 + GPT-4.1 + O3 + O4-Mini + Deepseek V3 + Gemini Pro + Perplexity',
    images: 'Illimité',
    tts: 'OpenAI HD + Google WaveNet + voix premium',
    minutes: 'Illimité',
    limits: '📱 Génération de contenu Social Media illimitée, 🗣️ Prise de Parole: 25 min/jour, Support prioritaire, gestion équipes',
    key: 'business',
    icon: Star,
    popular: false
  },
  {
    id: 'Enterprise',
    basePrice: 0, // Special case for enterprise
    users: 'Illimité',
    models: 'GPT-5 + GPT-4.1 + O3 + O4-Mini + Deepseek V3 + Gemini Pro + Perplexity',
    images: 'Illimité',
    tts: 'Voix personnalisées + options avancées',
    minutes: 'Illimité',
    limits: '📱 Génération de contenu Social Media illimitée, 🗣️ Prise de Parole: Illimitée, SLA, support dédié, API complet',
    key: 'enterprise',
    icon: Star,
    popular: false
  },
] as const;

const minutePackages: MinutePackage[] = [
  {
    id: "50",
    minutes: 50,
    price: 2500,
    pricePerMinute: 50,
  },
  {
    id: "100",
    minutes: 100,
    price: 4500,
    pricePerMinute: 45,
    popular: true,
  },
  {
    id: "300",
    minutes: 300,
    price: 12000,
    pricePerMinute: 40,
  },
  {
    id: "500",
    minutes: 500,
    price: 18000,
    pricePerMinute: 36,
  },
];

const Billing = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [minutesLoading, setMinutesLoading] = useState(false);
  const [sub, setSub] = useState<SubState>({ 
    subscribed: false, 
    subscription_tier: null, 
    subscription_end: null,
    minutes_balance: 0
  });
  const [selectedDuration, setSelectedDuration] = useState<'monthly' | 'threeMonthly' | 'twelveMonthly'>('monthly');

  const plans: Plan[] = useMemo(() => {
    return basePlans.map(plan => {
      const calculatedPrices: any = {};
      PLAN_DURATIONS.forEach(duration => {
        const totalBasePrice = plan.basePrice * duration.months;
        const discountedPrice = totalBasePrice * (1 - duration.discount);
        calculatedPrices[duration.value + 'Price'] = Math.round(discountedPrice);
      });
      return { ...plan, ...calculatedPrices };
    });
  }, []);

  const currentPlanKey = useMemo(() => {
    const tier = (sub.subscription_tier || '').toLowerCase();
    if (tier.includes('starter')) return 'starter';
    if (tier.includes('pro')) return 'pro';
    if (tier.includes('business')) return 'business';
    return null;
  }, [sub.subscription_tier]);

  const refresh = async () => {
    const { data, error } = await supabase.functions.invoke('check-subscription');
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      setSub(data as SubState);
    }
  };

  const startCheckout = async (planKey: string) => {
    try {
      if (planKey === 'enterprise') {
        window.location.href = 'mailto:contact@chatelix.app?subject=Demande%20Enterprise%20(Devis)';
        return;
      }
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('moneroo-init', {
        body: { plan: planKey, duration: selectedDuration }
      });
      if (error) throw error;
      if (data?.url) {
        const w = window.open(data.url as string, '_blank');
        if (!w) {
          window.location.href = data.url as string;
        }
      } else {
        toast({ title: 'Lien indisponible', description: 'Impossible d\'ouvrir le paiement.' });
      }
    } catch (e: any) {
      toast({ title: 'Paiement indisponible', description: e?.message || 'Réessayez plus tard.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const purchaseMinutes = async (packageId: string) => {
    try {
      setMinutesLoading(true);
      const { data, error } = await supabase.functions.invoke('moneroo-minutes-init', {
        body: { minutes: packageId }
      });
      if (error) throw error;
      if (data?.url) {
        const w = window.open(data.url as string, '_blank');
        if (!w) {
          window.location.href = data.url as string;
        }
      } else {
        toast({ title: 'Lien indisponible', description: 'Impossible d\'ouvrir le paiement.' });
      }
    } catch (e: any) {
      toast({ title: 'Achat indisponible', description: e?.message || 'Réessayez plus tard.', variant: 'destructive' });
    } finally {
      setMinutesLoading(false);
    }
  };

  const handlePaymentVerification = async () => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    const paymentId = params.get('paymentId');
    const paymentStatus = params.get('paymentStatus');
    const minutes = params.get('minutes');
    const ref = params.get('ref') || params.get('reference') || params.get('moneroo_ref');
    const plan = params.get('plan');
    const duration = params.get('duration');
    
    if (paymentId && paymentStatus) {
      if (paymentStatus === 'success' || status === 'success') {
        if (minutes) {
          // Minute purchase verification
          const { error } = await supabase.functions.invoke('moneroo-minutes-verify', {
            body: { reference: paymentId, minutes: Number(minutes) }
          });
          if (error) {
            toast({ title: 'Vérification échouée', description: error.message, variant: 'destructive' });
          } else {
            toast({ title: 'Achat confirmé', description: `${minutes} minutes ajoutées à votre compte.` });
          }
        } else {
          // Subscription purchase verification
          const planFromUrl = plan || 'starter';
          const durationFromUrl = (duration || 'monthly') as 'monthly' | 'threeMonthly' | 'twelveMonthly';
          const { error } = await supabase.functions.invoke('moneroo-verify', {
            body: { reference: paymentId, plan: planFromUrl, duration: durationFromUrl }
          });
          if (error) {
            toast({ title: 'Vérification échouée', description: error.message, variant: 'destructive' });
          } else {
            toast({ title: 'Paiement confirmé', description: 'Votre abonnement a été activé.' });
          }
        }
      } else {
        toast({ 
          title: 'Paiement échoué', 
          description: 'Le paiement n\'a pas été complété avec succès.',
          variant: 'destructive' 
        });
      }
      
      // Clean URL parameters
      const url = new URL(window.location.href);
      ['status', 'paymentId', 'paymentStatus', 'plan', 'minutes', 'duration'].forEach(param => {
        url.searchParams.delete(param);
      });
      window.history.replaceState({}, '', url.pathname + (url.search ? `?${url.searchParams.toString()}` : ''));
    }
    
    // Keep backward compatibility with old ref/plan parameters
    else if (ref && plan) {
      const durationFromUrl = (duration || 'monthly') as 'monthly' | 'threeMonthly' | 'twelveMonthly';
      const { error } = await supabase.functions.invoke('moneroo-verify', {
        body: { reference: ref, plan, duration: durationFromUrl }
      });
      if (error) {
        toast({ title: 'Vérification échouée', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Paiement confirmé', description: 'Votre abonnement a été activé.' });
      }
      
      const url = new URL(window.location.href);
      ['ref', 'reference', 'moneroo_ref', 'plan', 'duration'].forEach(param => {
        url.searchParams.delete(param);
      });
      window.history.replaceState({}, '', url.pathname + (url.search ? `?${url.searchParams.toString()}` : ''));
    }
  };

  useEffect(() => {
    document.title = "Abonnements Chatelix — Starter, Pro, Business";
    setMeta('description', 'Choisissez un abonnement Starter, Pro ou Business pour Chatelix. Paiement mensuel, TTS inclus.');

    handlePaymentVerification();
    refresh();
    const id = setInterval(refresh, 10000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <BillingHeader 
        title="Abonnements Chatelix" 
        description="Choisissez le plan qui vous convient" 
      />

      <main className="container mx-auto max-w-7xl px-6 py-8 space-y-12">
        <CurrentSubscriptionCard sub={sub} />

        <SubscriptionPlansSection
          plans={plans}
          selectedDuration={selectedDuration}
          onDurationChange={setSelectedDuration}
          startCheckout={startCheckout}
          loading={loading}
          currentPlanKey={currentPlanKey}
          sub={sub}
          PLAN_DURATIONS={PLAN_DURATIONS}
        />

        <MinutePackagesSection
          minutePackages={minutePackages}
          purchaseMinutes={purchaseMinutes}
          minutesLoading={minutesLoading}
        />

        <BillingActions
          onRefresh={refresh}
          loading={loading}
          minutesLoading={minutesLoading}
        />
      </main>
    </div>
  );
};

export default Billing;