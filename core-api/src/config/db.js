const { PrismaClient } = require('@prisma/client');

// Singleton pattern: re-use the same client across the process.
// In development, attach to globalThis to survive hot-reloads without
// exhausting Postgres connection slots.
let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: ['warn', 'error'],
    });
  }
  prisma = global.__prisma;
}

module.exports = prisma;
