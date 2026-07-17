// node fix-terms-html.js
const mongoose = require('mongoose');

const htmlTerms = `<h2><strong>1. Acceptance of Terms</strong></h2><p>By accessing and using the Seliora website, you accept and agree to be bound by these Terms and Conditions.</p><h2><strong>2. Products and Pricing</strong></h2><p>All products listed on Seliora are subject to availability. Prices are listed in Indian Rupees (INR) and are inclusive of applicable taxes unless stated otherwise.</p><h2><strong>3. Orders and Payments</strong></h2><p>Payment must be made in full at the time of order. We use Razorpay for secure payment processing.</p><h2><strong>4. Shipping and Delivery</strong></h2><p>We aim to dispatch orders within 2–5 business days. We are not responsible for delays caused by courier services.</p><h2><strong>5. Returns and Refunds</strong></h2><p>If you receive a damaged or defective item, please contact us within 48 hours of delivery. Refunds will be credited within 7–10 business days.</p><h2><strong>6. Privacy Policy</strong></h2><p>We collect personal information only as necessary to process your orders. We do not sell your personal information to third parties.</p><h2><strong>7. Changes to Terms</strong></h2><p>We reserve the right to update these Terms and Conditions at any time. Continued use of the website constitutes acceptance of the revised terms.</p>`;

mongoose.connect('mongodb://127.0.0.1:27017/seloria').then(async () => {
  const settings = mongoose.connection.db.collection('sitesettings');
  await settings.updateOne({ type: 'main' }, { $set: { terms: htmlTerms } }, { upsert: true });
  console.log('✅ Terms updated to HTML format');
  await mongoose.disconnect();
});
