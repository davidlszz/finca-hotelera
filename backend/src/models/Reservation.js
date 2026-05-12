const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Reservation = sequelize.define('Reservation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  cliente_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  fecha_ingreso: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  fecha_salida: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      esDespuesDeIngreso(value) {
        if (new Date(value) <= new Date(this.fecha_ingreso)) {
          throw new Error('La fecha de salida debe ser posterior al ingreso.');
        }
      },
    },
  },
  cantidad_huespedes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1 },
  },
  total: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
  },
  estado: {
    type: DataTypes.ENUM('Confirmada', 'Cancelada', 'Check-in', 'Check-out'),
    allowNull: false,
    defaultValue: 'Confirmada',
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'reservas',
  indexes: [
    { fields: ['estado'] },
    { fields: ['fecha_ingreso', 'fecha_salida'] },
    { fields: ['cliente_id'] },
  ],
});

module.exports = Reservation;
