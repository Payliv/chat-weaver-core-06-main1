import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour à l'accueil
        </Button>
        
        <h1 className="text-4xl font-bold mb-6">Politique de Confidentialité</h1>
        
        <div className="space-y-6 text-muted-foreground">
          <p>Dernière mise à jour : 10 août 2025</p>
          <p>La présente Politique de Confidentialité décrit la manière dont Chatelix collecte, utilise et partage les informations vous concernant lorsque vous utilisez notre service.</p>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">1. Collecte des informations</h2>
            <p>Nous collectons les informations que vous nous fournissez directement, telles que votre nom, votre adresse e-mail et vos informations de paiement lorsque vous créez un compte ou souscrivez à un abonnement. Nous collectons également automatiquement certaines informations lorsque vous utilisez notre service, telles que votre adresse IP, le type de votre navigateur et les informations sur votre utilisation.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">2. Utilisation des informations</h2>
            <p>Nous utilisons les informations collectées pour :</p>
            <ul className="list-disc list-inside ml-4">
              <li>Fournir, maintenir et améliorer notre service.</li>
              <li>Traiter vos transactions et vous envoyer les informations relatives, y compris les confirmations et les factures.</li>
              <li>Communiquer avec vous, notamment pour répondre à vos commentaires, questions et demandes.</li>
              <li>Surveiller et analyser les tendances, l'utilisation et les activités en rapport avec notre service.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">3. Partage des informations</h2>
            <p>Nous ne partageons pas vos informations personnelles avec des tiers, sauf dans les cas suivants :</p>
            <ul className="list-disc list-inside ml-4">
              <li>Avec des fournisseurs de services qui travaillent en notre nom.</li>
              <li>Pour nous conformer à la loi ou répondre à des processus légaux.</li>
              <li>Pour protéger les droits et la propriété de Chatelix, de nos agents, de nos clients et d'autres personnes.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">4. Vos droits</h2>
            <p>Vous disposez de certains droits concernant vos informations personnelles, notamment le droit d'accéder, de corriger ou de supprimer les informations que nous détenons à votre sujet. Pour exercer ces droits, veuillez nous contacter à l'adresse contact@chatelix.app.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;