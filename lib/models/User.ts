import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Name is required'],
    trim: true 
  },
  email: { 
    type: String, 
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true 
  },
  password: { 
    type: String, 
    required: [true, 'Password is required'],
    minlength: 6 
  },
  role: { 
    type: String, 
    enum: ['user', 'admin'], 
    default: 'user' 
  },
  phone: {
    type: String,
    trim: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  dob: {
    type: Date
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: { type: String, default: 'India' }
  },
  loyaltyCards: [{
    cardType: { type: String, enum: ['Opal', 'Pink Quartz', 'Emerald', 'Ruby', 'Sapphire'] },
    assignedAt: { type: Date, default: Date.now },
  }],
  giftHampers: [{
    cardType: { type: String, enum: ['Opal', 'Pink Quartz', 'Emerald', 'Ruby', 'Sapphire'] },
    status: { type: String, enum: ['pending', 'fulfilled'], default: 'pending' },
    awardedAt: { type: Date, default: Date.now },
    fulfilledAt: { type: Date, default: null }
  }],
  claimedGifts: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    price: { type: Number },
    claimedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['claimed', 'redeemed', 'revoked'], default: 'claimed' },
    redeemedAt: { type: Date, default: null }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.models.User || mongoose.model('User', UserSchema);