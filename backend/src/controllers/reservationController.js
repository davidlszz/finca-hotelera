const { Op } = require('sequelize');
const { Reservation, ReservationDetail, Room, Client, User, sequelize } = require('../models');

// Calcula el número de noches entre dos fechas
const calcNights = (ingreso, salida) => {
  const diff = new Date(salida) - new Date(ingreso);
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

exports.getAll = async (req, res) => {
  try {
    const { estado, fecha_desde, fecha_hasta } = req.query;
    const where = {};
    if (estado) where.estado = estado;
    if (fecha_desde && fecha_hasta) {
      where.fecha_ingreso = { [Op.between]: [fecha_desde, fecha_hasta] };
    }

    const reservations = await Reservation.findAll({
      where,
      include: [
        { model: Client, as: 'cliente' },
        { model: User,   as: 'recepcionista', attributes: ['id', 'nombre'] },
        { model: ReservationDetail, as: 'detalles',
          include: [{ model: Room, as: 'habitacion' }] },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(reservations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener reservas.' });
  }
};

exports.getById = async (req, res) => {
  try {
    const reservation = await Reservation.findByPk(req.params.id, {
      include: [
        { model: Client, as: 'cliente' },
        { model: User,   as: 'recepcionista', attributes: ['id', 'nombre'] },
        { model: ReservationDetail, as: 'detalles',
          include: [{ model: Room, as: 'habitacion' }] },
      ],
    });
    if (!reservation) return res.status(404).json({ error: 'Reserva no encontrada.' });
    res.json(reservation);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener reserva.' });
  }
};

/**
 * Crea una nueva reserva con sus detalles por habitación.
 * Lógica de negocio:
 *   1. Verifica que las habitaciones estén disponibles en el rango.
 *   2. Calcula subtotales por habitación y el total global.
 *   3. Usa transacción para garantizar consistencia (ACID).
 */
exports.create = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { cliente_id, fecha_ingreso, fecha_salida, cantidad_huespedes, habitaciones_ids, observaciones } = req.body;

    if (!habitaciones_ids || habitaciones_ids.length === 0) {
      await t.rollback();
      return res.status(400).json({ error: 'Debe seleccionar al menos una habitación.' });
    }

    const noches = calcNights(fecha_ingreso, fecha_salida);
    if (noches <= 0) {
      await t.rollback();
      return res.status(400).json({ error: 'Las fechas no son válidas.' });
    }

    // Verificar disponibilidad
    const conflictos = await ReservationDetail.findAll({
      include: [{
        model: Reservation, as: 'reserva',
        where: {
          estado: { [Op.in]: ['Confirmada', 'Check-in'] },
          [Op.and]: [
            { fecha_ingreso: { [Op.lt]: fecha_salida } },
            { fecha_salida:  { [Op.gt]: fecha_ingreso } },
          ],
        },
        required: true,
      }],
      where: { habitacion_id: { [Op.in]: habitaciones_ids } },
      transaction: t,
    });

    if (conflictos.length > 0) {
      await t.rollback();
      const ocupadas = [...new Set(conflictos.map(c => c.habitacion_id))];
      return res.status(409).json({
        error: 'Las habitaciones seleccionadas no están disponibles en ese rango de fechas.',
        habitaciones_ocupadas: ocupadas,
      });
    }

    // Obtener habitaciones y calcular total
    const rooms = await Room.findAll({
      where: { id: { [Op.in]: habitaciones_ids } },
      transaction: t,
    });

    let total = 0;
    const detalles = rooms.map(room => {
      const subtotal = parseFloat(room.precio_noche) * noches;
      total += subtotal;
      return {
        habitacion_id: room.id,
        precio_noche_aplicado: room.precio_noche,
        noches,
        subtotal,
      };
    });

    const reservation = await Reservation.create(
      { cliente_id, usuario_id: req.user.id, fecha_ingreso, fecha_salida, cantidad_huespedes, total, observaciones },
      { transaction: t }
    );

    await ReservationDetail.bulkCreate(
      detalles.map(d => ({ ...d, reserva_id: reservation.id })),
      { transaction: t }
    );

    await t.commit();

    const full = await Reservation.findByPk(reservation.id, {
      include: [
        { model: Client, as: 'cliente' },
        { model: ReservationDetail, as: 'detalles', include: [{ model: Room, as: 'habitacion' }] },
      ],
    });
    res.status(201).json(full);
  } catch (err) {
    await t.rollback();
    console.error(err);
    res.status(500).json({ error: 'Error al crear reserva.' });
  }
};

exports.updateEstado = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { estado } = req.body;
    const reservation = await Reservation.findByPk(req.params.id, {
      include: [{ model: ReservationDetail, as: 'detalles' }],
      transaction: t,
    });
    if (!reservation) { await t.rollback(); return res.status(404).json({ error: 'Reserva no encontrada.' }); }

    // Al hacer Check-in: marcar habitaciones como Ocupadas
    if (estado === 'Check-in') {
      const ids = reservation.detalles.map(d => d.habitacion_id);
      await Room.update({ estado: 'Ocupada' }, { where: { id: { [Op.in]: ids } }, transaction: t });
    }
    // Al hacer Check-out o Cancelar: liberar habitaciones
    if (estado === 'Check-out' || estado === 'Cancelada') {
      const ids = reservation.detalles.map(d => d.habitacion_id);
      await Room.update({ estado: 'Disponible' }, { where: { id: { [Op.in]: ids } }, transaction: t });
    }

    await reservation.update({ estado }, { transaction: t });
    await t.commit();
    res.json(reservation);
  } catch (err) {
    await t.rollback();
    res.status(500).json({ error: 'Error al actualizar estado de reserva.' });
  }
};

exports.delete = async (req, res) => {
  try {
    const reservation = await Reservation.findByPk(req.params.id);
    if (!reservation) return res.status(404).json({ error: 'Reserva no encontrada.' });
    if (reservation.estado === 'Check-in') {
      return res.status(400).json({ error: 'No se puede eliminar una reserva en Check-in.' });
    }
    await reservation.destroy();
    res.json({ message: 'Reserva eliminada.' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar reserva.' });
  }
};
