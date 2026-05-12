const { User } = require('../models');

exports.getAll = async (_req, res) => {
  try {
    const users = await User.findAll({ order: [['nombre', 'ASC']] });
    res.json(users);
  } catch { res.status(500).json({ error: 'Error al obtener usuarios.' }); }
};

exports.create = async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'El email ya está registrado.' });
    }
    res.status(500).json({ error: 'Error al crear usuario.' });
  }
};

exports.update = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });
    const { password, ...data } = req.body;
    await user.update(data);
    res.json(user);
  } catch { res.status(500).json({ error: 'Error al actualizar usuario.' }); }
};

exports.toggleActive = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });
    await user.update({ activo: !user.activo });
    res.json(user);
  } catch { res.status(500).json({ error: 'Error al cambiar estado del usuario.' }); }
};
