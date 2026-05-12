const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Room = sequelize.define('Room', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  numero: {
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: true,
  },
  tipo: {
    type: DataTypes.ENUM('Individual', 'Doble', 'Suite', 'Cabaña', 'Familiar'),
    allowNull: false,
  },
  capacidad: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1, max: 20 },
  },
  precio_noche: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: { min: 0 },
  },
  estado: {
    type: DataTypes.ENUM('Disponible', 'Ocupada', 'Mantenimiento'),
    allowNull: false,
    defaultValue: 'Disponible',
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'habitaciones',
  indexes: [{ fields: ['estado'] }, { fields: ['numero'] }],
});

module.exports = Room;
