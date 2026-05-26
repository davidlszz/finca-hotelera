import { useEffect, useState, useMemo } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { PlusIcon, TrashIcon, MagnifyingGlassIcon, ChevronDownIcon, ChevronUpIcon, ChevronLeftIcon, ChevronRightIcon, UsersIcon, ArrowDownLeftIcon, ArrowUpRightIcon } from '@heroicons/react/24/outline';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWithinInterval, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const ESTADOS = ['Confirmada', 'Check-in', 'Check-out', 'Cancelada'];

const estadoBadge = (e) => ({
  Confirmada:  'badge-blue',
  'Check-in':  'badge-green',
  'Check-out': 'badge-gray',
  Cancelada:   'badge-red',
}[e] || 'badge-gray');

const formatCOP = (n) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n);

const parseLocal = (str) => {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
};

// ── Timeline de disponibilidad ───────────────────────────────────────────────
function DisponibilidadTimeline({ reservations, rooms }) {
  const [viewStart, setViewStart] = useState(() => {
    // Iniciar mostrando desde 3 días antes de hoy para dar contexto
    const d = new Date();
    d.setDate(d.getDate() - 3);
    return d;
  });

  const DAYS = 14;
  const days = Array.from({ length: DAYS }, (_, i) => addDays(viewStart, i));
  const today = new Date();

  const prev = () => setViewStart(d => addDays(d, -DAYS));
  const next = () => setViewStart(d => addDays(d, DAYS));

  const mesLabel = format(viewStart, 'MMMM yyyy', { locale: es });

  // Para cada habitación y día, buscar reserva activa
  const getReserva = (roomId, day) => {
    return reservations.find(r => {
      if (!['Confirmada', 'Check-in', 'Check-out'].includes(r.estado)) return false;
      const tiene = r.detalles?.some(d => d.habitacion_id === roomId || d.habitacion?.id === roomId);
      if (!tiene) return false;
      const ini = parseLocal(r.fecha_ingreso);
      const fin = parseLocal(r.fecha_salida);
      return day >= ini && day < fin;
    });
  };

  // Color de celda
  const cellColor = (reserva) => {
    if (!reserva) return '';
    if (reserva.estado === 'Check-in')  return 'bg-green-400/80 text-white';
    if (reserva.estado === 'Check-out') return 'bg-gray-200/80 text-gray-400'; // completada
    return 'bg-blue-300/70 text-blue-900'; // Confirmada
  };

  // Etiqueta inicial de reserva (nombre cliente)
  const isStart = (reserva, day) => {
    if (!reserva) return false;
    const ini = parseLocal(reserva.fecha_ingreso);
    return isSameDay(day, ini);
  };

  return (
    <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
      {/* Cabecera */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <h2 className="font-bold text-gray-800">Disponibilidad de Habitaciones</h2>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-300 inline-block"/>Confirmada</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-400 inline-block"/>Check-in</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-200 inline-block"/>Completada</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-50 border border-gray-200 inline-block"/>Libre</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prev} className="p-1 rounded-lg hover:bg-gray-100"><ChevronLeftIcon className="w-4 h-4 text-gray-500"/></button>
          <span className="text-sm font-semibold text-gray-700 capitalize w-36 text-center">{mesLabel}</span>
          <button onClick={next} className="p-1 rounded-lg hover:bg-gray-100"><ChevronRightIcon className="w-4 h-4 text-gray-500"/></button>
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-4 py-2 text-gray-400 font-semibold w-36">HABITACIÓN</th>
              {days.map(d => (
                <th key={d} className={`text-center py-2 font-semibold min-w-[36px] ${isSameDay(d, today) ? 'text-finca-mid' : 'text-gray-400'}`}>
                  {format(d, 'd')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rooms.map(room => (
              <tr key={room.id} className="border-b border-gray-50 hover:bg-gray-50/40">
                <td className="px-4 py-2">
                  <p className="font-semibold text-gray-800">{room.numero}</p>
                  <p className="text-gray-400 uppercase text-[10px]">{room.tipo}</p>
                </td>
                {days.map(day => {
                  const res = getReserva(room.id, day);
                  const start = isStart(res, day);
                  const isToday = isSameDay(day, today);
                  return (
                    <td key={day}
                      className={`text-center py-1.5 px-0.5 relative
                        ${res ? cellColor(res) : isToday ? 'bg-finca-mid/10' : ''}
                        ${isToday && !res ? 'ring-1 ring-inset ring-finca-mid/30' : ''}
                      `}
                      title={res ? `${res.cliente?.nombres} ${res.cliente?.apellidos} — ${res.estado}` : 'Libre'}
                    >
                      {start && res ? (
                        <span className="text-[10px] font-bold truncate block px-0.5">
                          {res.cliente?.nombres?.charAt(0)}. {res.cliente?.apellidos?.split(' ')[0]}
                        </span>
                      ) : null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Panel lateral: check-ins/outs hoy ───────────────────────────────────────
function PanelHoy({ reservations, rooms }) {
  const hoy = format(new Date(), 'yyyy-MM-dd');

  const checkinsHoy  = reservations.filter(r => r.fecha_ingreso === hoy && ['Confirmada', 'Check-in'].includes(r.estado));
  const checkoutsHoy = reservations.filter(r => {
    if (!['Check-in', 'Check-out'].includes(r.estado)) return false;
    // Salida programada para hoy
    if (r.fecha_salida === hoy) return true;
    // Check-out anticipado: salió hoy pero su fecha_salida era futura
    if (r.estado === 'Check-out' && r.fecha_ingreso <= hoy && r.fecha_salida > hoy) return true;
    return false;
  });

  const totalCap   = rooms.reduce((a, r) => a + (r.capacidad || 0), 0);
  const ocupadas   = rooms.filter(r => r.estado === 'Ocupada').length;
  const pctOcupado = totalCap > 0 ? Math.round((ocupadas / rooms.length) * 100) : 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Check-ins hoy */}
      <div className="bg-white rounded-2xl shadow border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-800 flex items-center gap-1.5">
            <ArrowDownLeftIcon className="w-4 h-4 text-green-500" /> Check-ins (Hoy)
          </h3>
          <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">{checkinsHoy.length} Llegadas</span>
        </div>
        {checkinsHoy.length === 0 ? (
          <p className="text-xs text-gray-400 py-2">Sin check-ins hoy</p>
        ) : (
          <div className="space-y-2">
            {checkinsHoy.map(r => (
              <div key={r.id} className="flex items-center gap-3 py-1">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm flex-shrink-0">
                  {r.cliente?.nombres?.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{r.cliente?.nombres} {r.cliente?.apellidos}</p>
                  <p className="text-xs text-gray-400">
                    Hab. {r.detalles?.map(d => d.habitacion?.numero).join(', ')} · {r.estado}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Check-outs hoy */}
      <div className="bg-white rounded-2xl shadow border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-800 flex items-center gap-1.5">
            <ArrowUpRightIcon className="w-4 h-4 text-red-400" /> Check-outs (Hoy)
          </h3>
          <span className="text-xs bg-red-100 text-red-600 font-semibold px-2 py-0.5 rounded-full">{checkoutsHoy.length} Salidas</span>
        </div>
        {checkoutsHoy.length === 0 ? (
          <p className="text-xs text-gray-400 py-2">Sin check-outs hoy</p>
        ) : (
          <div className="space-y-2">
            {checkoutsHoy.map(r => {
              const procesado = r.estado === 'Check-out';
              return (
                <div key={r.id} className={`flex items-center gap-3 py-1 border-l-2 pl-2 ${procesado ? 'border-gray-300' : 'border-red-300'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${procesado ? 'bg-gray-100 text-gray-400' : 'bg-red-100 text-red-600'}`}>
                    {r.cliente?.nombres?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${procesado ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                      {r.cliente?.nombres} {r.cliente?.apellidos}
                    </p>
                    <p className="text-xs text-gray-400">Hab. {r.detalles?.map(d => d.habitacion?.numero).join(', ')}</p>
                  </div>
                  {procesado && (
                    <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full flex-shrink-0">✓</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Capacidad ocupada */}
      <div className="bg-white rounded-2xl shadow border border-gray-100 p-4 text-center">
        <UsersIcon className="w-8 h-8 text-finca-mid mx-auto mb-1" />
        <p className="text-xs text-gray-400 mb-1">Capacidad Ocupada Hoy</p>
        <p className="text-3xl font-bold text-finca-mid">{pctOcupado}%</p>
        <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-finca-mid rounded-full transition-all" style={{ width: `${pctOcupado}%` }} />
        </div>
        <p className="text-xs text-gray-400 mt-1">{ocupadas}/{rooms.length} habitaciones ocupadas</p>
      </div>
    </div>
  );
}

// ── Página principal ─────────────────────────────────────────────────────────
export default function ReservationsPage() {
  const [reservations, setRes]          = useState([]);
  const [clientes, setClientes]         = useState([]);
  const [rooms, setRooms]               = useState([]);
  const [modal, setModal]               = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [loading, setLoading]           = useState(false);
  const [collapsed, setCollapsed]       = useState(false);
  const { isAdmin }                     = useAuth();

  const [form, setForm]           = useState({ cliente_id: '', fecha_ingreso: '', fecha_salida: '', cantidad_huespedes: 1, observaciones: '' });
  const [roomsDisp, setRoomsDisp] = useState([]);
  const [selRooms, setSelRooms]   = useState([]);
  const [totalCalc, setTotalCalc] = useState(0);

  const load = () => {
    api.get('/reservations').then(r => setRes(r.data)).catch(() => {});
  };

  useEffect(() => {
    load();
    api.get('/clients').then(r => setClientes(r.data)).catch(() => {});
    api.get('/rooms').then(r => setRooms(r.data)).catch(() => {});
  }, []);

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
      const r = await api.get('/rooms/availability', { params: { fecha_ingreso: form.fecha_ingreso, fecha_salida: form.fecha_salida } });
      setRoomsDisp(r.data); setSelRooms([]);
    } catch { toast.error('Error al buscar habitaciones.'); }
  };

  const toggleRoom = (id) => setSelRooms(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const createReservation = async (e) => {
    e.preventDefault();
    if (selRooms.length === 0) { toast.error('Seleccione al menos una habitación.'); return; }
    setLoading(true);
    try {
      await api.post('/reservations', { ...form, habitaciones_ids: selRooms });
      toast.success('Reserva creada exitosamente.'); setModal(false); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error al crear reserva.'); }
    finally { setLoading(false); }
  };

  const cambiarEstado = async (id, estado) => {
    try {
      await api.patch(`/reservations/${id}/estado`, { estado });
      toast.success(`Estado cambiado a ${estado}.`); load();
      api.get('/rooms').then(r => setRooms(r.data)).catch(() => {});
    } catch (err) { toast.error(err.response?.data?.error || 'Error.'); }
  };

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar reserva?')) return;
    try {
      await api.delete(`/reservations/${id}`); toast.success('Reserva eliminada.'); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error.'); }
  };

  const formatDate = (d) => format(new Date(d + 'T12:00:00'), "d MMM yyyy", { locale: es });

  // Por defecto solo muestra activas; si hay filtro explícito muestra ese estado
  const filtered = filtroEstado
    ? reservations.filter(r => r.estado === filtroEstado)
    : reservations.filter(r => ['Confirmada', 'Check-in', 'Check-out'].includes(r.estado));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Reservas</h1>
        <button className="btn-primary btn-sm" onClick={() => {
          setForm({ cliente_id: '', fecha_ingreso: '', fecha_salida: '', cantidad_huespedes: 1, observaciones: '' });
          setRoomsDisp([]); setSelRooms([]); setModal('create');
        }}>
          <PlusIcon className="w-4 h-4" /> Nueva Reserva
        </button>
      </div>

      {/* Filtros + botón colapsar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {['', ...ESTADOS].map(e => (
            <button key={e} onClick={() => setFiltroEstado(e)}
              className={`btn btn-sm ${filtroEstado === e ? 'btn-primary' : 'btn-secondary'}`}>
              {e || 'Todas'}
            </button>
          ))}
        </div>
        <button onClick={() => setCollapsed(c => !c)}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors">
          {collapsed
            ? <><ChevronDownIcon className="w-4 h-4" /> Mostrar reservas</>
            : <><ChevronUpIcon   className="w-4 h-4" /> Ocultar reservas</>}
        </button>
      </div>

      {/* Tabla */}
      {!collapsed && (
        <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
          <table className="table w-full">
            <thead>
              <tr>
                <th>#</th><th>Cliente</th><th>Habitaciones</th><th>Ingreso</th>
                <th>Salida</th><th>Huéspedes</th><th>Total</th><th>Estado</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
          </table>
          <div className="overflow-y-auto" style={{ maxHeight: '305px' }}>
            <table className="table w-full">
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan="9" className="text-center text-gray-400 py-8">No hay reservas.</td></tr>
                )}
                {filtered.map(r => (
                  <tr key={r.id}>
                    <td className="font-mono text-xs text-gray-500">#{r.id}</td>
                    <td>
                      <p className="font-medium">{r.cliente?.nombres} {r.cliente?.apellidos}</p>
                      <p className="text-xs text-gray-400">{r.cliente?.numero_documento}</p>
                    </td>
                    <td className="text-xs text-gray-600">{r.detalles?.map(d => d.habitacion?.numero).join(', ')}</td>
                    <td>{formatDate(r.fecha_ingreso)}</td>
                    <td>{formatDate(r.fecha_salida)}</td>
                    <td className="text-center">{r.cantidad_huespedes}</td>
                    <td className="font-medium text-finca-dark">{formatCOP(r.total)}</td>
                    <td><span className={`badge ${estadoBadge(r.estado)}`}>{r.estado}</span></td>
                    <td>
                      <div className="flex gap-1 justify-end flex-wrap">
                        {r.estado === 'Confirmada' && <button className="btn-success btn-sm" onClick={() => cambiarEstado(r.id, 'Check-in')}>Check-in</button>}
                        {r.estado === 'Check-in'   && <button className="btn-secondary btn-sm" onClick={() => cambiarEstado(r.id, 'Check-out')}>Check-out</button>}
                        {r.estado === 'Confirmada' && <button className="btn-danger btn-sm" onClick={() => cambiarEstado(r.id, 'Cancelada')}>Cancelar</button>}
                        {isAdmin && r.estado !== 'Check-in' && (
                          <button className="btn-danger btn-sm" onClick={() => eliminar(r.id)}><TrashIcon className="w-3.5 h-3.5" /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-2 border-t border-gray-100 text-xs text-gray-400">
            {filtered.length} reserva{filtered.length !== 1 ? 's' : ''} {filtroEstado ? `en estado "${filtroEstado}"` : 'en total'}
          </div>
        </div>
      )}

      {/* Timeline + Panel hoy */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
        <div className="xl:col-span-3">
          <DisponibilidadTimeline reservations={reservations} rooms={rooms} />
        </div>
        <div>
          <PanelHoy reservations={reservations} rooms={rooms} />
        </div>
      </div>

      {/* Modal nueva reserva */}
      {modal === 'create' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl my-4">
            <div className="p-6 border-b border-gray-100"><h2 className="section-title">Nueva Reserva</h2></div>
            <form onSubmit={createReservation} className="p-6 space-y-4">
              <div className="form-group">
                <label className="label">Cliente</label>
                <select className="input" value={form.cliente_id} required onChange={e => setForm({...form, cliente_id: e.target.value})}>
                  <option value="">Seleccionar cliente...</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nombres} {c.apellidos} — {c.tipo_documento} {c.numero_documento}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="form-group">
                  <label className="label">Fecha Ingreso</label>
                  <input type="date" className="input" value={form.fecha_ingreso} required onChange={e => setForm({...form, fecha_ingreso: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="label">Fecha Salida</label>
                  <input type="date" className="input" value={form.fecha_salida} required onChange={e => setForm({...form, fecha_salida: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="label">Huéspedes</label>
                  <input type="number" className="input" min="1" value={form.cantidad_huespedes} onChange={e => setForm({...form, cantidad_huespedes: e.target.value})} />
                </div>
              </div>
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
                      <label key={r.id} className={`cursor-pointer rounded-lg border-2 p-2 text-sm transition-colors ${selRooms.includes(r.id) ? 'border-finca-mid bg-green-50' : 'border-gray-200'}`}>
                        <input type="checkbox" className="hidden" checked={selRooms.includes(r.id)} onChange={() => toggleRoom(r.id)} />
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
                <textarea className="input" rows="2" value={form.observaciones} onChange={e => setForm({...form, observaciones: e.target.value})} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" className="btn-secondary flex-1" onClick={() => setModal(false)}>Cancelar</button>
                <button type="submit" disabled={loading} className="btn-primary flex-1">{loading ? 'Creando...' : 'Crear Reserva'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
