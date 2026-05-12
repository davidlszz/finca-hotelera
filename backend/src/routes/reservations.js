const { Router } = require('express');
const ctrl = require('../controllers/reservationController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

const router = Router();
router.use(authenticate);

router.get('/',               ctrl.getAll);
router.get('/:id',            ctrl.getById);
router.post('/',              ctrl.create);
router.patch('/:id/estado',   ctrl.updateEstado);
router.delete('/:id',         authorize('Admin'), ctrl.delete);

module.exports = router;
