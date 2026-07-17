'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import { motion } from 'framer-motion';
import { FunnelIcon } from '@heroicons/react/24/outline';

// Create a separate component that uses useSearchParams
function ProductsContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    sort: '-createdAt',
    minPrice: '',
    maxPrice: '',
    search: searchParams.get('search') || ''
  });
  const [categories, setCategories] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [filters]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`/api/products/categories?t=${Date.now()}`, { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        setCategories(data || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.sort) queryParams.append('sort', filters.sort);
      if (filters.minPrice) queryParams.append('minPrice', filters.minPrice);
      if (filters.maxPrice) queryParams.append('maxPrice', filters.maxPrice);
      if (filters.search) queryParams.append('search', filters.search);
      queryParams.append('limit', '24');

      const response = await fetch(`/api/products?${queryParams}`);
      const data = await response.json();

      setProducts(data?.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      sort: '-createdAt',
      minPrice: '',
      maxPrice: '',
      search: ''
    });
  };

  const sortOptions = [
    { value: '-createdAt', label: 'Newest First' },
    { value: 'price', label: 'Price: Low to High' },
    { value: '-price', label: 'Price: High to Low' },
    { value: '-rating', label: 'Highest Rated' }
  ];

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-[#111111] border border-white/10 h-80 animate-pulse">
                <div className="h-48 bg-[#1a1a1a]"></div>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-[#1a1a1a] w-3/4"></div>
                  <div className="h-4 bg-[#1a1a1a] w-1/2"></div>
                  <div className="h-8 bg-[#1a1a1a] w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <p className="text-[10px] tracking-[0.4em] uppercase text-[#C8A96E] mb-2">✦ Collection</p>
            <h1 className="text-2xl font-serif text-white">Our Collection</h1>
            <p className="text-gray-400 mt-1 text-sm">Discover our exquisite jewelry collection</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden flex items-center border border-white/20 text-white hover:bg-white/5 text-[10px] tracking-[0.3em] uppercase px-4 py-2.5 transition-colors"
            >
              <FunnelIcon className="h-4 w-4 mr-2" />
              Filters
            </button>
            <select
              value={filters.sort}
              onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
              className="bg-[#1a1a1a] border border-white/10 text-white focus:outline-none focus:border-[#C8A96E] px-4 py-2.5 text-sm"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value} className="bg-[#1a1a1a]">
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Filters - Desktop */}
          <div className={`${showFilters ? 'block' : 'hidden'} md:block w-full md:w-64 flex-shrink-0`}>
            <div className="bg-[#111111] border border-white/10 p-6 sticky top-24">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[10px] font-semibold tracking-[0.45em] text-white uppercase">Filters</h3>
                <button
                  onClick={clearFilters}
                  className="text-[10px] tracking-[0.2em] uppercase text-[#C8A96E] hover:text-white transition-colors"
                >
                  Clear All
                </button>
              </div>

              {/* Category */}
              <div className="mb-6">
                <h4 className="text-[10px] tracking-[0.3em] uppercase text-gray-400 mb-3">Category</h4>
                <div className="space-y-2">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="category"
                      value=""
                      checked={filters.category === ''}
                      onChange={() => setFilters({ ...filters, category: '' })}
                      className="mr-2 accent-[#C8A96E]"
                    />
                    <span className="text-sm text-[#C8A96E]">All</span>
                  </label>
                  {categories.length > 0 ? (
                    categories.map(category => (
                      <label key={category} className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="category"
                          value={category}
                          checked={filters.category === category}
                          onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                          className="mr-2 accent-[#C8A96E]"
                        />
                        <span className="text-sm text-gray-400 hover:text-white transition-colors">{category}</span>
                      </label>
                    ))
                  ) : (
                    <p className="text-sm text-gray-600">No categories available</p>
                  )}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <h4 className="text-[10px] tracking-[0.3em] uppercase text-gray-400 mb-3">Price Range</h4>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice}
                    onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                    className="w-1/2 bg-[#1a1a1a] border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-[#C8A96E] px-3 py-2 text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                    className="w-1/2 bg-[#1a1a1a] border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-[#C8A96E] px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <button
                onClick={() => setShowFilters(false)}
                className="w-full md:hidden bg-[#7B2D42] text-white hover:bg-[#8A3048] transition-colors text-[10px] tracking-[0.3em] uppercase py-2.5"
              >
                Apply Filters
              </button>
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            {products.length === 0 ? (
              <div className="bg-[#111111] border border-white/10 p-12 text-center">
                <p className="text-gray-400 text-lg">No products found</p>
                <button
                  onClick={clearFilters}
                  className="mt-4 text-[#C8A96E] hover:text-white transition-colors text-[10px] tracking-[0.3em] uppercase"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product: any, index: number) => (
                  <motion.div
                    key={product._id || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Main export - wraps the content in Suspense
export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-[#111111] border border-white/10 h-80 animate-pulse">
                <div className="h-48 bg-[#1a1a1a]"></div>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-[#1a1a1a] w-3/4"></div>
                  <div className="h-4 bg-[#1a1a1a] w-1/2"></div>
                  <div className="h-8 bg-[#1a1a1a] w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}
