import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Settings from "./pages/Settings";
import Team from "./pages/Team"; // Updated import
import Billing from "./pages/Billing";
import Landing from "./pages/Landing";
import NewLanding from "./pages/NewLanding";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import ResetPassword from "./pages/ResetPassword";
import UpdatePassword from "./pages/UpdatePassword";
import AcceptInvitation from "./pages/AcceptInvitation";
import ShareSubscription from "./pages/ShareSubscription"; // New import
import Ebooks from "./pages/Ebooks";
import DalleStudio from "./pages/DalleStudio";
import TTSStudio from "./pages/TTSStudio";
import SpeechToText from "./pages/SpeechToText";
import CodeStudio from "./pages/CodeStudio";
import ModernCodeStudio from "./components/modern-code-studio/ModernCodeStudio";
import DocumentStudio from "./pages/DocumentStudio";
import SocialMediaStudio from "./pages/SocialMediaStudio";
import LegalNotice from "./pages/LegalNotice";
import PrivacyPolicy from "./pages/PrivacyPolicy";

const App = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<NewLanding />} />
        <Route path="/old-landing" element={<Landing />} />
        <Route path="/app" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/update-password" element={<UpdatePassword />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/team" element={<Team />} />
        <Route path="/team/accept-invitation" element={<AcceptInvitation />} />
        <Route path="/share-subscription" element={<ShareSubscription />} /> {/* New Route */}
        <Route path="/speech-to-text" element={<SpeechToText />} />
        <Route path="/ebooks" element={<Ebooks />} />
        <Route path="/dalle-studio" element={<DalleStudio />} />
        <Route path="/tts-studio" element={<TTSStudio />} />
        <Route path="/code-studio" element={<ModernCodeStudio />} />
        <Route path="/code-studio-legacy" element={<CodeStudio />} />
        <Route path="/documents" element={<DocumentStudio />} />
        <Route path="/social-media-studio" element={<SocialMediaStudio />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/super-admin" element={<SuperAdminDashboard />} />
        <Route path="/legal-notice" element={<LegalNotice />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </TooltipProvider>
);

export default App;