// Tabla pivote Reserva <-> Habitación (relación muchos-a-muchos)
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ReservationDetail = sequelize.define('ReservationDetail', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  reserva_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  habitacion_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  precio_noche_aplicado: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  noches: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  subtotal: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
}, {
  tableName: 'detalle_reservas',
  indexes: [{ fields: ['reserva_id'] }, { fields: ['habitacion_id'] }],
});

module.exports = ReservationDetail;
