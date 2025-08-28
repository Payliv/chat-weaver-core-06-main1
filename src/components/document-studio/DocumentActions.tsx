import { Button } from '@/components/ui/button';
import { Wand2 } from 'lucide-react';

export const DocumentActions = () => (
  <div className="p-4 border-t">
    <h3 className="font-semibold mb-2">Actions IA</h3>
    <div className="grid grid-cols-2 gap-2">
      <Button variant="outline" size="sm"><Wand2 className="w-4 h-4 mr-2" /> Résumer</Button>
      <Button variant="outline" size="sm"><Wand2 className="w-4 h-4 mr-2" /> Traduire</Button>
      <Button variant="outline" size="sm"><Wand2 className="w-4 h-4 mr-2" /> Convertir</Button>
      <Button variant="outline" size="sm"><Wand2 className="w-4 h-4 mr-2" /> Analyser</Button>
    </div>
  </div>
);