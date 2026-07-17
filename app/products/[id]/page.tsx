'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  StarIcon,
  ShoppingCartIcon,
  HeartIcon,
  ShareIcon,
  CheckIcon,
  TruckIcon,
  ShieldCheckIcon,
  ArrowLeftIcon,
  MinusIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { isWishlisted, toggleWishlist } from '@/lib/wishlist';

export default function ProductDetail() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [shareMessage, setShareMessage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [isWishlist, setIsWishlist] = useState(false);

  // Review state
  const [reviewRating, setReviewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);

  useEffect(() => {
    fetchProduct();

    if (params.id) {
      setIsWishlist(isWishlisted(String(params.id)));
      const syncWishlist = () => setIsWishlist(isWishlisted(String(params.id)));
      window.addEventListener('wishlistUpdated', syncWishlist);
      return () => window.removeEventListener('wishlistUpdated', syncWishlist);
    }
  }, [params.id]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${params.id}`);
      if (response.ok) {
        setProduct(await response.json());
      } else {
        router.push('/products');
      }
    } catch {
      router.push('/products');
    } finally {
      setLoading(false);
    }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reviewRating === 0) { setReviewError('Please select a star rating'); return; }
    setSubmittingReview(true);
    setReviewError('');
    try {
      const res = await fetch(`/api/products/${params.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: reviewRating, comment: reviewComment }),
      });
      const data = await res.json();
      if (res.ok) {
        setReviewSuccess(true);
        setReviewRating(0);
        setReviewComment('');
        fetchProduct();
      } else {
        setReviewError(data.error || 'Failed to submit review');
      }
    } catch {
      setReviewError('Please login to submit a review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const addToCart = async () => {
    setAddingToCart(true);
    try {

      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          productId: product._id, 
          quantity,
        }),
      });
      
      if (response.ok) {
        setAddedToCart(true);
        window.dispatchEvent(new Event('cartUpdated'));
        setTimeout(() => setAddedToCart(false), 3000);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to add to cart');
      }
    } catch {
      alert('Please login to add items to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleShare = async () => {
    if (!product) return;

    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    const shareData = {
      title: product.name,
      text: `${product.name} - ₹${product.price.toLocaleString('en-IN')}`,
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setShareMessage('Product shared successfully');
      } else if (navigator.clipboard && shareUrl) {
        await navigator.clipboard.writeText(shareUrl);
        setShareMessage('Product link copied');
      } else {
        setShareMessage('Sharing is not supported on this device');
      }
    } catch {
      setShareMessage('Sharing cancelled');
    }

    window.setTimeout(() => setShareMessage(''), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center pt-16">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#7B2D42]" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center pt-16">
        <div className="text-center">
          <p className="text-gray-400 text-sm tracking-widest uppercase">Product not found</p>
          <Link href="/products" className="text-[#C8A96E] hover:text-white mt-4 inline-block text-[10px] tracking-widest uppercase transition-colors">
            ← Back to Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-16">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-10">

        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-8 text-[10px] tracking-[0.3em] uppercase"
        >
          <ArrowLeftIcon className="h-4 w-4" /> Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14">

          {/* ── Images ── */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-3">
            <div className="aspect-square bg-[#111111] border border-white/10 overflow-hidden">
              {product.images[selectedImage] ? (
                <img
                  src={product.images[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-gray-600 text-xs tracking-widest uppercase">No Image</span>
                </div>
              )}
            </div>

            {product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {product.images.map((img: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`h-20 w-20 flex-shrink-0 overflow-hidden border transition-colors ${
                      selectedImage === i ? 'border-[#C8A96E]' : 'border-white/10 hover:border-white/30'
                    }`}
                  >
                    <img src={img} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* ── Info ── */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">

            {/* Category + Name */}
            <div>
              <p className="text-[10px] tracking-[0.4em] uppercase text-[#C8A96E] mb-2">{product.category}</p>
              <h1 className="font-serif text-4xl text-white font-light tracking-wide">{product.name}</h1>

              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    i < Math.floor(product.rating)
                      ? <StarSolidIcon key={i} className="h-4 w-4 text-[#C8A96E]" />
                      : <StarIcon key={i} className="h-4 w-4 text-gray-700" />
                  ))}
                  <span className="ml-2 text-xs text-gray-500">({product.numReviews || 0} reviews)</span>
                </div>
                <span className={`text-[10px] tracking-widest uppercase px-2 py-0.5 ${
                  product.stock > 0 ? 'text-green-400 bg-green-900/20' : 'text-red-400 bg-red-900/20'
                }`}>
                  {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 border-y border-white/10 py-5 flex-wrap">
              <span className="font-serif text-4xl text-[#C8A96E]">₹{product.price.toLocaleString('en-IN')}</span>
              {!!product.discountPercent && (
                <>
                  <span className="text-lg text-gray-500 line-through">₹{product.originalPrice?.toLocaleString('en-IN')}</span>
                  <span className="text-sm text-green-500 font-medium">{product.discountPercent}% off</span>
                </>
              )}
            </div>

            {/* Description */}
            <p className="text-gray-400 text-sm leading-relaxed">{product.description}</p>

            {/* Specs */}
            {(product.metalType || product.gemstone || product.weight || product.dimensions) && (
              <div className="grid grid-cols-2 gap-4 bg-[#111] border border-white/10 p-4">
                {product.metalType && (
                  <div>
                    <p className="text-[10px] tracking-widest uppercase text-gray-600 mb-1">Metal Type</p>
                    <p className="text-sm text-white">{product.metalType}</p>
                  </div>
                )}
                {product.gemstone && (
                  <div>
                    <p className="text-[10px] tracking-widest uppercase text-gray-600 mb-1">Gemstone</p>
                    <p className="text-sm text-white">{product.gemstone}</p>
                  </div>
                )}
                {product.weight && (
                  <div>
                    <p className="text-[10px] tracking-widest uppercase text-gray-600 mb-1">Weight</p>
                    <p className="text-sm text-white">{product.weight}g</p>
                  </div>
                )}
                {product.dimensions && (
                  <div>
                    <p className="text-[10px] tracking-widest uppercase text-gray-600 mb-1">Dimensions</p>
                    <p className="text-sm text-white">{product.dimensions}</p>
                  </div>
                )}
              </div>
            )}

            {!!product.discountPercent && !!product.originalPrice && (
              <p className="text-sm text-green-500">
                You save ₹{(product.originalPrice - product.price).toLocaleString('en-IN')} ({product.discountPercent}%) on this purchase
              </p>
            )}

            {/* Quantity + Add to Cart */}
            <div className="flex items-stretch gap-3">
              {/* Qty stepper */}
              <div className="flex items-center border border-white/10 bg-[#111]">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="px-3 py-3 text-gray-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-30"
                >
                  <MinusIcon className="h-4 w-4" />
                </button>
                <span className="px-4 text-white text-sm min-w-[3rem] text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  disabled={quantity >= product.stock}
                  className="px-3 py-3 text-gray-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-30"
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              </div>

              {/* Add to Cart */}
              <button
                onClick={addToCart}
                disabled={addingToCart || product.stock === 0}
                className={`flex-1 flex items-center justify-center gap-2 text-[10px] tracking-[0.3em] uppercase font-medium transition-colors ${
                  product.stock === 0
                    ? 'bg-white/5 text-gray-600 cursor-not-allowed'
                    : addedToCart
                    ? 'bg-green-800 text-white'
                    : 'bg-[#7B2D42] hover:bg-[#8A3048] text-white'
                }`}
              >
                {addingToCart ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : addedToCart ? (
                  <><CheckIcon className="h-4 w-4" /> Added</>
                ) : (
                  <><ShoppingCartIcon className="h-4 w-4" /> Add to Cart</>
                )}
              </button>
            </div>

            {/* Wishlist + Share */}
            <div className="flex gap-3">
              <button
                onClick={() => setIsWishlist(toggleWishlist(String(params.id)))}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 border transition-colors text-[10px] tracking-[0.3em] uppercase ${
                  isWishlist
                    ? 'border-[#7B2D42] text-[#7B2D42]'
                    : 'border-white/10 text-gray-500 hover:border-white/30 hover:text-white'
                }`}
                aria-label={isWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <HeartIcon className="h-4 w-4" /> Wishlist
              </button>
                <button
                  onClick={handleShare}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-white/10 text-gray-500 hover:border-white/30 hover:text-white transition-colors text-[10px] tracking-[0.3em] uppercase"
                >
                <ShareIcon className="h-4 w-4" /> Share
              </button>
            </div>

              {shareMessage && (
                <p className="text-[10px] tracking-widest uppercase text-[#C8A96E]">
                  {shareMessage}
                </p>
              )}

            {/* Guarantees */}
            <div className="border-t border-white/10 pt-5 space-y-3">
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <TruckIcon className="h-4 w-4 text-[#C8A96E] flex-shrink-0" />
                Free delivery on orders above ₹999
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <ShieldCheckIcon className="h-4 w-4 text-[#C8A96E] flex-shrink-0" />
                100% genuine products with authenticity guarantee
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Reviews ── */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 pb-16">
        <div className="border-t border-white/10 pt-12">
          <h2 className="text-[10px] tracking-[0.5em] uppercase text-[#C8A96E] mb-8">Customer Reviews</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

            {/* Existing reviews */}
            <div className="space-y-5">
              {(!product.reviews || product.reviews.length === 0) ? (
                <p className="text-gray-600 text-sm tracking-widest">No reviews yet. Be the first!</p>
              ) : (
                product.reviews.map((r: any, i: number) => (
                  <div key={i} className="border border-white/10 p-4 bg-[#111]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white text-sm font-medium">{r.name}</span>
                      <span className="text-[10px] text-gray-600">
                        {new Date(r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-0.5 mb-2">
                      {[...Array(5)].map((_, j) => (
                        j < r.rating
                          ? <StarSolidIcon key={j} className="h-3.5 w-3.5 text-[#C8A96E]" />
                          : <StarIcon key={j} className="h-3.5 w-3.5 text-gray-700" />
                      ))}
                    </div>
                    <p className="text-gray-400 text-sm leading-relaxed">{r.comment}</p>
                  </div>
                ))
              )}
            </div>

            {/* Write a review */}
            <div>
              <p className="text-[10px] tracking-[0.4em] uppercase text-gray-400 mb-5">Write a Review</p>

              {reviewSuccess ? (
                <div className="border border-green-500/30 bg-green-900/20 p-4 text-green-400 text-sm">
                  Thank you! Your review has been submitted.
                </div>
              ) : (
                <form onSubmit={submitReview} className="space-y-4">
                  {/* Star picker */}
                  <div>
                    <p className="text-[10px] text-gray-500 tracking-widest uppercase mb-2">Your Rating</p>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                        >
                          {star <= (hoverRating || reviewRating)
                            ? <StarSolidIcon className="h-6 w-6 text-[#C8A96E]" />
                            : <StarIcon className="h-6 w-6 text-gray-600" />
                          }
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Comment */}
                  <div>
                    <p className="text-[10px] text-gray-500 tracking-widest uppercase mb-2">Your Comment</p>
                    <textarea
                      value={reviewComment}
                      onChange={e => setReviewComment(e.target.value)}
                      required
                      rows={4}
                      placeholder="Share your experience with this product..."
                      className="w-full bg-[#111] border border-white/10 text-white placeholder-gray-600 text-sm px-4 py-3 focus:outline-none focus:border-[#C8A96E] resize-none"
                    />
                  </div>

                  {reviewError && (
                    <p className="text-red-400 text-xs">{reviewError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="px-8 py-2.5 bg-[#7B2D42] text-white text-[10px] tracking-[0.3em] uppercase hover:bg-[#8A3048] disabled:opacity-50 transition-colors"
                  >
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}