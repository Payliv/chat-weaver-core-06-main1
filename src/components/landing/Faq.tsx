import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";

const faqs = [
  {
    question: "Est-ce vraiment illimité ?",
    answer: "Oui ! Contrairement aux autres plateformes, Chatelix vous donne un accès totalement illimité à 400+ modèles IA via OpenRouter, génération d'images, voix off et transcription. Aucune limite mensuelle sur l'utilisation des modèles IA."
  },
  {
    question: "Quels outils sont inclus ?",
    answer: "Chatelix inclut 400+ modèles IA via OpenRouter : GPT-5, Claude 4, Llama 3.1 405B, Gemini Pro, Mistral Large, Perplexity et 50+ autres providers. Plus DALL-E 3 et Runware pour les images, OpenAI et Google TTS pour la voix, transcription audio avancée, vision IA et auto-router intelligent."
  },
  {
    question: "Puis-je annuler à tout moment ?",
    answer: "Absolument ! Vous pouvez annuler votre abonnement à tout moment depuis votre tableau de bord. Aucun engagement, aucune question posée."
  },
  {
    question: "Comment se passe le paiement ?",
    answer: "Paiements sécurisés par Moneroo. Nous acceptons toutes les cartes bancaires et les paiements mobiles. Facturation automatique selon votre plan choisi."
  },
  {
    question: "Y a-t-il une garantie ?",
    answer: "Oui ! Nous offrons une garantie satisfait ou remboursé de 30 jours. Si vous n'êtes pas satisfait, nous vous remboursons intégralement."
  },
  {
    question: "L'API est-elle incluse ?",
    answer: "Oui, l'accès API est inclus dans tous nos plans. Intégrez facilement Chatelix dans vos applications et workflows existants."
  }
];

export const Faq = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-5xl font-bold mb-8">
            Questions Fréquentes
          </h2>
          <p className="text-xl text-muted-foreground">
            Toutes les réponses à vos questions sur Chatelix
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <Card key={index} className="hover:shadow-elegant transition-all duration-300">
              <CardContent className="p-0">
                <button
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-secondary/50 transition-colors"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <h3 className="font-semibold text-lg pr-4">{faq.question}</h3>
                  {openFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-primary flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  )}
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-6">
                    <p className="text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};