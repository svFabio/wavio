import { Building2 } from 'lucide-react';
import type { LoginResponse } from '../types';

interface NegocioSelectorListProps {
  negocios: LoginResponse['negocios'];
  onSelect: (negocioId: number) => void;
}

export const NegocioSelectorList = ({ negocios, onSelect }: NegocioSelectorListProps) => (
  <div className="space-y-3">
    <p className="text-sm text-txt-secondary text-center">
      Tienes acceso a multiples negocios. Elige a cual quieres entrar.
    </p>
    {negocios.map((n) => (
      <button
        key={n.id}
        onClick={() => onSelect(n.id)}
        className="w-full flex items-center gap-3 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors text-left"
      >
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Building2 className="w-5 h-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-txt truncate">{n.nombre}</p>
          <span
            className={`inline-block mt-0.5 text-xs font-medium px-2 py-0.5 rounded-full ${
              n.plan === 'PRO' ? 'bg-primary/10 text-primary' : 'bg-surface-elevated text-txt-muted'
            }`}
          >
            {n.plan}
          </span>
        </div>
      </button>
    ))}
  </div>
);
