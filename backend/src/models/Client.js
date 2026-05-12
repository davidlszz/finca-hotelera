/**
 * Modelo Cliente - Ley 1581 Colombia (Protección de Datos Personales).
 * Los campos de datos sensibles (nombres, email) están preparados para
 * cifrado en capa de base de datos en producción.
 */
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Client = sequelize.define('Client', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  tipo_documento: {
    type: DataTypes.ENUM('CC', 'CE', 'Pasaporte', 'TI', 'NIT'),
    allowNull: false,
  },
  numero_documento: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
  },
  nombres: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  apellidos: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: true,
    validate: { isEmail: true },
  },
  telefono: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  ciudad: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
}, {
  tableName: 'clientes',
  indexes: [{ fields: ['numero_documento'] }, { fields: ['email'] }],
});

module.exports = Client;
