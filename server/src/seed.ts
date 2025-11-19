import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  const password = await bcrypt.hash('password123', 10);

  const client = await prisma.user.upsert({
    where: { email: 'client@example.com' },
    update: {},
    create: {
      email: 'client@example.com',
      passwordHash: password,
      role: 'CLIENT',
      profile: {
        create: {
          slug: 'john-client',
          name: 'John Client',
          bio: 'Looking for talented freelancers',
          skills: [],
          location: 'New York, USA',
        },
      },
    },
  });

  const freelancer = await prisma.user.upsert({
    where: { email: 'freelancer@example.com' },
    update: {},
    create: {
      email: 'freelancer@example.com',
      passwordHash: password,
      role: 'FREELANCER',
      profile: {
        create: {
          slug: 'jane-dev',
          name: 'Jane Developer',
          bio: 'Full-stack developer with 5 years experience',
          skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL'],
          location: 'San Francisco, USA',
        },
      },
    },
  });

  const order1 = await prisma.order.create({
    data: {
      clientId: client.id,
      title: 'Build E-commerce Website',
      description: 'Need a full-featured e-commerce platform with payment integration',
      budgetMin: 5000,
      budgetMax: 10000,
      currency: 'USD',
      tags: ['react', 'ecommerce', 'stripe'],
      status: 'OPEN',
    },
  });

  const order2 = await prisma.order.create({
    data: {
      clientId: client.id,
      title: 'Mobile App Development',
      description: 'iOS and Android app for fitness tracking',
      budgetMin: 8000,
      budgetMax: 15000,
      currency: 'USD',
      tags: ['react-native', 'mobile', 'fitness'],
      status: 'OPEN',
    },
  });

  const task1 = await prisma.task.create({
    data: {
      clientId: client.id,
      title: 'Fix React Performance Issues',
      description: 'Optimize slow rendering components',
      price: 500,
      currency: 'USD',
      tags: ['react', 'performance', 'optimization'],
      status: 'OPEN',
    },
  });

  const task2 = await prisma.task.create({
    data: {
      clientId: client.id,
      title: 'Implement Authentication System',
      description: 'JWT-based authentication with refresh tokens',
      price: 800,
      currency: 'USD',
      tags: ['auth', 'jwt', 'security'],
      status: 'OPEN',
    },
  });

  console.log('Seed completed successfully!');
  console.log(`Created users: ${client.email}, ${freelancer.email}`);
  console.log(`Created orders: ${order1.title}, ${order2.title}`);
  console.log(`Created tasks: ${task1.title}, ${task2.title}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
