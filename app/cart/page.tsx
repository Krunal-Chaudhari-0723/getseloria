'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  TrashIcon,
  PlusIcon,
  MinusIcon,
  ShoppingBagIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

interface CartItem {
  product: {
    _id: string;
    name: string;
    price: number;
    originalPrice?: number;
    discountPercent?: number;
    images: string[];
    stock: number;
  };
  name: string;
  image: string;
  price: number;
  quantity: number;
  _id: string;
  isGift?: boolean;
  giftPrice?: number | null;
}

function CartPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [averageSpend, setAverageSpend] = useState<number | null>(null);
  const [eligibleProducts, setEligibleProducts] = useState<any[]>([]);
  const [unlockedRecommendations, setUnlockedRecommendations] = useState(false);

  useEffect(() => {
    fetchCart();
    checkAuth();

    const handleCartUpdated = () => {
      fetchCart();
    };

    window.addEventListener('cartUpdated', handleCartUpdated);
    return () => window.removeEventListener('cartUpdated', handleCartUpdated);
  }, []);

  const computeAverageSpend = async (items: CartItem[]) => {
    try {
      const response = await fetch(`/api/loyalty?t=${Date.now()}`, { credentials: 'include', cache: 'no-store' });
      if (!response.ok) {
        setAverageSpend(null);
        return;
      }

      const data = await response.json();
      const unlocked = !!data?.unlockedRecommendations;
      setAverageSpend(unlocked ? data?.averageSpend ?? null : null);
    } catch {
      setAverageSpend(null);
    }
  };

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me', { credentials: 'include' });
      const ok = response.ok;
      setIsLoggedIn(ok);
      return ok;
    } catch (error) {
      setIsLoggedIn(false);
      return false;
    }
  };

  const fetchCart = async () => {
    try {
      const response = await fetch('/api/cart');
      if (response.ok) {
        const data = await response.json();
        const items = data.items || [];
        setCartItems(items);
        await computeAverageSpend(items);
        // fetch loyalty/eligible gifts
        try {
          const resp = await fetch(`/api/loyalty?t=${Date.now()}`, { credentials: 'include', cache: 'no-store' });
          if (resp.ok) {
            const ld = await resp.json();
            const unlocked = !!ld.unlockedRecommendations;
            setEligibleProducts(ld.eligibleProducts || []);
            setUnlockedRecommendations(unlocked);

            // fallback: if no eligible products returned but unlocked, fetch products priced <= averageSpend
            if ((ld.eligibleProducts || []).length === 0 && unlocked) {
              try {
                const fallbackUrl = ld.averageSpend > 0
                  ? `/api/products?maxPrice=${Number(ld.averageSpend).toFixed(2)}&limit=24`
                  : '/api/products?limit=12';
                const pResp = await fetch(fallbackUrl);
                if (pResp.ok) {
                  const pd = await pResp.json();
                  const fallback = (pd.products || []).filter((p: any) => !(ld.claimedProductIds || []).includes(String(p._id)));
                  setEligibleProducts(fallback || []);
                }
              } catch (err) {
                // ignore fallback failure
              }
            }
          } else {
            setEligibleProducts([]);
            setUnlockedRecommendations(false);
          }
        } catch {
          setEligibleProducts([]);
          setUnlockedRecommendations(false);
        }
      } else {
        setCartItems([]);
        setAverageSpend(null);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      setCartItems([]);
      setAverageSpend(null);
    } finally {
      setLoading(false);
    }
  };

  const forceShowGift = searchParams.get('gift') === 'unlocked';
  const showGiftSection = unlockedRecommendations || forceShowGift;

  const claimProduct = (productId: string) => {
    router.push(`/checkout?gift=${productId}`);
  };

  const fetchAverageSpend = async () => {
    try {
      const [cartResponse, loyaltyResponse] = await Promise.all([
        fetch('/api/cart'),
        fetch(`/api/loyalty?t=${Date.now()}`, { credentials: 'include', cache: 'no-store' })
      ]);

      if (!loyaltyResponse.ok || !cartResponse.ok) {
        setAverageSpend(null);
        return;
      }

      const cartData = await cartResponse.json();
      const loyaltyData = await loyaltyResponse.json();
      const unlocked = !!loyaltyData?.unlockedRecommendations;
      setAverageSpend(unlocked ? loyaltyData?.averageSpend ?? null : null);
    } catch {
      setAverageSpend(null);
    }
  };

  const updateQuantity = async (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setUpdating(productId);
    try {
      const response = await fetch(`/api/cart/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQuantity })
      });

      if (response.ok) {
        const data = await response.json();
        setCartItems(data.cart.items || []);
        window.dispatchEvent(new Event('cartUpdated'));
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
    } finally {
      setUpdating(null);
    }
  };

  const removeItem = async (productId: string) => {
    if (!confirm('Remove this item from cart?')) return;
    try {
      const response = await fetch(`/api/cart/${productId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const data = await response.json();
        setCartItems(data.cart.items || []);
        window.dispatchEvent(new Event('cartUpdated'));
      }
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  const handleCheckout = async () => {
    const ok = await checkAuth();
    if (!ok) {
      router.push('/auth/login?redirect=/checkout');
      return;
    }
    router.push('/checkout');
  };

  const total = cartItems.reduce((sum, item) => {
    const linePrice = item.price;
    return sum + linePrice * item.quantity;
  }, 0);

  const subtotal = total;
  const shipping = 0;
  const grandTotal = subtotal + shipping;

  const getDisplayPrice = (item: CartItem) => item.price;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center pt-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7B2D42]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 border border-white/10 text-white hover:bg-white/5 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <p className="text-[10px] tracking-[0.4em] uppercase text-[#C8A96E]">Your</p>
            <h1 className="text-2xl font-serif text-white">Shopping Cart</h1>
          </div>
        </div>

        {showGiftSection && (
          <div className="mb-6 bg-[#0f0f0f] border border-white/10 p-3 sm:p-4">
            <h3 className="text-sm font-semibold text-white mb-3">Your Gift Picks</h3>
            {eligibleProducts.length > 0 ? (
              <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3">
                {eligibleProducts.map((p: any) => (
                  <div key={p._id} className="bg-[#111111] p-3 border border-white/10 flex flex-col h-full">
                    <img
                      src={p.images?.[0] || '/placeholder-jewelry.jpg'}
                      alt={p.name}
                      className="h-24 sm:h-28 w-full object-cover mb-2"
                    />
                    <div className="text-sm text-white font-medium line-clamp-2 min-h-[2.5rem]">{p.name}</div>
                    <div className="text-sm text-gray-400 mt-1">₹{(p.price || 0).toLocaleString()}</div>
                    {p.claimed ? (
                      <span className="mt-3 block w-full py-2 text-center text-gray-500 text-sm">Claimed</span>
                    ) : (
                      <button
                        onClick={() => claimProduct(p._id)}
                        className="mt-3 w-full py-2 bg-[#7B2D42] text-white text-sm hover:bg-[#8A3048] transition-colors"
                      >
                        Claim
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded border border-dashed border-white/10 bg-[#111111] p-4 text-sm text-gray-400">
                Gift options are available for this cart total. Please refresh or try again shortly.
              </div>
            )}
          </div>
        )}

        {cartItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#111111] border border-white/10 p-12 text-center"
          >
            <ShoppingBagIcon className="h-20 w-20 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-serif text-white">Your cart is empty</h2>
            <p className="text-gray-400 mt-2 text-sm">Browse our collection and find something special</p>
            <Link
              href="/products"
              className="inline-block mt-6 bg-[#7B2D42] text-white hover:bg-[#8A3048] transition-colors text-[10px] tracking-[0.3em] uppercase px-6 py-2.5"
            >
              Start Shopping
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item, index) => {
                const displayPrice = getDisplayPrice(item);
                const itemTotal = (item.price) * item.quantity;
                
                return (
                  <motion.div
                    key={item._id || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#111111] border border-white/10 p-4 flex gap-4 items-start"
                  >
                    <div className="h-20 w-20 sm:h-24 sm:w-24 flex-shrink-0 bg-[#1a1a1a] overflow-hidden">
                      <img
                        src={item.image || ''}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 flex flex-col sm:flex-row justify-between gap-3 min-w-0 w-full">
                      <div className="flex-1 min-w-0">
                        <Link href={`/products/${item.product?._id || item._id}`}>
                          <h3 className="font-medium text-white hover:text-[#C8A96E] transition-colors text-sm truncate pr-2">
                            {item.name}
                          </h3>
                        </Link>
                        
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-sm text-gray-400">₹{displayPrice.toLocaleString()}</p>
                          {!!item.product?.discountPercent && (
                            <>
                              <p className="text-xs text-gray-600 line-through">₹{item.product.originalPrice?.toLocaleString()}</p>
                              <p className="text-xs text-green-500">{item.product.discountPercent}% off</p>
                            </>
                          )}
                        </div>

                        <div className="flex items-center gap-4 mt-3">
                          <div className="flex items-center border border-white/10 bg-[#0a0a0a]">
                            <button
                              onClick={() => updateQuantity(item.product?._id || item._id, item.quantity - 1)}
                              disabled={updating === (item.product?._id || item._id)}
                              className="px-2.5 py-1 text-white hover:bg-white/5 disabled:opacity-50 transition-colors"
                            >
                              <MinusIcon className="h-3.5 w-3.5" />
                            </button>
                            <span className="px-2 text-center text-white text-xs min-w-[1.5rem]">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.product?._id || item._id, item.quantity + 1)}
                              disabled={updating === (item.product?._id || item._id)}
                              className="px-2.5 py-1 text-white hover:bg-white/5 disabled:opacity-50 transition-colors"
                            >
                              <PlusIcon className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <button
                            onClick={() => removeItem(item.product?._id || item._id)}
                            className="text-gray-600 hover:text-red-400 transition-colors p-1"
                          >
                            <TrashIcon className="h-4.5 w-4.5" />
                          </button>
                        </div>
                      </div>

                      <div className="text-left sm:text-right flex-shrink-0 mt-1 sm:mt-0">
                        <p className="font-semibold text-[#C8A96E] text-base">
                          ₹{itemTotal.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-[#111111] border border-white/10 p-6 sticky top-24">
                <h2 className="text-[10px] font-semibold tracking-[0.45em] text-white uppercase mb-6">Order Summary</h2>

                <div className="space-y-3">
                  <div className="flex justify-between text-gray-400 text-sm">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-400 text-sm">
                    <span>Shipping</span>
                    <span className="text-green-400">Free</span> {/* ✅ Shipping free */}
                  </div>
                  <div className="border-t border-white/10 pt-3">
                    <div className="flex justify-between">
                      <span className="text-white font-medium">Total</span>
                      <span className="text-2xl text-[#C8A96E] font-semibold">
                        ₹{grandTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full mt-6 py-2.5 bg-[#7B2D42] text-white hover:bg-[#8A3048] transition-colors text-[10px] tracking-[0.3em] uppercase"
                >
                  Proceed to Checkout
                </button>

                <Link
                  href="/products"
                  className="block text-center mt-3 text-[10px] tracking-[0.2em] uppercase text-gray-600 hover:text-[#C8A96E] transition-colors"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CartPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center pt-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7B2D42]"></div>
      </div>
    }>
      <CartPageContent />
    </Suspense>
  );
}