import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

const plans = [
  {
    id: '1',
    name: 'Starter',
    description: 'Parfait pour débuter avec l\'IA',
    price: 7500,
    features: [
      '👤 1 utilisateur',
      '🤖 Modèles IA illimités (GPT-5, Claude 3.5, Llama 3.3, etc.)',
      '🎨 10 images DALL·E 3 / mois (+500 FCFA/supp.)',
      '🗣 100 min TTS inclus (+50 FCFA/min au-delà)',
      '🎤 100 min Voice-to-Text/mois',
      '📚 2 Ebooks Starter inclus/mois',
      '🔄 1 Conversion de document / jour',
      '📑 1 Analyse de document / jour'
    ],
    is_active: true,
    popular: false,
    buttonText: 'Choisir Starter'
  },
  {
    id: '2', 
    name: 'Pro',
    description: 'Idéal pour les professionnels',
    price: 22000,
    features: [
      '👤 Jusqu\'à 5 utilisateurs',
      '🤖 Modèles IA illimités (GPT-5, Claude 3.5, Llama 3.3, etc.)',
      '🎨 50 images DALL·E 3 / mois (illimité au-delà)',
      '🗣 500 min TTS HD inclus (illimité au-delà)',
      '🎤 500 min Voice-to-Text/mois',
      '📚 5 Ebooks Pro inclus/mois',
      '🔄 Conversions de documents illimitées',
      '📑 Analyse de documents illimitée'
    ],
    is_active: true,
    popular: true,
    buttonText: 'Choisir Pro'
  },
  {
    id: '3',
    name: 'Business', 
    description: 'Pour les équipes et entreprises',
    price: 55000,
    features: [
      '👤 Jusqu\'à 20 utilisateurs',
      '🤖 Modèles IA illimités (GPT-5, Claude 3.5, Llama 3.3, etc.)',
      '🎨 Images DALL·E 3 illimitées',
      '🗣 Minutes TTS HD illimitées',
      '🎤 Voice-to-Text illimité',
      '📚 20 Ebooks Business inclus',
      '🔄 Conversions de documents illimitées',
      '📑 Analyse de documents illimitée'
    ],
    is_active: true,
    popular: false,
    buttonText: 'Choisir Business'
  }
];

export const PricingSection = () => {
  const navigate = useNavigate();

  return (
    <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-5xl font-bold mb-8">
            Tarifs & Plans
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Des plans transparents pour tous les besoins. Choisissez celui qui vous convient.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card key={plan.id} className={`relative hover:shadow-elegant transition-all duration-300 hover:-translate-y-2 ${plan.popular ? 'border-primary shadow-elegant scale-105 bg-gradient-to-b from-primary/5 to-background' : 'bg-card/50 backdrop-blur-sm'}`}>
              {plan.popular && (
                  <Badge className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-primary text-lg px-6 py-2">
                    Populaire
                  </Badge>
                )}
                <CardContent className="p-8 text-center">
                  <h3 className="text-3xl font-bold mb-4">{plan.name}</h3>
                  <p className="text-muted-foreground mb-6">{plan.description}</p>
                  <div className="mb-6">
                    <div className="flex items-baseline justify-center">
                      <span className="text-5xl font-bold">{plan.price.toLocaleString()}</span>
                      <span className="text-muted-foreground ml-2"> FCFA/mois</span>
                    </div>
                    {plan.popular && (
                      <div className="mt-2">
                        <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                          Actuel
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  <ul className="space-y-4 mb-8 text-left">
                    {plan.features.map((feature, fIndex) => (
                      <li key={fIndex} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                        <span className="text-sm leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button 
                    size="lg"
                    onClick={() => navigate('/auth')}
                    className={`w-full ${plan.popular ? 'bg-gradient-primary hover:shadow-glow text-lg py-6' : 'text-lg py-6'}`}
                    variant={plan.popular ? "default" : "outline"}
                    disabled={plan.popular}
                  >
                    {plan.buttonText || `Choisir ${plan.name}`}
                  </Button>
                </CardContent>
              </Card>
            ))}
        </div>

        <div className="text-center mt-16">
          <p className="text-muted-foreground mb-6 text-lg">
            Garantie satisfait ou remboursé 30 jours • Support client dédié
          </p>
          <Button variant="outline" size="lg" onClick={() => navigate('/auth')}>
            Commencer maintenant
          </Button>
        </div>
      </div>
    </section>
  );
};