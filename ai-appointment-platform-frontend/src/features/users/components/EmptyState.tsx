import { Users } from 'lucide-react';

export const EmptyState = () => (
  <div className="text-center py-12">
    <Users className="w-12 h-12 mx-auto text-txt-muted/40 mb-3" />
    <p className="font-medium text-txt-muted">No hay usuarios registrados</p>
    <p className="text-sm text-txt-muted mt-1">Crea el primer usuario para comenzar</p>
  </div>
);
