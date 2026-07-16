import AdminWhatsapp from '../features/configuracion/components/AdminWhatsapp';

const Vincular = () => {
  return (
    <div>
      <div className="card-modern overflow-hidden">
        <div className="p-5 md:p-6 border-b border-border">
          <h2 className="text-lg font-bold text-txt">Conexion WhatsApp</h2>
          <p className="text-sm text-txt-muted mt-1">
            Vincula tu cuenta de Meta para recibir mensajes
          </p>
        </div>
        <div className="p-4 md:p-6">
          <AdminWhatsapp />
        </div>
      </div>
    </div>
  );
};

export default Vincular;
