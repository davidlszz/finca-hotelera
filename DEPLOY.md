# 🚀 Guía de Deploy — Vercel + Neon PostgreSQL

> Tiempo estimado: 15 minutos. Todo gratis.

---

## Paso 1 — Base de datos PostgreSQL gratis en Neon

1. Ir a **https://neon.tech** → crear cuenta gratuita
2. Crear un nuevo proyecto → nombre: `finca-hotelera`
3. En el dashboard, copiar la **Connection string**:
   ```
   postgresql://user:password@ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. Guardar ese string — lo usaremos como `DATABASE_URL`

---

## Paso 2 — Subir el código a GitHub

En la raíz del proyecto (`finca-hotelera/`):

```bash
git init
git add .
git commit -m "feat: prototipo finca hotelera USC 2026"
```

Crear un repositorio en GitHub (puede ser privado) y hacer push:

```bash
git remote add origin https://github.com/TU_USUARIO/finca-hotelera.git
git push -u origin main
```

> ⚠️ Verifica que `.gitignore` esté bloqueando `.env` y `*.sqlite` antes del push.

---

## Paso 3 — Deploy del Backend en Vercel

1. Ir a **https://vercel.com** → New Project → importar el repo de GitHub
2. En **"Root Directory"** escribir: `backend`
3. Framework Preset: **Other**
4. En **Environment Variables** agregar:

   | Variable | Valor |
   |----------|-------|
   | `DATABASE_URL` | `postgresql://...` (el de Neon) |
   | `JWT_SECRET` | Una cadena larga y aleatoria |
   | `JWT_EXPIRES_IN` | `8h` |
   | `NODE_ENV` | `production` |
   | `FRONTEND_URL` | (dejar vacío por ahora, llenar después) |

5. Clic en **Deploy** → esperar ~1 min
6. Copiar la URL del backend, ej: `https://finca-hotelera-api.vercel.app`

### Poblar la base de datos Neon (seed)

Con la URL de Neon en `.env` local:

```bash
cd backend
# Agregar DATABASE_URL al .env local (solo para el seed)
echo 'DATABASE_URL=postgresql://...' >> .env
node database/seed.js
```

Luego quitar esa línea del `.env` local para no romper el desarrollo con SQLite.

---

## Paso 4 — Deploy del Frontend en Vercel

1. En Vercel → New Project → mismo repo
2. **Root Directory**: `frontend`
3. Framework Preset: **Vite**
4. Environment Variables:

   | Variable | Valor |
   |----------|-------|
   | `VITE_API_URL` | `https://finca-hotelera-api.vercel.app/api` |

5. Deploy → copiar la URL del frontend, ej: `https://finca-hotelera.vercel.app`

---

## Paso 5 — Conectar frontend ↔ backend (CORS)

1. En el proyecto del **backend** en Vercel → Settings → Environment Variables
2. Actualizar `FRONTEND_URL` con la URL del frontend:
   ```
   https://finca-hotelera.vercel.app
   ```
3. Ir a **Deployments** → hacer **Redeploy** del backend

---

## Resultado Final

| Servicio | URL |
|---------|-----|
| Frontend | `https://finca-hotelera.vercel.app` |
| Backend API | `https://finca-hotelera-api.vercel.app/api` |
| Health check | `https://finca-hotelera-api.vercel.app/api/health` |

---

## Notas

- **Neon free tier**: 0.5 GB storage, conexiones ilimitadas, perfecto para el prototipo.
- **Vercel free tier**: 100 GB bandwidth/mes, funciones serverless ilimitadas.
- **Cold start**: la primera request tras inactividad puede tardar ~2s (normal en serverless).
- Para re-seedear producción: ejecutar `node database/seed.js` con `DATABASE_URL` de Neon en el `.env` local.
