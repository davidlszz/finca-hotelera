import { useEffect, useState, useRef } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  PlusIcon, PencilIcon, TrashIcon, EllipsisVerticalIcon,
  UsersIcon, WrenchScrewdriverIcon, CalendarDaysIcon, PhotoIcon
} from '@heroicons/react/24/outline';

const ESTADOS = ['Disponible', 'Ocupada', 'Mantenimiento'];
const TIPOS   = ['Individual', 'Doble', 'Suite', 'Cabaña', 'Familiar'];

const imagenDefault = (tipo) => {
  const map = {
    'Cabaña':    'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=400&q=80',
    'Suite':     'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&q=80',
    'Doble':     'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80',
    'Familiar':  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400&q=80',
    'Individual':'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=400&q=80',
  };
  return map[tipo] || map['Doble'];
};

const estadoConfig = (e) => ({
  Disponible:    { cls: 'bg-green-500',  dot: 'bg-green-400' },
  Ocupada:       { cls: 'bg-red-500',    dot: 'bg-red-400'   },
  Mantenimiento: { cls: 'bg-yellow-500', dot: 'bg-yellow-400'},
}[e] || { cls: 'bg-gray-400', dot: 'bg-gray-300' });

const formatCOP = (n) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n);

const emptyForm = { numero: '', tipo: 'Doble', capacidad: 2, precio_noche: '', estado: 'Disponible', descripcion: '', imagen: '' };

export default function RoomsPage() {
  const [rooms, setRooms]       = useState([]);
  const [filtro, setFiltro]     = useState('');
  const [modal, setModal]       = useState(false);
  const [editing, setEditing]   = useState(null);
  const [form, setForm]         = useState(emptyForm);
  const [loading, setLoading]   = useState(false);
  const [menuOpen, setMenuOpen] = useState(null);
  const [preview, setPreview]   = useState('');
  const fileRef                 = useRef();
  const { isAdmin }             = useAuth();

  const load = () => api.get('/rooms').then(r => setRooms(r.data)).catch(() => toast.error('Error al cargar habitaciones.'));
  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setForm(emptyForm); setEditing(null); setPreview(''); setModal(true);
  };
  const openEdit = (r) => {
    setForm(r); setEditing(r.id); setPreview(r.imagen || ''); setModal(true); setMenuOpen(null);
  };

  // Convierte imagen a base64
  const handleImagen = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { toast.error('La imagen no debe superar 3MB.'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreview(ev.target.result);
      setForm(f => ({ ...f, imagen: ev.target.result }));
    };
    reader.readAsDataURL(file);
  };

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
      load(); setMenuOpen(null);
    } catch (err) { toast.error(err.response?.data?.error || 'Error al eliminar.'); }
  };

  const marcarLimpieza = (r) => {
    toast.success(`Habitación #${r.numero} marcada para limpieza.`);
    setMenuOpen(null);
  };

  const visible = rooms.filter(r =>
    r.numero.toLowerCase().includes(filtro.toLowerCase()) ||
    r.tipo.toLowerCase().includes(filtro.toLowerCase()) ||
    r.estado.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div className="space-y-5" onClick={() => setMenuOpen(null)}>
      <div className="flex items-center justify-between">
        <h1 className="page-title">Habitaciones</h1>
        {isAdmin && (
          <button className="btn-primary btn-sm" onClick={openCreate}>
            <PlusIcon className="w-4 h-4" /> Nueva Habitación
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <input className="input max-w-xs" placeholder="Buscar..." value={filtro} onChange={e => setFiltro(e.target.value)} />
        {['', ...ESTADOS].map(e => (
          <button key={e} onClick={() => setFiltro(e)}
            className={`btn btn-sm ${filtro === e ? 'btn-primary' : 'btn-secondary'}`}>
            {e || 'Todas'}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {visible.map(r => {
          const cfg = estadoConfig(r.estado);
          const imgSrc = r.imagen || imagenDefault(r.tipo);
          return (
            <div key={r.id} className="bg-white rounded-2xl shadow hover:shadow-lg transition-shadow overflow-hidden border border-gray-100">
              <div className="relative h-44 overflow-hidden">
                <img src={imgSrc} alt={r.tipo} className="w-full h-full object-cover" />
                <span className={`absolute top-3 left-3 flex items-center gap-1.5 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow ${cfg.cls}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} animate-pulse`}/>{r.estado}
                </span>
                <span className="absolute bottom-3 right-3 bg-black/70 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                  {formatCOP(r.precio_noche)}/noche
                </span>
                {isAdmin && (
                  <div className="absolute top-3 right-3" onClick={e => e.stopPropagation()}>
                    <button className="bg-white/80 hover:bg-white rounded-full p-1 shadow"
                      onClick={() => setMenuOpen(menuOpen === r.id ? null : r.id)}>
                      <EllipsisVerticalIcon className="w-5 h-5 text-gray-700" />
                    </button>
                    {menuOpen === r.id && (
                      <div className="absolute right-0 mt-1 w-36 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-10">
                        <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                          onClick={() => openEdit(r)}>
                          <PencilIcon className="w-4 h-4 text-gray-500" /> Editar
                        </button>
                        <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
                          onClick={() => remove(r.id)}>
                          <TrashIcon className="w-4 h-4" /> Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-bold text-gray-900 text-base mb-1">{r.numero}</h3>
                <p className="text-sm text-gray-500 flex items-center gap-1 mb-1">
                  <UsersIcon className="w-4 h-4" />{r.tipo} • Cap. {r.capacidad} pers.
                </p>
                {r.descripcion && <p className="text-xs text-gray-400 line-clamp-2 mb-3">{r.descripcion}</p>}
                <div className="flex gap-2 mt-3">
                  <button className="flex-1 flex items-center justify-center gap-1.5 text-sm font-medium border border-gray-200 rounded-lg py-1.5 hover:bg-gray-50 transition-colors text-gray-700"
                    onClick={() => marcarLimpieza(r)}>
                    <WrenchScrewdriverIcon className="w-4 h-4" /> Marcar Limpieza
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-1.5 text-sm font-medium bg-finca-mid text-white rounded-lg py-1.5 hover:opacity-90 transition-opacity"
                    onClick={() => toast(`Reservas de habitación #${r.numero}`)}>
                    <CalendarDaysIcon className="w-4 h-4" /> Reservas
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h2 className="section-title">{editing ? 'Editar' : 'Nueva'} Habitación</h2>
            </div>
            <form onSubmit={save} className="p-6 space-y-4">

              {/* Imagen */}
              <div className="form-group">
                <label className="label">Imagen de la habitación</label>
                <div
                  className="relative w-full h-40 rounded-xl overflow-hidden border-2 border-dashed border-gray-200 cursor-pointer hover:border-finca-mid transition-colors group"
                  onClick={() => fileRef.current.click()}
                >
                  {preview ? (
                    <img src={preview} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                      <PhotoIcon className="w-10 h-10" />
                      <span className="text-sm">Haz clic para subir imagen</span>
                      <span className="text-xs">JPG, PNG — máx. 3MB</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    {preview && (
                      <span className="opacity-0 group-hover:opacity-100 text-white text-sm font-medium bg-black/50 px-3 py-1 rounded-full transition-opacity">
                        Cambiar imagen
                      </span>
                    )}
                  </div>
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImagen} />
                {preview && (
                  <button type="button" className="text-xs text-red-500 hover:underline mt-1"
                    onClick={() => { setPreview(''); setForm(f => ({ ...f, imagen: '' })); }}>
                    Quitar imagen
                  </button>
                )}
              </div>

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
