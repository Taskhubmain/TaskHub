import { Router } from 'express';
import { authenticate } from '../../common/middleware/auth';

const router = Router();

router.get('/', authenticate, (req, res) => {
  res.json({ threads: [] });
});

router.post('/', authenticate, (req, res) => {
  res.json({ message: 'Thread created' });
});

export default router;
