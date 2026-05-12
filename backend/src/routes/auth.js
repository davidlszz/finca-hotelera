const { Router } = require('express');
const { body } = require('express-validator');
const { login, me, changePassword } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

const router = Router();

router.post('/login',
  [
    body('email').isEmail().withMessage('Email inválido.'),
    body('password').notEmpty().withMessage('Contraseña requerida.'),
  ],
  login
);

router.get('/me', authenticate, me);
router.put('/change-password', authenticate, changePassword);

module.exports = router;
