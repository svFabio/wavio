import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { UsersView } from '../components/UsersView';
import { EmptyState } from '../components/EmptyState';
import { UserModal } from '../components/UserModal';
import { UsersSkeleton } from '../../../shared/components/skeletons/UsersSkeleton';
import type { User, UserFormData } from '../types';

const EMPTY_FORM: UserFormData = { nombre: '', email: '', password: '', rol: 'STAFF' };

export const UsersContainer = () => {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>(EMPTY_FORM);

  const { data: users = [], isLoading: loading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => api.getUsers(),
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      if (editingUser) {
        return api.updateUser(editingUser.id, formData);
      }
      return api.createUser(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowModal(false);
      setEditingUser(null);
      setFormData(EMPTY_FORM);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const openModal = useCallback((user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({ nombre: user.nombre, email: user.email, password: '', rol: user.rol });
    } else {
      setEditingUser(null);
      setFormData(EMPTY_FORM);
    }
    setShowModal(true);
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setEditingUser(null);
    setFormData(EMPTY_FORM);
  }, []);

  const handleDelete = useCallback(
    (id: number) => {
      if (!confirm('¿Estás seguro de eliminar este usuario?')) return;
      deleteMutation.mutate(id);
    },
    [deleteMutation],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      saveMutation.mutate();
    },
    [saveMutation],
  );

  if (loading) {
    return <UsersSkeleton />;
  }

  return (
    <div>
      {users.length === 0 ? (
        <EmptyState />
      ) : (
        <UsersView
          users={users}
          onOpenModal={() => openModal()}
          onEdit={openModal}
          onDelete={handleDelete}
        />
      )}

      <UserModal
        isOpen={showModal}
        editingUser={editingUser}
        formData={formData}
        isSaving={saveMutation.isPending}
        onFormDataChange={setFormData}
        onSubmit={handleSubmit}
        onClose={closeModal}
      />
    </div>
  );
};
