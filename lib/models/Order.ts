import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  orderNumber: {
    type: String,
    unique: true
  },
  items: [{
    product: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Product' 
    },
    name: String,
    image: String,
    quantity: { 
      type: Number, 
      required: true,
      min: 1 
    },
    price: { 
      type: Number, 
      required: true 
    },
    isGift: {
      type: Boolean,
      default: false
    }
  }],
  totalAmount: { 
    type: Number, 
    required: true 
  },
  shippingAddress: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, required: true }
  },
  paymentMethod: {
    type: String,
    enum: ['razorpay', 'cod'],
    default: 'razorpay'
  },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'paid', 'failed'], 
    default: 'pending' 
  },
  orderStatus: { 
    type: String, 
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'], 
    default: 'pending' 
  },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,
  trackingNumber: String,
  estimatedDelivery: Date,
  deliveredAt: Date,
  cancelledAt: Date,
  paidAt: Date,
  cancelReason: String,
  cancellationType: {
    type: String,
    enum: ['full_refund', 'voucher']
  },
  refundStatus: {
    type: String,
    enum: ['pending', 'refunded', 'voucher_pending', 'voucher_issued', 'none'],
    default: 'none'
  },
  voucherCode: String,
  voucherExpiresAt: Date,
  notes: String,
  createdAt: { 
    type: Date, 
    default: Date.now,
    index: true 
  }
});

// Generate order number before saving
OrderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `SEL${year}${month}${day}${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);