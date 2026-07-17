// Run this once with: node reset-admin.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = 'mongodb://127.0.0.1:27017/seloria';

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db;
  const users = db.collection('users');

  const hashed = await bcrypt.hash('02230223', 10);

  await users.deleteOne({ email: 'admin@gmail.com' });

  await users.insertOne({
    name: 'Admin',
    email: 'admin@gmail.com',
    password: hashed,
    role: 'admin',
    createdAt: new Date(),
  });

  const admin = await users.findOne({ email: 'admin@gmail.com' });
  const ok = await bcrypt.compare('02230223', admin.password);

  console.log('✅ Admin created');
  console.log('   Email:', admin.email);
  console.log('   Role:', admin.role);
  console.log('   Password verified:', ok);

  await mongoose.disconnect();
}

main().catch(console.error);
