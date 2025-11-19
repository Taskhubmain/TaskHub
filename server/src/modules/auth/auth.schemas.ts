import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['CLIENT', 'FREELANCER']),
  name: z.string().min(2),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const refreshSchema = z.object({
  refreshToken: z.string(),
});
