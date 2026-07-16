import { Camera, Trash2, Loader2 } from 'lucide-react';

interface AvatarSectionProps {
  nombre: string;
  fotoPerfil?: string;
  avatarLoading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDelete: () => void;
}

export const AvatarSection = ({
  nombre,
  fotoPerfil,
  avatarLoading,
  fileInputRef,
  onFileChange,
  onDelete,
}: AvatarSectionProps) => {
  return (
    <div className="relative group mb-6">
      <div className="w-24 h-24 rounded-full overflow-hidden bg-surface-alt border-4 border-surface shadow-md flex items-center justify-center">
        {fotoPerfil && !avatarLoading ? (
          <img src={fotoPerfil} alt={nombre} className="w-full h-full object-cover" />
        ) : avatarLoading ? (
          <div className="w-full h-full bg-surface-alt flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-txt-muted animate-spin" />
          </div>
        ) : (
          <span className="text-3xl font-bold text-txt-muted select-none">
            {nombre.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {!avatarLoading && (
        <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            aria-label="Cambiar foto"
            className="p-2 bg-surface/20 hover:bg-surface/40 rounded-full text-white backdrop-blur-sm transition-colors"
          >
            <Camera size={15} />
          </button>
          {fotoPerfil && (
            <button
              onClick={onDelete}
              aria-label="Eliminar foto"
              className="p-2 bg-surface/20 hover:bg-danger/80 rounded-full text-white backdrop-blur-sm transition-colors"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileChange}
        accept="image/png, image/jpeg, image/webp"
        className="hidden"
      />
    </div>
  );
};
