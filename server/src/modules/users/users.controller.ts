import { Request, Response, NextFunction } from 'express';
import { UsersService } from './users.service';

const usersService = new UsersService();

export class UsersController {
  async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await usersService.getUserById(req.params.id);
      res.json(result);
    } catch (error) { next(error); }
  }

  async getUserBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await usersService.getUserBySlug(req.params.slug);
      res.json(result);
    } catch (error) { next(error); }
  }
}
