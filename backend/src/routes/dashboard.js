const { Router } = require('express');
const ctrl = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');

const router = Router();
router.use(authenticate);

router.get('/summary',   ctrl.getSummary);
router.get('/occupancy', ctrl.getOccupancyChart);

module.exports = router;
