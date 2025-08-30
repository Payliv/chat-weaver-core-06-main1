import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Martinez",
    role: "CEO, TechCorp",
    content: "Chatelix a révolutionné notre productivité. L'accès illimité à toutes les IA en un endroit, c'est fantastique !",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face",
    rating: 5
  },
  {
    name: "David Chen",
    role: "Développeur Senior",
    content: "Fini les abonnements multiples ! Une seule plateforme pour tout. L'interface est parfaite.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
    rating: 5
  },
  {
    name: "Marie Dubois",
    role: "Consultante IA",
    content: "La qualité des réponses et la variété des outils font de Chatelix un indispensable.",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face",
    rating: 5
  },
  {
    name: "Pierre Durand",
    role: "Créateur de contenu",
    content: "Génération d'images, transcription, voix... tout y est ! Ma productivité a explosé.",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
    rating: 5
  },
  {
    name: "Sophie Laurent",
    role: "Marketing Manager",
    content: "L'utilisation illimitée change tout. Plus de stress avec les quotas, on peut enfin créer librement.",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop&crop=face",
    rating: 5
  }
];

export const Testimonials = () => {
  return (
    <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary/20">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-5xl font-bold mb-8">
            Témoignages
          </h2>
          <p className="text-xl text-muted-foreground">
            Découvrez pourquoi nos utilisateurs adorent Chatelix
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6">
                {/* Rating Stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-500 fill-current" />
                  ))}
                </div>
                
                <Quote className="w-8 h-8 text-primary mb-4" />
                <p className="text-muted-foreground mb-6 leading-relaxed italic">
                  "{testimonial.content}"
                </p>
                
                <div className="flex items-center gap-3">
                  <img 
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};