// Usage: node reset-user.js <email> <newpassword>
// Example: node reset-user.js chaudharikrunal0223@gmail.com mypassword123
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

const [,, email, newPassword] = process.argv;

if (!email || !newPassword) {
  console.error('Usage: node reset-user.js <email> <newpassword>');
  process.exit(1);
}

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/seloria';

mongoose.connect(uri).then(async () => {
  const users = mongoose.connection.db.collection('users');
  const hashed = await bcrypt.hash(newPassword, 10);
  const result = await users.updateOne(
    { email: email.toLowerCase().trim() },
    { $set: { password: hashed } }
  );
  if (result.matchedCount === 0) {
    console.error(`❌ No user found with email: ${email}`);
  } else {
    console.log(`✅ Password reset — email: ${email}  password: ${newPassword}`);
  }
  await mongoose.disconnect();
}).catch(err => {
  console.error('DB connection failed:', err.message);
  process.exit(1);
});
