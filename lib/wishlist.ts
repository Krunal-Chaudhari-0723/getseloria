const WISHLIST_KEY = 'seloria-wishlist';

export function getWishlist(): string[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = window.localStorage.getItem(WISHLIST_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

export function isWishlisted(productId: string): boolean {
  return getWishlist().includes(productId);
}

export function toggleWishlist(productId: string): boolean {
  if (typeof window === 'undefined') return false;

  const wishlist = new Set(getWishlist());
  if (wishlist.has(productId)) {
    wishlist.delete(productId);
  } else {
    wishlist.add(productId);
  }

  window.localStorage.setItem(WISHLIST_KEY, JSON.stringify(Array.from(wishlist)));
  window.dispatchEvent(new Event('wishlistUpdated'));
  return wishlist.has(productId);
}

export function setWishlist(productIds: string[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(WISHLIST_KEY, JSON.stringify(productIds));
  window.dispatchEvent(new Event('wishlistUpdated'));
}