import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Brain, Image, Mic, Volume2 } from "lucide-react";

const detailedFeatures = [
  {
    icon: Image,
    title: "Génération d'images (DALL·E 3)",
    description: "Créez des images haute qualité pour vos projets marketing, contenus ou designs.",
    image: "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=800"
  },
  {
    icon: Volume2,
    title: "Voix Off (Text → Speech)",
    description: "Transformez vos textes en voix naturelles avec plusieurs voix disponibles.",
    image: "https://images.pexels.com/photos/7088526/pexels-photo-7088526.jpeg?auto=compress&cs=tinysrgb&w=800"
  },
  {
    icon: Mic,
    title: "Voice-to-Text",
    description: "Transcription précise pour vos podcasts, interviews et vidéos.",
    image: "https://images.pexels.com/photos/4226140/pexels-photo-4226140.jpeg?auto=compress&cs=tinysrgb&w=800"
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