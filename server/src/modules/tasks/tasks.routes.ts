import { Router } from 'express';
import { authenticate } from '../../common/middleware/auth';

const router = Router();

router.get('/', (req, res) => res.json({ tasks: [] }));
router.post('/', authenticate, (req, res) => res.json({ message: 'Task created' }));
router.get('/:id', (req, res) => res.json({ task: {} }));

export default router;
