import { useState } from 'react';
import { Link2, Copy, Check, Loader2 } from 'lucide-react';
import { useGenerateLinkMutation } from '../api/usePortal';

interface GenerateLinkButtonProps {
  clienteId: number;
}

export const GenerateLinkButton = ({ clienteId }: GenerateLinkButtonProps) => {
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const generateMutation = useGenerateLinkMutation();

  const handleGenerate = async () => {
    const result = await generateMutation.mutateAsync(clienteId);
    const fullUrl = `${window.location.origin}/portal/${result.token}`;
    setGeneratedUrl(fullUrl);
    setCopied(false);
  };

  const handleCopy = async () => {
    if (!generatedUrl) return;
    await navigator.clipboard.writeText(generatedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleGenerate}
        disabled={generateMutation.isPending}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
      >
        {generateMutation.isPending ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Link2 className="w-3.5 h-3.5" />
        )}
        {generatedUrl ? 'Regenerar enlace' : 'Generar enlace'}
      </button>

      {generatedUrl && (
        <div className="flex items-center gap-2">
          <code className="text-xs text-txt-secondary bg-surface-alt px-2 py-1 rounded border border-border truncate max-w-[200px]">
            {generatedUrl}
          </code>
          <button
            type="button"
            onClick={handleCopy}
            className="text-txt-muted hover:text-txt transition-colors"
            title="Copiar enlace"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-success" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      )}
    </div>
  );
};
