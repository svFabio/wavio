import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Building } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const NegocioSelector = () => {
  const { negocios, activeNegocioId, switchNegocio } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!negocios || negocios.length <= 1) return null;

  const activeNegocio = negocios.find((n) => n.id === activeNegocioId);

  return (
    <div className="relative mx-4 mb-2 mt-2" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 w-full p-2 text-left bg-surface-elevated hover:bg-border/50 rounded-lg transition-colors border border-border"
      >
        <div className="flex-shrink-0 p-1.5 bg-primary/10 rounded-md">
          <Building className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-txt truncate">
            {activeNegocio?.nombre || 'Seleccionar...'}
          </div>
          <div className="text-[10px] text-txt-muted uppercase font-semibold">
            Plan {activeNegocio?.plan}
          </div>
        </div>
        <ChevronDown className="w-4 h-4 text-txt-muted flex-shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-lg shadow-lg overflow-hidden z-50">
          <div className="max-h-48 overflow-y-auto">
            {negocios.map((negocio) => (
              <button
                key={negocio.id}
                onClick={() => {
                  switchNegocio(negocio.id);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 text-sm transition-colors border-b border-border last:border-0 ${
                  negocio.id === activeNegocioId
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-txt-secondary hover:bg-surface-elevated hover:text-txt'
                }`}
              >
                <div className="truncate">{negocio.nombre}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
