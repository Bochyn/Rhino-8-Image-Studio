import { Label } from '@/components/Common/Label';
import { Button } from '@/components/Common/Button';
import { Wand2 } from 'lucide-react';

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onGenerate?: () => void;
  isGenerating?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

const TEMPLATES = [
  "Photorealistic architectural rendering, modern villa, golden hour lighting, 8k",
  "Interior design, scandinavian style, soft natural light, minimalist furniture",
  "Aerial view, urban planning, futuristic city, cyberpunk neon lights",
  "Close up detail, wooden texture, depth of field, studio lighting"
];

export function PromptInput({ value, onChange, onGenerate, isGenerating = false, disabled, placeholder }: PromptInputProps) {
  return (
    <div className="space-y-3">
      <Label>Prompt</Label>
      <div className="relative">
        <textarea
          className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
          placeholder={placeholder || "Describe what you want to generate..."}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
        {onGenerate && (
          <Button 
            className="absolute bottom-2 right-2" 
            size="sm" 
            onClick={onGenerate}
            disabled={disabled || isGenerating || !value.trim()}
            isLoading={isGenerating}
          >
            <Wand2 className="mr-2 h-4 w-4" />
            Generate
          </Button>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2">
        {TEMPLATES.map((t, i) => (
          <button
            key={i}
            className="text-xs bg-secondary hover:bg-secondary/80 text-secondary-foreground px-2 py-1 rounded-full transition-colors text-left"
            onClick={() => onChange(t)}
            disabled={disabled}
          >
            {t.slice(0, 30)}...
          </button>
        ))}
      </div>
    </div>
  );
}
