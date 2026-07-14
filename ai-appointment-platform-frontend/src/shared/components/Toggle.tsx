import React from 'react';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
  className?: string;
}

export function Toggle({ checked, onChange, id, className = '' }: ToggleProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onChange(!checked);
    }
  };

  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      tabIndex={0}
      onClick={() => onChange(!checked)}
      onKeyDown={handleKeyDown}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 ${
        checked ? 'bg-primary' : 'bg-border'
      } ${className}`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full shadow transition-transform duration-200 ${
          checked ? 'translate-x-6 bg-on-primary' : 'translate-x-1 bg-surface'
        }`}
      />
    </button>
  );
}
