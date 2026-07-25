'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ShoppingCartIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { getWishlist } from '@/lib/wishlist';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [gifts, setGifts] = useState<any[]>([]);
  const [showGiftsMenu, setShowGiftsMenu] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const giftsMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (giftsMenuRef.current && !giftsMenuRef.current.contains(e.target as Node)) {
        setShowGiftsMenu(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const cached = sessionStorage.getItem('user');
    if (cached) {
      try {
        const u = JSON.parse(cached);
        setIsLoggedIn(true);
        setUserName(u.name);
        setUserRole(u.role);
        setIsAuthLoading(false);
      } catch {}
    }

    const handleAuthChanged = (e: any) => {
      setIsLoggedIn(true);
      setUserName(e.detail.name);
      setUserRole(e.detail.role);
      setIsAuthLoading(false);
      updateCartCount();
      fetchGifts();
    };

    checkAuth();
    updateCartCount();
    updateWishlistCount();
    fetchGifts();
    window.addEventListener('cartUpdated', updateCartCount);
    window.addEventListener('wishlistUpdated', updateWishlistCount);
    window.addEventListener('authChanged', handleAuthChanged);
    return () => {
      window.removeEventListener('cartUpdated', updateCartCount);
      window.removeEventListener('wishlistUpdated', updateWishlistCount);
      window.removeEventListener('authChanged', handleAuthChanged);
    };
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setIsLoggedIn(true);
        setUserName(data.user.name);
        setUserRole(data.user.role);  
        sessionStorage.setItem('user', JSON.stringify({ name: data.user.name, role: data.user.role, email: data.user.email }));
      } else {
        sessionStorage.removeItem('user');
        setIsLoggedIn(false);
        setUserName('');
        setUserRole('');
      }
      setIsAuthLoading(false);
    } catch {
      setIsAuthLoading(false);
    }
  };

  const fetchGifts = async () => {
    try {
      const res = await fetch(`/api/loyalty?t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      const items = data.eligibleProducts || [];
      setGifts(items);
    } catch {}
  };

  const updateCartCount = async () => {
    try {
      const res = await fetch('/api/cart');
      if (res.ok) {
        const data = await res.json();
        const total = (data.items || []).reduce((sum: number, item: any) => sum + (item.quantity || 1), 0);
        setCartCount(total);
      } else {
        setCartCount(0);
      }
    } catch {
      setCartCount(0);
    }
  };

  const updateWishlistCount = () => {
    try {
      setWishlistCount(getWishlist().length);
    } catch {
      setWishlistCount(0);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    sessionStorage.removeItem('user');
    window.location.href = '/';
  };

  if (pathname.startsWith('/admin')) return null;

  const navLinks = [
    { label: 'Home',         href: '/' },
    { label: 'Shop',         href: '/products' },
    { label: 'Wishlist',     href: '/wishlist' },
    { label: 'About',        href: '/about' },
    { label: 'Loyalty Card', href: '/loyalty' },
    { label: 'Contact',      href: '/contact' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-black/95 backdrop-blur-sm border-b border-white/10' : 'bg-black'
    }`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-12">
        <div className="flex items-center justify-between h-16 gap-2">

          {/* Logo */}
          <Link href="/" className="font-serif text-xl tracking-[0.35em] text-white uppercase hover:text-luxury-gold transition-colors shrink-0 md:mr-8">
            Seloria
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative text-[10px] tracking-[0.25em] uppercase transition-colors ${
                  pathname === link.href
                    ? 'text-[#C8A96E] border-b border-[#C8A96E] pb-0.5'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {link.label}
                {link.href === '/wishlist' && wishlistCount > 0 && (
                  <span className="absolute -top-2 -right-4 bg-[#7B2D42] text-white text-[9px] font-bold rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
                    {wishlistCount > 9 ? '9+' : wishlistCount}
                  </span>
                )}
              </Link>
            ))}
          </div>

          {/* Right */}
          <div className="flex items-center gap-2 sm:gap-4 ml-auto">
            {/* Gifts dropdown */}
            <div className="relative" ref={giftsMenuRef}>
              <button
                onClick={() => { setShowGiftsMenu(!showGiftsMenu); if (!showGiftsMenu) fetchGifts(); }}
                className="relative p-1.5 text-gray-400 hover:text-white transition-colors"
              >
                Gifts
                {gifts && gifts.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-[#7B2D42] text-white text-[9px] font-bold rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
                    {gifts.filter((g: any) => !g.claimed).length}
                  </span>
                )}
              </button>
              <AnimatePresence>
                {showGiftsMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="fixed inset-x-0 top-[4.5rem] mx-auto z-[60] w-[calc(100vw-1rem)] max-w-[22rem] bg-[#111]/95 border border-white/10 py-3 shadow-2xl rounded-xl backdrop-blur-sm md:absolute md:right-0 md:top-full md:mt-2 md:left-auto md:mx-0 md:w-80"
                  >
                    <div className="px-3 text-xs text-gray-400 mb-2">Available Gifts</div>
                    <div className="max-h-[min(18rem,calc(100vh-6rem))] overflow-y-auto">
                      {gifts.length === 0 && <div className="px-3 py-2 text-sm text-gray-400">No gifts available</div>}
                      {gifts.map((p: any) => (
                        <div key={p._id} className="flex items-center gap-3 px-3 py-2 hover:bg-white/2">
                          <div className="h-10 w-10 bg-[#1a1a1a] flex-shrink-0">
                            <img src={p.images?.[0] || ''} alt={p.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate">{p.name}</p>
                            <p className="text-[10px] text-gray-500 mt-0.5">₹{p.price.toLocaleString('en-IN')}</p>
                          </div>
                          <div>
                            {p.claimed ? (
                              <span className="text-[10px] text-gray-500">Claimed</span>
                            ) : (
                              <button
                                onClick={() => {
                                  setShowGiftsMenu(false);
                                  router.push(`/checkout?gift=${p._id}`);
                                }}
                                className="px-2 py-1 bg-[#7B2D42] text-white text-[10px] tracking-[0.3em] uppercase hover:bg-[#8A3048] transition-colors"
                              >
                                Claim
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {/* Cart */}
            <Link href="/cart" className="relative p-1.5 text-gray-400 hover:text-white transition-colors">
              <ShoppingCartIcon className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#7B2D42] text-white text-[9px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>

            {/* User */}
            {!isAuthLoading && isLoggedIn ? (
              <div className="relative hidden sm:block" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2"
                >
                  <div className="h-7 w-7 rounded-full bg-[#7B2D42] flex items-center justify-center text-white text-xs font-semibold">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                </button>
                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-3 w-52 bg-[#111] border border-white/10 py-2 shadow-2xl"
                    >
                      <div className="px-4 py-2 border-b border-white/10 mb-1">
                        <p className="text-white text-xs font-medium">{userName}</p>
                        <p className="text-gray-500 text-[10px] tracking-widest uppercase mt-0.5">{userRole}</p>
                      </div>
                      {userRole === 'admin' && (
                        <Link href="/admin/dashboard"
                          className="flex items-center px-4 py-2 text-[10px] tracking-widest uppercase text-[#C8A96E] hover:bg-white/5 transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}>
                          Admin Panel
                        </Link>
                      )}
                      {[
                        { label: 'My Profile', href: '/profile' },
                        { label: 'Loyalty Cards', href: '/loyalty' },
                        { label: 'My Orders', href: '/orders' },
                        { label: 'Wishlist', href: '/wishlist' },
                        { label: 'Terms', href: '/terms' },
                      ].map(link => {
                        const isActive = pathname === link.href;
                        return (
                          <Link
                            key={link.href}
                            href={link.href}
                            className={`flex items-center px-4 py-2 text-[10px] tracking-widest uppercase transition-colors ${
                              isActive
                                ? 'text-[#C8A96E] font-semibold bg-white/5'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            {link.label}
                          </Link>
                        );
                      })}
                      <div className="border-t border-white/10 mt-1 pt-1">
                        <button onClick={handleLogout}
                          className="flex items-center w-full px-4 py-2 text-[10px] tracking-widest uppercase text-[#7B2D42] hover:bg-white/5 transition-colors">
                          Logout
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : !isAuthLoading ? (
              <Link href="/auth/login"
                className="border border-white px-4 py-1.5 text-[10px] tracking-[0.25em] uppercase text-white hover:bg-white hover:text-black transition-colors">
                Join Now
              </Link>
            ) : null}

            {/* Mobile toggle */}
            <button className="md:hidden p-2 rounded-md border border-white/20 bg-white/5 text-white hover:bg-white/10 transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <XMarkIcon className="h-5 w-5" /> : <Bars3Icon className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-black border-t border-white/10 overflow-hidden"
          >
            <div className="px-6 py-6 space-y-5">
              {navLinks.map(link => (
                <Link key={link.href} href={link.href}
                  className="block text-[10px] tracking-[0.3em] uppercase text-gray-400 hover:text-white transition-colors"
                  onClick={() => setIsMenuOpen(false)}>
                  {link.label}
                </Link>
              ))}
              <div className="border-t border-white/10 pt-5 space-y-4">
                {!isAuthLoading && isLoggedIn ? (
                  <>
                    <Link href="/profile" className="block text-[10px] tracking-[0.3em] uppercase text-gray-400 hover:text-white transition-colors" onClick={() => setIsMenuOpen(false)}>My Profile</Link>
                    <Link href="/orders" className="block text-[10px] tracking-[0.3em] uppercase text-gray-400 hover:text-white transition-colors" onClick={() => setIsMenuOpen(false)}>My Orders</Link>
                    {gifts && gifts.filter((g: any) => !g.claimed).length > 0 && (
                      <Link href="/loyalty" className="block text-[10px] tracking-[0.3em] uppercase text-[#C8A96E] font-semibold hover:text-white transition-colors" onClick={() => setIsMenuOpen(false)}>
                        Claim Gift ({gifts.filter((g: any) => !g.claimed).length})
                      </Link>
                    )}
                    <Link href="/wishlist" className="block text-[10px] tracking-[0.3em] uppercase text-gray-400 hover:text-white transition-colors" onClick={() => setIsMenuOpen(false)}>
                      Wishlist {wishlistCount > 0 ? `(${wishlistCount})` : ''}
                    </Link>
                    <Link href="/loyalty" className="block text-[10px] tracking-[0.3em] uppercase text-gray-400 hover:text-white transition-colors" onClick={() => setIsMenuOpen(false)}>Loyalty Cards</Link>
                    <Link href="/terms" className="block text-[10px] tracking-[0.3em] uppercase text-gray-400 hover:text-white transition-colors" onClick={() => setIsMenuOpen(false)}>Terms</Link>
                    <button onClick={handleLogout} className="block text-[10px] tracking-[0.3em] uppercase text-[#7B2D42] hover:text-[#8A3048] transition-colors">Logout</button>
                  </>
                ) : !isAuthLoading ? (
                  <Link href="/auth/login"
                    className="inline-block border border-white px-5 py-2 text-[10px] tracking-[0.25em] uppercase text-white hover:bg-white hover:text-black transition-colors"
                    onClick={() => setIsMenuOpen(false)}>
                    Join Now
                  </Link>
                ) : null}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
