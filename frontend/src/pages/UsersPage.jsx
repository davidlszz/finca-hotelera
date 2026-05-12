import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { PlusIcon, PencilIcon } from '@heroicons/react/24/outline';

const emptyForm = { nombre: '', email: '', password: '', rol: 'Recepcionista' };

export default function UsersPage() {
  const [users, setUsers]     = useState([]);
  const [modal, setModal]     = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm]       = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  const load = () => api.get('/users').then(r => setUsers(r.data)).catch(() => toast.error('Error al cargar usuarios.'));
  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(emptyForm); setEditing(null); setModal(true); };
  const openEdit   = (u)  => { setForm({ ...u, password: '' }); setEditing(u.id); setModal(true); };

  const save = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editing) {
        const { password, ...data } = form;
        await api.put(`/users/${editing}`, data);
        toast.success('Usuario actualizado.');
      } else {
        if (form.password.length < 8) { toast.error('La contraseña debe tener al menos 8 caracteres.'); setLoading(false); return; }
        await api.post('/users', form);
        toast.success('Usuario creado.');
      }
      setModal(false); load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar.');
    } finally { setLoading(false); }
  };

  const toggle = async (id) => {
    try {
      await api.patch(`/users/${id}/toggle`);
      load();
      toast.success('Estado cambiado.');
    } catch { toast.error('Error.'); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Usuarios del Sistema</h1>
        <button className="btn-primary btn-sm" onClick={openCreate}>
          <PlusIcon className="w-4 h-4" /> Nuevo Usuario
        </button>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Estado</th>
              <th className="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td className="font-medium">{u.nombre}</td>
                <td className="text-gray-500">{u.email}</td>
                <td><span className={`badge ${u.rol === 'Admin' ? 'badge-blue' : 'badge-gray'}`}>{u.rol}</span></td>
                <td><span className={`badge ${u.activo ? 'badge-green' : 'badge-red'}`}>{u.activo ? 'Activo' : 'Inactivo'}</span></td>
                <td>
                  <div className="flex gap-2 justify-end">
                    <button className="btn-secondary btn-sm" onClick={() => openEdit(u)}>
                      <PencilIcon className="w-3.5 h-3.5" />
                    </button>
                    <button className={`btn-sm ${u.activo ? 'btn-danger' : 'btn-success'}`} onClick={() => toggle(u.id)}>
                      {u.activo ? 'Desactivar' : 'Activar'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="p-6 border-b border-gray-100">
              <h2 className="section-title">{editing ? 'Editar' : 'Nuevo'} Usuario</h2>
            </div>
            <form onSubmit={save} className="p-6 space-y-4">
              <div className="form-group">
                <label className="label">Nombre completo</label>
                <input className="input" value={form.nombre} required
                  onChange={e => setForm({...form, nombre: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="label">Email</label>
                <input type="email" className="input" value={form.email} required
                  onChange={e => setForm({...form, email: e.target.value})} />
              </div>
              {!editing && (
                <div className="form-group">
                  <label className="label">Contraseña</label>
                  <input type="password" className="input" value={form.password} required
                    onChange={e => setForm({...form, password: e.target.value})}
                    placeholder="Mínimo 8 caracteres" />
                </div>
              )}
              <div className="form-group">
                <label className="label">Rol</label>
                <select className="input" value={form.rol} onChange={e => setForm({...form, rol: e.target.value})}>
                  <option>Admin</option>
                  <option>Recepcionista</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" className="btn-secondary flex-1" onClick={() => setModal(false)}>Cancelar</button>
                <button type="submit" disabled={loading} className="btn-primary flex-1">
                  {loading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
