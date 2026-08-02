import type { Tab } from '../types';

interface TabSelectorProps {
  tab: Tab;
  onTabChange: (tab: Tab) => void;
}

export const TabSelector = ({ tab, onTabChange }: TabSelectorProps) => (
  <div className="flex bg-surface-elevated p-1 rounded-xl">
    {(['login', 'register'] as Tab[]).map((t) => (
      <button
        key={t}
        onClick={() => onTabChange(t)}
        className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
          tab === t
            ? 'bg-surface text-txt shadow-sm border border-border'
            : 'text-txt-muted hover:text-txt'
        }`}
      >
        {t === 'login' ? 'Iniciar sesion' : 'Registrarse'}
      </button>
    ))}
  </div>
);
