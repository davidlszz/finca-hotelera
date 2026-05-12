import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { PlusIcon, EyeIcon, PencilSquareIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ESTADOS = ['Confirmada', 'Check-in', 'Check-out', 'Cancelada'];

const estadoBadge = (e) => ({
  Confirmada: 'badge-blue',
  'Check-in':  'badge-green',
  'Check-out': 'badge-gray',
  Cancelada:   'badge-red',
}[e] || 'badge-gray');

const formatCOP = (n) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n);

export default function ReservationsPage() {
  const [reservations, setRes] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [rooms, setRooms]       = useState([]);
  const [modal, setModal]       = useState(false); // 'create' | 'view' | 'estado' | false
  const [selected, setSelected] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [loading, setLoading]   = useState(false);
  const { isAdmin }             = useAuth();

  // Formulario nueva reserva
  const [form, setForm] = useState({
    cliente_id: '', fecha_ingreso: '', fecha_salida: '', cantidad_huespedes: 1, observaciones: '',
  });
  const [roomsDisp, setRoomsDisp]  = useState([]);
  const [selRooms, setSelRooms]    = useState([]);
  const [totalCalc, setTotalCalc]  = useState(0);

  const load = () => {
    const params = filtroEstado ? { estado: filtroEstado } : {};
    api.get('/reservations', { params }).then(r => setRes(r.data)).catch(() => {});
  };

  useEffect(() => {
    load();
    api.get('/clients').then(r => setClientes(r.data)).catch(() => {});
  }, [filtroEstado]);

  // Calcular total cuando cambian habitaciones seleccionadas y fechas
  useEffect(() => {
    if (!form.fecha_ingreso || !form.fecha_salida || selRooms.length === 0) { setTotalCalc(0); return; }
    const noches = Math.ceil((new Date(form.fecha_salida) - new Date(form.fecha_ingreso)) / 86400000);
    if (noches <= 0) return;
    const t = selRooms.reduce((acc, id) => {
      const r = roomsDisp.find(r => r.id === id);
      return acc + (r ? parseFloat(r.precio_noche) * noches : 0);
    }, 0);
    setTotalCalc(t);
  }, [selRooms, form.fecha_ingreso, form.fecha_salida]);

  const buscarDisponibles = async () => {
    if (!form.fecha_ingreso || !form.fecha_salida) { toast.error('Seleccione las fechas primero.'); return; }
    try {
      const r = await api.get('/rooms/availability', {
        params: { fecha_ingreso: form.fecha_ingreso, fecha_salida: form.fecha_salida },
      });
      setRoomsDisp(r.data);
      setSelRooms([]);
    } catch { toast.error('Error al buscar habitaciones.'); }
  };

  const toggleRoom = (id) =>
    setSelRooms(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const createReservation = async (e) => {
    e.preventDefault();
    if (selRooms.length === 0) { toast.error('Seleccione al menos una habitación.'); return; }
    setLoading(true);
    try {
      await api.post('/reservations', { ...form, habitaciones_ids: selRooms });
      toast.success('Reserva creada exitosamente.');
      setModal(false); load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al crear reserva.');
    } finally { setLoading(false); }
  };

  const cambiarEstado = async (id, estado) => {
    try {
      await api.patch(`/reservations/${id}/estado`, { estado });
      toast.success(`Estado cambiado a ${estado}.`);
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error.'); }
  };

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar reserva?')) return;
    try {
      await api.delete(`/reservations/${id}`);
      toast.success('Reserva eliminada.');
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error.'); }
  };

  const formatDate = (d) => format(new Date(d + 'T12:00:00'), "d MMM yyyy", { locale: es });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Reservas</h1>
        <button className="btn-primary btn-sm" onClick={() => { setForm({ cliente_id: '', fecha_ingreso: '', fecha_salida: '', cantidad_huespedes: 1, observaciones: '' }); setRoomsDisp([]); setSelRooms([]); setModal('create'); }}>
          <PlusIcon className="w-4 h-4" /> Nueva Reserva
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {['', ...ESTADOS].map(e => (
          <button key={e} onClick={() => setFiltroEstado(e)}
            className={`btn btn-sm ${filtroEstado === e ? 'btn-primary' : 'btn-secondary'}`}>
            {e || 'Todas'}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Cliente</th>
              <th>Habitaciones</th>
              <th>Ingreso</th>
              <th>Salida</th>
              <th>Huéspedes</th>
              <th>Total</th>
              <th>Estado</th>
              <th className="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {reservations.length === 0 && (
              <tr><td colSpan="9" className="text-center text-gray-400 py-8">No hay reservas.</td></tr>
            )}
            {reservations.map(r => (
              <tr key={r.id}>
                <td className="font-mono text-xs text-gray-500">#{r.id}</td>
                <td>
                  <p className="font-medium">{r.cliente?.nombres} {r.cliente?.apellidos}</p>
                  <p className="text-xs text-gray-400">{r.cliente?.numero_documento}</p>
                </td>
                <td className="text-xs text-gray-600">
                  {r.detalles?.map(d => d.habitacion?.numero).join(', ')}
                </td>
                <td>{formatDate(r.fecha_ingreso)}</td>
                <td>{formatDate(r.fecha_salida)}</td>
                <td className="text-center">{r.cantidad_huespedes}</td>
                <td className="font-medium text-finca-dark">{formatCOP(r.total)}</td>
                <td><span className={`badge ${estadoBadge(r.estado)}`}>{r.estado}</span></td>
                <td>
                  <div className="flex gap-1 justify-end flex-wrap">
                    {r.estado === 'Confirmada' && (
                      <button className="btn-success btn-sm" onClick={() => cambiarEstado(r.id, 'Check-in')}>Check-in</button>
                    )}
                    {r.estado === 'Check-in' && (
                      <button className="btn-secondary btn-sm" onClick={() => cambiarEstado(r.id, 'Check-out')}>Check-out</button>
                    )}
                    {r.estado === 'Confirmada' && (
                      <button className="btn-danger btn-sm" onClick={() => cambiarEstado(r.id, 'Cancelada')}>Cancelar</button>
                    )}
                    {isAdmin && r.estado !== 'Check-in' && (
                      <button className="btn-danger btn-sm" onClick={() => eliminar(r.id)}>
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

      {/* Modal nueva reserva */}
      {modal === 'create' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl my-4">
            <div className="p-6 border-b border-gray-100">
              <h2 className="section-title">Nueva Reserva</h2>
            </div>
            <form onSubmit={createReservation} className="p-6 space-y-4">
              {/* Cliente */}
              <div className="form-group">
                <label className="label">Cliente</label>
                <select className="input" value={form.cliente_id} required
                  onChange={e => setForm({...form, cliente_id: e.target.value})}>
                  <option value="">Seleccionar cliente...</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nombres} {c.apellidos} — {c.tipo_documento} {c.numero_documento}
                    </option>
                  ))}
                </select>
              </div>

              {/* Fechas + huéspedes */}
              <div className="grid grid-cols-3 gap-3">
                <div className="form-group">
                  <label className="label">Fecha Ingreso</label>
                  <input type="date" className="input" value={form.fecha_ingreso} required
                    onChange={e => setForm({...form, fecha_ingreso: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="label">Fecha Salida</label>
                  <input type="date" className="input" value={form.fecha_salida} required
                    onChange={e => setForm({...form, fecha_salida: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="label">Huéspedes</label>
                  <input type="number" className="input" min="1" value={form.cantidad_huespedes}
                    onChange={e => setForm({...form, cantidad_huespedes: e.target.value})} />
                </div>
              </div>

              {/* Buscar habitaciones */}
              <div>
                <button type="button" className="btn-secondary btn-sm" onClick={buscarDisponibles}>
                  <MagnifyingGlassIcon className="w-4 h-4" /> Buscar habitaciones disponibles
                </button>
              </div>

              {roomsDisp.length > 0 && (
                <div>
                  <p className="label">Seleccionar habitaciones ({roomsDisp.length} disponibles)</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                    {roomsDisp.map(r => (
                      <label key={r.id} className={`cursor-pointer rounded-lg border-2 p-2 text-sm transition-colors ${
                        selRooms.includes(r.id) ? 'border-finca-mid bg-green-50' : 'border-gray-200'}`}>
                        <input type="checkbox" className="hidden" checked={selRooms.includes(r.id)}
                          onChange={() => toggleRoom(r.id)} />
                        <p className="font-bold">#{r.numero} — {r.tipo}</p>
                        <p className="text-xs text-gray-500">{r.capacidad} pers. · {formatCOP(r.precio_noche)}/noche</p>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {totalCalc > 0 && (
                <div className="bg-green-50 rounded-lg p-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Total calculado</span>
                  <span className="text-lg font-bold text-finca-dark">{formatCOP(totalCalc)}</span>
                </div>
              )}

              <div className="form-group">
                <label className="label">Observaciones</label>
                <textarea className="input" rows="2" value={form.observaciones}
                  onChange={e => setForm({...form, observaciones: e.target.value})} />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" className="btn-secondary flex-1" onClick={() => setModal(false)}>Cancelar</button>
                <button type="submit" disabled={loading} className="btn-primary flex-1">
                  {loading ? 'Creando...' : 'Crear Reserva'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
