/**
 * migrate.js — Aplica cambios de esquema sin borrar datos.
 * Ejecutar una vez después del seed cuando se agregan nuevas columnas/tablas.
 * Uso: node database/migrate.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { sequelize } = require('../src/models');

const migrate = async () => {
  await sequelize.authenticate();
  console.log('✅ Conectado a la base de datos.');

  const qi = sequelize.getQueryInterface();
  const dialect = sequelize.getDialect();

  // ── 1. Agregar columna imagen a habitaciones ────────────────────
  try {
    await qi.addColumn('habitaciones', 'imagen', {
      type: dialect === 'postgres'
        ? require('sequelize').DataTypes.TEXT
        : require('sequelize').DataTypes.TEXT('long'),
      allowNull: true,
    });
    console.log('✅ Columna habitaciones.imagen creada.');
  } catch (e) {
    if (e.message.includes('already exists') || e.message.includes('duplicate column')) {
      console.log('ℹ️  habitaciones.imagen ya existe, se omite.');
    } else { throw e; }
  }

  // ── 2. Crear tabla configuracion si no existe ───────────────────
  try {
    await qi.createTable('configuracion', {
      id:        { type: require('sequelize').DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      clave:     { type: require('sequelize').DataTypes.STRING(100), allowNull: false, unique: true },
      valor:     { type: require('sequelize').DataTypes.TEXT('long'), allowNull: true },
      createdAt: { type: require('sequelize').DataTypes.DATE, allowNull: false },
      updatedAt: { type: require('sequelize').DataTypes.DATE, allowNull: false },
    });
    console.log('✅ Tabla configuracion creada.');
  } catch (e) {
    if (e.message.includes('already exists')) {
      console.log('ℹ️  Tabla configuracion ya existe, se omite.');
    } else { throw e; }
  }

  console.log('\n✅ Migración completada.');
  process.exit(0);
};

migrate().catch(err => { console.error('❌ Error en migración:', err.message); process.exit(1); });
