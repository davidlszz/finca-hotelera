import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(form.email, form.password);
    if (result.ok) {
      toast.success('¡Bienvenido!');
      navigate('/');
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-finca-dark via-finca-mid to-finca-light flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <img src="/LOGO_MIRADOR.png" alt="Logo Mirador" className="logo mx-auto block" />
          <p className="text-green-200 mt-1">Sistema de Gestión Administrativa</p>
        </div>

        {/* Card */}
        <div className="card">
          <h2 className="section-title mb-6 text-center">Iniciar Sesión</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-group">
              <label className="label">Correo electrónico</label>
              <input
                type="email"
                className="input"
                placeholder="usuario@finca.co"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="label">Contraseña</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5 mt-2">
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
          <div className="mt-4 p-3 bg-green-50 rounded-lg text-xs text-gray-600">
            <p className="font-medium mb-1 text-gray-700">Demo:</p>
            <p>Admin: <span className="font-mono">admin@finca.co</span> / <span className="font-mono">Admin1234!</span></p>
            <p>Recep: <span className="font-mono">recep@finca.co</span> / <span className="font-mono">Recep1234!</span></p>
          </div>
        </div>

        <p className="text-center text-green-300 text-xs mt-4">
          Universidad Santiago de Cali · Proyecto TI 2026
        </p>
      </div>
    </div>
  );
}
