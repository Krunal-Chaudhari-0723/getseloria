'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import { HeartIcon, TrashIcon } from '@heroicons/react/24/outline';
import { getWishlist, setWishlist } from '@/lib/wishlist';

export default function WishlistPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);

  useEffect(() => {
    const syncWishlist = () => setWishlistIds(getWishlist());

    syncWishlist();
    window.addEventListener('wishlistUpdated', syncWishlist);
    return () => window.removeEventListener('wishlistUpdated', syncWishlist);
  }, []);

  useEffect(() => {
    const fetchWishlistProducts = async () => {
      setLoading(true);
      try {
        const allProducts: any[] = [];
        let page = 1;
        let hasMore = true;

        while (hasMore) {
          const response = await fetch(`/api/products?limit=100&page=${page}`);
          if (!response.ok) break;

          const data = await response.json();
          const pageProducts = data?.products || [];
          allProducts.push(...pageProducts);
          hasMore = page < (data?.pages || 1);
          page += 1;
        }

        setProducts(allProducts.filter(product => wishlistIds.includes(product._id)));
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlistProducts();
  }, [wishlistIds]);

  const clearWishlist = () => {
    setWishlist([]);
    setWishlistIds([]);
    setProducts([]);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <p className="text-[10px] tracking-[0.4em] uppercase text-[#C8A96E] mb-2">Saved Items</p>
            <h1 className="text-2xl font-serif text-white">My Wishlist</h1>
            <p className="text-gray-400 mt-1 text-sm">Products you have saved for later</p>
          </div>

          {wishlistIds.length > 0 && (
            <button
              onClick={clearWishlist}
              className="inline-flex items-center gap-2 px-4 py-2 border border-white/10 text-[10px] tracking-[0.3em] uppercase text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              <TrashIcon className="h-4 w-4" />
              Clear Wishlist
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-[#111111] border border-white/10 h-80 animate-pulse" />
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product: any) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        ) : (
          <div className="bg-[#111111] border border-white/10 p-12 text-center">
            <HeartIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-serif text-white">Your wishlist is empty</h2>
            <p className="text-gray-400 mt-2 text-sm">Tap the heart icon on products to save them here.</p>
            <Link href="/products" className="inline-block mt-6 bg-[#7B2D42] text-white hover:bg-[#8A3048] transition-colors text-[10px] tracking-[0.3em] uppercase px-6 py-2.5">
              Browse Products
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}