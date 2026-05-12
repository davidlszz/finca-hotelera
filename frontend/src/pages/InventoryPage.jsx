import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { PlusIcon, ArrowUpIcon, ArrowDownIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const formatCOP = (n) => n
  ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n)
  : '—';

export default function InventoryPage() {
  const [products, setProducts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [movements, setMovements] = useState([]);
  const [tab, setTab]             = useState('productos');
  const [modalProd, setModalProd] = useState(false);
  const [modalMov, setModalMov]   = useState(null); // 'Entrada' | 'Salida' | null
  const [selProduct, setSelProduct] = useState(null);
  const [loading, setLoading]     = useState(false);
  const { isAdmin }               = useAuth();

  const [formProd, setFormProd]   = useState({ categoria_id: '', nombre: '', unidad_medida: 'unidad', stock_actual: 0, stock_minimo: 5, precio_unitario: '' });
  const [formMov, setFormMov]     = useState({ cantidad: '', motivo: '' });

  const loadProducts = () => api.get('/inventory/products').then(r => setProducts(r.data)).catch(() => {});
  const loadMovements = () => api.get('/inventory/movements').then(r => setMovements(r.data)).catch(() => {});

  useEffect(() => {
    loadProducts();
    loadMovements();
    api.get('/inventory/categories').then(r => setCategories(r.data)).catch(() => {});
  }, []);

  const saveProd = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/inventory/products', formProd);
      toast.success('Producto creado.');
      setModalProd(false); loadProducts();
    } catch (err) { toast.error(err.response?.data?.error || 'Error.'); }
    finally { setLoading(false); }
  };

  const registrarMov = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/inventory/movements', {
        producto_id: selProduct.id, tipo: modalMov, ...formMov,
      });
      toast.success(`${modalMov} registrada.`);
      setModalMov(null); loadProducts(); loadMovements();
    } catch (err) { toast.error(err.response?.data?.error || 'Error.'); }
    finally { setLoading(false); }
  };

  const bajosStock = products.filter(p => parseFloat(p.stock_actual) <= parseFloat(p.stock_minimo));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Inventario</h1>
          {bajosStock.length > 0 && (
            <p className="flex items-center gap-1 text-sm text-yellow-600 mt-1">
              <ExclamationTriangleIcon className="w-4 h-4" />
              {bajosStock.length} producto(s) con stock bajo
            </p>
          )}
        </div>
        {isAdmin && (
          <button className="btn-primary btn-sm" onClick={() => {
            setFormProd({ categoria_id: categories[0]?.id || '', nombre: '', unidad_medida: 'unidad', stock_actual: 0, stock_minimo: 5, precio_unitario: '' });
            setModalProd(true);
          }}>
            <PlusIcon className="w-4 h-4" /> Nuevo Producto
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {['productos', 'movimientos'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${
              tab === t ? 'border-finca-mid text-finca-mid' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'productos' && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Stock Actual</th>
                <th>Stock Mínimo</th>
                <th>Precio Unitario</th>
                <th>Estado</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => {
                const bajo = parseFloat(p.stock_actual) <= parseFloat(p.stock_minimo);
                return (
                  <tr key={p.id}>
                    <td className="font-medium">{p.nombre}</td>
                    <td className="text-gray-500">{p.categoria?.nombre}</td>
                    <td>
                      <span className={`font-bold ${bajo ? 'text-red-600' : 'text-gray-800'}`}>
                        {p.stock_actual} {p.unidad_medida}
                      </span>
                    </td>
                    <td className="text-gray-500">{p.stock_minimo} {p.unidad_medida}</td>
                    <td>{formatCOP(p.precio_unitario)}</td>
                    <td>
                      <span className={`badge ${bajo ? 'badge-red' : 'badge-green'}`}>
                        {bajo ? '⚠ Stock bajo' : 'OK'}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-1 justify-end">
                        <button className="btn-success btn-sm" onClick={() => { setSelProduct(p); setFormMov({ cantidad: '', motivo: '' }); setModalMov('Entrada'); }}>
                          <ArrowUpIcon className="w-3.5 h-3.5" /> Entrada
                        </button>
                        <button className="btn-secondary btn-sm" onClick={() => { setSelProduct(p); setFormMov({ cantidad: '', motivo: '' }); setModalMov('Salida'); }}>
                          <ArrowDownIcon className="w-3.5 h-3.5" /> Salida
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'movimientos' && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Producto</th>
                <th>Tipo</th>
                <th>Cantidad</th>
                <th>Stock Ant.</th>
                <th>Stock Post.</th>
                <th>Motivo</th>
                <th>Usuario</th>
              </tr>
            </thead>
            <tbody>
              {movements.length === 0 && (
                <tr><td colSpan="8" className="text-center text-gray-400 py-8">Sin movimientos registrados.</td></tr>
              )}
              {movements.map(m => (
                <tr key={m.id}>
                  <td className="text-xs text-gray-500">{new Date(m.createdAt).toLocaleDateString('es-CO')}</td>
                  <td className="font-medium">{m.producto?.nombre}</td>
                  <td>
                    <span className={`badge ${m.tipo === 'Entrada' ? 'badge-green' : 'badge-red'}`}>
                      {m.tipo === 'Entrada' ? '↑' : '↓'} {m.tipo}
                    </span>
                  </td>
                  <td className="font-bold">{m.cantidad}</td>
                  <td className="text-gray-500">{m.stock_anterior}</td>
                  <td className="text-gray-500">{m.stock_posterior}</td>
                  <td className="text-gray-500 text-xs">{m.motivo || '—'}</td>
                  <td className="text-xs text-gray-500">{m.usuario?.nombre}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
