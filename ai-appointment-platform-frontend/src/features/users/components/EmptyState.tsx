import type { LucideIcon } from 'lucide-react';
import { Users } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  className?: string;
}

export const EmptyState = ({
  icon: Icon = Users,
  title = 'No users registered',
  description,
  className = '',
}: EmptyStateProps): React.JSX.Element => (
  <div className={`text-center py-12 ${className}`}>
    <Icon className="w-12 h-12 mx-auto text-txt-muted/40 mb-3" />
    <p className="font-medium text-txt-muted">{title}</p>
    {description && <p className="text-sm text-txt-muted/70 mt-1">{description}</p>}
  </div>
);
