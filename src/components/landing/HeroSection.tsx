import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import professionalAiHero from "@/assets/professional-ai-hero.png";

export const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto text-center">
        <h1 className="text-5xl sm:text-7xl font-bold mb-8 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent leading-tight">
          Chatelix – Toute la puissance de l'IA, 
          <span className="bg-gradient-primary bg-clip-text text-transparent">à portée de main</span>
        </h1>
        
        <p className="text-xl sm:text-2xl text-muted-foreground mb-12 max-w-4xl mx-auto leading-relaxed">
          Accédez à toutes vos IA préférées, sans limites ! Avec Chatelix, utilisez directement les meilleurs modèles IA : GPT-5, Claude 3.5, Llama 3.3 et bien d'autres. 
          <span className="font-semibold">Plus besoin de multiplier les abonnements : tout est disponible sur une seule plateforme, pour créer, analyser et automatiser vos contenus.</span>
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
          <Button 
            size="lg" 
            onClick={() => navigate('/auth')}
            className="bg-gradient-primary hover:shadow-glow text-xl px-12 py-8"
          >
            Essayer maintenant
            <ArrowRight className="w-6 h-6 ml-2" />
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            onClick={() => navigate('/features')} 
            // Updated to navigate to /features
            className="text-xl px-12 py-8"
          >
            Voir les fonctionnalités
          </Button>
        </div>

        {/* Hero Mockup */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-primary opacity-20 blur-3xl rounded-3xl"></div>
          <img 
            src={professionalAiHero}
            alt="Interface Chatelix - Toutes les IA en un seul endroit"
            className="relative w-full max-w-4xl mx-auto h-auto object-contain drop-shadow-2xl rounded-2xl"
          />
        </div>
      </div>
    </section>
  );
};