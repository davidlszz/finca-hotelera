import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const TIPOS_DOC = ['CC', 'CE', 'Pasaporte', 'TI', 'NIT'];
const emptyForm  = { tipo_documento: 'CC', numero_documento: '', nombres: '', apellidos: '', email: '', telefono: '', ciudad: '' };

export default function ClientsPage() {
  const [clients, setClients]   = useState([]);
  const [search, setSearch]     = useState('');
  const [modal, setModal]       = useState(false);
  const [editing, setEditing]   = useState(null);
  const [form, setForm]         = useState(emptyForm);
  const [loading, setLoading]   = useState(false);
  const { isAdmin }             = useAuth();

  const load = (q = '') => api.get('/clients', { params: { search: q } })
    .then(r => setClients(r.data)).catch(() => toast.error('Error al cargar clientes.'));

  useEffect(() => { load(); }, []);

  const handleSearch = (e) => { setSearch(e.target.value); load(e.target.value); };

  const openCreate = () => { setForm(emptyForm); setEditing(null); setModal(true); };
  const openEdit   = (c)  => { setForm(c); setEditing(c.id); setModal(true); };

  const save = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editing) {
        await api.put(`/clients/${editing}`, form);
        toast.success('Cliente actualizado.');
      } else {
        await api.post('/clients', form);
        toast.success('Cliente registrado.');
      }
      setModal(false); load(search);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar cliente.');
    } finally { setLoading(false); }
  };

  const remove = async (id) => {
    if (!confirm('¿Eliminar cliente? Esta acción no se puede deshacer.')) return;
    try {
      await api.delete(`/clients/${id}`);
      toast.success('Cliente eliminado.');
      load(search);
    } catch (err) { toast.error(err.response?.data?.error || 'Error al eliminar.'); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Clientes</h1>
        <button className="btn-primary btn-sm" onClick={openCreate}>
          <PlusIcon className="w-4 h-4" /> Nuevo Cliente
        </button>
      </div>

      {/* Búsqueda */}
      <div className="relative max-w-sm">
        <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input className="input pl-9" placeholder="Buscar por nombre, documento o email..."
          value={search} onChange={handleSearch} />
      </div>

      {/* Tabla */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Documento</th>
              <th>Nombre</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>Ciudad</th>
              <th className="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clients.length === 0 && (
              <tr><td colSpan="6" className="text-center text-gray-400 py-8">No se encontraron clientes.</td></tr>
            )}
            {clients.map(c => (
              <tr key={c.id}>
                <td>
                  <span className="badge badge-gray mr-1">{c.tipo_documento}</span>
                  {c.numero_documento}
                </td>
                <td className="font-medium">{c.nombres} {c.apellidos}</td>
                <td className="text-gray-500">{c.email || '—'}</td>
                <td className="text-gray-500">{c.telefono || '—'}</td>
                <td className="text-gray-500">{c.ciudad || '—'}</td>
                <td>
                  <div className="flex gap-2 justify-end">
                    <button className="btn-secondary btn-sm" onClick={() => openEdit(c)}>
                      <PencilIcon className="w-3.5 h-3.5" />
                    </button>
                    {isAdmin && (
                      <button className="btn-danger btn-sm" onClick={() => remove(c.id)}>
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
            <div className="p-6 border-b border-gray-100">
              <h2 className="section-title">{editing ? 'Editar' : 'Registrar'} Cliente</h2>
            </div>
            <form onSubmit={save} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="label">Tipo Documento</label>
                  <select className="input" value={form.tipo_documento}
                    onChange={e => setForm({...form, tipo_documento: e.target.value})}>
                    {TIPOS_DOC.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="label">N° Documento</label>
                  <input className="input" value={form.numero_documento}
                    onChange={e => setForm({...form, numero_documento: e.target.value})} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="label">Nombres</label>
                  <input className="input" value={form.nombres}
                    onChange={e => setForm({...form, nombres: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="label">Apellidos</label>
                  <input className="input" value={form.apellidos}
                    onChange={e => setForm({...form, apellidos: e.target.value})} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="label">Email</label>
                  <input type="email" className="input" value={form.email || ''}
                    onChange={e => setForm({...form, email: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="label">Teléfono</label>
                  <input className="input" value={form.telefono || ''}
                    onChange={e => setForm({...form, telefono: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label className="label">Ciudad</label>
                <input className="input" value={form.ciudad || ''}
                  onChange={e => setForm({...form, ciudad: e.target.value})} />
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
