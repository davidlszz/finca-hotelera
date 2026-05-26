const { Router } = require('express');
const ctrl = require('../controllers/inventoryController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

const router = Router();
router.use(authenticate);

router.get('/alerts',              ctrl.getLowStockAlerts);
router.get('/categories',          ctrl.getCategories);
router.post('/categories',         authorize('Admin'), ctrl.createCategory);
router.get('/products',            ctrl.getProducts);
router.post('/products',           authorize('Admin'), ctrl.createProduct);
router.put('/products/:id',        authorize('Admin'), ctrl.updateProduct);
router.get('/movements',           ctrl.getMovements);
router.post('/movements',          authorize('Admin'), ctrl.registerMovement);

module.exports = router;
