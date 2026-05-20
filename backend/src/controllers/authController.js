const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { User } = require('../models');

const generateToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, rol: user.rol },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );

exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    const user = await User.findOne({ where: { email, activo: true } });

    if (!user || !(await user.verificarPassword(password))) {
      // Mensaje genérico para no revelar si el email existe (ISO 27001)
      return res.status(401).json({ error: 'Credenciales incorrectas.' });
    }

    const token = generateToken(user);
    res.json({ token, user: user.toJSON() });
  } catch (err) {
    console.error('❌ LOGIN ERROR:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

exports.me = async (req, res) => {
  res.json(req.user.toJSON());
};

exports.changePassword = async (req, res) => {
  try {
    const { password_actual, password_nuevo } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!(await user.verificarPassword(password_actual))) {
      return res.status(400).json({ error: 'Contraseña actual incorrecta.' });
    }
    if (password_nuevo.length < 8) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 8 caracteres.' });
    }

    user.password = password_nuevo;
    await user.save();
    res.json({ message: 'Contraseña actualizada correctamente.' });
  } catch (err) {
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};
