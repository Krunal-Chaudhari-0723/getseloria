// Run once: node fix-image-urls.js
const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/seloria').then(async () => {
  const products = mongoose.connection.db.collection('products');
  const all = await products.find({}).toArray();
  for (const p of all) {
    const newImages = (p.images || []).map(img =>
      img.startsWith('/uploads/') ? img.replace('/uploads/', '/api/uploads/') : img
    );
    await products.updateOne({ _id: p._id }, { $set: { images: newImages } });
    console.log('Updated:', p.name, '->', newImages);
  }
  await mongoose.disconnect();
  console.log('✅ All image URLs updated');
});
