const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Categoría de inventario
const InventoryCategory = sequelize.define('InventoryCategory', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  descripcion: { type: DataTypes.TEXT, allowNull: true },
}, { tableName: 'categorias_inventario' });

// Producto de inventario
const InventoryProduct = sequelize.define('InventoryProduct', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  categoria_id: { type: DataTypes.INTEGER, allowNull: false },
  nombre: { type: DataTypes.STRING(150), allowNull: false },
  unidad_medida: {
    type: DataTypes.ENUM('unidad', 'kg', 'litro', 'caja', 'bolsa', 'paquete'),
    defaultValue: 'unidad',
  },
  stock_actual: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  },
  stock_minimo: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 5,
    comment: 'Nivel mínimo que dispara alerta en el dashboard',
  },
  precio_unitario: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  activo: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'productos_inventario',
  indexes: [{ fields: ['categoria_id'] }, { fields: ['stock_actual'] }],
});

// Movimiento de inventario (Entrada/Salida)
const InventoryMovement = sequelize.define('InventoryMovement', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  producto_id: { type: DataTypes.INTEGER, allowNull: false },
  usuario_id: { type: DataTypes.INTEGER, allowNull: false },
  tipo: {
    type: DataTypes.ENUM('Entrada', 'Salida'),
    allowNull: false,
  },
  cantidad: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: { min: 0.01 },
  },
  motivo: { type: DataTypes.STRING(255), allowNull: true },
  stock_anterior: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  stock_posterior: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
}, {
  tableName: 'movimientos_inventario',
  indexes: [{ fields: ['producto_id'] }, { fields: ['tipo'] }, { fields: ['createdAt'] }],
});

module.exports = { InventoryCategory, InventoryProduct, InventoryMovement };
