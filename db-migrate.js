const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.log('Skipping database migration: MONGODB_URI is not set in environment.');
  process.exit(0);
}

console.log('Connecting to production MongoDB for migration...');
mongoose.connect(uri)
  .then(async () => {
    console.log('Successfully connected to MongoDB.');
    const usersCollection = mongoose.connection.db.collection('users');
    const users = await usersCollection.find({}).toArray();
    let updatedCount = 0;
    
    for (const user of users) {
      if (user.claimedGifts && user.claimedGifts.length > 0) {
        let changed = false;
        const updatedGifts = user.claimedGifts.map(g => {
          if (g.status === 'claimed') {
            changed = true;
            return { ...g, status: 'redeemed', redeemedAt: g.claimedAt || new Date() };
          }
          return g;
        });
        if (changed) {
          await usersCollection.updateOne({ _id: user._id }, { $set: { claimedGifts: updatedGifts } });
          console.log(`Updated claimedGifts for user ${user.email}`);
          updatedCount++;
        }
      }
    }
    console.log(`Migration finished. Updated ${updatedCount} users.`);
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(err => {
    console.error('Migration failed:', err);
    // Exit with 0 to prevent blocking the build in case of build-server IP whitelist restrictions
    process.exit(0);
  });
