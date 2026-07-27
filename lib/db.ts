import mongoose, { Mongoose } from 'mongoose';
import bcrypt from 'bcryptjs';

declare global {
  var mongoose: {
    conn: Mongoose | null;
    promise: Promise<Mongoose> | null;
  };
}

const MONGODB_URI = process.env.MONGODB_URI;

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function seedAdmin() {
  try {
    const User = (await import('./models/User')).default;
    const existing = await User.findOne({ email: 'admin@gmail.com' }).select('_id').lean();
    if (existing) return; // skip bcrypt if admin already exists
    const hashed = await bcrypt.hash('02230223', 10);
    await User.create({ name: 'Admin', email: 'admin@gmail.com', password: hashed, role: 'admin' });
    console.log('Admin seeded email: admin@gmail.com  password: 02230223');
  } catch (err) {
    console.error('Admin seed failed:', err);
  }
}

export async function connectToDatabase() {
  if (!MONGODB_URI) {
    throw new Error('Please define MONGODB_URI environment variable');
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then(async (mongoose) => {
      console.log('Connected to MongoDB');
      await seedAdmin();
      return mongoose;
    }).catch((error) => {
      console.error('MongoDB connection error:', error);
      throw error;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}