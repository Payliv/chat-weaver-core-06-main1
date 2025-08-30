import { Card, CardContent } from "@/components/ui/card";
import { Infinity, Sparkles, Zap, Globe } from "lucide-react";

const uniquePoints = [
  {
    icon: Infinity,
    title: "Accès illimité à toutes les IA",
    description: "Accédez à toutes les IA incluses dans votre plan, sans limites d'utilisation."
  },
  {
    icon: Sparkles,
    title: "Création de contenu simplifiée",
    description: "Images, voix, transcription et ebooks au même endroit pour une création fluide."
  },
  {
    icon: Zap,
    title: "Productivité maximale",
    description: "Plus de quotas, plus de stress. Concentrez-vous sur votre travail, l'IA s'occupe du reste."
  },
  {
    icon: Globe,
    title: "Interface intuitive et accessible",
    description: "Utilisez Chatelix partout, sur le web et via notre API, avec une interface moderne."
  }
];

export const UniquePoints = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary/20">
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="text-3xl sm:text-5xl font-bold mb-8">
          Pourquoi Chatelix est unique ?
        </h2>
        <p className="text-xl text-muted-foreground mb-16 max-w-4xl mx-auto leading-relaxed">
          Fini les abonnements multiples et les limites d'utilisation. Accédez à toutes les IA de pointe 
          et aux outils créatifs en illimité, sur une seule plateforme.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {uniquePoints.map((point, index) => (
            <Card key={index} className="hover:shadow-elegant transition-all duration-300 hover:-translate-y-2 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 bg-gradient-primary rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <point.icon className="w-10 h-10 text-primary-foreground" />
                </div>
                <h3 className="font-bold text-xl mb-4">{point.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{point.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};