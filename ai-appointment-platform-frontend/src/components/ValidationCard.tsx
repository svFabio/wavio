import type { Cita } from '../types'; // Asegúrate de que esta ruta sea correcta
import { Check, X } from 'lucide-react';

interface Props {
  cita: Cita;
  onAction: (id: string, action: 'APROBAR' | 'RECHAZAR') => void;
}

// IMPORTANTE: Usamos "export const" para que coincida con el import { ValidationCard }
export const ValidationCard = ({ cita, onAction }: Props) => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-6 transition-all hover:shadow-xl">

      {/* Encabezado de la tarjeta */}
      <div className="bg-gray-50 p-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
          <div>
            <h3 className="font-bold text-gray-800 text-lg md:text-xl">{cita.clienteNombre}</h3>
            <p className="text-sm text-gray-600 font-medium mt-1">Teléfono: {cita.clienteTelefono}</p>
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            {cita.estado}
          </span>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Columna Izquierda: Información y Botones */}
          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Fecha Solicitada</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm md:text-base">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <span className="text-gray-600 font-medium">Fecha:</span>
                  <span className="ml-2 font-semibold">{cita.fecha}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <span className="text-gray-600 font-medium">Hora:</span>
                  <span className="ml-2 font-semibold">{cita.horario}</span>
                </div>
              </div>
            </div>

            {/* Botones - responsive */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => onAction(cita.id, 'RECHAZAR')}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 border-red-100 text-red-600 font-bold hover:bg-red-50 hover:border-red-200 transition-colors active:scale-95"
              >
                <X size={18} /> Rechazar
              </button>
              <button
                onClick={() => onAction(cita.id, 'APROBAR')}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700 shadow-lg shadow-green-200 transition-all active:scale-95"
              >
                <Check size={18} /> Validar
              </button>
            </div>
          </div>

          {/* Columna Derecha: Imagen del Comprobante */}
          <div className="bg-gray-100 rounded-lg flex items-center justify-center min-h-[200px] border-2 border-dashed border-gray-300 relative overflow-hidden group">
            {cita.comprobanteUrl ? (
              <a
                href={cita.comprobanteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-full block cursor-zoom-in"
                title="Clic para ver en grande"
              >
                <img
                  src={cita.comprobanteUrl}
                  alt="Comprobante de pago"
                  className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm transition-opacity font-medium">
                    Ver imagen completa
                  </span>
                </div>
              </a>
            ) : (
              <div className="text-center p-6">
                <div className="text-4xl mb-2">📄</div>
                <p className="text-gray-500 text-sm font-medium">Sin imagen cargada</p>
                <p className="text-gray-400 text-xs mt-1">(El usuario no subió comprobante)</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};