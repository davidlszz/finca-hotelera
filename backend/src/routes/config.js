const router                      = require('express').Router();
const { authenticate }            = require('../middleware/auth');
const { authorize }               = require('../middleware/rbac');
const { getConfig, updateConfig } = require('../controllers/configController');

router.get('/',  authenticate, getConfig);
router.put('/',  authenticate, authorize('Admin'), updateConfig);

module.exports = router;
