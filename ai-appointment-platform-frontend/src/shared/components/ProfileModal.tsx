import { useReducer, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useModalAccessibility } from '../hooks/useModalAccessibility';
import { api } from '../../lib/api';
import { AvatarSection } from './AvatarSection';
import { NameEditSection } from './NameEditSection';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ProfileModalState {
  avatarLoading: boolean;
  nombreLoading: boolean;
  error: string | null;
  editingNombre: boolean;
  nombreValue: string;
}

type ProfileModalAction =
  | { type: 'SET_AVATAR_LOADING'; payload: boolean }
  | { type: 'SET_NOMBRE_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_EDITING_NOMBRE'; payload: boolean }
  | { type: 'SET_NOMBRE_VALUE'; payload: string }
  | { type: 'RESET_NOMBRE'; payload: string };

const profileReducer = (
  state: ProfileModalState,
  action: ProfileModalAction,
): ProfileModalState => {
  switch (action.type) {
    case 'SET_AVATAR_LOADING':
      return { ...state, avatarLoading: action.payload };
    case 'SET_NOMBRE_LOADING':
      return { ...state, nombreLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_EDITING_NOMBRE':
      return { ...state, editingNombre: action.payload };
    case 'SET_NOMBRE_VALUE':
      return { ...state, nombreValue: action.payload };
    case 'RESET_NOMBRE':
      return { ...state, editingNombre: false, nombreValue: action.payload };
    default:
      return state;
  }
};

export const ProfileModal = ({ isOpen, onClose }: ProfileModalProps) => {
  const { usuario, setFotoPerfil, setNombre } = useAuth();

  const [state, dispatch] = useReducer(profileReducer, {
    avatarLoading: false,
    nombreLoading: false,
    error: null,
    editingNombre: false,
    nombreValue: usuario?.nombre ?? '',
  });

  const { avatarLoading, nombreLoading, error, editingNombre, nombreValue } = state;

  const nombreInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (editingNombre) nombreInputRef.current?.focus();
  }, [editingNombre]);

  const { handleKeyDown } = useModalAccessibility({
    isOpen,
    onClose,
    modalRef,
    triggerRef,
  });

  if (!isOpen || !usuario) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      dispatch({ type: 'SET_ERROR', payload: 'La imagen no debe superar los 3MB' });
      return;
    }

    dispatch({ type: 'SET_AVATAR_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        const result = reader.result;
        if (typeof result !== 'string') throw new Error('Error al procesar la imagen');
        const res = await api.updateAvatar(result);
        setFotoPerfil(res.url);
      } catch (err: unknown) {
        dispatch({
          type: 'SET_ERROR',
          payload: err instanceof Error ? err.message : 'Error al subir la imagen',
        });
      } finally {
        dispatch({ type: 'SET_AVATAR_LOADING', payload: false });
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.onerror = () => {
      dispatch({ type: 'SET_ERROR', payload: 'Error al leer el archivo' });
      dispatch({ type: 'SET_AVATAR_LOADING', payload: false });
    };
  };

  const handleDelete = async () => {
    dispatch({ type: 'SET_AVATAR_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    try {
      await api.deleteAvatar();
      setFotoPerfil(null);
    } catch (err: unknown) {
      dispatch({
        type: 'SET_ERROR',
        payload: err instanceof Error ? err.message : 'Error al eliminar la foto',
      });
    } finally {
      dispatch({ type: 'SET_AVATAR_LOADING', payload: false });
    }
  };

  const handleSaveNombre = async () => {
    const trimmed = nombreValue.trim();
    if (!trimmed || trimmed === usuario.nombre) {
      dispatch({ type: 'SET_EDITING_NOMBRE', payload: false });
      return;
    }
    dispatch({ type: 'SET_NOMBRE_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    try {
      const res = await api.updateNombre(trimmed);
      setNombre(res.nombre);
      dispatch({ type: 'SET_EDITING_NOMBRE', payload: false });
    } catch (err: unknown) {
      dispatch({
        type: 'SET_ERROR',
        payload: err instanceof Error ? err.message : 'Error al actualizar el nombre',
      });
    } finally {
      dispatch({ type: 'SET_NOMBRE_LOADING', payload: false });
    }
  };

  const handleNombreKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveNombre();
    if (e.key === 'Escape') {
      dispatch({ type: 'RESET_NOMBRE', payload: usuario.nombre });
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
                setEditingNombre={(v) => dispatch({ type: 'SET_EDITING_NOMBRE', payload: v })}
                nombreValue={nombreValue}
                setNombreValue={(v) => dispatch({ type: 'SET_NOMBRE_VALUE', payload: v })}
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
