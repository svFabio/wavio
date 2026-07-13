import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { api } from '../services/api';
import { Loader2 } from 'lucide-react';

interface User {
    id: number;
    nombre: string;
    email: string;
    rol: 'ADMIN' | 'STAFF';
    creadoEn: string;
}

const Users = () => {
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        password: '',
        rol: 'STAFF' as 'ADMIN' | 'STAFF'
    });
    const queryClient = useQueryClient();

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
            closeModal();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => api.deleteUser(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
    });

    const openModal = (user?: User) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                nombre: user.nombre,
                email: user.email,
                password: '',
                rol: user.rol
            });
        } else {
            setEditingUser(null);
            setFormData({ nombre: '', email: '', password: '', rol: 'STAFF' });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingUser(null);
        setFormData({ nombre: '', email: '', password: '', rol: 'STAFF' });
    };

    const handleDelete = (id: number) => {
        if (!confirm('¿Estás seguro de eliminar este usuario?')) return;
        deleteMutation.mutate(id);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        saveMutation.mutate();
    };

    if (loading) {
        return (
            <div className="p-6 space-y-4">
                <div className="flex justify-between items-center mb-6">
                    <div className="skeleton h-8 w-48 rounded" />
                    <div className="skeleton h-10 w-36 rounded-xl" />
                </div>
                <div className="card-modern overflow-hidden">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4 p-4 border-b border-border last:border-0">
                            <div className="skeleton w-10 h-10 rounded-full shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="skeleton h-3.5 w-2/5 rounded" />
                                <div className="skeleton h-2.5 w-3/5 rounded" />
                            </div>
                            <div className="skeleton h-6 w-16 rounded-full" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-txt">Gestion de Usuarios</h1>
                <button
                    onClick={() => openModal()}
                    className="btn-primary"
                >
                    <Plus className="w-5 h-5" />
                    Nuevo Usuario
                </button>
            </div>

            {/* ── Desktop: tabla ── */}
            <div className="hidden md:block card-modern overflow-hidden">
                <table className="w-full">
                    <thead className="bg-surface-elevated/50">
                        <tr>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-txt">Nombre</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-txt">Email</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-txt">Rol</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-txt">Creado</th>
                            <th className="text-right py-3 px-4 text-sm font-semibold text-txt">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id} className="border-t border-border-light hover:bg-surface-alt/50">
                                <td className="py-3 px-4 text-sm text-txt">{user.nombre}</td>
                                <td className="py-3 px-4 text-sm text-txt-secondary">{user.email}</td>
                                <td className="py-3 px-4">
                                    <span className={`badge ${user.rol === 'ADMIN' ? 'badge-primary' : 'badge-info'}`}>
                                        {user.rol}
                                    </span>
                                </td>
                                <td className="py-3 px-4 text-sm text-txt-secondary">
                                    {new Date(user.creadoEn).toLocaleDateString()}
                                </td>
                                <td className="py-3 px-4 text-right">
                                    <button onClick={() => openModal(user)} className="text-primary hover:text-primary-dark mr-3">
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(user.id)} className="text-danger hover:text-danger/80">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ── Mobile: cards ── */}
            <div className="md:hidden space-y-3">
                {users.map(user => (
                    <div key={user.id} className="card-modern p-4">
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <p className="font-semibold text-txt text-sm truncate">{user.nombre}</p>
                                <p className="text-xs text-txt-muted truncate mt-0.5">{user.email}</p>
                            </div>
                            <span className={`shrink-0 badge ${user.rol === 'ADMIN' ? 'badge-primary' : 'badge-info'}`}>
                                {user.rol}
                            </span>
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border-light">
                            <p className="text-xs text-txt-muted">Creado: {new Date(user.creadoEn).toLocaleDateString()}</p>
                            <div className="flex items-center gap-3">
                                <button onClick={() => openModal(user)} className="text-primary hover:text-primary-dark">
                                    <Pencil className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDelete(user.id)} className="text-danger hover:text-danger/80">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-modal">
                    <div className="bg-surface rounded-lg p-6 w-full max-w-md shadow-xl">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-txt">
                                {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                            </h2>
                            <button onClick={closeModal} className="text-txt-muted hover:text-txt">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-txt mb-1">Nombre</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.nombre}
                                    onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                                    className="input-modern"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-txt mb-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="input-modern"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-txt mb-1">
                                    Contraseña {editingUser && '(dejar vacio para no cambiar)'}
                                </label>
                                <input
                                    type="password"
                                    required={!editingUser}
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    className="input-modern"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-txt mb-1">Rol</label>
                                <select
                                    value={formData.rol}
                                    onChange={e => setFormData({ ...formData, rol: e.target.value as 'ADMIN' | 'STAFF' })}
                                    className="input-modern"
                                >
                                    <option value="STAFF">STAFF (Recepcionista)</option>
                                    <option value="ADMIN">ADMIN (Administrador)</option>
                                </select>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="btn-secondary flex-1"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saveMutation.isPending}
                                    className="btn-primary flex-1"
                                >
                                    {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : editingUser ? 'Actualizar' : 'Crear'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;
