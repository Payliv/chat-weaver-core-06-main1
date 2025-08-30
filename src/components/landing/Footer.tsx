import { Button } from "@/components/ui/button";
import { Mail, Twitter } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const Footer = () => {
  const navigate = useNavigate();

  return (
    <footer className="bg-secondary/20 border-t border-border py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center">
                <img 
                  src="/lovable-uploads/bb8847f5-56f9-4e8b-b9f0-67b8a41e9639.png"
                  alt="Chatelix Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-xl font-bold">Chatelix</span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-md mb-6">
              La plateforme multi-API qui révolutionne l'accès à l'intelligence artificielle. 
              Toutes les IA en un seul endroit, sans limites.
            </p>
            <div className="flex gap-4">
              <Button size="sm" variant="outline">
                <Mail className="w-4 h-4 mr-2" />
                Contact
              </Button>
              <Button size="sm" variant="outline">
                <Twitter className="w-4 h-4 mr-2" />
                Twitter
              </Button>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-4">Produit</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#features" className="hover:text-foreground transition-colors">Fonctionnalités</a></li>
              <li><a href="#pricing" className="hover:text-foreground transition-colors">Tarifs</a></li>
              <li><a href="/app" className="hover:text-foreground transition-colors">Application</a></li>
              <li><a href="#video" className="hover:text-foreground transition-colors">Démo</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Légal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="/legal-notice" onClick={(e) => { e.preventDefault(); navigate('/legal-notice'); }} className="hover:text-foreground transition-colors">Mentions légales</a></li>
              <li><a href="/privacy-policy" onClick={(e) => { e.preventDefault(); navigate('/privacy-policy'); }} className="hover:text-foreground transition-colors">Politique de confidentialité</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Support</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Centre d'aide</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-12 pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 Chatelix. Conçu avec ❤️ par{" "}
            <a 
              href="https://gstartup.pro" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              G-STARTUP
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};