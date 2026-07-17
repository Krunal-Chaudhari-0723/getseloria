'use client';

import Image from 'next/image';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-16">
      {/* Hero */}
      <section className="bg-black py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-[#C8A96E] text-[10px] tracking-[0.4em] uppercase mb-4">✦</p>
          <h1 className="text-4xl md:text-5xl font-serif text-white mb-4 tracking-wide">About Seliora</h1>
          <p className="text-gray-400 text-lg leading-relaxed">
            Where timeless craftsmanship meets modern elegance every piece tells a story.
          </p>
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-white/10" />

      {/* Our Story */}
      <section className="py-16 bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-[#C8A96E] text-[10px] tracking-[0.4em] uppercase mb-3">Our Story</p>
              <h2 className="text-2xl font-serif text-white mb-6">Crafting Beauty Since Day One</h2>
              <p className="text-gray-400 leading-relaxed mb-4">
                Seliora was born from a passion for jewelry that transcends trends. We believe that the right piece of jewelry doesn&apos;t just accessorize an outfit  it becomes a part of who you are.
              </p>
              <p className="text-gray-400 leading-relaxed mb-4">
                Every ring, necklace, earring, and bracelet in our collection is thoughtfully designed and carefully crafted. We source only the finest materials to ensure that each piece is not just beautiful, but built to last a lifetime.
              </p>
              <p className="text-gray-400 leading-relaxed">
                From bridal jewelry to everyday elegance, Seliora has something for every moment, every milestone, and every woman.
              </p>
            </div>
            <div className="relative">
              <div className="bg-[#111111] border border-white/10 h-80 flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="text-6xl mb-4">💎</div>
                  <p className="text-[#C8A96E] font-semibold text-xl tracking-wide">Premium Quality</p>
                  <p className="text-gray-400 mt-2">Handcrafted with love</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-white/10" />

      {/* Meet the Founders */}
      <section className="py-20 bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-[#C8A96E] text-[10px] tracking-[0.4em] uppercase mb-3">✦</p>
            <h2 className="text-3xl font-serif text-white tracking-wide">Meet the Founders</h2>
            <p className="text-gray-400 mt-3 text-sm max-w-xl mx-auto leading-relaxed">
              Two visions, one purpose building Seliora into a name synonymous with elegance and trust.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 max-w-3xl mx-auto">
            {/* Founder 1 */}
            <div className="group text-center">
              <div className="relative w-full aspect-[3/4] overflow-hidden bg-[#111111] border border-white/10">
                <Image
                  src="/komal.jpeg"
                  alt="Komal Kashyap Co-Founder, Seliora"
                  fill
                  sizes="(max-width: 640px) 100vw, 50vw"
                  className="object-cover grayscale-[15%] group-hover:grayscale-0 transition-all duration-500"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
              <h3 className="mt-6 text-white font-serif text-xl tracking-wide">Komal Kashyap</h3>
              <p className="text-[#C8A96E] text-[10px] tracking-[0.3em] uppercase mt-2">Co-Founder</p>
              <p className="text-gray-400 text-sm leading-relaxed mt-4 px-2">
                Komal leads Seliora&apos;s creative direction, shaping every collection with an eye for timeless design and modern elegance.
              </p>
            </div>

            {/* Founder 2 */}
            <div className="group text-center">
              <div className="relative w-full aspect-[3/4] overflow-hidden bg-[#111111] border border-white/10">
                <Image
                  src="/neha.jpeg"
                  alt="Neha Mishra Co-Founder, Seliora"
                  fill
                  sizes="(max-width: 640px) 100vw, 50vw"
                  className="object-cover grayscale-[15%] group-hover:grayscale-0 transition-all duration-500"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
              <h3 className="mt-6 text-white font-serif text-xl tracking-wide">Neha Mishra</h3>
              <p className="text-[#C8A96E] text-[10px] tracking-[0.3em] uppercase mt-2">Co-Founder</p>
              <p className="text-gray-400 text-sm leading-relaxed mt-4 px-2">
                Neha drives operations and quality assurance, ensuring every piece that leaves Seliora meets the highest standard of craftsmanship.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-[#F5F0EB]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-[10px] tracking-[0.4em] uppercase text-gray-500 mb-3">✦</p>
            <h2 className="text-2xl font-serif text-gray-800">Why Choose Seliora?</h2>
            <p className="text-gray-500 mt-2 text-sm">Our commitment to quality, beauty, and trust</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: '✦', title: 'Handcrafted Quality', desc: 'Every piece is carefully crafted by skilled artisans using traditional techniques combined with modern design.' },
              { icon: '🔒', title: 'Certified Authenticity', desc: 'All our jewelry comes with authenticity certificates ensuring you receive genuine, high-quality materials.' },
              { icon: '💝', title: 'Gifting Made Easy', desc: 'Beautiful packaging and gift options make Seliora the perfect choice for every special occasion.' },
            ].map(v => (
              <div key={v.title} className="bg-white border border-gray-200 p-6 text-center">
                <div className="text-3xl mb-4 text-[#7B2D42]">{v.icon}</div>
                <h3 className="text-[10px] tracking-[0.3em] uppercase text-gray-800 mb-3 font-semibold">{v.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-[#7B2D42]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            {[
              { number: '50+', label: 'Products' },
              { number: '100+', label: 'Happy Customers' },
              { number: '5★', label: 'Average Rating' },
              { number: '100%', label: 'Authentic Jewelry' },
            ].map(s => (
              <div key={s.label}>
                <p className="text-4xl font-bold text-[#C8A96E]">{s.number}</p>
                <p className="text-white/70 mt-1 text-[10px] tracking-[0.3em] uppercase">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}