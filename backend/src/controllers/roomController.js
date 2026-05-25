const { Op } = require('sequelize');
const { Room, ReservationDetail, Reservation } = require('../models');

exports.getAll = async (req, res) => {
  try {
    const { estado } = req.query;
    const where = estado ? { estado } : {};
    const rooms = await Room.findAll({ where, order: [['numero', 'ASC']] });
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener habitaciones.' });
  }
};

exports.getById = async (req, res) => {
  try {
    const room = await Room.findByPk(req.params.id);
    if (!room) return res.status(404).json({ error: 'Habitación no encontrada.' });
    res.json(room);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener habitación.' });
  }
};

exports.create = async (req, res) => {
  try {
    const room = await Room.create(req.body);
    res.status(201).json(room);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'El número de habitación ya existe.' });
    }
    res.status(500).json({ error: 'Error al crear habitación.' });
  }
};

exports.update = async (req, res) => {
  try {
    const room = await Room.findByPk(req.params.id);
    if (!room) return res.status(404).json({ error: 'Habitación no encontrada.' });
    await room.update(req.body);
    res.json(room);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar habitación.' });
  }
};

exports.delete = async (req, res) => {
  try {
    const room = await Room.findByPk(req.params.id);
    if (!room) return res.status(404).json({ error: 'Habitación no encontrada.' });
    await room.destroy();
    res.json({ message: 'Habitación eliminada.' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar habitación.' });
  }
};

/**
 * Verifica disponibilidad de habitaciones en un rango de fechas.
 * Retorna habitaciones que NO tienen reservas activas que se solapen.
 */
exports.checkAvailability = async (req, res) => {
  try {
    const { fecha_ingreso, fecha_salida, capacidad_min } = req.query;

    if (!fecha_ingreso || !fecha_salida) {
      return res.status(400).json({ error: 'Se requieren fecha_ingreso y fecha_salida.' });
    }
    if (new Date(fecha_salida) <= new Date(fecha_ingreso)) {
      return res.status(400).json({ error: 'fecha_salida debe ser posterior a fecha_ingreso.' });
    }

    // IDs de habitaciones ocupadas en el rango solicitado
    const detallesOcupados = await ReservationDetail.findAll({
      include: [{
        model: Reservation,
        as: 'reserva',
        where: {
          estado: { [Op.in]: ['Confirmada', 'Check-in'] },
          // Solapamiento: la reserva existente se superpone con el rango pedido
          [Op.and]: [
            { fecha_ingreso: { [Op.lt]: fecha_salida } },
            { fecha_salida:  { [Op.gt]: fecha_ingreso } },
          ],
        },
        required: true,
      }],
      attributes: ['habitacion_id'],
    });

    const idsOcupadas = detallesOcupados.map(d => d.habitacion_id);

    const where = {
      estado: 'Disponible',
      ...(idsOcupadas.length > 0 && { id: { [Op.notIn]: idsOcupadas } }),
      ...(capacidad_min && { capacidad: { [Op.gte]: parseInt(capacidad_min) } }),
    };

    const disponibles = await Room.findAll({ where, order: [['numero', 'ASC']] });
    res.json(disponibles);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al verificar disponibilidad.' });
  }
};

// Marcar limpieza: pone en Mantenimiento
exports.marcarLimpieza = async (req, res) => {
  try {
    const room = await Room.findByPk(req.params.id);
    if (!room) return res.status(404).json({ error: 'Habitación no encontrada.' });
    await room.update({ estado: 'Mantenimiento' });
    res.json(room);
  } catch (err) {
    res.status(500).json({ error: 'Error al marcar limpieza.' });
  }
};

// Marcar limpiada: vuelve a Disponible
exports.marcarLimpiada = async (req, res) => {
  try {
    const room = await Room.findByPk(req.params.id);
    if (!room) return res.status(404).json({ error: 'Habitación no encontrada.' });
    await room.update({ estado: 'Disponible' });
    res.json(room);
  } catch (err) {
    res.status(500).json({ error: 'Error al marcar como limpiada.' });
  }
};

// Reservas futuras de una habitación
exports.getReservasFuturas = async (req, res) => {
  try {
    const hoy = new Date().toISOString().split('T')[0];
    const detalles = await ReservationDetail.findAll({
      where: { habitacion_id: req.params.id },
      include: [{
        model: Reservation,
        as: 'reserva',
        where: {
          fecha_salida: { [Op.gte]: hoy },
          estado: { [Op.in]: ['Confirmada', 'Check-in'] },
        },
        include: [{ association: 'cliente' }],
        required: true,
      }],
      order: [[{ model: Reservation, as: 'reserva' }, 'fecha_ingreso', 'ASC']],
    });
    res.json(detalles.map(d => d.reserva));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener reservas.' });
  }
};
