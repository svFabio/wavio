import { useState, useRef, useEffect } from 'react';
import { X, Trash2, Camera, Check, Loader2, Pencil } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal = ({ isOpen, onClose }: ProfileModalProps) => {
  const { usuario, setFotoPerfil, setNombre } = useAuth();

  const [avatarLoading, setAvatarLoading] = useState(false);
  const [nombreLoading, setNombreLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingNombre, setEditingNombre] = useState(false);
  const [nombreValue, setNombreValue] = useState(usuario?.nombre ?? '');
  const nombreInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync nombre if user changes externally
  useEffect(() => {
    if (usuario?.nombre) setNombreValue(usuario.nombre);
  }, [usuario?.nombre]);

  // Focus input when editing starts
  useEffect(() => {
    if (editingNombre) nombreInputRef.current?.focus();
  }, [editingNombre]);

  if (!isOpen || !usuario) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      setError('La imagen no debe superar los 3MB');
      return;
    }

    setAvatarLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const res = await api.updateAvatar(base64);
        setFotoPerfil(res.fotoPerfil);
      } catch (err: any) {
        setError(err.message || 'Error al subir la imagen');
      } finally {
        setAvatarLoading(false);
        // Reset input so same file can be selected again
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.onerror = () => {
      setError('Error al leer el archivo');
      setAvatarLoading(false);
    };
  };

  const handleDelete = async () => {
    setAvatarLoading(true);
    setError(null);
    try {
      await api.deleteAvatar();
      setFotoPerfil(null);
    } catch (err: any) {
      setError(err.message || 'Error al eliminar la foto');
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleSaveNombre = async () => {
    const trimmed = nombreValue.trim();
    if (!trimmed || trimmed === usuario.nombre) {
      setEditingNombre(false);
      return;
    }
    setNombreLoading(true);
    setError(null);
    try {
      const res = await api.updateNombre(trimmed);
      setNombre(res.nombre);
      setEditingNombre(false);
    } catch (err: any) {
      setError(err.message || 'Error al actualizar el nombre');
    } finally {
      setNombreLoading(false);
    }
  };

  const handleNombreKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveNombre();
    if (e.key === 'Escape') {
      setNombreValue(usuario.nombre);
      setEditingNombre(false);
    }
  };

  return (
    <div className="fixed inset-0 z-overlay flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-light">
          <h3 className="font-semibold text-txt">Personalizar Perfil</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-surface-alt text-txt-muted transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          <div className="flex flex-col items-center">

            {/* Avatar with loading overlay */}
            <div className="relative group mb-6">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-surface-alt border-4 border-white shadow-md flex items-center justify-center">
                {usuario.fotoPerfil && !avatarLoading ? (
                  <img
                    src={usuario.fotoPerfil}
                    alt={usuario.nombre}
                    className="w-full h-full object-cover"
                  />
                ) : avatarLoading ? (
                  // Loading spinner overlay
                  <div className="w-full h-full bg-surface-alt flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-txt-muted animate-spin" />
                  </div>
                ) : (
                  <span className="text-3xl font-bold text-txt-muted select-none">
                    {usuario.nombre.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              {/* Hover overlay — only when not loading */}
              {!avatarLoading && (
                <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-sm transition-colors"
                    title="Cambiar foto"
                  >
                    <Camera size={15} />
                  </button>
                  {usuario.fotoPerfil && (
                    <button
                      onClick={handleDelete}
                      className="p-2 bg-white/20 hover:bg-danger/80 rounded-full text-white backdrop-blur-sm transition-colors"
                      title="Eliminar foto"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              )}

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/png, image/jpeg, image/webp"
                className="hidden"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="w-full p-3 mb-4 text-sm text-danger bg-danger-light rounded-xl border border-danger/10">
                {error}
              </div>
            )}

            {/* Fields */}
            <div className="w-full space-y-4">

              {/* Nombre — editable */}
              <div>
                <label className="text-xs font-semibold text-txt-muted uppercase tracking-wider">
                  Nombre
                </label>
                <div className="mt-1 flex items-center gap-1.5">
                  {editingNombre ? (
                    <>
                      <input
                        ref={nombreInputRef}
                        value={nombreValue}
                        onChange={e => setNombreValue(e.target.value)}
                        onKeyDown={handleNombreKeyDown}
                        disabled={nombreLoading}
                        className="flex-1 px-3 py-2 text-sm border border-primary/60 rounded-xl outline-none ring-2 ring-primary/20 text-txt disabled:opacity-60"
                      />
                      <button
                        onClick={handleSaveNombre}
                        disabled={nombreLoading}
                        className="p-2 rounded-xl bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-60 flex-shrink-0"
                        title="Guardar"
                      >
                        {nombreLoading
                          ? <Loader2 size={15} className="animate-spin" />
                          : <Check size={15} />
                        }
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="flex-1 p-2.5 bg-surface-alt border border-border rounded-xl text-sm text-txt">
                        {usuario.nombre}
                      </div>
                      <button
                        onClick={() => setEditingNombre(true)}
                        className="p-2 rounded-xl text-txt-muted hover:text-txt hover:bg-surface-alt transition-colors flex-shrink-0"
                        title="Editar nombre"
                      >
                        <Pencil size={15} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Correo — readonly */}
              <div>
                <label className="text-xs font-semibold text-txt-muted uppercase tracking-wider">
                  Correo
                </label>
                <div className="mt-1 p-2.5 bg-surface-alt border border-border rounded-xl text-sm text-txt-muted select-all">
                  {usuario.email}
                </div>
              </div>

              {/* Rol */}
              <div>
                <label className="text-xs font-semibold text-txt-muted uppercase tracking-wider">
                  Rol
                </label>
                <div className="mt-1">
                  <span className="badge badge-primary">
                    {usuario.rol}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
