import { useEffect, useState, useMemo } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import {
  PlusIcon, ArrowUpIcon, ArrowDownIcon, ExclamationTriangleIcon,
  EllipsisVerticalIcon, CubeIcon, FireIcon, FunnelIcon,
} from '@heroicons/react/24/outline';

const formatCOP = (n) => n
  ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n)
  : '—';

const estadoStock = (actual, minimo) => {
  const a = parseFloat(actual), m = parseFloat(minimo);
  if (a === 0)      return { label: 'Crítico',  cls: 'bg-red-100 text-red-700 border border-red-200',    dot: 'bg-red-500'    };
  if (a <= m)       return { label: 'Crítico',  cls: 'bg-red-100 text-red-700 border border-red-200',    dot: 'bg-red-500'    };
  if (a <= m * 1.5) return { label: 'Bajo',     cls: 'bg-yellow-100 text-yellow-700 border border-yellow-200', dot: 'bg-yellow-500' };
  return              { label: 'Óptimo',  cls: 'bg-green-100 text-green-700 border border-green-200', dot: 'bg-green-500'  };
};

const StockBar = ({ actual, minimo }) => {
  const pct = Math.min(100, Math.round((parseFloat(actual) / Math.max(parseFloat(minimo) * 2, 1)) * 100));
  const color = pct <= 50 ? '#ef4444' : pct <= 75 ? '#f59e0b' : '#22c55e';
  return (
    <div className="mt-1">
      <div className="flex justify-between text-xs text-gray-400 mb-0.5">
        <span>{actual} EN STOCK</span><span>META: {minimo}</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
};

export default function InventoryPage() {
  const [products, setProducts]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [movements, setMovements]   = useState([]);
  const [catFilter, setCatFilter]   = useState('Todos');
  const [ordenar, setOrdenar]       = useState('nombre');
  const [menuOpen, setMenuOpen]     = useState(null);
  const [modalProd, setModalProd]   = useState(false);
  const [modalMov, setModalMov]     = useState(null);
  const [selProduct, setSelProduct] = useState(null);
  const [loading, setLoading]       = useState(false);
  const [page, setPage]             = useState(1);
  const PER_PAGE = 5;
  const { isAdmin } = useAuth();

  const [formProd, setFormProd] = useState({ categoria_id: '', nombre: '', unidad_medida: 'unidad', stock_actual: 0, stock_minimo: 5, precio_unitario: '' });
  const [formMov, setFormMov]   = useState({ cantidad: '', motivo: '' });

  const loadProducts  = () => api.get('/inventory/products').then(r => setProducts(r.data)).catch(() => {});
  const loadMovements = () => api.get('/inventory/movements').then(r => setMovements(r.data)).catch(() => {});

  useEffect(() => {
    loadProducts(); loadMovements();
    api.get('/inventory/categories').then(r => setCategories(r.data)).catch(() => {});
  }, []);

  const saveProd = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      await api.post('/inventory/products', formProd);
      toast.success('Producto creado.'); setModalProd(false); loadProducts();
    } catch (err) { toast.error(err.response?.data?.error || 'Error.'); }
    finally { setLoading(false); }
  };

  const registrarMov = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      await api.post('/inventory/movements', { producto_id: selProduct.id, tipo: modalMov, ...formMov });
      toast.success(`${modalMov} registrada.`); setModalMov(null); loadProducts(); loadMovements();
    } catch (err) { toast.error(err.response?.data?.error || 'Error.'); }
    finally { setLoading(false); }
  };

  // Estadísticas resumen
  const criticos    = products.filter(p => parseFloat(p.stock_actual) <= parseFloat(p.stock_minimo));
  const altaRotacion = useMemo(() => {
    const conteo = {};
    movements.forEach(m => { if (m.tipo === 'Salida') conteo[m.producto?.nombre] = (conteo[m.producto?.nombre] || 0) + parseFloat(m.cantidad); });
    return Object.entries(conteo).sort((a,b) => b[1]-a[1]).slice(0,4).map(([nombre, total]) => ({ nombre: nombre?.split(' ')[0], total }));
  }, [movements]);

  // Filtrado y orden
  const filtered = useMemo(() => {
    let list = catFilter === 'Todos' ? products : products.filter(p => p.categoria?.nombre === catFilter);
    if (ordenar === 'nombre')  list = [...list].sort((a,b) => a.nombre.localeCompare(b.nombre));
    if (ordenar === 'stock')   list = [...list].sort((a,b) => parseFloat(a.stock_actual) - parseFloat(b.stock_actual));
    if (ordenar === 'estado')  list = [...list].sort((a,b) => parseFloat(a.stock_actual)/parseFloat(a.stock_minimo) - parseFloat(b.stock_actual)/parseFloat(b.stock_minimo));
    return list;
  }, [products, catFilter, ordenar]);

  const totalPages  = Math.ceil(filtered.length / PER_PAGE);
  const paginated   = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE);

  const catLabels = ['Todos', ...categories.map(c => c.nombre)];

  return (
    <div className="space-y-5" onClick={() => setMenuOpen(null)}>
      <div className="flex items-center justify-between">
        <h1 className="page-title">Inventario</h1>
        {isAdmin && (
          <button className="btn-primary btn-sm" onClick={() => {
            setFormProd({ categoria_id: categories[0]?.id || '', nombre: '', unidad_medida: 'unidad', stock_actual: 0, stock_minimo: 5, precio_unitario: '' });
            setModalProd(true);
          }}>
            <PlusIcon className="w-4 h-4" /> Nuevo Producto
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
        {/* Tabla principal — 3 columnas */}
        <div className="xl:col-span-3 bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">

          {/* Filtros categoría + ordenar */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4 pb-3 border-b border-gray-100">
            <div className="flex flex-wrap gap-2">
              {catLabels.map(c => (
                <button key={c} onClick={() => { setCatFilter(c); setPage(1); }}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${catFilter === c ? 'bg-finca-mid text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {c}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <FunnelIcon className="w-4 h-4" />
              <span>Ordenar por:</span>
              <select className="input py-1 text-sm" value={ordenar} onChange={e => setOrdenar(e.target.value)}>
                <option value="nombre">Nombre</option>
                <option value="stock">Stock</option>
                <option value="estado">Estado</option>
              </select>
            </div>
          </div>

          {/* Cabecera tabla */}
          <div className="grid grid-cols-12 px-5 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100">
            <div className="col-span-4">Producto</div>
            <div className="col-span-2">Categoría</div>
            <div className="col-span-3">Nivel de Stock</div>
            <div className="col-span-1">Unidad</div>
            <div className="col-span-1">Estado</div>
            <div className="col-span-1 text-right">Acciones</div>
          </div>

          {/* Filas */}
          {paginated.map(p => {
            const est = estadoStock(p.stock_actual, p.stock_minimo);
            return (
              <div key={p.id} className="grid grid-cols-12 px-5 py-3 items-center border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                {/* Producto */}
                <div className="col-span-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <CubeIcon className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800 leading-tight">{p.nombre}</p>
                    <p className="text-xs text-gray-400">SKU: MIR-{String(p.id).padStart(4,'0')}</p>
                  </div>
                </div>
                {/* Categoría */}
                <div className="col-span-2 text-sm text-gray-500">{p.categoria?.nombre}</div>
                {/* Barra stock */}
                <div className="col-span-3 pr-4">
                  <StockBar actual={p.stock_actual} minimo={p.stock_minimo} />
                </div>
                {/* Unidad */}
                <div className="col-span-1 text-sm text-gray-600 capitalize">{p.unidad_medida}</div>
                {/* Estado */}
                <div className="col-span-1">
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${est.cls}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${est.dot}`} />
                    {est.label}
                  </span>
                </div>
                {/* Acciones */}
                <div className="col-span-1 flex justify-end" onClick={e => e.stopPropagation()}>
                  <button className="p-1 rounded-lg hover:bg-gray-100" onClick={() => setMenuOpen(menuOpen === p.id ? null : p.id)}>
                    <EllipsisVerticalIcon className="w-5 h-5 text-gray-400" />
                  </button>
                  {menuOpen === p.id && (
                    <div className="absolute right-8 mt-6 w-40 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-10">
                      <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 text-green-700"
                        onClick={() => { setSelProduct(p); setFormMov({ cantidad:'', motivo:'' }); setModalMov('Entrada'); setMenuOpen(null); }}>
                        <ArrowUpIcon className="w-4 h-4" /> Entrada
                      </button>
                      <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
                        onClick={() => { setSelProduct(p); setFormMov({ cantidad:'', motivo:'' }); setModalMov('Salida'); setMenuOpen(null); }}>
                        <ArrowDownIcon className="w-4 h-4" /> Salida
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Footer paginación */}
          <div className="flex items-center justify-between px-5 py-3 text-sm text-gray-500">
            <span>Mostrando {Math.min((page-1)*PER_PAGE+1, filtered.length)}–{Math.min(page*PER_PAGE, filtered.length)} de {filtered.length} productos</span>
            <div className="flex gap-2">
              <button className="btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p-1)}>Anterior</button>
              <button className="btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p+1)}>Siguiente</button>
            </div>
          </div>
        </div>

        {/* Panel derecho: Resumen de Salud */}
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-2xl shadow border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Resumen de Salud</span>
            </div>

            {/* Total items */}
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <CubeIcon className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Total Items</p>
                <p className="text-2xl font-bold text-gray-800">{products.length}</p>
              </div>
            </div>

            {/* Críticos y alta rotación */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-red-50 rounded-xl p-3">
                <div className="flex items-center gap-1 mb-1">
                  <ExclamationTriangleIcon className="w-3.5 h-3.5 text-red-500" />
                  <span className="text-xs font-semibold text-red-500">Stock Crítico</span>
                </div>
                <p className="text-2xl font-bold text-gray-800">{criticos.length}</p>
                <p className="text-xs text-gray-400">Requieren atención</p>
              </div>
              <div className="bg-yellow-50 rounded-xl p-3">
                <div className="flex items-center gap-1 mb-1">
                  <FireIcon className="w-3.5 h-3.5 text-yellow-500" />
                  <span className="text-xs font-semibold text-yellow-500">Alta Rotación</span>
                </div>
                <p className="text-2xl font-bold text-gray-800">{altaRotacion.length}</p>
                <p className="text-xs text-gray-400">Más consumidos</p>
              </div>
            </div>

            {/* Gráfico top consumo */}
            {altaRotacion.length > 0 && (
              <>
                <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                  <span className="text-green-500">↗</span> Top Consumo
                </p>
                <p className="text-xs text-gray-400 mb-2">Items más utilizados este mes</p>
                <ResponsiveContainer width="100%" height={100}>
                  <BarChart data={altaRotacion} barSize={20}>
                    <XAxis dataKey="nombre" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip formatter={(v) => [v, 'Consumo']} />
                    <Bar dataKey="total" radius={[4,4,0,0]}>
                      {altaRotacion.map((_, i) => <Cell key={i} fill="#22c55e" />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <button className="w-full text-center text-xs text-green-600 font-medium mt-2 hover:underline"
                  onClick={() => {}}>
                  Ver reporte detallado →
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal nuevo producto */}
      {modalProd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="p-6 border-b border-gray-100">
              <h2 className="section-title">Nuevo Producto</h2>
            </div>
            <form onSubmit={saveProd} className="p-6 space-y-4">
              <div className="form-group">
                <label className="label">Categoría</label>
                <select className="input" value={formProd.categoria_id} required
                  onChange={e => setFormProd({...formProd, categoria_id: e.target.value})}>
                  <option value="">Seleccionar...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="label">Nombre</label>
                <input className="input" value={formProd.nombre} required
                  onChange={e => setFormProd({...formProd, nombre: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="label">Unidad de Medida</label>
                  <select className="input" value={formProd.unidad_medida}
                    onChange={e => setFormProd({...formProd, unidad_medida: e.target.value})}>
                    {['unidad','kg','litro','caja','bolsa','paquete'].map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="label">Precio Unitario (COP)</label>
                  <input type="number" className="input" value={formProd.precio_unitario}
                    onChange={e => setFormProd({...formProd, precio_unitario: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="label">Stock Inicial</label>
                  <input type="number" min="0" className="input" value={formProd.stock_actual}
                    onChange={e => setFormProd({...formProd, stock_actual: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="label">Stock Mínimo</label>
                  <input type="number" min="0" className="input" value={formProd.stock_minimo}
                    onChange={e => setFormProd({...formProd, stock_minimo: e.target.value})} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" className="btn-secondary flex-1" onClick={() => setModalProd(false)}>Cancelar</button>
                <button type="submit" disabled={loading} className="btn-primary flex-1">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal movimiento */}
      {modalMov && selProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
            <div className="p-6 border-b border-gray-100">
              <h2 className="section-title">Registrar {modalMov}</h2>
              <p className="text-sm text-gray-500 mt-1">{selProduct.nombre}</p>
            </div>
            <form onSubmit={registrarMov} className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <span className="text-gray-500">Stock actual:</span>{' '}
                <strong>{selProduct.stock_actual} {selProduct.unidad_medida}</strong>
              </div>
              <div className="form-group">
                <label className="label">Cantidad ({selProduct.unidad_medida})</label>
                <input type="number" min="0.01" step="0.01" className="input" value={formMov.cantidad} required
                  onChange={e => setFormMov({...formMov, cantidad: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="label">Motivo / Descripción</label>
                <input className="input" value={formMov.motivo}
                  onChange={e => setFormMov({...formMov, motivo: e.target.value})}
                  placeholder={modalMov === 'Entrada' ? 'Compra, donación...' : 'Consumo, merma...'} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" className="btn-secondary flex-1" onClick={() => setModalMov(null)}>Cancelar</button>
                <button type="submit" disabled={loading}
                  className={`flex-1 ${modalMov === 'Entrada' ? 'btn-success' : 'btn-danger'}`}>
                  {loading ? 'Registrando...' : `Registrar ${modalMov}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
