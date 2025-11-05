const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { faker } = require('@faker-js/faker');
const User = require('../models/User');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const Order = require('../models/Order');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('Error: MONGO_URI is required in .env file');
  process.exit(1);
}

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected, seeding...');

  await Promise.all([
    User.deleteMany({}),
    Product.deleteMany({}),
    Cart.deleteMany({}),
    Order.deleteMany({})
  ]);

  const adminPassword = await User.hashPassword('Admin@12345');
  const admin = await User.create({ name: 'Admin', email: 'admin@example.com', passwordHash: adminPassword, role: 'Admin' });

  const users = [];
  for (let i = 0; i < 5; i++) {
    const passwordHash = await User.hashPassword('Password@123');
    users.push({ name: faker.person.fullName(), email: faker.internet.email().toLowerCase(), passwordHash, role: 'Viewer' });
  }
  const userDocs = await User.insertMany(users);

  const products = [];
  for (let i = 0; i < 30; i++) {
    products.push({
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      price: Number(faker.commerce.price({ min: 5, max: 500 })),
      stock: faker.number.int({ min: 0, max: 200 }),
      images: []
    });
  }
  const productDocs = await Product.insertMany(products);

  for (const u of userDocs) {
    const itemCount = faker.number.int({ min: 1, max: 3 });
    const items = [];
    for (let j = 0; j < itemCount; j++) {
      const p = faker.helpers.arrayElement(productDocs);
      items.push({ product: p._id, quantity: faker.number.int({ min: 1, max: 3 }) });
    }
    await Cart.create({ user: u._id, items });
  }

  for (let k = 0; k < 20; k++) {
    const u = faker.helpers.arrayElement([admin, ...userDocs]);
    const itemCount = faker.number.int({ min: 1, max: 4 });
    const items = [];
    for (let j = 0; j < itemCount; j++) {
      const p = faker.helpers.arrayElement(productDocs);
      items.push({ product: p._id, quantity: faker.number.int({ min: 1, max: 3 }), priceAtPurchase: p.price });
    }
    const total = items.reduce((s, it) => s + it.quantity * it.priceAtPurchase, 0);
    await Order.create({ user: u._id, items, total, status: faker.helpers.arrayElement(['pending', 'paid', 'shipped', 'completed']) });
  }

  console.log('Seeding done.');
  await mongoose.disconnect();
}

run().catch(async (e) => {
  console.error(e);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});

