import AdminWhatsapp from '../components/AdminWhatsapp';

const Vincular = () => {
  return (
    <div className="min-h-screen bg-surface-alt">
      <div className="bg-surface border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-txt">Configuracion del Sistema</h1>
              <p className="text-sm text-txt-secondary mt-1">Gestiona la conexion de WhatsApp</p>
            </div>
            <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-success-light text-success rounded-lg text-sm font-medium">
              <span className="w-2 h-2 bg-success rounded-full"></span>
              Conexion WhatsApp
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-surface rounded-xl shadow-lg border border-border overflow-hidden">
          <AdminWhatsapp />
        </div>
      </div>
    </div>
  );
};

export default Vincular;
