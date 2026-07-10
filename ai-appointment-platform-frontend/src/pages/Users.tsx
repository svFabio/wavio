import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';

interface User {
    id: number;
    nombre: string;
    email: string;
    rol: 'ADMIN' | 'STAFF';
    creadoEn: string;
}

const Users = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        password: '',
        rol: 'STAFF' as 'ADMIN' | 'STAFF'
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setUsers(data);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        try {
            if (editingUser) {
                // Actualizar
                await fetch(`${import.meta.env.VITE_API_URL}/users/${editingUser.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(formData)
                });
            } else {
                // Crear
                await fetch(`${import.meta.env.VITE_API_URL}/users`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(formData)
                });
            }

            fetchUsers();
            closeModal();
        } catch (error) {
            console.error('Error saving user:', error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Estás seguro de eliminar este usuario?')) return;

        const token = localStorage.getItem('token');
        try {
            await fetch(`${import.meta.env.VITE_API_URL}/users/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
        }
    };

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
                <h1 className="text-3xl font-bold text-slate-800">Gestión de Usuarios</h1>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                    <Plus className="w-5 h-5" />
                    Nuevo Usuario
                </button>
            </div>

            {/* ── Desktop: tabla ── */}
            <div className="hidden md:block bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Nombre</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Email</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Rol</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Creado</th>
                            <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id} className="border-t border-slate-100 hover:bg-slate-50">
                                <td className="py-3 px-4 text-sm text-slate-800">{user.nombre}</td>
                                <td className="py-3 px-4 text-sm text-slate-600">{user.email}</td>
                                <td className="py-3 px-4">
                                    <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${user.rol === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                                        {user.rol}
                                    </span>
                                </td>
                                <td className="py-3 px-4 text-sm text-slate-600">
                                    {new Date(user.creadoEn).toLocaleDateString()}
                                </td>
                                <td className="py-3 px-4 text-right">
                                    <button onClick={() => openModal(user)} className="text-blue-600 hover:text-blue-800 mr-3">
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(user.id)} className="text-red-600 hover:text-red-800">
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
                    <div key={user.id} className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <p className="font-semibold text-slate-800 text-sm truncate">{user.nombre}</p>
                                <p className="text-xs text-slate-500 truncate mt-0.5">{user.email}</p>
                            </div>
                            <span className={`shrink-0 inline-block px-2 py-1 text-xs font-semibold rounded ${user.rol === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                                {user.rol}
                            </span>
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                            <p className="text-xs text-slate-400">Creado: {new Date(user.creadoEn).toLocaleDateString()}</p>
                            <div className="flex items-center gap-3">
                                <button onClick={() => openModal(user)} className="text-blue-600 hover:text-blue-800">
                                    <Pencil className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDelete(user.id)} className="text-red-600 hover:text-red-800">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-slate-800">
                                {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                            </h2>
                            <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.nombre}
                                    onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Contraseña {editingUser && '(dejar vacío para no cambiar)'}
                                </label>
                                <input
                                    type="password"
                                    required={!editingUser}
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Rol</label>
                                <select
                                    value={formData.rol}
                                    onChange={e => setFormData({ ...formData, rol: e.target.value as 'ADMIN' | 'STAFF' })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="STAFF">STAFF (Recepcionista)</option>
                                    <option value="ADMIN">ADMIN (Administrador)</option>
                                </select>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                >
                                    {editingUser ? 'Actualizar' : 'Crear'}
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
