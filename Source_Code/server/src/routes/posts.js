const router = require('express').Router();
const c = require('../controllers/postController');
const v = require('../middleware/validate');

router.get('/', v.validateList, c.list);
router.post('/', v.validateCreate, c.create);
router.get('/:id', v.validateId, c.getOne);
router.put('/:id', v.validateUpdate, c.update);
router.patch('/:id', v.validateUpdate, c.update);
router.delete('/:id', v.validateId, c.remove);

module.exports = router;
