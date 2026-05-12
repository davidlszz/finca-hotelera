/**
 * Punto de entrada de modelos: define todas las asociaciones (FK) y
 * exporta instancias listas para usar en controladores.
 */
const sequelize = require('../config/database');
const User = require('./User');
const Room = require('./Room');
const Client = require('./Client');
const Reservation = require('./Reservation');
const ReservationDetail = require('./ReservationDetail');
const { InventoryCategory, InventoryProduct, InventoryMovement } = require('./Inventory');

// ── Asociaciones ──────────────────────────────────────────────────
// Reserva pertenece a Cliente y a Usuario (recepcionista)
Reservation.belongsTo(Client,      { foreignKey: 'cliente_id',  as: 'cliente' });
Reservation.belongsTo(User,        { foreignKey: 'usuario_id',  as: 'recepcionista' });
Client.hasMany(Reservation,        { foreignKey: 'cliente_id',  as: 'reservas' });

// Detalle relaciona Reserva <-> Habitación (muchos a muchos)
Reservation.hasMany(ReservationDetail,    { foreignKey: 'reserva_id',    as: 'detalles' });
ReservationDetail.belongsTo(Reservation, { foreignKey: 'reserva_id',    as: 'reserva' });
ReservationDetail.belongsTo(Room,        { foreignKey: 'habitacion_id', as: 'habitacion' });
Room.hasMany(ReservationDetail,          { foreignKey: 'habitacion_id', as: 'detallesReserva' });

// Inventario
InventoryProduct.belongsTo(InventoryCategory, { foreignKey: 'categoria_id', as: 'categoria' });
InventoryCategory.hasMany(InventoryProduct,   { foreignKey: 'categoria_id', as: 'productos' });
InventoryMovement.belongsTo(InventoryProduct, { foreignKey: 'producto_id',  as: 'producto' });
InventoryMovement.belongsTo(User,             { foreignKey: 'usuario_id',   as: 'usuario' });
InventoryProduct.hasMany(InventoryMovement,   { foreignKey: 'producto_id',  as: 'movimientos' });

module.exports = {
  sequelize,
  User,
  Room,
  Client,
  Reservation,
  ReservationDetail,
  InventoryCategory,
  InventoryProduct,
  InventoryMovement,
};
