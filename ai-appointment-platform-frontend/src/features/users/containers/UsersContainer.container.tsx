import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UsersView } from '../components/UsersView';
import { EmptyState } from '../components/EmptyState';
import { UserModal } from '../components/UserModal';
import { UsersSkeleton } from '../../../shared/components/skeletons/UsersSkeleton';
import { ErrorBoundary } from '../../../shared/components/ErrorBoundary';
import { ErrorAlert } from '../../../shared/components/ErrorAlert';
import { useAuth } from '../../../context/AuthContext';
import type { User, UserFormData } from '../types';
import { usersApi } from '../api/users.api';

const EMPTY_FORM: UserFormData = { nombre: '', email: '', password: '', rol: 'STAFF' };

export const UsersContainer = (): React.JSX.Element => {
  const queryClient = useQueryClient();
  const { usuario } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>(EMPTY_FORM);

  const {
    data: users = [],
    isLoading: loading,
    isError,
  } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => usersApi.getUsers(),
  });

  const viewerRole = (usuario?.rol ?? 'STAFF') as 'OWNER' | 'ADMIN' | 'STAFF';

  // Count ADMIN + OWNER entries for last-admin guard
  const adminCount = useMemo(
    () => users.filter((u) => u.rol === 'ADMIN' || u.rol === 'OWNER').length,
    [users],
  );

  const saveMutation = useMutation({
    mutationFn: () => {
      if (editingUser) {
        return usersApi.updateUser(editingUser.id, formData);
      }
      return usersApi.createUser(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowModal(false);
      setEditingUser(null);
      setFormData(EMPTY_FORM);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => usersApi.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const openModal = useCallback((user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        nombre: user.nombre,
        email: user.email,
        password: '',
        rol: user.rol === 'OWNER' ? 'OWNER' : user.rol,
      });
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
      if (!confirm('Are you sure you want to delete this user?')) return;
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

  if (isError) {
    return (
      <div className="mt-8">
        <ErrorAlert message="Error loading users" />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div>
        {users.length === 0 ? (
          <EmptyState description="Add a new member to the team to get started." />
        ) : (
          <UsersView
            users={users}
            viewerRole={viewerRole}
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
          viewerRole={viewerRole}
          adminCount={adminCount}
          onFormDataChange={setFormData}
          onSubmit={handleSubmit}
          onClose={closeModal}
        />
      </div>
    </ErrorBoundary>
  );
};
