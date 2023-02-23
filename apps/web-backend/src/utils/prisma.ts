import { PrismaClient } from '@codaco/database';

declare global {
  let prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma || new PrismaClient({ log: ['query', 'info'] });

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

async function connectDB() {
  try {
    await prisma.$connect();
    console.log('🚀 Database connected successfully');
  } catch (error) {
    console.log(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

export default connectDB;