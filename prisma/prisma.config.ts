
const connectionString = process.env.DATABASE_URL as string;

export const prismaConfig = {
  adapter: connectionString,
  // if you use Prisma Accelerate instead, swap to:
  // accelerateUrl: connectionString,
};

export default prismaConfig;
