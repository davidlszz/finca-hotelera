# El Mirador — Sistema de Gestión

**Prototipo funcional** · Universidad Santiago de Cali · Proyecto TI 2026  
*Diseño de un prototipo de plataforma web para la gestión de reservas y control administrativo en una finca hotelera*

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Backend | Node.js 20 + Express 4 + Sequelize ORM |
| Base de Datos | SQLite (prototipo) → migrable a PostgreSQL |
| Frontend | React 19 + Vite 6 + Tailwind CSS 3 |
| Autenticación | JWT + bcrypt (ISO/IEC 27001) |
| Gráficos | Recharts |

---

## Instalación y Arranque

### Requisitos
- Node.js ≥ 18
- npm ≥ 9

### 1. Backend

```bash
cd backend
npm install
node database/seed.js      # Crea la BD y carga datos demo
npm run dev                 # Inicia en http://localhost:3001
```

> El seed crea la base de datos SQLite en `backend/database/finca_hotelera.sqlite`.  
> Para re-seedear: `node database/seed.js` (borra y recrea todo).

### 2. Frontend

```bash
cd frontend
npm install
npm run dev                 # Inicia en http://localhost:5173
```

Abrir **http://localhost:5173** en el navegador.

---

## Credenciales Demo

| Rol | Email | Contraseña |
|-----|-------|-----------|
| Administrador | `admin@finca.co` | `Admin1234!` |
| Recepcionista | `recep@finca.co` | `Recep1234!` |

---

## Módulos del Sistema

### Dashboard
- KPIs en tiempo real: tasa de ocupación, reservas del día, ingresos del mes
- Gráfico de estado de habitaciones (disponibles / ocupadas / mantenimiento)
- Mapa visual de habitaciones por color de estado
- Panel de alertas de stock mínimo en inventario

### Reservas
- Creación de reservas con verificación de disponibilidad en tiempo real
- Cálculo automático del total (precio × noches × habitaciones)
- Gestión de estados: Confirmada → Check-in → Check-out / Cancelada
- Al hacer Check-in: habitaciones pasan a "Ocupada" automáticamente
- Al hacer Check-out/Cancelar: habitaciones vuelven a "Disponible"

### Habitaciones
- CRUD completo (solo Admin)
- Filtros por estado
- Vista en tarjetas con información de tipo, capacidad y precio
- Endpoint `/api/rooms/availability?fecha_ingreso=&fecha_salida=` para disponibilidad

### Clientes
- Registro con validación de documento único (Ley 1581)
- Búsqueda en tiempo real por nombre, documento o email
- Historial de reservas por cliente

### Inventario
- Gestión de productos por categoría
- Registro de movimientos de Entrada/Salida con trazabilidad
- Alertas automáticas cuando el stock ≤ stock mínimo
- Historial completo de movimientos con usuario responsable

### Usuarios (solo Admin)
- CRUD de usuarios con roles Admin / Recepcionista
- Activar / desactivar acceso sin eliminar

---

## API REST — Endpoints Principales

```
POST   /api/auth/login                  → Autenticación JWT
GET    /api/dashboard/summary           → KPIs del dashboard

GET    /api/rooms                       → Listar habitaciones
GET    /api/rooms/availability          → Disponibilidad por fechas
POST   /api/rooms                       → Crear (Admin)
PUT    /api/rooms/:id                   → Actualizar (Admin)
DELETE /api/rooms/:id                   → Eliminar (Admin)

GET    /api/clients                     → Listar / buscar
POST   /api/clients                     → Registrar
PUT    /api/clients/:id                 → Actualizar

GET    /api/reservations                → Listar (filtros: estado, fechas)
POST   /api/reservations                → Crear con cálculo automático
PATCH  /api/reservations/:id/estado     → Cambiar estado

GET    /api/inventory/products          → Productos (con stock_bajo=true)
POST   /api/inventory/movements         → Registrar entrada/salida
GET    /api/inventory/alerts            → Productos bajo stock mínimo
```

---

## Seguridad Implementada (ISO/IEC 27001)

- **Cifrado de contraseñas**: bcrypt con cost factor 12
- **Sesiones JWT**: tokens firmados con expiración de 8 horas
- **RBAC**: Control de acceso basado en roles (Admin / Recepcionista)
- **Headers HTTP**: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection
- **Mensajes genéricos**: Login no revela si el email existe o no
- **Transacciones ACID**: Operaciones de reserva e inventario en transacciones

## Protección de Datos (Ley 1581 Colombia)

- Campos de datos personales preparados para cifrado en capa de BD
- `toJSON()` en modelo Usuario nunca expone el hash de contraseña
- Email en Cliente marcado en comentarios como dato sensible

---

## Estructura del Proyecto

```
finca-hotelera/
├── backend/
│   ├── src/
│   │   ├── config/database.js
│   │   ├── models/          (User, Room, Client, Reservation, Inventory...)
│   │   ├── controllers/     (auth, rooms, clients, reservations, inventory, dashboard)
│   │   ├── routes/          (una por módulo)
│   │   ├── middleware/       (auth.js JWT, rbac.js RBAC)
│   │   └── app.js
│   └── database/
│       ├── seed.js
│       └── finca_hotelera.sqlite  (generado al hacer seed)
└── frontend/
    └── src/
        ├── api/axios.js
        ├── context/AuthContext.jsx
        ├── components/layout/
        └── pages/           (Dashboard, Rooms, Clients, Reservations, Inventory, Users)
```

---

## Equipo de Desarrollo

Valeria González Espinosa · Breiner Andrés Hoyos · David López Sánchez  
Michael Moreno Cortés · Santiago Muñoz Vega · Juan Camilo Zapata
