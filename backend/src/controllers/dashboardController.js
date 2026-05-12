const { Op, fn, col, literal } = require('sequelize');
const { Room, Reservation, ReservationDetail, Client, InventoryProduct, sequelize } = require('../models');

exports.getSummary = async (_req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const [
      totalHabitaciones,
      habitacionesDisponibles,
      habitacionesOcupadas,
      habitacionesMantenimiento,
      reservasHoy,
      checkinsHoy,
      totalClientes,
      ingresosDelMes,
      alertasStock,
    ] = await Promise.all([
      Room.count(),
      Room.count({ where: { estado: 'Disponible' } }),
      Room.count({ where: { estado: 'Ocupada' } }),
      Room.count({ where: { estado: 'Mantenimiento' } }),

      Reservation.count({
        where: {
          fecha_ingreso: today,
          estado: { [Op.in]: ['Confirmada', 'Check-in'] },
        },
      }),

      Reservation.count({ where: { estado: 'Check-in' } }),

      Client.count(),

      // Suma de totales de reservas del mes actual (no canceladas)
      Reservation.sum('total', {
        where: {
          estado: { [Op.notIn]: ['Cancelada'] },
          createdAt: {
            [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),

      // Productos con stock <= stock_minimo
      InventoryProduct.findAll({ where: { activo: true } }).then(
        prods => prods.filter(p => parseFloat(p.stock_actual) <= parseFloat(p.stock_minimo)).length
      ),
    ]);

    const tasaOcupacion = totalHabitaciones > 0
      ? Math.round((habitacionesOcupadas / totalHabitaciones) * 100)
      : 0;

    res.json({
      habitaciones: { total: totalHabitaciones, disponibles: habitacionesDisponibles, ocupadas: habitacionesOcupadas, mantenimiento: habitacionesMantenimiento },
      reservas: { hoy: reservasHoy, checkins_activos: checkinsHoy },
      clientes: { total: totalClientes },
      finanzas: { ingresos_mes: ingresosDelMes || 0 },
      inventario: { alertas_stock: alertasStock },
      tasa_ocupacion: tasaOcupacion,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener el resumen del dashboard.' });
  }
};

// Ocupación por día para gráfico (últimos 30 días)
exports.getOccupancyChart = async (_req, res) => {
  try {
    const rooms = await Room.findAll({ attributes: ['id', 'numero', 'tipo', 'estado'] });
    const checkins = await Reservation.findAll({
      where: { estado: 'Check-in' },
      include: [{ model: ReservationDetail, as: 'detalles', attributes: ['habitacion_id'] }],
    });

    res.json({ habitaciones: rooms, checkins_activos: checkins.length });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener datos de ocupación.' });
  }
};
