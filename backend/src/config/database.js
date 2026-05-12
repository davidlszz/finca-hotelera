/**
 * Configuración de la base de datos con Sequelize.
 * - LOCAL:      SQLite (sin servidor, archivo .sqlite)
 * - PRODUCCIÓN: PostgreSQL via DATABASE_URL (Neon, Railway, Render...)
 */
const { Sequelize } = require('sequelize');
const path = require('path');

let sequelize;

if (process.env.DATABASE_URL) {
  // PostgreSQL — Neon / Railway / Render
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: { require: true, rejectUnauthorized: false },
    },
    logging: false,
    define: { timestamps: true, underscored: false },
    // Pool optimizado para serverless (Vercel crea/destruye instancias)
    pool: { max: 2, min: 0, acquire: 30000, idle: 10000 },
  });
} else {
  // SQLite — solo desarrollo local (sqlite3 es optionalDependency)
  try {
    sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: path.join(__dirname, '../../database/finca_hotelera.sqlite'),
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      define: { timestamps: true, underscored: false },
    });
  } catch (e) {
    throw new Error('SQLite no disponible y DATABASE_URL no configurada.');
  }
}

module.exports = sequelize;
