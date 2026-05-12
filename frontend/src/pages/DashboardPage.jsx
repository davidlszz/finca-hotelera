import { useEffect, useState } from 'react';
import api from '../api/axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import {
  BuildingOfficeIcon, CalendarDaysIcon, UsersIcon,
  CurrencyDollarIcon, ExclamationTriangleIcon, CheckCircleIcon,
} from '@heroicons/react/24/outline';

const StatCard = ({ icon: Icon, value, label, color, sub }) => (
  <div className="stat-card">
    <div className={`stat-icon ${color}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  </div>
);

const formatCOP = (n) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n);

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    api.get('/dashboard/summary').then(r => setData(r.data)).catch(() => {});
    api.get('/inventory/alerts').then(r => setAlerts(r.data)).catch(() => {});
    api.get('/rooms').then(r => setRooms(r.data)).catch(() => {});
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400 animate-pulse">Cargando dashboard...</div>
      </div>
    );
  }

  const ocupacionData = [
    { name: 'Disponibles',    value: data.habitaciones.disponibles,    color: '#22c55e' },
    { name: 'Ocupadas',       value: data.habitaciones.ocupadas,        color: '#ef4444' },
    { name: 'Mantenimiento',  value: data.habitaciones.mantenimiento,   color: '#f59e0b' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={BuildingOfficeIcon} value={`${data.tasa_ocupacion}%`}
          label="Tasa de Ocupación" color="bg-finca-mid"
          sub={`${data.habitaciones.ocupadas}/${data.habitaciones.total} hab.`} />
        <StatCard icon={CalendarDaysIcon} value={data.reservas.hoy}
          label="Reservas Hoy" color="bg-blue-500"
          sub={`${data.reservas.checkins_activos} en Check-in`} />
        <StatCard icon={UsersIcon} value={data.clientes.total}
          label="Clientes Registrados" color="bg-purple-500" />
        <StatCard icon={CurrencyDollarIcon} value={formatCOP(data.finanzas.ingresos_mes)}
          label="Ingresos del Mes" color="bg-finca-accent" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Gráfico ocupación */}
        <div className="card xl:col-span-2">
          <h2 className="section-title mb-4">Estado de Habitaciones</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={ocupacionData} barSize={60}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => [v, 'Habitaciones']} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {ocupacionData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {/* Mapa de habitaciones */}
          <div className="mt-4 grid grid-cols-4 gap-2">
            {rooms.map(r => (
              <div key={r.id} title={`${r.numero} - ${r.tipo}`}
                className={`rounded-lg p-2 text-center text-xs font-medium cursor-default ${
                  r.estado === 'Disponible'   ? 'bg-green-100 text-green-800' :
                  r.estado === 'Ocupada'      ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                <div className="font-bold">{r.numero}</div>
                <div className="text-[10px] opacity-75 truncate">{r.estado}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Alertas stock */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />
            <h2 className="section-title">Alertas de Stock</h2>
            {alerts.length > 0 && (
              <span className="badge badge-yellow ml-auto">{alerts.length}</span>
            )}
          </div>
          {alerts.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-gray-400">
              <CheckCircleIcon className="w-10 h-10 text-green-400" />
              <p className="text-sm">Inventario en buen estado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map(p => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{p.nombre}</p>
                    <p className="text-xs text-gray-400">Mín: {p.stock_minimo} {p.unidad_medida}</p>
                  </div>
                  <span className={`badge ${parseFloat(p.stock_actual) === 0 ? 'badge-red' : 'badge-yellow'}`}>
                    {p.stock_actual} {p.unidad_medida}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
