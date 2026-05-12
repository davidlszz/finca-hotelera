require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { sequelize, User, Room, Client, Reservation, ReservationDetail, InventoryCategory, InventoryProduct } = require('../src/models');

const seed = async () => {
  // force:true borra y recrea todas las tablas (válido para SQLite y PostgreSQL)
  await sequelize.sync({ force: true });
  console.log('📋 Tablas recreadas.');

  // Usuarios
  await User.bulkCreate([
    { nombre: 'Administrador Principal', email: 'admin@finca.co', password: 'Admin1234!', rol: 'Admin' },
    { nombre: 'Recepcionista Demo', email: 'recep@finca.co', password: 'Recep1234!', rol: 'Recepcionista' },
  ], { individualHooks: true });
  console.log('👥 Usuarios creados.');

  // Habitaciones
  await Room.bulkCreate([
    { numero: '101', tipo: 'Individual',  capacidad: 1, precio_noche: 120000, estado: 'Disponible', descripcion: 'Habitación individual con vista al jardín' },
    { numero: '102', tipo: 'Doble',       capacidad: 2, precio_noche: 180000, estado: 'Disponible', descripcion: 'Habitación doble con balcón' },
    { numero: '103', tipo: 'Doble',       capacidad: 2, precio_noche: 190000, estado: 'Disponible', descripcion: 'Habitación doble con jacuzzi' },
    { numero: '201', tipo: 'Suite',       capacidad: 3, precio_noche: 320000, estado: 'Disponible', descripcion: 'Suite presidencial con sala de estar' },
    { numero: '202', tipo: 'Familiar',    capacidad: 5, precio_noche: 280000, estado: 'Disponible', descripcion: 'Habitación familiar con dos camas dobles' },
    { numero: 'C1',  tipo: 'Cabaña',      capacidad: 6, precio_noche: 450000, estado: 'Disponible', descripcion: 'Cabaña privada con cocina y BBQ' },
    { numero: 'C2',  tipo: 'Cabaña',      capacidad: 6, precio_noche: 450000, estado: 'Mantenimiento', descripcion: 'Cabaña en remodelación' },
    { numero: '301', tipo: 'Suite',       capacidad: 2, precio_noche: 350000, estado: 'Ocupada',    descripcion: 'Luna de miel - suite romántica' },
  ]);
  console.log('🏠 Habitaciones creadas.');

  // Clientes
  const clientes = await Client.bulkCreate([
    { tipo_documento: 'CC', numero_documento: '1234567890', nombres: 'Carlos',    apellidos: 'Rodríguez Pérez',  email: 'carlos.r@email.com', telefono: '3001234567', ciudad: 'Cali' },
    { tipo_documento: 'CC', numero_documento: '0987654321', nombres: 'María',     apellidos: 'González López',   email: 'maria.g@email.com',  telefono: '3109876543', ciudad: 'Bogotá' },
    { tipo_documento: 'CE', numero_documento: 'CE123456',   nombres: 'Jean',      apellidos: 'Dupont',           email: 'jean.d@email.fr',    telefono: '3202345678', ciudad: 'Medellín' },
    { tipo_documento: 'CC', numero_documento: '5678901234', nombres: 'Luisa',     apellidos: 'Martínez Vargas',  email: 'luisa.m@email.com',  telefono: '3154567890', ciudad: 'Cali' },
    { tipo_documento: 'Pasaporte', numero_documento: 'P789456', nombres: 'Emma', apellidos: 'Johnson',           email: 'emma.j@email.com',   telefono: '3167891234', ciudad: 'Buenaventura' },
  ]);
  console.log('👤 Clientes creados.');

  // Reservas demo
  const hoy = new Date();
  const f = (d) => d.toISOString().split('T')[0];
  const addDays = (date, n) => { const d = new Date(date); d.setDate(d.getDate() + n); return d; };

  const admin = await User.findOne({ where: { rol: 'Admin' } });

  const r1 = await Reservation.create({
    cliente_id: clientes[0].id, usuario_id: admin.id,
    fecha_ingreso: f(addDays(hoy, 1)), fecha_salida: f(addDays(hoy, 3)),
    cantidad_huespedes: 2, total: 360000, estado: 'Confirmada',
  });
  await ReservationDetail.create({ reserva_id: r1.id, habitacion_id: 2, precio_noche_aplicado: 180000, noches: 2, subtotal: 360000 });

  const r2 = await Reservation.create({
    cliente_id: clientes[2].id, usuario_id: admin.id,
    fecha_ingreso: f(hoy), fecha_salida: f(addDays(hoy, 2)),
    cantidad_huespedes: 2, total: 700000, estado: 'Check-in',
  });
  await ReservationDetail.create({ reserva_id: r2.id, habitacion_id: 8, precio_noche_aplicado: 350000, noches: 2, subtotal: 700000 });

  console.log('📅 Reservas creadas.');

  // Inventario
  const [alimentos, aseo, ropa, bebidas] = await InventoryCategory.bulkCreate([
    { nombre: 'Alimentos', descripcion: 'Insumos de cocina y alimentos' },
    { nombre: 'Aseo y Limpieza', descripcion: 'Productos de limpieza y aseo' },
    { nombre: 'Ropa de Cama', descripcion: 'Sábanas, toallas, almohadas' },
    { nombre: 'Bebidas', descripcion: 'Bebidas para minibar y restaurante' },
  ]);

  await InventoryProduct.bulkCreate([
    { categoria_id: alimentos.id, nombre: 'Arroz 25kg',         unidad_medida: 'bolsa',   stock_actual: 8,  stock_minimo: 5,  precio_unitario: 75000 },
    { categoria_id: alimentos.id, nombre: 'Aceite 1L',          unidad_medida: 'unidad',  stock_actual: 3,  stock_minimo: 6,  precio_unitario: 12000 },
    { categoria_id: alimentos.id, nombre: 'Huevos (30 und)',    unidad_medida: 'caja',    stock_actual: 4,  stock_minimo: 3,  precio_unitario: 18000 },
    { categoria_id: aseo.id,      nombre: 'Jabón de baño',      unidad_medida: 'unidad',  stock_actual: 25, stock_minimo: 20, precio_unitario: 3500  },
    { categoria_id: aseo.id,      nombre: 'Shampoo 250ml',      unidad_medida: 'unidad',  stock_actual: 12, stock_minimo: 15, precio_unitario: 8000  },
    { categoria_id: aseo.id,      nombre: 'Cloro 5L',           unidad_medida: 'unidad',  stock_actual: 6,  stock_minimo: 4,  precio_unitario: 15000 },
    { categoria_id: ropa.id,      nombre: 'Sábanas dobles',     unidad_medida: 'unidad',  stock_actual: 20, stock_minimo: 16, precio_unitario: 45000 },
    { categoria_id: ropa.id,      nombre: 'Toallas de baño',    unidad_medida: 'unidad',  stock_actual: 18, stock_minimo: 20, precio_unitario: 25000 },
    { categoria_id: bebidas.id,   nombre: 'Agua mineral 600ml', unidad_medida: 'caja',    stock_actual: 10, stock_minimo: 8,  precio_unitario: 24000 },
    { categoria_id: bebidas.id,   nombre: 'Gaseosa 1.5L',       unidad_medida: 'caja',    stock_actual: 2,  stock_minimo: 5,  precio_unitario: 18000 },
  ]);
  console.log('📦 Inventario creado.');

  console.log('\n✅ Seed completado.\n');
  console.log('  👤 Admin:         admin@finca.co   / Admin1234!');
  console.log('  👤 Recepcionista: recep@finca.co  / Recep1234!\n');
  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
