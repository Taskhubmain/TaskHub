import { Router } from 'express';
import { authenticate } from '../../common/middleware/auth';

const router = Router();

router.get('/', authenticate, (req, res) => {
  res.json({ message: 'Module endpoint working', module: 'favorites' });
});

export default router;
