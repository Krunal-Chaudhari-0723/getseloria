const Razorpay = require('razorpay');

const key = process.env.RAZORPAY_KEY_ID;
const secret = process.env.RAZORPAY_KEY_SECRET;

if (!key || !secret) {
  console.error('Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET in environment');
  process.exit(1);
}

const r = new Razorpay({ key_id: key, key_secret: secret });

(async () => {
  try {
    const order = await r.orders.create({ amount: 100, currency: 'INR', receipt: `TEST_${Date.now()}` });
    console.log('Razorpay test order created:', order);
  } catch (err) {
    console.error('Razorpay error:', err);
    process.exit(1);
  }
})();
