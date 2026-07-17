import mongoose from 'mongoose';

const CartSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    unique: true 
  },
  items: [{
    product: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Product' 
    },
    name: String,
    image: String,
    price: Number,
    quantity: { 
      type: Number, 
      default: 1,
      min: 1 
    },
    isGift: { type: Boolean, default: false },
    giftPrice: { type: Number, default: null }
  }],
  totalItems: {
    type: Number,
    default: 0
  },
  totalPrice: {
    type: Number,
    default: 0
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Update totals before saving
CartSchema.pre('save', function(next) {
  this.totalItems = this.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  this.totalPrice = this.items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.Cart || mongoose.model('Cart', CartSchema);