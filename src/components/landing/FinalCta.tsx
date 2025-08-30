import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export const FinalCta = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-primary relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/70"></div>
      <div className="relative max-w-4xl mx-auto text-center">
        <h2 className="text-3xl sm:text-5xl font-bold mb-8 text-primary-foreground">
          Prêt à révolutionner votre productivité ?
        </h2>
        <p className="text-xl text-primary-foreground/90 mb-12 max-w-2xl mx-auto leading-relaxed">
          ✅ Accès illimité à toutes les IA<br />
          ✅ Génération d'images illimitée<br />
          ✅ Voix off et transcription incluses<br />
          ✅ Interface intuitive et moderne
        </p>
        
        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <Button 
            size="lg" 
            onClick={() => navigate('/auth')}
            className="bg-background text-foreground hover:bg-background/90 text-xl px-12 py-8 shadow-xl"
          >
            Inscrivez-vous maintenant
            <ArrowRight className="w-6 h-6 ml-2" />
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            onClick={() => navigate('/app')}
            className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary text-xl px-12 py-8"
          >
            Essayer gratuitement
          </Button>
        </div>

        <p className="text-primary-foreground/80 text-sm mt-8">
          Sans engagement • Annulation à tout moment • Support français
        </p>
      </div>
    </section>
  );
};