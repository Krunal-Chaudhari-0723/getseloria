'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { HeartIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { isWishlisted, toggleWishlist } from '@/lib/wishlist';

interface ProductCardProps {
  product: {
    _id: string;
    name: string;
    description: string;
    price: number;
    originalPrice?: number;
    discountPercent?: number;
    images: string[];
    category: string;
    rating: number;
    stock: number;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [imgSrc, setImgSrc] = useState(product.images?.[0] || '');
  const [isWishlist, setIsWishlist] = useState(false);

  useEffect(() => {
    setIsWishlist(isWishlisted(product._id));

    const syncWishlist = () => setIsWishlist(isWishlisted(product._id));
    window.addEventListener('wishlistUpdated', syncWishlist);
    return () => window.removeEventListener('wishlistUpdated', syncWishlist);
  }, [product._id]);

  const addToCart = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product._id, quantity: 1 })
      });
      if (response.ok) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2500);
        window.dispatchEvent(new Event('cartUpdated'));
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to add to cart');
      }
    } catch {
      alert('Please login to add items to cart');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-[#111111] border border-white/10 overflow-hidden group hover:border-white/20 transition-colors"
    >
      <Link href={`/products/${product._id}`}>
        <div className="relative h-60 overflow-hidden bg-[#1a1a1a]">
          {imgSrc ? (
            <img
              src={imgSrc}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-600"
              onError={() => setImgSrc('')}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-gray-600 text-xs tracking-widest uppercase">No Image</span>
            </div>
          )}

          {/* Wishlist */}
          <button
            onClick={e => {
              e.preventDefault();
              setIsWishlist(toggleWishlist(product._id));
            }}
            className="absolute top-3 right-3 p-1.5 bg-black/60 backdrop-blur-sm hover:bg-black/80 transition-colors"
            aria-label={isWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            {isWishlist
              ? <HeartSolidIcon className="h-4 w-4 text-[#7B2D42]" />
              : <HeartIcon className="h-4 w-4 text-white/70" />}
          </button>

          {/* Category badge */}
          {product.category && (
            <div className="absolute top-3 left-3 px-2 py-0.5 bg-black/60 backdrop-blur-sm">
              <span className="text-[9px] tracking-[0.3em] uppercase text-[#C8A96E]">{product.category}</span>
            </div>
          )}

          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
              <span className="text-[10px] tracking-[0.3em] uppercase text-white border border-white/30 px-3 py-1">Out of Stock</span>
            </div>
          )}
        </div>
      </Link>

      <div className="p-4">
        <Link href={`/products/${product._id}`}>
          <h3 className="text-sm font-medium text-white hover:text-[#C8A96E] transition-colors line-clamp-1 tracking-wide">
            {product.name}
          </h3>
        </Link>
        <p className="text-xs text-gray-500 mt-1 line-clamp-1">{product.description}</p>

        <div className="flex items-center justify-between mt-3">
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-base font-semibold text-[#C8A96E]">₹{product.price.toLocaleString('en-IN')}</span>
              {!!product.discountPercent && (
                <>
                  <span className="text-xs text-gray-500 line-through">₹{product.originalPrice?.toLocaleString('en-IN')}</span>
                  <span className="text-xs text-green-500">{product.discountPercent}% off</span>
                </>
              )}
            </div>
            {product.rating > 0 && (
              <div className="flex items-center mt-0.5 gap-1">
                <span className="text-[#C8A96E] text-xs">★</span>
                <span className="text-xs text-gray-500">{product.rating.toFixed(1)}</span>
              </div>
            )}
          </div>

          <button
            onClick={addToCart}
            disabled={isLoading || product.stock === 0}
            className={`p-2.5 transition-colors ${
              product.stock === 0
                ? 'bg-white/5 text-gray-600 cursor-not-allowed'
                : 'bg-[#7B2D42] hover:bg-[#8A3048] text-white'
            }`}
          >
            <ShoppingCartIcon className="h-4 w-4" />
          </button>
        </div>

        {showSuccess && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-2 text-[10px] tracking-widest uppercase text-[#C8A96E]"
          >
            ✓ Added to cart
          </motion.p>
        )}
      </div>
    </motion.div>
  );
}
