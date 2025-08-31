import { useNavigate } from "react-router-dom";
import { NavigationBar } from "@/components/landing/NavigationBar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  Brain,
  Image,
  Mic,
  Volume2,
  BookOpen,
  Code2,
  FileText,
  Share2,
  Megaphone,
  Infinity,
  Zap,
  Globe,
  CheckCircle,
  Sparkles,
  Users,
  CreditCard,
  ArrowRight, // Importation de ArrowRight
} from "lucide-react";

const featuresData = [
  {
    category: "Modèles d'Intelligence Artificielle",
    icon: Brain,
    items: [
      {
        title: "Les meilleurs modèles de l'IA",
        description: "Accédez aux modèles les plus avancés du marché : GPT-5, Claude 3.5, Llama 3.3, Gemini Pro, Mistral Large, DeepSeek, Grok, Perplexity et plus de 50 autres fournisseurs, tous sur une seule plateforme.",
        details: ["Accès illimité aux modèles premium", "Mises à jour constantes des derniers modèles", "Choix du modèle adapté à chaque tâche"],
        highlight: true,
      },
      {
        title: "Auto-Router Intelligent",
        description: "Laissez l'IA choisir automatiquement le meilleur modèle pour votre requête, optimisant la qualité et la vitesse de réponse.",
        details: ["Sélection automatique basée sur la complexité et le type de tâche", "Optimisation des coûts et des performances"],
      },
    ],
  },
  {
    category: "Génération de Contenu Multimédia",
    icon: Sparkles,
    items: [
      {
        title: "Génération d'Images (DALL·E 3 & Runware)",
        description: "Créez des visuels époustouflants pour tous vos projets, du marketing au design, avec les technologies de pointe.",
        details: ["Images haute résolution et réalistes", "Édition et variations d'images", "Contrôle précis du prompt"],
      },
      {
        title: "Synthèse Vocale (Text-to-Speech)",
        description: "Transformez n'importe quel texte en voix naturelles et expressives, parfait pour les narrations, podcasts ou assistants vocaux.",
        details: ["Multiples voix et langues disponibles", "Ajustement de la vitesse et du format audio", "Voix HD premium"],
      },
      {
        title: "Transcription Audio (Speech-to-Text)",
        description: "Convertissez vos enregistrements audio en texte avec une précision remarquable, idéal pour les interviews, réunions ou podcasts.",
        details: ["Détection automatique de la langue", "Transcription rapide et fiable", "Support de divers formats audio"],
      },
      // { // Masqué temporairement
      //   title: "Génération de Vidéos (KlingAI)",
      //   description: "Créez des vidéos à partir de texte ou d'images, pour vos campagnes marketing, réseaux sociaux ou présentations.",
      //   details: ["Vidéos courtes et dynamiques", "Options de prompt négatif", "Divers formats d'aspect"],
      // },
    ],
  },
  {
    category: "Outils de Productivité & Création",
    icon: Zap,
    items: [
      {
        title: "Générateur d'Ebooks",
        description: "Créez des ebooks complets et structurés en quelques minutes, de la table des matières aux chapitres détaillés.",
        details: ["Génération ultra-rapide (20k+ mots en 2-3 min)", "Templates professionnels", "Éditeur intégré et export PDF/DOCX"],
      },
      {
        title: "Code Studio",
        description: "Développez des applications web complètes avec l'aide de l'IA, du HTML/CSS/JS aux applications React.",
        details: ["Génération de code React/Vanilla", "Éditeur de code intégré avec prévisualisation live", "Assistant IA pour l'amélioration et le débogage"],
      },
      {
        title: "Document Studio",
        description: "Analysez, résumez, traduisez et convertissez vos documents (PDF, DOCX, TXT) avec l'intelligence artificielle.",
        details: ["Extraction de texte avancée", "Chat interactif avec vos documents", "Conversion multi-formats"],
      },
      {
        title: "Social Media Studio",
        description: "Générez du contenu percutant et adapté pour toutes vos plateformes de réseaux sociaux (Instagram, Facebook, TikTok, LinkedIn, X).",
        details: ["Posts, tweets, scripts vidéo", "Adaptation au ton et aux tendances de chaque plateforme", "Génération illimitée"],
      },
      {
        title: "Studio de Prise de Parole",
        description: "Améliorez vos compétences oratoires grâce à l'analyse de discours, la simulation d'audience et des exercices guidés par l'IA.",
        details: ["Analyse détaillée de la fluidité, clarté, impact", "Simulation d'audience avec différentes personas", "Défis quotidiens et feedback personnalisé"],
      },
    ],
  },
  {
    category: "Avantages Exclusifs Chatelix",
    icon: CheckCircle,
    items: [
      {
        title: "Accès Illimité & Unifié",
        description: "Fini les abonnements multiples ! Accédez à toutes les IA et outils sans limites d'utilisation sur une seule plateforme.",
        details: ["Les meilleurs modèles de l'IA", "Génération de contenu illimitée", "Une seule interface pour tout gérer"],
        highlight: true,
      },
      {
        title: "Collaboration d'Équipe",
        description: "Partagez votre abonnement avec votre équipe et collaborez sur vos projets IA en toute simplicité (plans Pro et Business).",
        details: ["Gestion des membres et invitations", "Historique d'activité d'équipe", "Partage de ressources"],
      },
      {
        title: "Support Prioritaire",
        description: "Bénéficiez d'un support client dédié pour vous accompagner dans l'utilisation de Chatelix (plans Business et Enterprise).",
        details: ["Assistance rapide et personnalisée", "Conseils d'experts", "SLA pour les entreprises"],
      },
    ],
  },
];

const FeaturesPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <NavigationBar />

      <main className="container mx-auto px-4 py-12 pt-24 max-w-7xl">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-8 flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Retour à l'accueil
        </Button>

        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent leading-tight">
            Découvrez toutes les <span className="bg-gradient-primary bg-clip-text text-transparent">fonctionnalités</span> de Chatelix
          </h1>
          <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
            Chatelix est votre plateforme tout-en-un pour l'intelligence artificielle. 
            Accédez à une suite complète d'outils pour la création de contenu, la productivité et la collaboration.
          </p>
        </div>

        <div className="space-y-16">
          {featuresData.map((category, catIndex) => (
            <section key={catIndex} className="py-8">
              <div className="flex items-center justify-center gap-4 mb-12">
                <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center flex-shrink-0">
                  <category.icon className="w-8 h-8 text-primary-foreground" />
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                  {category.category}
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {category.items.map((feature, itemIndex) => (
                  <Card key={itemIndex} className={`hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 ${feature.highlight ? 'border-primary shadow-lg bg-primary/5' : 'bg-card/50 backdrop-blur-sm'}`}>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`p-2 rounded-lg ${feature.highlight ? 'bg-primary/20' : 'bg-muted/50'}`}>
                          {feature.highlight ? (
                            <Sparkles className="w-5 h-5 text-primary" />
                          ) : (
                            <CheckCircle className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <h3 className="font-semibold text-xl text-foreground">{feature.title}</h3>
                      </div>
                      <p className="text-muted-foreground mb-4 leading-relaxed">{feature.description}</p>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        {feature.details.map((detail, dIndex) => (
                          <li key={dIndex} className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-1" />
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="text-center mt-20">
          <h2 className="text-3xl sm:text-5xl font-bold mb-8">
            Prêt à commencer ?
          </h2>
          <Button 
            size="lg" 
            onClick={() => navigate('/auth')}
            className="bg-gradient-primary hover:shadow-glow text-xl px-12 py-8"
          >
            Essayer Chatelix maintenant
            <ArrowRight className="w-6 h-6 ml-2" />
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FeaturesPage;