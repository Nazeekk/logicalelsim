const express = require('express');
const circuitsController = require('../controllers/circuits');
const authMiddleware = require('../middlewares/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/', circuitsController.getAll);
router.post('/', circuitsController.create);
router.get('/:id', circuitsController.getOne);
router.put('/:id', circuitsController.update);
router.delete('/:id', circuitsController.delete);

module.exports = router;
