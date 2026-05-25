/**
 * configController — Gestiona configuración clave-valor en la tabla `configuracion`.
 * Reemplaza el enfoque de filesystem (no compatible con Render/Vercel).
 */
const { sequelize } = require('../models');
const { QueryTypes } = require('sequelize');

const getAll = async () => {
  const rows = await sequelize.query(
    'SELECT clave, valor FROM configuracion',
    { type: QueryTypes.SELECT }
  );
  return rows.reduce((acc, r) => { acc[r.clave] = r.valor; return acc; }, {});
};

exports.getConfig = async (req, res) => {
  try {
    res.json(await getAll());
  } catch (err) {
    console.error('getConfig error:', err.message);
    res.status(500).json({ error: 'Error al leer configuración.' });
  }
};

exports.updateConfig = async (req, res) => {
  try {
    for (const [clave, valor] of Object.entries(req.body)) {
      const dialect = sequelize.getDialect();
      if (dialect === 'postgres') {
        await sequelize.query(
          `INSERT INTO configuracion (clave, valor, "createdAt", "updatedAt")
           VALUES (:clave, :valor, NOW(), NOW())
           ON CONFLICT (clave) DO UPDATE SET valor = :valor, "updatedAt" = NOW()`,
          { replacements: { clave, valor }, type: QueryTypes.UPSERT }
        );
      } else {
        // SQLite
        await sequelize.query(
          `INSERT OR REPLACE INTO configuracion (clave, valor, createdAt, updatedAt)
           VALUES (:clave, :valor, datetime('now'), datetime('now'))`,
          { replacements: { clave, valor }, type: QueryTypes.INSERT }
        );
      }
    }
    res.json(await getAll());
  } catch (err) {
    console.error('updateConfig error:', err.message);
    res.status(500).json({ error: 'Error al guardar configuración.' });
  }
};
