import { useState, useRef, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { AvatarSection } from './AvatarSection';
import { NameEditSection } from './NameEditSection';

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
  const modalRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (usuario?.nombre) setNombreValue(usuario.nombre);
  }, [usuario?.nombre]);

  useEffect(() => {
    if (editingNombre) nombreInputRef.current?.focus();
  }, [editingNombre]);

  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement as HTMLElement;
      const timer = setTimeout(() => {
        const modal = modalRef.current;
        if (modal) {
          const focusable = modal.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
          );
          if (focusable.length > 0) focusable[0].focus();
        }
      }, 50);
      return () => clearTimeout(timer);
    } else if (triggerRef.current) {
      triggerRef.current.focus();
      triggerRef.current = null;
    }
  }, [isOpen]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    },
    [onClose],
  );

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
        setFotoPerfil(res.url);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error al subir la imagen');
      } finally {
        setAvatarLoading(false);
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al eliminar la foto');
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al actualizar el nombre');
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
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="Personalizar perfil"
        onKeyDown={handleKeyDown}
        className="bg-surface rounded-2xl shadow-xl w-full max-w-sm overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-light">
          <h3 className="font-semibold text-txt">Personalizar Perfil</h3>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="p-1 rounded-full hover:bg-surface-alt text-txt-muted transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          <div className="flex flex-col items-center">
            <AvatarSection
              nombre={usuario.nombre}
              fotoPerfil={usuario.fotoPerfil}
              avatarLoading={avatarLoading}
              fileInputRef={fileInputRef}
              onFileChange={handleFileChange}
              onDelete={handleDelete}
            />

            {error && (
              <div className="w-full p-3 mb-4 text-sm text-danger bg-danger-light rounded-xl border border-danger/10">
                {error}
              </div>
            )}

            <div className="w-full space-y-4">
              <NameEditSection
                nombre={usuario.nombre}
                editingNombre={editingNombre}
                setEditingNombre={setEditingNombre}
                nombreValue={nombreValue}
                setNombreValue={setNombreValue}
                nombreLoading={nombreLoading}
                onSave={handleSaveNombre}
                nombreInputRef={nombreInputRef}
                onKeyDown={handleNombreKeyDown}
              />

              <div>
                <label className="text-xs font-semibold text-txt-muted uppercase tracking-wider">
                  Correo
                </label>
                <div className="mt-1 p-2.5 bg-surface-alt border border-border rounded-xl text-sm text-txt-muted select-all">
                  {usuario.email}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-txt-muted uppercase tracking-wider">
                  Rol
                </label>
                <div className="mt-1">
                  <span className="badge badge-primary">{usuario.rol}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
