// src/pages/Vincular.tsx
import AdminWhatsapp from '../components/AdminWhatsapp'; // Importamos el componente

const Vincular = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-800">Configuración del Sistema</h1>
              <p className="text-sm text-gray-600 mt-1">Gestiona la conexión de WhatsApp</p>
            </div>
            <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-kenyan-copper-50 text-kenyan-copper-700 rounded-lg text-sm font-medium">
              <span className="w-2 h-2 bg-kenyan-copper-500 rounded-full"></span>
              Conexión WhatsApp
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <AdminWhatsapp />
        </div>
      </div>
    </div>
  );
};

export default Vincular;