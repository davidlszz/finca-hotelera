require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');

const app = express();

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

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

// DB init — en producción solo verifica conexión (schema ya existe por seed.js)
// En desarrollo hace sync() para crear tablas automáticamente con SQLite
let dbReady = false;
app.use(async (req, res, next) => {
  if (dbReady) return next();
  try {
    await sequelize.authenticate();
    // sync() solo en SQLite (desarrollo local); en PostgreSQL el esquema
    // ya existe (seed.js + migrate.js) y sync() puede fallar con ENUMs.
    if (sequelize.getDialect() === 'sqlite') {
      await sequelize.sync();
    }
    dbReady = true;
    next();
  } catch (err) {
    console.error('DB init error:', err.message);
    res.status(503).json({ error: 'Base de datos no disponible.' });
  }
});

app.use('/api/auth',         require('./routes/auth'));
app.use('/api/config',       require('./routes/config'));
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

module.exports = app;
