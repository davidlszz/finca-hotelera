const { Router } = require('express');
const ctrl = require('../controllers/roomController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

const router = Router();
router.use(authenticate);

router.get('/availability', ctrl.checkAvailability);
router.get('/',       ctrl.getAll);
router.get('/:id',    ctrl.getById);
router.post('/',      authorize('Admin'), ctrl.create);
router.put('/:id',    authorize('Admin'), ctrl.update);
router.delete('/:id', authorize('Admin'), ctrl.delete);

module.exports = router;
