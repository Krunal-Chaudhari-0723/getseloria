export const revalidate = 60; // Cache and statically pre-render the landing page for 60 seconds

import Link from 'next/link';
import { connectToDatabase } from '@/lib/db';
import Product from '@/lib/models/Product';
import ProductCard from '@/components/ProductCard';
import FadeIn from '@/components/FadeIn';
import NewsletterForm from '@/components/NewsletterForm';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

const FLOWER_IMAGE = '/flower.png';

const CATEGORIES = [
  { name: 'Necklaces', href: '/products?category=Necklace', image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=500&fit=crop' },
  { name: 'Rings', href: '/products?category=Ring', image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&h=500&fit=crop' },
  { name: 'Earrings', href: '/products?category=Earring', image: 'https://images.unsplash.com/photo-1635767798638-3e25273a8236?w=400&h=500&fit=crop' },
  { name: 'Bracelets', href: '/products?category=Bracelet', image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&h=500&fit=crop' },
  { name: 'Pendants', href: '/products?category=Pendant', image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=500&fit=crop' },
  { name: 'Bangles', href: '/products?category=Bangle', image: 'https://images.unsplash.com/photo-1596944924616-7b38e7cfac36?w=400&h=500&fit=crop' },
];

export default async function Home() {
  let products: any[] = [];
  try {
    await connectToDatabase();
    const rawProducts = await Product.find({ isActive: true })
      .select('-reviews -__v')
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();
    products = rawProducts.map((p: any) => ({
      ...p,
      _id: p._id.toString(),
    }));
  } catch (err) {
    console.error('Error loading products on homepage:', err);
  }

  return (
    <div className="bg-[#0a0a0a]">

      {/* ── HERO ── */}
      <section className="relative min-h-screen bg-black overflow-hidden flex items-center pt-16">

        {/* Mobile: flower as full background */}
        <div className="absolute inset-0 lg:hidden">
          <img src={FLOWER_IMAGE} alt="Seloria" className="w-full h-full object-cover object-[75%_center] opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/20" />
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-12 w-full relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

            {/* Left — content */}
            <FadeIn x={-40} className="text-center lg:text-left py-16 lg:py-0">
              {/* Logo badge */}
              <div className="w-16 h-16 rounded-full border border-[#C8A96E]/50 flex items-center justify-center mb-8 mx-auto lg:mx-0 relative overflow-hidden">
                <img src="/logo.jpeg" alt="Seloria" className="w-full h-full object-cover rounded-full" />
                {/* decorative dots */}
                <span className="absolute -top-1 left-1/2 -translate-x-1/2 text-[#C8A96E]/40 text-[8px]">✦</span>
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[#C8A96E]/40 text-[8px]">✦</span>
              </div>

              <h1 className="font-serif text-6xl sm:text-7xl md:text-8xl font-light tracking-[0.18em] text-white uppercase leading-none mb-5">
                SELORIA
              </h1>

              <div className="flex items-center gap-3 mb-6 justify-center lg:justify-start">
                <div className="h-px w-8 bg-[#C8A96E]/70" />
                <p className="text-[#C8A96E] text-[10px] tracking-[0.5em] uppercase font-light">
                  Loyalty Card
                </p>
                <div className="h-px w-8 bg-[#C8A96E]/70" />
              </div>

              <p className="text-gray-400 text-base leading-relaxed mb-10 max-w-sm mx-auto lg:mx-0">
                More than a card,<br />it's a connection.
              </p>

              <div className="flex flex-wrap items-center gap-6 justify-center lg:justify-start">
                <Link href="/auth/register"
                  className="px-8 py-3 bg-[#7B2D42] text-white text-[10px] tracking-[0.3em] uppercase hover:bg-[#8A3048] transition-colors">
                  Join Now
                </Link>
                <Link href="/profile"
                  className="flex items-center gap-2 text-white text-[10px] tracking-[0.3em] uppercase hover:text-[#C8A96E] transition-colors">
                  Explore Benefits <ArrowRightIcon className="h-3.5 w-3.5" />
                </Link>
              </div>
            </FadeIn>

            {/* Right — flower image (desktop only) */}
            <FadeIn x={40} className="hidden lg:block relative h-[680px]">
              <img src={FLOWER_IMAGE} alt="Seloria" className="w-full h-full object-cover opacity-80" />
              <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-black/60" />
            </FadeIn>
          </div>
        </div>

        {/* Vertical label */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 hidden xl:flex flex-col items-center gap-3">
          <div className="h-12 w-px bg-[#C8A96E]/30" />
          <p className="text-[#C8A96E]/50 text-[9px] tracking-[0.6em] uppercase"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
            Be Rewarded. Always.
          </p>
          <div className="h-12 w-px bg-[#C8A96E]/30" />
        </div>
      </section>

      {/* ── BENEFITS ── cream */}
      {/* <section className="bg-[#F5F0EB]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#D4C4B8]">
          {[
            {
              icon: (
                <svg className="w-6 h-6 text-[#7B2D42]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                </svg>
              ),
              title: 'EXCLUSIVE REWARDS',
              desc: 'Unlock premium rewards and seasonal offers, curated just for Seloria members.',
            },
            {
              icon: (
                <svg className="w-6 h-6 text-[#7B2D42]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1012 10.125 2.625 2.625 0 0012 4.875z" />
                </svg>
              ),
              title: 'SPECIAL PRIVILEGES',
              desc: 'Enjoy early access to new collections, member-only events, and more.',
            },
            {
              icon: (
                <svg className="w-6 h-6 text-[#7B2D42]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
                </svg>
              ),
              title: 'MEMBER STATUS',
              desc: 'The more you shop, the more you earn. Rise through tiers and enjoy elevated benefits.',
            },
          ].map(item => (
            <div key={item.title} className="px-8 lg:px-10 py-12 lg:py-14 text-center">
              <div className="w-14 h-14 rounded-full border border-[#7B2D42]/25 flex items-center justify-center mx-auto mb-6">
                {item.icon}
              </div>
              <h3 className="text-[10px] font-semibold tracking-[0.4em] text-gray-800 mb-3">{item.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              <Link href="/profile"
                className="inline-flex items-center gap-2 text-[10px] tracking-[0.3em] uppercase text-gray-600 mt-6 hover:text-[#7B2D42] transition-colors">
                Learn More <ArrowRightIcon className="h-3 w-3" />
              </Link>
            </div>
          ))}
        </div>
      </section> */}

      {/* ── COLLECTIONS ── dark */}
      <section className="py-16 lg:py-20 bg-[#111111]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 lg:mb-12">
            <p className="text-[#C8A96E] text-base mb-2">✦</p>
            <h2 className="text-[10px] font-semibold tracking-[0.5em] text-white uppercase">Shop Our Collections</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
            {CATEGORIES.map(cat => (
              <Link key={cat.name} href={cat.href}
                className="relative group overflow-hidden" style={{ aspectRatio: '3/4' }}>
                <img src={cat.image} alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-[0.6]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3 text-center">
                  <p className="text-white text-[9px] sm:text-[10px] font-semibold tracking-[0.3em] uppercase">{cat.name}</p>
                  <p className="text-[#C8A96E] text-[8px] sm:text-[9px] tracking-widest mt-1">Explore Now →</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED PRODUCTS ── */}
      <section className="py-16 lg:py-20 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-end mb-10 lg:mb-12">
            <div>
              <p className="text-[#C8A96E] text-[9px] tracking-[0.5em] uppercase mb-2">✦ Our Pieces</p>
              <h2 className="text-[10px] font-semibold tracking-[0.5em] text-white uppercase">Featured Collection</h2>
            </div>
            <Link href="/products"
              className="text-[#C8A96E] text-[10px] tracking-[0.3em] uppercase flex items-center gap-2 hover:text-white transition-colors">
              View All <ArrowRightIcon className="h-3 w-3" />
            </Link>
          </div>

          {products.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {products.map((p: any) => <ProductCard key={p._id} product={p} />)}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-gray-600 text-[10px] tracking-[0.4em] uppercase">No products yet</p>
            </div>
          )}
        </div>
      </section>

      {/* ── HOW IT WORKS ── cream */}
      {/* <section className="py-16 lg:py-20 bg-[#F5F0EB]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-[#7B2D42] text-base mb-2">✦</p>
          <h2 className="text-[10px] font-semibold tracking-[0.5em] text-gray-800 uppercase mb-12 lg:mb-16">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-12 relative">
            <div className="hidden sm:block absolute top-10 left-1/4 right-1/4 h-px bg-[#C8A96E]/30" />
            {[
              { num: '01.', icon: '⊕', label: 'JOIN',   desc: 'Sign up and become a Seloria member.' },
              { num: '02.', icon: '☆', label: 'EARN',   desc: 'Earn points every time you shop or engage.' },
              { num: '03.', icon: '◈', label: 'REDEEM', desc: 'Redeem your points for exclusive rewards.' },
            ].map((step, i) => (
              <div key={step.label} className="flex flex-col items-center relative">
                {i < 2 && (
                  <div className="sm:hidden absolute -bottom-5 left-1/2 h-10 w-px bg-[#C8A96E]/30" />
                )}
                <p className="text-[#C8A96E] text-sm font-light tracking-widest mb-4">{step.num}</p>
                <div className="w-14 h-14 rounded-full border border-[#7B2D42]/25 bg-white flex items-center justify-center mb-4">
                  <span className="text-[#7B2D42] text-xl">{step.icon}</span>
                </div>
                <h3 className="text-[10px] font-semibold tracking-[0.4em] text-gray-700 mb-2">{step.label}</h3>
                <p className="text-gray-500 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* ── NEWSLETTER ── burgundy */}
      {/* <section className="py-14 lg:py-16 bg-[#7B2D42]">
        <div className="max-w-xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-white text-[10px] tracking-[0.5em] uppercase mb-3">Stay Connected</h2>
          <p className="text-[#E8C0CC] text-sm mb-8">Subscribe for exclusive offers and new arrivals</p>
          <NewsletterForm />
        </div>
      </section> */}

    </div>
  );
}
