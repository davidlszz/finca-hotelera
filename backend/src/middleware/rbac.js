/**
 * Middleware RBAC - Control de acceso basado en roles (ISO/IEC 27001 - A.9.2).
 * Uso: router.delete('/users/:id', authenticate, authorize('Admin'), handler)
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.rol)) {
    return res.status(403).json({
      error: 'Acceso denegado. No tiene permisos para esta acción.',
    });
  }
  next();
};

module.exports = { authorize };
