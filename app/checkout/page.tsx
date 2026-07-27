'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Script from 'next/script';
import { ShieldCheckIcon, TruckIcon, LockClosedIcon } from '@heroicons/react/24/outline';

declare global {
  interface Window { Razorpay: any; }
}

const inputClass =
  'w-full bg-[#1a1a1a] border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-[#C8A96E] px-4 py-2.5 text-sm transition-colors';
const labelClass = 'block text-[10px] tracking-[0.3em] uppercase text-gray-500 mb-1.5';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const giftProductId = searchParams.get('gift');
  const buyNow = searchParams.get('buyNow') === 'true';
  const buyNowProductId = searchParams.get('productId');
  const buyNowQuantity = Number(searchParams.get('quantity') || '1');

  const [loading, setLoading] = useState(false);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [averageSpend, setAverageSpend] = useState<number | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [giftProduct, setGiftProduct] = useState<any>(null);
  const [giftLoading, setGiftLoading] = useState(!!giftProductId);
  const [buyNowProduct, setBuyNowProduct] = useState<any>(null);
  const [buyNowLoading, setBuyNowLoading] = useState(buyNow && !!buyNowProductId);
  const [savedUserProfile, setSavedUserProfile] = useState<any>(null);
  const [useDefaultAddress, setUseDefaultAddress] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '',
    street: '', city: '', state: '', zipCode: '', country: 'India',
  });

  useEffect(() => {
    loadUserData();
    if (giftProductId) {
      fetchGiftProduct(giftProductId);
    } else if (buyNow && buyNowProductId) {
      fetchBuyNowProduct(buyNowProductId);
    } else {
      fetchCart();
    }
  }, [giftProductId, buyNow, buyNowProductId]);

  const fetchGiftProduct = async (productId: string) => {
    try {
      const res = await fetch(`/api/products/${productId}`);
      if (res.ok) {
        const product = await res.json();
        setGiftProduct(product);
      } else {
        alert('This gift is no longer available.');
        router.push('/cart');
      }
    } catch {
      router.push('/cart');
    } finally {
      setGiftLoading(false);
    }
  };

  const fetchBuyNowProduct = async (productId: string) => {
    try {
      const res = await fetch(`/api/products/${productId}`);
      if (res.ok) {
        const product = await res.json();
        setBuyNowProduct(product);
        setTotal(product.price * buyNowQuantity);
      } else {
        alert('This product is no longer available.');
        router.push('/products');
      }
    } catch {
      router.push('/products');
    } finally {
      setBuyNowLoading(false);
    }
  };

  const fetchCart = async () => {
    try {
      const res = await fetch('/api/cart');
      if (res.ok) {
        const data = await res.json();
        const items = data.items || [];
        setCartItems(items);
        // After cart load, fetch loyalty and compute adjusted total
        try {
          const loy = await fetch('/api/loyalty');
          if (loy.ok) {
            const ldata = await loy.json();
            const cartHasLargeQty = items.some((it: any) => (it.quantity || 0) >= 10);
            const cartQuantity = items.reduce((sum: number, it: any) => sum + (it.quantity || 0), 0);
            const unlocked = (ldata?.totalProductsPurchased || 0) >= 10 || cartHasLargeQty || cartQuantity >= 10;
            const avg = ldata?.averageSpend ?? 0;
            setAverageSpend(unlocked ? avg : null);

            // compute total from actual cart line prices
            let computed = 0;
            for (const item of items) {
              const linePrice = item.isGift ? (item.giftPrice ?? item.price) : item.price;
              computed += linePrice * (item.quantity || 0);
            }
            setTotal(computed);
          } else {
            setTotal(data.totalPrice || 0);
          }
        } catch {
          setTotal(data.totalPrice || 0);
        }
      }
    } catch { }
  };

  const loadUserData = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const { user } = await res.json();
        setSavedUserProfile(user);
        setFormData(prev => ({
          ...prev,
          name: user.name || prev.name,
          email: user.email || prev.email,
          phone: user.phone || prev.phone,
        }));
      }
    } catch { }
  };

  const handleToggleDefaultAddress = (checked: boolean) => {
    setUseDefaultAddress(checked);
    if (checked && savedUserProfile) {
      const addr = savedUserProfile.address || {};
      setFormData(prev => ({
        ...prev,
        name: savedUserProfile.name || prev.name,
        email: savedUserProfile.email || prev.email,
        phone: savedUserProfile.phone || prev.phone,
        street: addr.street || prev.street,
        city: addr.city || prev.city,
        state: addr.state || prev.state,
        zipCode: addr.zipCode || prev.zipCode,
        country: addr.country || prev.country || 'India',
      }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleClaimGiftSubmit = async () => {
    if (!giftProduct) return;
    setLoading(true);
    try {
      const cardType = searchParams.get('cardType');
      const res = await fetch('/api/gifts/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          productId: giftProduct._id,
          address: formData,
          cardType: cardType || undefined
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to claim gift');
      }
      window.dispatchEvent(new Event('cart-updated'));
      router.push(`/orders?success=true&orderId=${data.orderId}`);
    } catch (error: any) {
      alert(error.message || 'Failed to claim gift. Please try again.');
      setLoading(false);
    }
  };

  const handleBuyNowSubmit = async () => {
    setLoading(true);
    try {
      const orderRes = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          address: formData,
          buyNow: true,
          productId: buyNowProductId,
          quantity: buyNowQuantity
        }),
      });
      if (!orderRes.ok) {
        const err = await orderRes.json();
        throw new Error(err.error || 'Failed to create order');
      }
      const orderData = await orderRes.json();

      const options = {
        key: orderData.razorpayKeyId,
        amount: orderData.amount * 100,
        currency: 'INR',
        name: 'Seloria',
        description: `Order #${orderData.orderId}`,
        order_id: orderData.razorpayOrderId,
        handler: async (response: any) => {
          const verifyRes = await fetch('/api/payment/verify', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              order_id: orderData.orderId,
            }),
          });
          const data = await verifyRes.json();
          if (verifyRes.ok && data && data.success) {
            window.dispatchEvent(new Event('cart-updated'));
            router.push(`/orders?success=true&orderId=${orderData.orderId}`);
          } else {
            alert('Payment verification failed. Please contact support.');
          }
        },
        prefill: { name: formData.name, email: formData.email, contact: formData.phone },
        theme: { color: '#7B2D42' },
        modal: { ondismiss: () => setLoading(false) },
      };

      if (typeof window.Razorpay === 'undefined') {
        alert('Payment gateway is loading. Please wait 2 seconds and click Pay Now again.');
        setLoading(false);
        return;
      }

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      alert(error.message || 'Payment failed. Please try again.');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) {
      alert('Please agree to the Terms & Conditions before proceeding.');
      return;
    }
    if (giftProductId) {
      await handleClaimGiftSubmit();
      return;
    }
    if (buyNow && buyNowProductId) {
      await handleBuyNowSubmit();
      return;
    }
    setLoading(true);
    try {
      const orderRes = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ address: formData }),
      });
      if (!orderRes.ok) {
        const err = await orderRes.json();
        throw new Error(err.error || 'Failed to create order');
      }
      const orderData = await orderRes.json();

      const options = {
        key: orderData.razorpayKeyId,
        amount: orderData.amount * 100,
        currency: 'INR',
        name: 'Seloria',
        description: `Order #${orderData.orderId}`,
        order_id: orderData.razorpayOrderId,
        handler: async (response: any) => {
          const verifyRes = await fetch('/api/payment/verify', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              order_id: orderData.orderId,
            }),
          });
          const data = await verifyRes.json();
          console.log('Payment verify response', verifyRes.status, data);
          if (verifyRes.ok && data && data.success) {
            window.dispatchEvent(new Event('cart-updated'));
            // if payment unlocked a gift, redirect to cart where gift options are shown
            if (data.showGift) {
              console.log('Redirecting to cart to show gift');
              router.push('/cart?gift=unlocked');
            } else {
              console.log('Redirecting to orders');
              router.push(`/orders?success=true&orderId=${orderData.orderId}`);
            }
          } else {
            alert('Payment verification failed. Please contact support.');
          }
        },
        prefill: { name: formData.name, email: formData.email, contact: formData.phone },
        theme: { color: '#7B2D42' },
        modal: { ondismiss: () => setLoading(false) },
      };

      if (typeof window.Razorpay === 'undefined') {
        alert('Payment gateway is loading. Please wait 2 seconds and click Pay Now again.');
        setLoading(false);
        return;
      }

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      alert(error.message || 'Payment failed. Please try again.');
      setLoading(false);
    }
  };

  const grandTotal = giftProductId ? 0 : total;
  const displayItems = giftProductId && giftProduct
    ? [{ name: giftProduct.name, image: giftProduct.images?.[0], quantity: 1, price: 0, isGift: true }]
    : buyNow && buyNowProduct
      ? [{
        product: buyNowProduct,
        name: buyNowProduct.name,
        image: buyNowProduct.images?.[0],
        quantity: buyNowQuantity,
        price: buyNowProduct.price,
        isGift: false
      }]
    : cartItems;

  if (giftLoading || buyNowLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center pt-16">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#7B2D42]" />
      </div>
    );
  }

  if (!giftProductId && !buyNow && cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center pt-16">
        <div className="text-center">
          <p className="text-[10px] tracking-[0.4em] uppercase text-[#C8A96E] mb-4">✦</p>
          <h2 className="font-serif text-3xl text-white mb-3">Your cart is empty</h2>
          <p className="text-gray-500 text-sm mb-8">Add items to proceed with checkout</p>
          <button
            onClick={() => router.push('/products')}
            className="px-8 py-3 bg-[#7B2D42] text-white text-[10px] tracking-[0.3em] uppercase hover:bg-[#8A3048] transition-colors"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      <div className="min-h-screen bg-[#0a0a0a] pt-16">
        <div className="max-w-5xl mx-auto px-6 lg:px-12 py-12">

          {/* Header */}
          <div className="mb-10">
            <p className="text-[10px] tracking-[0.4em] uppercase text-[#C8A96E] mb-2">
              {giftProductId ? 'Gift Claim' : 'Secure Checkout'}
            </p>
            <h1 className="font-serif text-4xl text-white font-light tracking-wide">
              {giftProductId ? 'Confirm Your Gift' : 'Complete Your Order'}
            </h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

            {/* ── LEFT: Shipping Form ── */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-3"
            >
              <div className="bg-[#111111] border border-white/10 p-6">
                <h2 className="text-[10px] tracking-[0.4em] uppercase text-[#C8A96E] mb-6">Shipping Details</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Optional Default Shipping Address Checkbox */}
                  {savedUserProfile && (
                    <div className="bg-[#1a1a1a] border border-white/10 p-3.5 mb-4 flex items-center justify-between">
                      <label className="flex items-center gap-3 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={useDefaultAddress}
                          onChange={(e) => handleToggleDefaultAddress(e.target.checked)}
                          className="h-4 w-4 rounded border-white/20 bg-black text-[#7B2D42] focus:ring-0 accent-[#7B2D42]"
                        />
                        <span className="text-xs text-gray-300">Use default shipping address from My Profile</span>
                      </label>
                      {useDefaultAddress && (
                        <span className="text-[9px] uppercase tracking-widest text-[#C8A96E] font-medium">Auto-filled</span>
                      )}
                    </div>
                  )}
                  {/* Name */}
                  <div>
                    <label className={labelClass}>Full Name <span className="text-[#7B2D42]">*</span></label>
                    <input type="text" name="name" required value={formData.name} onChange={handleChange} className={inputClass} />
                  </div>

                  {/* Email */}
                  <div>
                    <label className={labelClass}>Email Address <span className="text-[#7B2D42]">*</span></label>
                    <input type="email" name="email" required value={formData.email} onChange={handleChange} className={inputClass} />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className={labelClass}>Phone <span className="text-[#7B2D42]">*</span></label>
                    <input type="tel" name="phone" required value={formData.phone} onChange={handleChange} className={inputClass} />
                  </div>

                  {/* Street */}
                  <div>
                    <label className={labelClass}>Street Address <span className="text-[#7B2D42]">*</span></label>
                    <input type="text" name="street" required placeholder="Street Address" value={formData.street} onChange={handleChange} className={inputClass} />
                  </div>

                  {/* City + State */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>City <span className="text-[#7B2D42]">*</span></label>
                      <input type="text" name="city" required value={formData.city} onChange={handleChange} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>State <span className="text-[#7B2D42]">*</span></label>
                      <input type="text" name="state" required value={formData.state} onChange={handleChange} className={inputClass} />
                    </div>
                  </div>

                  {/* ZIP + Country */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>ZIP Code <span className="text-[#7B2D42]">*</span></label>
                      <input type="text" name="zipCode" required value={formData.zipCode} onChange={handleChange} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Country</label>
                      <select name="country" value={formData.country} onChange={handleChange}
                        className="w-full bg-[#1a1a1a] border border-white/10 text-white focus:outline-none focus:border-[#C8A96E] px-4 py-2.5 text-sm transition-colors">
                        <option value="India">India</option>
                        <option value="USA">USA</option>
                        <option value="UK">UK</option>
                      </select>
                    </div>
                  </div>

                  {/* Terms & Conditions */}
                  <div className="border-t border-white/10 pt-5">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <div className="relative mt-0.5 flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={agreedToTerms}
                          onChange={e => setAgreedToTerms(e.target.checked)}
                          className="sr-only"
                        />
                        <div className={`w-4 h-4 border transition-colors ${agreedToTerms ? 'bg-[#7B2D42] border-[#7B2D42]' : 'bg-[#1a1a1a] border-white/20 group-hover:border-white/40'}`}>
                          {agreedToTerms && (
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 leading-relaxed">
                        I have read and agree to the{' '}
                        <Link href="/terms" target="_blank" className="text-[#C8A96E] hover:text-white underline underline-offset-2 transition-colors">
                          Terms &amp; Conditions
                        </Link>
                        {' '}and{' '}
                        <Link href="/terms" target="_blank" className="text-[#C8A96E] hover:text-white underline underline-offset-2 transition-colors">
                          Privacy Policy
                        </Link>
                        . I confirm that the shipping details provided are correct.
                      </span>
                    </label>
                  </div>

                  {/* Pay Now */}
                  <button
                    type="submit"
                    disabled={loading || !agreedToTerms}
                    className={`w-full flex items-center justify-center gap-2 py-4 text-[10px] tracking-[0.3em] uppercase font-medium transition-colors ${!agreedToTerms
                      ? 'bg-white/5 text-gray-600 cursor-not-allowed'
                      : loading
                        ? 'bg-[#7B2D42] text-white opacity-70 cursor-wait'
                        : 'bg-[#7B2D42] hover:bg-[#8A3048] text-white'
                      }`}
                  >
                    <LockClosedIcon className="h-4 w-4" />
                    {loading
                      ? (giftProductId ? 'Claiming...' : 'Processing...')
                      : (giftProductId ? 'Confirm & Claim Gift' : 'Pay Now')}
                  </button>
                </form>
              </div>
            </motion.div>

            {/* ── RIGHT: Order Summary ── */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-2 space-y-4"
            >
              <div className="bg-[#111111] border border-white/10 p-6">
                <h2 className="text-[10px] tracking-[0.4em] uppercase text-[#C8A96E] mb-5">Order Summary</h2>

                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {displayItems.map((item: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0">
                      <div className="h-12 w-12 flex-shrink-0 bg-[#1a1a1a] overflow-hidden">
                        {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{item.name}</p>
                        <p className="text-[10px] text-gray-600 mt-0.5">Qty: {item.quantity}</p>
                        {item.isGift && (
                          <p className="text-[10px] text-[#7B2D42] mt-1">Gift item</p>
                        )}
                      </div>
                      <p className="text-sm text-[#C8A96E] flex-shrink-0">
                        {(() => {
                          const linePrice = item.isGift ? (item.giftPrice ?? 0) : item.price;
                          const itemTotal = linePrice * (item.quantity || 0);
                          return `₹${itemTotal.toLocaleString('en-IN')}`;
                        })()}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-white/10 space-y-2.5">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span className="tracking-widest uppercase">Subtotal</span>
                    <span>₹{total.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span className="tracking-widest uppercase">Shipping</span>
                    <span className="text-green-500">Free</span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-white/10">
                    <span className="text-[10px] tracking-[0.3em] uppercase text-white">Total</span>
                    <span className="font-serif text-2xl text-[#C8A96E]">₹{grandTotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Trust badges */}
              <div className="bg-[#111111] border border-white/10 p-5 space-y-3">
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <LockClosedIcon className="h-4 w-4 text-[#C8A96E] flex-shrink-0" />
                  256-bit SSL encrypted payment
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <ShieldCheckIcon className="h-4 w-4 text-[#C8A96E] flex-shrink-0" />
                  {giftProductId ? 'No payment required for gift claims' : '100% secure checkout via Razorpay'}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <TruckIcon className="h-4 w-4 text-[#C8A96E] flex-shrink-0" />
                  Free shipping on all orders
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center pt-16">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#7B2D42]" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
