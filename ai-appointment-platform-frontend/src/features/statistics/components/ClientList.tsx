import { Users } from 'lucide-react';

interface ClientListProps {
  clientes: Array<{ nombre: string; telefono: string; totalCitas: number }>;
}

const getMedal = (index: number) => {
  if (index === 0) return '\u{1F947}';
  if (index === 1) return '\u{1F948}';
  if (index === 2) return '\u{1F949}';
  return `${index + 1}.`;
};

export const ClientList = ({ clientes }: ClientListProps) => {
  return (
    <div className="card-modern p-5 md:p-6">
      <h2 className="text-lg font-bold text-txt mb-4 flex items-center gap-2">
        <Users className="w-5 h-5 text-secondary" />
        Clientes Mas Frecuentes
      </h2>
      <div className="space-y-3">
        {clientes.length === 0 ? (
          <p className="text-txt-muted text-sm text-center py-8">Sin datos aun</p>
        ) : (
          clientes.map((cliente, index) => (
            <div
              key={cliente.telefono}
              className="flex items-center gap-3 p-3 rounded-xl bg-surface-elevated/50 hover:bg-surface-alt/50 transition-colors"
            >
              <span className="text-xl w-8 text-center">{getMedal(index)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-txt truncate capitalize">
                  {cliente.nombre}
                </p>
                <p className="text-xs text-txt-muted truncate">{cliente.telefono}</p>
              </div>
              <span className="badge badge-primary font-bold text-sm px-3">
                {cliente.totalCitas} citas
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
