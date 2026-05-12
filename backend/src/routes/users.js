const { Router } = require('express');
const ctrl = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

const router = Router();
router.use(authenticate, authorize('Admin'));

router.get('/',           ctrl.getAll);
router.post('/',          ctrl.create);
router.put('/:id',        ctrl.update);
router.patch('/:id/toggle', ctrl.toggleActive);

module.exports = router;
