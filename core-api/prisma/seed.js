'use strict';
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// Default demo merchant — used to own all seeded products/policies.
// The password is hashed here at seed time so fresh volumes always work.
const DEMO_EMAIL    = 'demo@demo.com';
const DEMO_PASSWORD = 'Demo1234!';
const DEMO_NAME     = 'Demo Merchant';

const products = [
  { sku: 'MOU-001', name: 'Wireless Mouse',              price:  649, stock: 12, category: 'electronics', active: true },
  { sku: 'KBD-001', name: 'Mechanical Keyboard',         price: 2499, stock:  8, category: 'electronics', active: true },
  { sku: 'MON-001', name: '24-inch LED Monitor',         price: 8999, stock:  5, category: 'electronics', active: true },
  { sku: 'USB-001', name: 'USB-C Hub 7-in-1',            price:  999, stock: 20, category: 'accessories', active: true },
  { sku: 'CAB-001', name: 'USB-C Charging Cable 2m',     price:  299, stock: 50, category: 'accessories', active: true },
  { sku: 'BAG-001', name: 'Laptop Backpack 15.6"',       price: 1499, stock: 15, category: 'bags',        active: true },
  { sku: 'WEB-001', name: '1080p Webcam',                price: 1999, stock:  7, category: 'electronics', active: true },
  { sku: 'SPK-001', name: 'Bluetooth Speaker',           price: 1299, stock: 10, category: 'audio',       active: true },
  { sku: 'HDN-001', name: 'Noise Cancelling Headphones', price: 3499, stock:  6, category: 'audio',       active: true },
  { sku: 'PAD-001', name: 'XL Desk Mouse Pad',           price:  449, stock: 30, category: 'accessories', active: true },
  { sku: 'SSD-001', name: 'Portable SSD 1TB',            price: 4999, stock:  4, category: 'storage',     active: true },
  { sku: 'PWR-001', name: '65W GaN Charger',             price:  799, stock: 18, category: 'accessories', active: true },
  { sku: 'STD-001', name: 'Laptop Stand Aluminium',      price:  899, stock: 14, category: 'accessories', active: true },
  { sku: 'LMP-001', name: 'LED Desk Lamp with USB',      price:  599, stock: 22, category: 'lighting',    active: true },
  { sku: 'CAM-001', name: 'Phone Camera Lens Kit',       price:  349, stock: 25, category: 'photography', active: false },
];

const defaultPolicy = {
  maxOrderAmount: 4000,
  allowedSkus: [
    'MOU-001','KBD-001','USB-001','CAB-001','BAG-001',
    'WEB-001','SPK-001','HDN-001','PAD-001',
    'PWR-001','STD-001','LMP-001',
  ],
  maxOrdersPerSession: 3,
};

async function main() {
  // Upsert demo merchant
  console.log('Seeding demo merchant…');
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const merchant = await prisma.merchant.upsert({
    where:  { email: DEMO_EMAIL },
    update: { passwordHash: hash, name: DEMO_NAME },
    create: { email: DEMO_EMAIL, passwordHash: hash, name: DEMO_NAME },
  });
  console.log(`Demo merchant id: ${merchant.id} / email: ${merchant.email}`);
  console.log(`Demo password: ${DEMO_PASSWORD}`);

  // Seed products owned by the demo merchant
  console.log('Seeding products…');
  for (const p of products) {
    await prisma.product.upsert({
      where:  { sku: p.sku },
      update: { ...p, merchantId: merchant.id },
      create: { ...p, merchantId: merchant.id },
    });
  }
  console.log(`Seeded ${products.length} products.`);

  // Seed default policy owned by the demo merchant
  console.log('Seeding default policy…');
  const existing = await prisma.policy.findFirst({ where: { merchantId: merchant.id } });
  if (!existing) {
    await prisma.policy.create({ data: { ...defaultPolicy, merchantId: merchant.id } });
    console.log('Default policy created.');
  } else {
    await prisma.policy.update({
      where: { id: existing.id },
      data:  { ...defaultPolicy, merchantId: merchant.id },
    });
    console.log('Default policy updated.');
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
