/**
 * Modelo Usuario - Entidad de autenticación y control de acceso.
 * Seguridad ISO/IEC 27001:
 *   - Contraseñas almacenadas como hash bcrypt (cost factor 12)
 *   - RBAC: roles Admin / Recepcionista
 * Ley 1581 Colombia: campo email marcado para cifrado en producción.
 */
const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: { len: [2, 100] },
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  rol: {
    type: DataTypes.ENUM('Admin', 'Recepcionista'),
    allowNull: false,
    defaultValue: 'Recepcionista',
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'usuarios',
  hooks: {
    // Hash automático antes de crear o actualizar contraseña
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    },
  },
});

// Método de instancia para verificar contraseña
User.prototype.verificarPassword = async function (passwordPlano) {
  return bcrypt.compare(passwordPlano, this.password);
};

// Método para serializar sin exponer el hash
User.prototype.toJSON = function () {
  const values = { ...this.get() };
  delete values.password;
  return values;
};

module.exports = User;
