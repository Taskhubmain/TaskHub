import prisma from '../../prisma/client';
import { AppError } from '../../common/middleware/error';

export class UsersService {
  async getUserById(id: string) {
    const user = await prisma.user.findUnique({ where: { id }, include: { profile: true } });
    if (!user) throw new AppError(404, 'User not found');
    return { id: user.id, email: user.email, role: user.role, profile: user.profile };
  }

  async getUserBySlug(slug: string) {
    const profile = await prisma.profile.findUnique({ where: { slug }, include: { user: true } });
    if (!profile) throw new AppError(404, 'User not found');
    return { id: profile.user.id, email: profile.user.email, role: profile.user.role, profile };
  }
}
