import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorAlertProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorAlert = ({ message, onRetry }: ErrorAlertProps) => (
  <div className="bg-danger-light border border-danger/20 rounded-xl px-4 py-3 text-sm text-danger flex items-start gap-2">
    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
    <span className="flex-1">{message}</span>
    {onRetry && (
      <button
        onClick={onRetry}
        className="p-1 hover:bg-danger/10 rounded-lg transition-colors shrink-0"
        aria-label="Reintentar"
      >
        <RefreshCw className="w-4 h-4" />
      </button>
    )}
  </div>
);
