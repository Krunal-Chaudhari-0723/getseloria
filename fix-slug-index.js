// Run once with: node fix-slug-index.js
const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://127.0.0.1:27017/seloria';

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db;
  const products = db.collection('products');

  try {
    await products.dropIndex('slug_1');
    console.log('✅ Dropped slug_1 index  products can now be created normally');
  } catch (e) {
    if (e.code === 27) {
      console.log('ℹ️  slug_1 index does not exist — nothing to drop');
    } else {
      throw e;
    }
  }

  await mongoose.disconnect();
}

main().catch(console.error);
