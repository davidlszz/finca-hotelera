const { Op } = require('sequelize');
const { Client, Reservation } = require('../models');

exports.getAll = async (req, res) => {
  try {
    const { search } = req.query;
    const where = search
      ? {
          [Op.or]: [
            { nombres:          { [Op.like]: `%${search}%` } },
            { apellidos:        { [Op.like]: `%${search}%` } },
            { numero_documento: { [Op.like]: `%${search}%` } },
            { email:            { [Op.like]: `%${search}%` } },
          ],
        }
      : {};
    const clients = await Client.findAll({ where, order: [['apellidos', 'ASC']] });
    res.json(clients);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener clientes.' });
  }
};

exports.getById = async (req, res) => {
  try {
    const client = await Client.findByPk(req.params.id, {
      include: [{ model: Reservation, as: 'reservas', limit: 10, order: [['createdAt', 'DESC']] }],
    });
    if (!client) return res.status(404).json({ error: 'Cliente no encontrado.' });
    res.json(client);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener cliente.' });
  }
};

exports.create = async (req, res) => {
  try {
    const client = await Client.create(req.body);
    res.status(201).json(client);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Ya existe un cliente con ese número de documento.' });
    }
    res.status(500).json({ error: 'Error al crear cliente.' });
  }
};

exports.update = async (req, res) => {
  try {
    const client = await Client.findByPk(req.params.id);
    if (!client) return res.status(404).json({ error: 'Cliente no encontrado.' });
    await client.update(req.body);
    res.json(client);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar cliente.' });
  }
};

exports.delete = async (req, res) => {
  try {
    const client = await Client.findByPk(req.params.id);
    if (!client) return res.status(404).json({ error: 'Cliente no encontrado.' });
    const reservas = await Reservation.count({ where: { cliente_id: client.id } });
    if (reservas > 0) {
      return res.status(400).json({ error: 'No se puede eliminar: el cliente tiene reservas registradas.' });
    }
    await client.destroy();
    res.json({ message: 'Cliente eliminado.' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar cliente.' });
  }
};
