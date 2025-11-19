import { Router } from 'express';
import { authenticate } from '../../common/middleware/auth';

const router = Router();

router.post('/open', authenticate, (req, res) => res.json({ message: 'Deal opened' }));
router.get('/', authenticate, (req, res) => res.json({ deals: [] }));
router.get('/:id', authenticate, (req, res) => res.json({ deal: {} }));
router.patch('/:id/state', authenticate, (req, res) => res.json({ message: 'Deal state updated' }));

export default router;
