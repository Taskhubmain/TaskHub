import { Router } from 'express';
import { UsersController } from './users.controller';

const router = Router();
const controller = new UsersController();

router.get('/:id', controller.getUserById);
router.get('/by-slug/:slug', controller.getUserBySlug);

export default router;
