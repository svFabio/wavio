import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
import { OnboardingView } from '../components/OnboardingView';

export const OnboardingContainer = () => {
  const [nombre, setNombre] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || nombre.trim().length < 2) {
      setError('El nombre debe tener al menos 2 caracteres.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.configurarNegocio(nombre.trim());
      navigate('/dashboard', { replace: true });
    } catch {
      setError('Error al configurar el negocio. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <OnboardingView
      nombre={nombre}
      onNombreChange={setNombre}
      error={error}
      loading={loading}
      onSubmit={handleSubmit}
    />
  );
};
