import { CheckCircle2, Copy, X } from 'lucide-react';

interface InviteSuccessCardProps {
  url: string;
  onDismiss: () => void;
}

export const InviteSuccessCard = ({
  url,
  onDismiss,
}: InviteSuccessCardProps): React.JSX.Element => {
  const handleCopy = async () => {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
    }
  };

  return (
    <div className="card-modern mt-6 p-5 border border-success/30 bg-success/5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <CheckCircle2 className="w-6 h-6 text-success shrink-0 mt-0.5" />
          <div className="min-w-0">
            <h3 className="text-base font-bold text-txt">Invitation sent</h3>
            <p className="text-sm text-txt-secondary mt-1">
              Share this link with the invited person. It expires in 48 hours.
            </p>
            <p className="text-xs text-txt-muted break-all mt-2 font-mono">{url}</p>
          </div>
        </div>
        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          className="p-1.5 hover:bg-surface-elevated rounded-full transition-colors shrink-0"
        >
          <X className="w-5 h-5 text-txt-muted" />
        </button>
      </div>
      <div className="mt-4">
        <button onClick={handleCopy} className="btn-secondary text-sm">
          <Copy className="w-4 h-4" />
          Copy link
        </button>
      </div>
    </div>
  );
};
