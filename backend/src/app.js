require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');

const app = express();

// ── Seguridad headers ─────────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// CORS: soporta múltiples orígenes separados por coma en FRONTEND_URL
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(o => o.trim())
  : ['http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── DB lazy-init para Vercel serverless (se ejecuta una sola vez por instancia) ──
let dbReady = false;
app.use(async (req, res, next) => {
  if (dbReady) return next();
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    dbReady = true;
    next();
  } catch (err) {
    console.error('DB init error:', err);
    res.status(503).json({ error: 'Base de datos no disponible.' });
  }
});

// ── Rutas API ─────────────────────────────────────────────────────
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/dashboard',    require('./routes/dashboard'));
app.use('/api/rooms',        require('./routes/rooms'));
app.use('/api/clients',      require('./routes/clients'));
app.use('/api/reservations', require('./routes/reservations'));
app.use('/api/inventory',    require('./routes/inventory'));
app.use('/api/users',        require('./routes/users'));

app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date() }));

app.use((_req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }));
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor.' });
});

// Arranque local (node src/app.js  o  npm run dev)
if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  sequelize.authenticate()
    .then(() => sequelize.sync())
    .then(() => {
      dbReady = true;
      console.log('✅ Base de datos sincronizada.');
      app.listen(PORT, () => console.log(`🚀 API corriendo en http://localhost:${PORT}`));
    })
    .catch(err => { console.error('❌ Error al iniciar:', err); process.exit(1); });
}

// Exportación para Vercel serverless
module.exports = app;
