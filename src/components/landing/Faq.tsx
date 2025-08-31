import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";

const faqs = [
  {
    question: "Est-ce vraiment illimité ?",
    answer: "Oui, pour les plans payants ! Contrairement aux autres plateformes, Chatelix vous donne un accès totalement illimité à plus de 400 modèles IA via OpenRouter (incluant GPT-5, Claude 3.5, Llama 3.3, Gemini Pro, Mistral Large, DeepSeek, Grok, Perplexity), ainsi qu'à la génération d'images, voix off et transcription. Aucune limite mensuelle sur l'utilisation des modèles IA pour les abonnés. Un mode test gratuit avec des limites est disponible pour essayer."
  },
  {
    question: "Quels outils sont inclus ?",
    answer: "Chatelix inclut plus de 400 modèles IA via OpenRouter (GPT-5, Claude 3.5, Llama 3.3, Gemini Pro, Mistral Large, DeepSeek, Grok, Perplexity et 50+ autres fournisseurs). Vous avez également accès à DALL-E 3 et Runware pour les images, OpenAI et Google TTS pour la voix, la transcription audio avancée, la vision IA, un auto-router intelligent, un générateur d'ebooks, un studio de code, un studio de documents et un studio de médias sociaux."
  },
  {
    question: "Puis-je annuler à tout moment ?",
    answer: "Absolument ! Vous pouvez annuler votre abonnement à tout moment depuis votre tableau de bord. Aucun engagement, aucune question posée."
  },
  {
    question: "Comment se passe le paiement ?",
    answer: "Les paiements sont sécurisés par Moneroo. Nous acceptons toutes les cartes bancaires et les paiements mobiles. La facturation est automatique selon votre plan choisi."
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