import { Router } from 'express';
import { authenticate } from '../../common/middleware/auth';

const router = Router();

router.patch('/', authenticate, (req, res) => {
  res.json({ message: 'Profile updated' });
});

export default router;
