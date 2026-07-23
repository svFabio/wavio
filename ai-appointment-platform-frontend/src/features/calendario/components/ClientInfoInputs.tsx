import React from 'react';
import { User, Phone } from 'lucide-react';

interface ClientInfoInputsProps {
  nombre: string;
  telefono: string;
  onNombreChange: (nombre: string) => void;
  onTelefonoChange: (telefono: string) => void;
}

export const ClientInfoInputs = ({
  nombre,
  telefono,
  onNombreChange,
  onTelefonoChange,
}: ClientInfoInputsProps): React.JSX.Element => {
  const handleTelefonoChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const valor = e.target.value.replace(/\D/g, '');
    onTelefonoChange(valor);
  };

  return (
    <>
      <div>
        <label className="block text-sm font-semibold text-txt mb-1.5">Nombre del Cliente *</label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-txt-muted" />
          <input
            type="text"
            required
            value={nombre}
            onChange={(e) => onNombreChange(e.target.value)}
            className="input-modern pl-10"
            placeholder="Ej: Juan Perez"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-txt mb-1.5">Telefono *</label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-txt-muted" />
          <input
            type="tel"
            required
            value={telefono}
            onChange={handleTelefonoChange}
            className="input-modern pl-10"
            placeholder="Ej: 591 70000000"
          />
        </div>
      </div>
    </>
  );
};
