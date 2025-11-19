import { Router } from 'express';
import { authenticate } from '../../common/middleware/auth';

const router = Router();

router.get('/sent', authenticate, (req, res) => res.json({ proposals: [] }));
router.get('/received', authenticate, (req, res) => res.json({ proposals: [] }));
router.post('/', authenticate, (req, res) => res.json({ message: 'Proposal created' }));
router.patch('/:id/status', authenticate, (req, res) => res.json({ message: 'Proposal status updated' }));

export default router;
