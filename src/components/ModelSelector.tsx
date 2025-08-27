import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Cpu, Sparkles, Zap, Search, ShieldCheck, Settings2, Code2, Globe, Wrench } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const models = [
  // === ROUTAGE INTELLIGENT ===
  {
    id: "auto-router",
    name: "🤖 Auto (IA Router)",
    provider: "Intelligence",
    icon: Search,
    color: "openai",
    description: "Sélection automatique du meilleur modèle selon la tâche"
  },

  // === 🏆 OPENAI MODELS (CLÉS API DIRECTES) ===
  {
    id: "gpt-5-2025-08-07",
    name: "🌟 GPT-5",
    provider: "OpenAI Direct",
    icon: Sparkles,
    color: "openai",
    description: "GPT-5 flagship - Le plus puissant"
  },
  {
    id: "gpt-5-mini-2025-08-07",
    name: "⚡ GPT-5 Mini",
    provider: "OpenAI Direct",
    icon: Zap,
    color: "openai",
    description: "GPT-5 rapide et économique"
  },
  {
    id: "gpt-5-nano-2025-08-07",
    name: "💫 GPT-5 Nano",
    provider: "OpenAI Direct",
    icon: Zap,
    color: "openai",
    description: "GPT-5 ultra-rapide"
  },
  {
    id: "gpt-4o",
    name: "🏆 GPT-4o",
    provider: "OpenAI Direct",
    icon: Sparkles,
    color: "openai",
    description: "GPT-4 Omni - Avec ta clé API"
  },
  {
    id: "gpt-4o-mini",
    name: "⚡ GPT-4o Mini",
    provider: "OpenAI Direct",
    icon: Zap,
    color: "openai",
    description: "Version économique - Clé API directe"
  },
  {
    id: "gpt-4-turbo",
    name: "🚀 GPT-4 Turbo",
    provider: "OpenAI Direct",
    icon: Zap,
    color: "openai",
    description: "GPT-4 Turbo - Clé API directe"
  },

  // === 🧠 REASONING MODELS (CLÉS API DIRECTES) ===
  {
    id: "o3-2025-04-16",
    name: "🧠 O3",
    provider: "OpenAI Direct",
    icon: Cpu,
    color: "openai",
    description: "Raisonnement O3 - Le plus puissant"
  },
  {
    id: "o4-mini-2025-04-16",
    name: "⚡ O4 Mini",
    provider: "OpenAI Direct",
    icon: Cpu,
    color: "openai",
    description: "Raisonnement rapide O4"
  },
  {
    id: "o1-preview",
    name: "🧠 O1 Preview",
    provider: "OpenAI Direct",
    icon: Cpu,
    color: "openai",
    description: "Raisonnement O1 - Clé API directe"
  },
  {
    id: "o1-mini",
    name: "⚡ O1 Mini",
    provider: "OpenAI Direct",
    icon: Cpu,
    color: "openai",
    description: "Raisonnement rapide - Clé API directe"
  },

  // === 👑 CLAUDE SERIES (CLÉS API DIRECTES) ===
  {
    id: "claude-3-5-sonnet-20241022",
    name: "👑 Claude 3.5 Sonnet",
    provider: "Anthropic Direct",
    icon: Sparkles,
    color: "claude",
    description: "Claude 3.5 - Avec ta clé API"
  },
  {
    id: "anthropic/claude-3-5-haiku-20241022",
    name: "⚡ Claude 3.5 Haiku",
    provider: "Anthropic",
    icon: Zap,
    color: "claude",
    description: "Le plus rapide - Réponses instantanées"
  },

  // === 🦙 META LLAMA 3.3 ===
  {
    id: "meta-llama/llama-3.3-70b-instruct",
    name: "🆕 Llama 3.3 70B",
    provider: "Meta",
    icon: Code2,
    color: "codestral",
    description: "Dernière version Llama - Améliorations majeures"
  },

  // === 🤖 xAI GROK SERIES ===
  {
    id: "x-ai/grok-2-1212",
    name: "🚀 Grok 2",
    provider: "xAI",
    icon: Sparkles,
    color: "perplexity",
    description: "Dernière génération Grok avec personnalité"
  },
  {
    id: "x-ai/grok-2-vision-1212",
    name: "👁️ Grok 2 Vision",
    provider: "xAI",
    icon: Globe,
    color: "perplexity",
    description: "Grok avec capacités vision avancées"
  },

  // === 🧠 DEEPSEEK V3 & R1 ===
  {
    id: "deepseek/deepseek-v3",
    name: "🚀 DeepSeek V3",
    provider: "DeepSeek",
    icon: Sparkles,
    color: "deepseek",
    description: "Dernière génération - Performances accrues"
  },
  {
    id: "deepseek/deepseek-r1-lite-preview",
    name: "🧠 DeepSeek R1 Lite",
    provider: "DeepSeek",
    icon: Cpu,
    color: "deepseek",
    description: "Raisonnement optimisé preview"
  },

  // === 🚀 GOOGLE GEMINI (CLÉS API DIRECTES) ===
  {
    id: "gemini-1.5-pro",
    name: "🚀 Gemini 1.5 Pro",
    provider: "Google Direct",
    icon: Sparkles,
    color: "gemini",
    description: "Gemini Pro - Avec ta clé API"
  },
  {
    id: "gemini-1.5-flash",
    name: "⚡ Gemini Flash",
    provider: "Google Direct",
    icon: Zap,
    color: "gemini",
    description: "Version rapide - Clé API directe"
  },

  // === 🧠 DEEPSEEK MODELS (CLÉS API DIRECTES) ===
  {
    id: "deepseek-chat",
    name: "🧠 DeepSeek Chat",
    provider: "DeepSeek Direct",
    icon: Sparkles,
    color: "deepseek",
    description: "DeepSeek Chat - Avec ta clé API"
  },
  {
    id: "deepseek-coder",
    name: "💻 DeepSeek Coder",
    provider: "DeepSeek Direct",
    icon: Code2,
    color: "deepseek",
    description: "Spécialisé code - Clé API directe"
  },
];
interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  personality: string;
  onPersonalityChange: (key: string) => void;
  safeMode: boolean;
  onSafeModeChange: (v: boolean) => void;
}

export const ModelSelector = ({ selectedModel, onModelChange, personality, onPersonalityChange, safeMode, onSafeModeChange }: ModelSelectorProps) => {
  const currentModel = models.find(m => m.id === selectedModel) || models[0];

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 sm:p-4 border-b border-border bg-background">
      {/* Modèle principal - toujours visible */}
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <div className="flex items-center gap-2">
          <currentModel.icon className="w-4 h-4 text-foreground" />
          <span className="text-sm font-medium text-foreground hidden sm:inline">Modèle :</span>
        </div>
        
        <Select value={selectedModel} onValueChange={onModelChange}>
          <SelectTrigger className="flex-1 sm:w-[200px] lg:w-[280px] bg-secondary border-border text-sm">
            <SelectValue>
              <div className="flex items-center gap-2">
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${
                          currentModel.color === 'openai' ? 'bg-openai/20 text-openai border-openai/30' :
                          currentModel.color === 'claude' ? 'bg-claude/20 text-claude border-claude/30' :
                          currentModel.color === 'gemini' ? 'bg-gemini/20 text-gemini border-gemini/30' :
                          currentModel.color === 'deepseek' ? 'bg-deepseek/20 text-deepseek border-deepseek/30' :
                          currentModel.color === 'mistral' ? 'bg-mistral/20 text-mistral border-mistral/30' :
                          'bg-perplexity/20 text-perplexity border-perplexity/30'
                        }`}
                      >
                  {currentModel.provider}
                </Badge>
                <span className="text-foreground truncate">{currentModel.name}</span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {models.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                <div className="flex items-center gap-3 py-1">
                  <model.icon className="w-4 h-4" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{model.name}</span>
                       <Badge 
                         variant="secondary" 
                         className={`text-xs ${
                           model.color === 'openai' ? 'bg-openai/20 text-openai border-openai/30' :
                           model.color === 'claude' ? 'bg-claude/20 text-claude border-claude/30' :
                           model.color === 'gemini' ? 'bg-gemini/20 text-gemini border-gemini/30' :
                           model.color === 'deepseek' ? 'bg-deepseek/20 text-deepseek border-deepseek/30' :
                           model.color === 'mistral' ? 'bg-mistral/20 text-mistral border-mistral/30' :
                           'bg-perplexity/20 text-perplexity border-perplexity/30'
                         }`}
                       >
                        {model.provider}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{model.description}</p>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Options rapides mobile/desktop */}
      <div className="flex items-center gap-2 w-full sm:w-auto ml-auto">
        {/* Safe mode - toujours visible */}
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" />
          <Switch checked={safeMode} onCheckedChange={onSafeModeChange} className="scale-75 sm:scale-100" />
        </div>

        {/* Options avancées - mobile: popup, desktop: inline */}
        <div className="sm:hidden">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                <Settings2 className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-4" align="end">
              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="text-sm font-medium">Personnalité</span>
                  
                  <div className="space-y-1">
                    <Select value={personality} onValueChange={onPersonalityChange}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Neutre</SelectItem>
                        <SelectItem value="nerd">Nerd</SelectItem>
                        <SelectItem value="listener">Écoute</SelectItem>
                        <SelectItem value="cynic">Cynique</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Options desktop - cachées sur mobile */}
        <div className="hidden sm:flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Personnalité</span>
            <Select value={personality} onValueChange={onPersonalityChange}>
              <SelectTrigger className="w-[120px] lg:w-[150px] bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Neutre</SelectItem>
                <SelectItem value="nerd">Nerd</SelectItem>
                <SelectItem value="listener">Écoute</SelectItem>
                <SelectItem value="cynic">Cynique</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
};