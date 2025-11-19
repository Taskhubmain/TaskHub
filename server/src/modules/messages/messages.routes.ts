import { Router } from 'express';
import { authenticate } from '../../common/middleware/auth';

const router = Router();

router.get('/:threadId/messages', authenticate, (req, res) => {
  res.json({ messages: [] });
});

router.post('/:threadId/messages', authenticate, (req, res) => {
  res.json({ message: 'Message sent' });
});

export default router;
