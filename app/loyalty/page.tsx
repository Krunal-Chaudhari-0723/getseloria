'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LoyaltyCard from '@/components/LoyaltyCard';
import { ClipboardDocumentListIcon, GiftIcon } from '@heroicons/react/24/outline';
import { TIERS } from '@/lib/loyalty';

const CARD_GLOW: Record<string, string> = {
  'Opal':        'shadow-gray-500/30',
  'Sapphire':    'shadow-blue-500/40',
  'Emerald':     'shadow-emerald-500/40',
  'Pink Quartz': 'shadow-pink-500/40',
  'Ruby':        'shadow-red-500/40',
};

const CARD_TYPES = ['Opal', 'Sapphire', 'Emerald', 'Pink Quartz', 'Ruby'];

const CARD_DESCRIPTIONS: Record<string, string> = {
  'Opal': 'This category includes products ranging from ₹99 – ₹399.',
  'Sapphire': 'This category includes products ranging from ₹399 – ₹999.',
  'Emerald': 'This category includes products ranging from ₹999 – ₹1,499.',
  'Pink Quartz': 'This category includes products ranging from ₹1,499 – ₹2,499.',
  'Ruby': 'This category includes products ranging from ₹2,499 – ₹3,999.',
};

const CARD_RANK_LABEL: Record<string, string> = {
  'Opal': 'Lowest',
  'Ruby': 'Highest',
};

function MiniLoyaltyCard({ cardType, onInfoClick }: { cardType: string; onInfoClick?: (cardType: string) => void }) {
  const tier = TIERS.find(t => t.name === cardType) ?? TIERS[0];
  return (
    <div
      className={`relative bg-gradient-to-br ${tier.gradient} overflow-hidden shadow-lg ${CARD_GLOW[cardType] ?? ''}`}
      style={{ aspectRatio: '1.7 / 1', borderRadius: 8 }}
    >
      <div className="absolute top-2 right-14 z-10">
        <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 bg-black/30 flex items-center justify-center">
          <img src="/logo.jpeg" alt="Logo" className="w-full h-full object-cover" />
        </div>
      </div>
      {onInfoClick && (
        <button
          type="button"
          onClick={() => onInfoClick(cardType)}
          className="absolute top-2 right-2 z-30 h-8 w-8 flex items-center justify-center border border-white/20 bg-black/55 text-white text-xs font-semibold hover:bg-black/75 transition-colors"
          aria-label={`View ${cardType} card info`}
        >
          !
        </button>
      )}

      <img
        src="/flower.png"
        alt=""
        className="absolute -bottom-2 -left-2 w-20 h-20 object-cover opacity-40"
        style={{ filter: `hue-rotate(${tier.glowColor})` }}
      />
      <div className="relative z-10 p-4 h-full flex flex-col justify-between pr-14">
        <div>
          <p className={`text-[10px] font-bold tracking-[0.25em] uppercase ${tier.textColor}`}>SELORIA</p>
          <p className={`text-[7px] tracking-widest opacity-60 ${tier.textColor}`}>MAKE IT COUNT</p>
        </div>
        <p className={`text-[8px] font-bold tracking-[0.16em] uppercase ${tier.textColor} opacity-80`}>LOYALTY CARD</p>
      </div>
      <div className={`absolute right-0 top-0 bottom-0 w-9 ${tier.sideColor} border-l border-white/10 flex items-center justify-center`}>
        <p
          className={`text-[7px] font-semibold tracking-wider ${tier.textColor} whitespace-nowrap`}
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
        >
          {cardType} Card
        </p>
      </div>
    </div>
  );
}

export default function LoyaltyPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loyalty, setLoyalty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCardInfo, setShowCardInfo] = useState(false);
  const [selectedCardType, setSelectedCardType] = useState<string | null>(null);
  const [showGiftPopup, setShowGiftPopup] = useState(false);
  const [newGiftTypes, setNewGiftTypes] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then(r => r.ok ? r.json() : Promise.reject()),
      fetch(`/api/loyalty?t=${Date.now()}`, { cache: 'no-store' }).then(r => r.ok ? r.json() : null),
    ])
      .then(([userData, loyaltyData]) => {
        setUser(userData.user);
        setLoyalty(loyaltyData);
        const cards = loyaltyData?.loyaltyCards ?? [];
        const giftHampers = loyaltyData?.giftHampers ?? [];
        const earnedTypes = CARD_TYPES.filter(type => {
          const totalCards = cards.filter((c: any) => c.cardType === type).length;
          const fulfilledCount = giftHampers.filter((h: any) => h.cardType === type && h.status === 'fulfilled').length;
          const availableClaims = Math.floor(totalCards / 10) - fulfilledCount;
          return availableClaims > 0;
        });

        if (earnedTypes.length > 0) {
          const seenKey = `gift-types-seen-${userData.user?._id || userData.user?.email || 'guest'}`;
          const seen: string[] = JSON.parse(localStorage.getItem(seenKey) || '[]');
          
          const newlyEarned = earnedTypes.filter(type => {
            const totalCards = cards.filter((c: any) => c.cardType === type).length;
            const fulfilledCount = giftHampers.filter((h: any) => h.cardType === type && h.status === 'fulfilled').length;
            const cycleNumber = Math.floor(totalCards / 10);
            const cycleKey = `${type}-${cycleNumber}`;
            return !seen.includes(cycleKey);
          });

          if (newlyEarned.length > 0) {
            setNewGiftTypes(newlyEarned);
            setShowGiftPopup(true);
            const newKeys = newlyEarned.map(type => {
              const totalCards = cards.filter((c: any) => c.cardType === type).length;
              return `${type}-${Math.floor(totalCards / 10)}`;
            });
            localStorage.setItem(seenKey, JSON.stringify([...seen, ...newKeys]));
          }
        }
        setLoading(false);
      })
      .catch(() => {
        router.push('/auth/login');
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center pt-16">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#7B2D42]" />
      </div>
    );
  }

  const cards: any[] = loyalty?.loyaltyCards ?? [];
  const giftHampers: any[] = loyalty?.giftHampers ?? [];

  const cardTypeCounts = CARD_TYPES.reduce((acc: Record<string, number>, type: string) => {
    const totalCards = cards.filter((c: any) => c.cardType === type).length;
    const fulfilledCount = giftHampers.filter((h: any) => h.cardType === type && h.status === 'fulfilled').length;
    const netCards = Math.max(0, totalCards - (fulfilledCount * 10));
    acc[type] = netCards >= 10 ? 10 : netCards;
    return acc;
  }, {});

  const earnedGiftTypes = CARD_TYPES.filter(type => {
    const totalCards = cards.filter((c: any) => c.cardType === type).length;
    const fulfilledCount = giftHampers.filter((h: any) => h.cardType === type && h.status === 'fulfilled').length;
    const availableClaims = Math.floor(totalCards / 10) - fulfilledCount;
    return availableClaims > 0;
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-16">
      {showGiftPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 py-8 overflow-y-auto">
          <div className="w-full max-w-2xl border border-amber-500/30 bg-[#111111] p-6 shadow-2xl relative my-auto">
            <button
              type="button"
              onClick={() => setShowGiftPopup(false)}
              className="absolute top-3 right-3 h-8 w-8 flex items-center justify-center border border-white/15 text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
              aria-label="Close gift popup"
            >
              ×
            </button>
            <p className="text-[10px] tracking-[0.4em] uppercase text-amber-400 mb-3">Congratulations</p>
            <h2 className="text-2xl font-serif text-white mb-3">
              {newGiftTypes.length > 1 ? `${newGiftTypes.length} Gifts Unlocked!` : 'Gift Unlocked!'}
            </h2>
            <p className="text-sm text-gray-400 leading-relaxed mb-6">
              Your <span className="text-amber-400 font-medium">{newGiftTypes.join(', ')}</span> card
              {newGiftTypes.length > 1 ? 's have' : ' has'} reached 10/10. Claim your free reward from the range below:
            </p>

            <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-2">
              {newGiftTypes.map(type => {
                const cg = loyalty?.cardGifts?.find((g: any) => g.cardType === type);
                const rangeLabel = type === 'Opal' ? '₹99 - ₹399' : type === 'Sapphire' ? '₹399 - ₹999' : type === 'Emerald' ? '₹999 - ₹1499' : type === 'Pink Quartz' ? '₹1499 - ₹2499' : '₹2499 - ₹3999';

                if (!cg || !cg.products || cg.products.length === 0) {
                  return (
                    <div key={type} className="border border-white/10 p-4 bg-[#0a0a0a]">
                      <h3 className="font-serif text-[#C8A96E] text-base mb-1">{type} Tier Gift</h3>
                      <p className="text-xs text-gray-500">No products available in the range ({rangeLabel}) currently.</p>
                    </div>
                  );
                }

                return (
                  <div key={type} className="border border-white/10 p-4 bg-[#0a0a0a]">
                    <h3 className="font-serif text-[#C8A96E] text-base mb-3">{type} Tier Gift ({rangeLabel})</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {cg.products.map((p: any) => (
                        <div key={p._id} className="bg-[#111111] border border-white/10 p-3 flex gap-3 items-center">
                          <div className="h-16 w-16 bg-[#1a1a1a] flex-shrink-0 overflow-hidden">
                            <img src={p.images?.[0] || '/placeholder-jewelry.jpg'} alt={p.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-white truncate">{p.name}</h4>
                            <p className="text-xs text-[#C8A96E] mt-0.5">₹{p.price.toLocaleString('en-IN')}</p>
                          </div>
                          <button
                            onClick={() => {
                              setShowGiftPopup(false);
                              router.push(`/checkout?gift=${p._id}&cardType=${type}`);
                            }}
                            className="px-3 py-1.5 bg-[#7B2D42] text-white text-[9px] tracking-[0.2em] uppercase hover:bg-[#8A3048] transition-colors flex-shrink-0"
                          >
                            Claim
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowGiftPopup(false)}
                className="px-4 py-2 bg-amber-500/20 text-amber-300 text-[10px] tracking-[0.3em] uppercase hover:bg-amber-500/30 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Header */}
      <section className="bg-black py-12">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <p className="text-[10px] tracking-[0.4em] uppercase text-[#C8A96E] mb-2">Seloria Rewards</p>
          <h1 className="text-3xl font-serif text-white mb-2">Loyalty Cards Collection</h1>
          <p className="text-gray-400 text-sm">Earn cards with your purchases &amp; unlock exclusive free rewards</p>
          {loyalty && (
            <span className="inline-block mt-3 px-4 py-1 border border-[#C8A96E]/30 text-[10px] tracking-[0.3em] uppercase text-[#C8A96E]">
              {loyalty.tier} Member
            </span>
          )}
        </div>
      </section>

      <div className="border-t border-white/10" />

      <section className="py-10">
        <div className="max-w-4xl mx-auto px-4 space-y-8">
          {/* Main Loyalty Card */}
          {loyalty && (
            <div className="relative" id="my-card">
              <p className="text-[10px] tracking-[0.4em] uppercase text-[#C8A96E] mb-4">Your Membership Card</p>

              <div className="absolute top-0 right-0 transform translate-y-2 translate-x-2 z-30">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 bg-black/30 flex items-center justify-center">
                  <img src="/logo.jpeg" alt="Logo" className="w-full h-full object-cover" />
                </div>
              </div>

              <LoyaltyCard
                tier={loyalty.tier}
                name={user?.name ?? ''}
                totalSpend={loyalty.totalSpend}
                nextTier={loyalty.nextTier}
                nextMin={loyalty.nextMin}
                orderCount={loyalty.orderCount}
              />
            </div>
          )}

          {/* How It Works Section */}
          <div id="how-it-works" className="bg-[#111111] border border-white/10 p-6 rounded-lg">
            <p className="text-[10px] tracking-[0.4em] uppercase text-[#C8A96E] mb-2">Guide</p>
            <h2 className="text-xl font-serif text-white mb-4">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-400">
              <div>
                <span className="text-[#C8A96E] font-serif text-lg block mb-1">1. Shop & Earn</span>
                <p className="text-xs leading-relaxed">Every item you purchase earns you a loyalty card matching the price tier of that product.</p>
              </div>
              <div>
                <span className="text-[#C8A96E] font-serif text-lg block mb-1">2. Collect Cards</span>
                <p className="text-xs leading-relaxed">Collect 10 cards of the same tier. You can view your card collection progress in the sections below.</p>
              </div>
              <div>
                <span className="text-[#C8A96E] font-serif text-lg block mb-1">3. Redeem Gift</span>
                <p className="text-xs leading-relaxed">Once you reach 10/10 cards for a tier, you can choose and claim a free gift hamper from that tier range.</p>
              </div>
            </div>
          </div>

          {/* Card-Based Loyalty Gifts Section */}
          {loyalty?.cardGifts && loyalty.cardGifts.length > 0 && (
            <div className="space-y-6">
              {loyalty.cardGifts.map((cg: any) => (
                <div key={cg.cardType} className="bg-[#111111] border border-white/10 p-6">
                  <p className="text-[10px] tracking-[0.4em] uppercase text-[#C8A96E] mb-1">Loyalty Reward ({cg.cardType} Tier)</p>
                  <h2 className="text-xl font-serif text-white mb-4">Choose Your {cg.cardType} Gift</h2>
                  <p className="text-gray-400 text-sm mb-6">
                    You have completed 10/10 cards of the <span className="text-[#C8A96E] font-medium">{cg.cardType}</span> tier. Claim any of the products in the price range of <span className="text-white font-medium">₹{cg.cardType === 'Opal' ? '99 - 399' : cg.cardType === 'Sapphire' ? '399 - 999' : cg.cardType === 'Emerald' ? '999 - 1499' : cg.cardType === 'Pink Quartz' ? '1499 - 2499' : '2499 - 3999'}</span> below as your free reward:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {(cg.products || []).map((p: any) => (
                      <div key={p._id} className="bg-[#0a0a0a] border border-white/10 p-4 flex flex-col h-full group hover:border-[#C8A96E]/50 transition-colors">
                        <div className="h-40 bg-[#1a1a1a] overflow-hidden mb-4 relative">
                          <img
                            src={p.images?.[0] || '/placeholder-jewelry.jpg'}
                            alt={p.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                        </div>
                        <h3 className="font-serif text-white text-base font-medium line-clamp-1 mb-1">{p.name}</h3>
                        <p className="text-xs text-gray-500 mb-3 capitalize">{p.category}</p>
                        <div className="mt-auto flex items-center justify-between pt-2 border-t border-white/5 w-full">
                          <span className="text-[#C8A96E] font-semibold text-sm">₹{p.price.toLocaleString('en-IN')}</span>
                          <button
                            onClick={() => router.push(`/checkout?gift=${p._id}&cardType=${cg.cardType}`)}
                            className="px-4 py-1.5 bg-[#7B2D42] text-white text-[9px] tracking-[0.2em] uppercase hover:bg-[#8A3048] transition-colors"
                          >
                            Claim Gift
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Collected Cards Section */}
          <div id="tiers-benefits">
            <h2 className="text-xl font-serif text-white mb-6">Your Collected Loyalty Cards</h2>

            {earnedGiftTypes.length > 0 && (
              <div className="mb-5 px-4 py-4 bg-gradient-to-r from-amber-900/30 to-yellow-900/20 border border-amber-500/40 text-center">
                <p className="text-amber-400 font-semibold text-sm tracking-wider flex items-center justify-center gap-2">
                  <GiftIcon className="h-4 w-4 flex-shrink-0" />
                  Congratulations! You've earned {earnedGiftTypes.length} gift{earnedGiftTypes.length > 1 ? 's' : ''}!
                  <GiftIcon className="h-4 w-4 flex-shrink-0 scale-x-[-1]" />
                </p>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {earnedGiftTypes.map(type => {
                    const gift = giftHampers.find((g: any) => g.cardType === type);
                    const fulfilled = gift?.status === 'fulfilled';
                    return (
                      <span
                        key={type}
                        className={`text-[10px] px-2 py-1 border ${
                          fulfilled
                            ? 'bg-green-500/10 text-green-400 border-green-500/30'
                            : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        {type} · {fulfilled ? 'Delivered' : 'Pending'}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {CARD_TYPES.map((cardType) => (
                <div key={cardType}>
                  <MiniLoyaltyCard cardType={cardType} onInfoClick={(type) => {
                    setSelectedCardType(type);
                    setShowCardInfo(true);
                  }} />
                  <p className="text-[9px] text-gray-500 text-center mt-1.5 tracking-widest flex items-center justify-center gap-1">
                    {(cardTypeCounts[cardType] || 0)} / 10
                    {earnedGiftTypes.includes(cardType) && (
                      <GiftIcon className="h-3 w-3 text-amber-400" />
                    )}
                  </p>
                </div>
              ))}
            </div>

            {showCardInfo && selectedCardType && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4">
                <div className="w-full max-w-md border border-[#C8A96E]/30 bg-[#111111] p-6 shadow-2xl relative">
                  <button
                    type="button"
                    onClick={() => setShowCardInfo(false)}
                    className="absolute top-3 right-3 h-8 w-8 flex items-center justify-center border border-white/15 text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                    aria-label="Close card info"
                  >
                    ×
                  </button>
                  <p className="text-[10px] tracking-[0.4em] uppercase text-[#C8A96E] mb-3">Card Info</p>
                  <h2 className="text-2xl font-serif text-white mb-1">
                    {selectedCardType} Card
                    {CARD_RANK_LABEL[selectedCardType] && (
                      <span className="text-xs text-[#C8A96E] ml-2 border border-[#C8A96E]/40 px-1.5 py-0.5 uppercase tracking-widest">
                        {CARD_RANK_LABEL[selectedCardType]}
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                    {CARD_DESCRIPTIONS[selectedCardType]}
                  </p>
                  <div className="mt-4 border-t border-white/10 pt-4 text-xs text-gray-300">
                    Collect <strong className="text-white">10 {selectedCardType} cards</strong> to unlock a free gift reward!
                  </div>

                  {(() => {
                    const totalCards = cards.filter((c: any) => c.cardType === selectedCardType).length;
                    const fulfilledCount = giftHampers.filter((h: any) => h.cardType === selectedCardType && h.status === 'fulfilled').length;
                    const availableClaims = Math.floor(totalCards / 10) - fulfilledCount;
                    return (
                      <p className="mt-3 text-sm flex items-center gap-2 text-amber-400">
                        <GiftIcon className="h-4 w-4 flex-shrink-0" />
                        {availableClaims > 0 ? 'You can claim your reward in the loyalty gifts section below!' : 'Your gift has been claimed.'}
                      </p>
                    );
                  })()}
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={() => setShowCardInfo(false)}
                      className="px-4 py-2 bg-[#7B2D42] text-white text-[10px] tracking-[0.3em] uppercase hover:bg-[#8A3048] transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
