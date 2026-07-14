import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  gradient: string;
  glow: string;
}

export const StatCard = ({ label, value, icon: Icon, gradient, glow }: StatCardProps) => {
  return (
    <div className="stat-card group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-txt-secondary">{label}</p>
          <p className="text-3xl font-bold text-txt mt-2 animate-count-up">{value}</p>
        </div>
        <div
          className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}
          style={{ boxShadow: glow }}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
};
