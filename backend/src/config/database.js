/**
 * Configuración de la base de datos con Sequelize.
 * - LOCAL:      SQLite (sin servidor, archivo .sqlite)
 * - PRODUCCIÓN: PostgreSQL via DATABASE_URL (Neon, Railway, Render...)
 *               ISO/IEC 27001 - A.10: la URL incluye credenciales cifradas en tránsito (SSL).
 */
const { Sequelize } = require('sequelize');
const path = require('path');

let sequelize;

if (process.env.DATABASE_URL) {
  // PostgreSQL — Neon / Railway / Render
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false, // Neon usa certificados auto-firmados
      },
    },
    logging: false,
    define: { timestamps: true, underscored: false },
  });
} else {
  // SQLite — desarrollo local
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '../../database/finca_hotelera.sqlite'),
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: { timestamps: true, underscored: false },
  });
}

module.exports = sequelize;
