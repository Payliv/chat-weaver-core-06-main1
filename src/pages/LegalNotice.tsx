import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const LegalNotice = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour à l'accueil
        </Button>
        
        <h1 className="text-4xl font-bold mb-6">Mentions Légales</h1>
        
        <div className="space-y-6 text-muted-foreground">
          <p>Conformément aux dispositions de la loi n° 2004-575 du 21 juin 2004 pour la confiance en l'économie numérique, il est précisé aux utilisateurs du site Chatelix l'identité des différents intervenants dans le cadre de sa réalisation et de son suivi.</p>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">Édition du site</h2>
            <p>Le présent site, accessible à l’URL https://chatelix.app, est édité par :</p>
            <p>G-STARTUP, société au capital de 1,000,000 FCFA, inscrite au R.C.S. de Dakar sous le numéro SN.DKR.2023.A.12345, dont le siège social est situé au 123 Avenue de la République, Dakar, Sénégal.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">Hébergement</h2>
            <p>Le Site est hébergé par la société Vercel Inc., située 340 S Lemon Ave #4133 Walnut, CA 91789, (contact : (951) 383-6898).</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">Directeur de publication</h2>
            <p>Le Directeur de la publication du Site est Monsieur Jean Dupont.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">Nous contacter</h2>
            <p>Par téléphone : +221 77 123 45 67</p>
            <p>Par email : contact@chatelix.app</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">Données personnelles</h2>
            <p>Le traitement de vos données à caractère personnel est régi par notre Politique de Confidentialité, disponible depuis la section "Politique de confidentialité" du site, conformément au Règlement Général sur la Protection des Données 2016/679 du 27 avril 2016 (« RGPD »).</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default LegalNotice;