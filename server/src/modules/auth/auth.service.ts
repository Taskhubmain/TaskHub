import bcrypt from 'bcrypt';
import prisma from '../../prisma/client';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../common/utils/jwt';
import { AppError } from '../../common/middleware/error';

export class AuthService {
  async register(data: { email: string; password: string; role: 'CLIENT' | 'FREELANCER'; name: string; slug: string; }) {
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) throw new AppError(400, 'User already exists');

    const existingSlug = await prisma.profile.findUnique({ where: { slug: data.slug } });
    if (existingSlug) throw new AppError(400, 'Slug already taken');

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: { email: data.email, passwordHash, role: data.role, profile: { create: { slug: data.slug, name: data.name, skills: [] } } },
      include: { profile: true },
    });

    const accessToken = generateAccessToken({ userId: user.id, email: user.email, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user.id, email: user.email, role: user.role });

    return { user: { id: user.id, email: user.email, role: user.role, profile: user.profile }, accessToken, refreshToken };
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email }, include: { profile: true } });
    if (!user) throw new AppError(401, 'Invalid credentials');

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) throw new AppError(401, 'Invalid credentials');

    const accessToken = generateAccessToken({ userId: user.id, email: user.email, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user.id, email: user.email, role: user.role });

    return { user: { id: user.id, email: user.email, role: user.role, profile: user.profile }, accessToken, refreshToken };
  }

  async refresh(refreshToken: string) {
    const payload = verifyRefreshToken(refreshToken);
    if (!payload) throw new AppError(401, 'Invalid refresh token');

    const user = await prisma.user.findUnique({ where: { id: payload.userId }, include: { profile: true } });
    if (!user) throw new AppError(401, 'User not found');

    const newAccessToken = generateAccessToken({ userId: user.id, email: user.email, role: user.role });
    return { accessToken: newAccessToken };
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { profile: true } });
    if (!user) throw new AppError(404, 'User not found');
    return { id: user.id, email: user.email, role: user.role, profile: user.profile };
  }
}
