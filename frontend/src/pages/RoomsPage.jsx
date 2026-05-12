import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const ESTADOS = ['Disponible', 'Ocupada', 'Mantenimiento'];
const TIPOS   = ['Individual', 'Doble', 'Suite', 'Cabaña', 'Familiar'];

const estadoBadge = (e) => ({
  Disponible:   'badge-green',
  Ocupada:      'badge-red',
  Mantenimiento:'badge-yellow',
}[e] || 'badge-gray');

const formatCOP = (n) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n);

const emptyForm = { numero: '', tipo: 'Doble', capacidad: 2, precio_noche: '', estado: 'Disponible', descripcion: '' };

export default function RoomsPage() {
  const [rooms, setRooms]       = useState([]);
  const [filtro, setFiltro]     = useState('');
  const [modal, setModal]       = useState(false);
  const [editing, setEditing]   = useState(null);
  const [form, setForm]         = useState(emptyForm);
  const [loading, setLoading]   = useState(false);
  const { isAdmin }             = useAuth();

  const load = () => api.get('/rooms').then(r => setRooms(r.data)).catch(() => toast.error('Error al cargar habitaciones.'));
  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(emptyForm); setEditing(null); setModal(true); };
  const openEdit   = (r)  => { setForm(r); setEditing(r.id); setModal(true); };

  const save = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editing) {
        await api.put(`/rooms/${editing}`, form);
        toast.success('Habitación actualizada.');
      } else {
        await api.post('/rooms', form);
        toast.success('Habitación creada.');
      }
      setModal(false); load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar.');
    } finally { setLoading(false); }
  };

  const remove = async (id) => {
    if (!confirm('¿Eliminar habitación?')) return;
    try {
      await api.delete(`/rooms/${id}`);
      toast.success('Habitación eliminada.');
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error al eliminar.'); }
  };

  const visible = rooms.filter(r =>
    r.numero.toLowerCase().includes(filtro.toLowerCase()) ||
    r.tipo.toLowerCase().includes(filtro.toLowerCase()) ||
    r.estado.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Habitaciones</h1>
        {isAdmin && (
          <button className="btn-primary btn-sm" onClick={openCreate}>
            <PlusIcon className="w-4 h-4" /> Nueva Habitación
          </button>
        )}
      </div>

      {/* Filtros rápidos */}
      <div className="flex flex-wrap gap-3">
        <input className="input max-w-xs" placeholder="Buscar..." value={filtro} onChange={e => setFiltro(e.target.value)} />
        {['', ...ESTADOS].map(e => (
          <button key={e} onClick={() => setFiltro(e)}
            className={`btn btn-sm ${filtro === e ? 'btn-primary' : 'btn-secondary'}`}>
            {e || 'Todas'}
          </button>
        ))}
      </div>

      {/* Grid de habitaciones */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {visible.map(r => (
          <div key={r.id} className="card-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-bold text-lg text-finca-dark">#{r.numero}</p>
                <p className="text-sm text-gray-500">{r.tipo}</p>
              </div>
              <span className={`badge ${estadoBadge(r.estado)}`}>{r.estado}</span>
            </div>
            <div className="space-y-1 text-sm text-gray-600">
              <p>👥 Capacidad: <strong>{r.capacidad}</strong> personas</p>
              <p>💰 {formatCOP(r.precio_noche)} / noche</p>
              {r.descripcion && <p className="text-xs text-gray-400 line-clamp-2 mt-1">{r.descripcion}</p>}
            </div>
            {isAdmin && (
              <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                <button className="btn-secondary btn-sm flex-1" onClick={() => openEdit(r)}>
                  <PencilIcon className="w-3.5 h-3.5" /> Editar
                </button>
                <button className="btn-danger btn-sm" onClick={() => remove(r.id)}>
                  <TrashIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="p-6 border-b border-gray-100">
              <h2 className="section-title">{editing ? 'Editar' : 'Nueva'} Habitación</h2>
            </div>
            <form onSubmit={save} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="label">Número</label>
                  <input className="input" value={form.numero} onChange={e => setForm({...form, numero: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="label">Tipo</label>
                  <select className="input" value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})}>
                    {TIPOS.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="label">Capacidad</label>
                  <input type="number" className="input" min="1" max="20" value={form.capacidad}
                    onChange={e => setForm({...form, capacidad: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="label">Precio / Noche (COP)</label>
                  <input type="number" className="input" min="0" value={form.precio_noche}
                    onChange={e => setForm({...form, precio_noche: e.target.value})} required />
                </div>
              </div>
              <div className="form-group">
                <label className="label">Estado</label>
                <select className="input" value={form.estado} onChange={e => setForm({...form, estado: e.target.value})}>
                  {ESTADOS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="label">Descripción</label>
                <textarea className="input" rows="2" value={form.descripcion || ''}
                  onChange={e => setForm({...form, descripcion: e.target.value})} />
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
