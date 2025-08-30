import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Brain, Image, Mic, Volume2 } from "lucide-react";

const detailedFeatures = [
  {
    icon: Brain,
    title: "Modèles IA illimités",
    description: "GPT-5, Claude 3.5, Llama 3.3 pour toutes vos créations et analyses.",
    image: "/lovable-uploads/18559761-9d7a-4f88-b792-3c402d548818.png"
  },
  {
    icon: Image,
    title: "Génération d'images (DALL·E 3)",
    description: "Créez des images haute qualité pour vos projets marketing, contenus ou designs.",
    image: "/lovable-uploads/4d23475f-fa47-4f1b-bba0-5b597d4be24b.png"
  },
  {
    icon: Volume2,
    title: "Voix Off (Text → Speech)",
    description: "Transformez vos textes en voix naturelles avec plusieurs voix disponibles.",
    image: "/lovable-uploads/eb4adb27-683e-42a7-ade3-aa8185079db6.png"
  },
  {
    icon: Mic,
    title: "Voice-to-Text",
    description: "Transcription précise pour vos podcasts, interviews et vidéos.",
    image: "/lovable-uploads/ff955a65-24d1-4da4-a5d3-7e518af6492b.png"
  }
];

export const DetailedFeatures = () => {
  const navigate = useNavigate();

  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-5xl font-bold mb-8">
            Fonctionnalités Complètes
          </h2>
        </div>

        <div className="space-y-32">
          {detailedFeatures.map((feature, index) => (
            <div key={index} className={`grid grid-cols-1 lg:grid-cols-2 gap-16 items-center ${index % 2 === 1 ? 'lg:grid-flow-col-dense' : ''}`}>
              {/* Contenu */}
              <div className={index % 2 === 1 ? 'lg:col-start-2' : ''}>
                <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mb-6">
                  <feature.icon className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="text-3xl font-bold mb-6">{feature.title}</h3>
                <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                  {feature.description}
                </p>
                <Button 
                  size="lg" 
                  onClick={() => navigate('/auth')}
                  className="bg-gradient-primary hover:shadow-glow"
                >
                  Tester maintenant
                </Button>
              </div>
              
              {/* Image */}
              <div className={index % 2 === 1 ? 'lg:col-start-1' : ''}>
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-primary opacity-20 blur-2xl rounded-2xl"></div>
                  <img 
                    src={feature.image}
                    alt={feature.title}
                    className="relative w-full h-auto object-contain rounded-2xl shadow-elegant"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};