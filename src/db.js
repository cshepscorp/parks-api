import { PrismaClient } from '@prisma/client';
// import pkg from '@prisma/client'
// import { PrismaPg } from '@prisma/adapter-pg';

// const { PrismaClient } = pkg;

// const adapter = new PrismaPg({
//     connectionString: process.env.DATABASE_URL
// });

// const prisma = new PrismaClient({ adapter })

const prisma = new PrismaClient();

export default prisma;