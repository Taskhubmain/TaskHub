import { Router } from 'express';
import { authenticate } from '../../common/middleware/auth';

const router = Router();

router.get('/', (req, res) => res.json({ orders: [] }));
router.post('/', authenticate, (req, res) => res.json({ message: 'Order created' }));
router.get('/:id', (req, res) => res.json({ order: {} }));

export default router;
