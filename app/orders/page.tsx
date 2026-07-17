'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import OrderCard from '@/components/OrderCard';
import { ClipboardDocumentListIcon, CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

function OrdersContent() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBanner, setShowBanner] = useState(false);
  const [showAveragePopup, setShowAveragePopup] = useState(false);
  const [averageSpend, setAverageSpend] = useState<number | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [showGifts, setShowGifts] = useState(false);
  const [eligibleProducts, setEligibleProducts] = useState<any[]>([]);
  const searchParams = useSearchParams();
  const router = useRouter();
  const success = searchParams.get('success');
  const newOrderId = searchParams.get('orderId');

  useEffect(() => {
    if (success === 'true') {
      setShowBanner(true);
    }
    fetchAverageSpend();
    fetchOrders();
  }, []);

  const fetchAverageSpend = async () => {
    try {
      const response = await fetch(`/api/loyalty?t=${Date.now()}`, { credentials: 'include', cache: 'no-store' });
      if (!response.ok) return;

      const data = await response.json();
      if (data?.unlockedRecommendations && data?.averageSpend) {
        setAverageSpend(data.averageSpend);
        setEligibleProducts(data.eligibleProducts || []);

        const unclaimed = (data.eligibleProducts || []).filter((p: any) => !p.claimed);
        if (success === 'true' && unclaimed.length > 0) {
          const popupKey = `average-claim-popup-seen-${newOrderId || 'default'}`;
          if (!localStorage.getItem(popupKey)) {
            setShowAveragePopup(true);
            localStorage.setItem(popupKey, '1');
          }
        }
      }
    } catch (error) {
      console.error('Error fetching average spend:', error);
    }
  };

  const handleClaimAverage = async () => {
    if (!averageSpend) return;
    setClaiming(true);
    try {
      localStorage.setItem('claimed-average-amount', String(averageSpend));
      // Fetch eligible products (gifts) and show them to user
      try {
        const res = await fetch(`/api/loyalty?t=${Date.now()}`, { credentials: 'include', cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setEligibleProducts(data.eligibleProducts || []);
          setShowAveragePopup(false);
          setShowGifts(true);
        } else {
          setShowAveragePopup(false);
        }
      } catch (err) {
        setShowAveragePopup(false);
      }
    } finally {
      setClaiming(false);
    }
  };

  const handleClaimGift = (productId: string) => {
    setShowGifts(false);
    router.push(`/checkout?gift=${productId}`);
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch(`/api/orders?t=${Date.now()}`, { credentials: 'include', cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center pt-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7B2D42]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Average amount claim popup */}
        <AnimatePresence>
          {showAveragePopup && averageSpend !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4"
            >
              <div className="w-full max-w-md border border-[#C8A96E]/30 bg-[#111111] p-6 shadow-2xl relative">
                <button
                  onClick={() => setShowAveragePopup(false)}
                  className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
                  aria-label="Close average popup"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
                <p className="text-[10px] tracking-[0.4em] uppercase text-[#C8A96E] mb-3">Average Amount</p>
                <h2 className="text-2xl font-serif text-white mb-3">Your claim is ready</h2>
                <p className="text-sm text-gray-400 leading-relaxed">
                  You have completed 10 or more products. Your average amount is{' '}
                  <span className="text-[#C8A96E] font-semibold">₹{averageSpend.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>.
                  Claim it once to apply this amount to your products.
                </p>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => setShowAveragePopup(false)}
                    className="px-4 py-2 border border-white/10 text-white text-[10px] tracking-[0.3em] uppercase hover:bg-white/5 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={handleClaimAverage}
                    disabled={claiming}
                    className="px-4 py-2 bg-[#7B2D42] text-white text-[10px] tracking-[0.3em] uppercase hover:bg-[#8A3048] disabled:opacity-50 transition-colors"
                  >
                    {claiming ? 'Claiming...' : 'Claim'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Gifts modal shown after claiming average */}
        <AnimatePresence>
          {showGifts && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4"
            >
              <div className="w-full max-w-3xl border border-[#C8A96E]/30 bg-[#111111] p-6 shadow-2xl relative">
                <button
                  onClick={() => setShowGifts(false)}
                  className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
                  aria-label="Close gifts"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
                <p className="text-[10px] tracking-[0.4em] uppercase text-[#C8A96E] mb-3">Gifts</p>
                <h2 className="text-2xl font-serif text-white mb-3">Choose your gift</h2>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Here are products available as gifts for your claimed average amount. Each eligible product can be claimed once at the average price.
                </p>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-96 overflow-y-auto pt-2">
                  {eligibleProducts.length === 0 ? (
                    <div className="text-sm text-gray-400">No gift products available right now.</div>
                  ) : (
                    eligibleProducts.map((p: any) => (
                      <div key={p._id} className="flex gap-3 p-3 bg-[#0f0f0f] border border-white/5">
                        <div className="h-16 w-16 bg-[#1a1a1a] flex-shrink-0">
                          <img src={p.images?.[0] || ''} alt={p.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-white">{p.name}</p>
                          <p className="text-[10px] text-gray-500 mt-1">₹{p.price.toLocaleString('en-IN')}</p>
                        </div>
                        <div className="flex items-center">
                          {p.claimed ? (
                            <span className="px-3 py-2 text-gray-500 text-[10px] tracking-[0.3em] uppercase">Claimed</span>
                          ) : (
                            <button
                              onClick={() => handleClaimGift(p._id)}
                              className="px-3 py-2 bg-[#7B2D42] text-white text-[10px] tracking-[0.3em] uppercase hover:bg-[#8A3048] transition-colors"
                            >
                              Claim Gift
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Payment success banner */}
        <AnimatePresence>
          {showBanner && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 bg-green-900/30 border border-green-500/20 p-4 flex items-start gap-4"
            >
              <CheckCircleIcon className="h-7 w-7 text-green-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-green-400 text-lg">Payment Successful!</p>
                <p className="text-green-400/70 text-sm mt-0.5">
                  Your order has been placed and is being processed. You can track the status below.
                </p>
              </div>
              <button onClick={() => setShowBanner(false)} className="text-green-400/50 hover:text-green-400 transition-colors">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mb-8">
          <p className="text-[10px] tracking-[0.4em] uppercase text-[#C8A96E] mb-2">Account</p>
          <h1 className="text-2xl font-serif text-white">My Orders</h1>
        </div>

        {/* Claim Reward Banner */}
        {averageSpend !== null && eligibleProducts.filter((p: any) => !p.claimed).length > 0 && (
          <div className="mb-6 bg-gradient-to-r from-amber-900/30 to-yellow-900/20 border border-amber-500/30 p-4 flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-amber-400 text-sm tracking-wide">🎁 You have a free gift reward ready!</p>
              <p className="text-gray-400 text-xs mt-1">
                Based on your purchases, you have unlocked gift recommendations with an average value of <span className="text-amber-400 font-semibold">₹{averageSpend.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>.
              </p>
            </div>
            <button
              onClick={() => setShowGifts(true)}
              className="px-4 py-2 bg-amber-500/20 text-amber-300 text-[10px] tracking-[0.3em] uppercase hover:bg-amber-500/30 border border-amber-500/30 transition-colors whitespace-nowrap"
            >
              Claim Gift
            </button>
          </div>
        )}

        {orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#111111] border border-white/10 p-12 text-center"
          >
            <ClipboardDocumentListIcon className="h-20 w-20 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-serif text-white">No orders yet</h2>
            <p className="text-gray-400 mt-2 text-sm">Start shopping to see your orders here</p>
            <Link href="/products"
              className="inline-block mt-6 bg-[#7B2D42] text-white hover:bg-[#8A3048] transition-colors text-[10px] tracking-[0.3em] uppercase px-6 py-2.5">
              Start Shopping
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {orders.map((order: any) => (
              <motion.div
                key={order._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {/* Highlight the newly paid order */}
                {newOrderId && order._id === newOrderId && (
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <CheckCircleIcon className="h-4 w-4 text-green-400" />
                    <span className="text-sm font-medium text-green-400">New order just placed</span>
                  </div>
                )}
                <div className={newOrderId && order._id === newOrderId ? 'ring-2 ring-green-500/40' : ''}>
                  <OrderCard order={order} />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center pt-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7B2D42]" />
      </div>
    }>
      <OrdersContent />
    </Suspense>
  );
}
