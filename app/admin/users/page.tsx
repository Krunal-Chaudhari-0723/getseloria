'use client';

import { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, XMarkIcon, GiftIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

const CARD_TYPES = ['Opal', 'Sapphire', 'Emerald', 'Pink Quartz', 'Ruby'];

const CARD_COLORS: Record<string, string> = {
  'Opal': 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  'Pink Quartz': 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  'Emerald': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  'Ruby': 'bg-red-500/20 text-red-300 border-red-500/30',
  'Sapphire': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Card modal state
  const [cardModal, setCardModal] = useState<{ userId: string; userName: string; cards: any[]; gifts: any[] } | null>(null);
  const [selectedCard, setSelectedCard] = useState('Opal');
  const [assigning, setAssigning] = useState(false);
  const [giftAwardedPopup, setGiftAwardedPopup] = useState<{ userName: string; cardType: string } | null>(null);

  const getBestCardProgress = (cards: any[] = [], giftHampers: any[] = []) => {
    const counts = CARD_TYPES.reduce((acc: Record<string, number>, type: string) => {
      const totalCards = cards.filter((c: any) => c.cardType === type).length;
      const fulfilledCount = (giftHampers || []).filter((h: any) => h.cardType === type && h.status === 'fulfilled').length;
      const netCards = Math.max(0, totalCards - (fulfilledCount * 10));
      acc[type] = netCards >= 10 ? 10 : netCards;
      return acc;
    }, {});

    const bestType = CARD_TYPES.reduce((best, current) => {
      if (!best) return current;
      return (counts[current] || 0) > (counts[best] || 0) ? current : best;
    }, '' as string);
    const bestCount = bestType ? (counts[bestType] || 0) : 0;
    
    const earnedTypes = CARD_TYPES.filter(type => {
      const totalCards = cards.filter((c: any) => c.cardType === type).length;
      const fulfilledCount = (giftHampers || []).filter((h: any) => h.cardType === type && h.status === 'fulfilled').length;
      const availableClaims = Math.floor(totalCards / 10) - fulfilledCount;
      return availableClaims > 0;
    });

    return { counts, bestType, bestCount, earnedTypes };
  };

  const getDisplayGifts = (cards: any[] = [], giftHampers: any[] = []) => {
    const list: any[] = [];
    for (const type of CARD_TYPES) {
      const totalCards = cards.filter((c: any) => c.cardType === type).length;
      const totalGiftsEarned = Math.floor(totalCards / 10);
      const typeHampers = giftHampers.filter((h: any) => h.cardType === type);
      
      list.push(...typeHampers);
      
      const missingCount = totalGiftsEarned - typeHampers.length;
      for (let i = 0; i < missingCount; i++) {
        list.push({
          cardType: type,
          status: 'pending',
          awardedAt: new Date(),
          isVirtual: true
        });
      }
    }
    return list;
  };

  useEffect(() => { fetchUsers(); }, [page, search]);

  const fetchUsers = async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/users?page=${page}&limit=20&search=${search}`);
    const data = await res.json();
    setUsers(data.users || []);
    setTotal(data.total || 0);
    setPages(data.pages || 1);
    setLoading(false);
  };

  const openCardModal = (user: any) => {
    setCardModal({ userId: user._id, userName: user.name, cards: user.loyaltyCards || [], gifts: user.giftHampers || [] });
    setSelectedCard('Opal');
  };

  const assignCard = async () => {
    if (!cardModal) return;
    setAssigning(true);
    try {
      const res = await fetch(`/api/admin/users/${cardModal.userId}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardType: selectedCard }),
      });
      
      let data: any = {};
      try {
        data = await res.json();
      } catch (parseErr) {
        console.error('Failed to parse JSON response:', parseErr);
      }

      if (res.ok) {
        setCardModal(prev => prev ? { ...prev, cards: data.loyaltyCards, gifts: data.giftHampers ?? prev.gifts } : null);
        setUsers(prev => prev.map(u => u._id === cardModal.userId ? { ...u, loyaltyCards: data.loyaltyCards, giftHampers: data.giftHampers ?? u.giftHampers } : u));
        
        if (data.giftAwarded) {
          setGiftAwardedPopup({
            userName: cardModal.userName,
            cardType: data.cardType
          });
        }
      } else {
        alert(data.error || 'Failed to assign card');
      }
    } catch (err: any) {
      console.error('Error assigning card:', err);
      alert(err.message || 'Failed to assign card');
    } finally {
      setAssigning(false);
    }
  };

  const removeCard = async (cardId: string) => {
    if (!cardModal) return;
    try {
      const res = await fetch(`/api/admin/users/${cardModal.userId}/cards`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId }),
      });
      
      let data: any = {};
      try {
        data = await res.json();
      } catch (parseErr) {
        console.error('Failed to parse JSON response:', parseErr);
      }

      if (res.ok) {
        setCardModal(prev => prev ? { ...prev, cards: data.loyaltyCards, gifts: data.giftHampers ?? prev.gifts } : null);
        setUsers(prev => prev.map(u => u._id === cardModal.userId ? { ...u, loyaltyCards: data.loyaltyCards, giftHampers: data.giftHampers ?? u.giftHampers } : u));
      } else {
        alert(data.error || 'Failed to remove card');
      }
    } catch (err: any) {
      console.error('Error removing card:', err);
      alert(err.message || 'Failed to remove card');
    }
  };

  const toggleGiftStatus = async (cardType: string, currentStatus: string, giftId?: string) => {
    if (!cardModal) return;
    const status = currentStatus === 'fulfilled' ? 'pending' : 'fulfilled';
    try {
      const res = await fetch(`/api/admin/users/${cardModal.userId}/gifts`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ giftId, cardType, status }),
      });
      
      let data: any = {};
      try {
        data = await res.json();
      } catch (parseErr) {
        console.error('Failed to parse JSON response:', parseErr);
      }

      if (res.ok) {
        setCardModal(prev => prev ? { ...prev, gifts: data.giftHampers } : null);
        setUsers(prev => prev.map(u => u._id === cardModal.userId ? { ...u, giftHampers: data.giftHampers } : u));
      } else {
        alert(data.error || 'Failed to update gift status');
      }
    } catch (err: any) {
      console.error('Error updating gift status:', err);
      alert(err.message || 'Failed to update gift status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] tracking-[0.4em] uppercase text-[#C8A96E] mb-1">Manage</p>
          <h1 className="text-2xl font-serif text-white">Users</h1>
          <p className="text-gray-400 mt-1 text-sm">{total} total users</p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-600" />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="bg-[#1a1a1a] border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-[#C8A96E] pl-10 pr-4 py-2.5 text-sm w-full"
        />
      </div>

      <div className="bg-[#111111] border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#0d0d0d]">
              <tr>
                <th className="px-4 py-3 text-left text-[10px] font-medium text-gray-400 uppercase tracking-wider border-b border-white/5">Name</th>
                <th className="px-4 py-3 text-left text-[10px] font-medium text-gray-400 uppercase tracking-wider border-b border-white/5">Email</th>
                <th className="px-4 py-3 text-left text-[10px] font-medium text-gray-400 uppercase tracking-wider border-b border-white/5">Phone</th>
                <th className="px-4 py-3 text-left text-[10px] font-medium text-gray-400 uppercase tracking-wider border-b border-white/5">Gender</th>
                <th className="px-4 py-3 text-left text-[10px] font-medium text-gray-400 uppercase tracking-wider border-b border-white/5">DOB</th>
                <th className="px-4 py-3 text-left text-[10px] font-medium text-gray-400 uppercase tracking-wider border-b border-white/5">Loyalty</th>
                <th className="px-4 py-3 text-left text-[10px] font-medium text-gray-400 uppercase tracking-wider border-b border-white/5">Cards</th>
                <th className="px-4 py-3 text-left text-[10px] font-medium text-gray-400 uppercase tracking-wider border-b border-white/5">Role</th>
                <th className="px-4 py-3 text-left text-[10px] font-medium text-gray-400 uppercase tracking-wider border-b border-white/5">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}><td colSpan={7} className="px-4 py-4"><div className="h-4 bg-[#1a1a1a] animate-pulse w-full" /></td></tr>
                ))
              ) : users.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">No users found</td></tr>
              ) : users.map(user => (
                <tr key={user._id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-[#7B2D42]/30 border border-[#7B2D42]/20 flex items-center justify-center text-[#C8A96E] font-semibold text-sm">
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-white">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">{user.email}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">{user.phone || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">{user.gender ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1) : '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {user.dob ? new Date(user.dob).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {user.role === 'admin' ? (
                      <span className="text-gray-500 text-sm">—</span>
                    ) : (
                      <div className="flex flex-col gap-0.5">
                        <span className={`px-2 py-0.5 text-xs font-medium w-fit ${
                          user.loyaltyTier === 'Sapphire' ? 'bg-purple-900/30 text-purple-400' :
                          user.loyaltyTier === 'Ruby' ? 'bg-red-900/30 text-red-400' :
                          user.loyaltyTier === 'Emerald' ? 'bg-emerald-900/30 text-emerald-400' :
                          user.loyaltyTier === 'Pink Quartz' ? 'bg-pink-900/30 text-pink-400' :
                          'bg-white/5 text-gray-400'
                        }`}>
                          {user.loyaltyTier || 'Opal'}
                        </span>
                        <span className="text-[10px] text-gray-600">₹{(user.totalSpend || 0).toLocaleString('en-IN')}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {user.role === 'admin' ? (
                      <span className="text-gray-500 text-sm">—</span>
                    ) : (
                      (() => {
                        const { bestCount, earnedTypes } = getBestCardProgress(user.loyaltyCards || [], user.giftHampers || []);
                        const pendingCount = earnedTypes.length;
                        return (
                          <button
                            onClick={() => openCardModal(user)}
                            className="flex items-center gap-2 hover:text-[#C8A96E] transition-colors"
                          >
                            {earnedTypes.length > 0 ? (
                              <span className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 border ${
                                pendingCount > 0
                                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                  : 'bg-green-500/20 text-green-400 border-green-500/30'
                              }`}>
                                <GiftIcon className="h-3 w-3" />
                                {earnedTypes.length} Gift{earnedTypes.length > 1 ? 's' : ''}
                              </span>
                            ) : bestCount > 0 ? (
                              <>
                                <span className="text-white text-sm font-semibold">{bestCount}</span>
                                <span className="text-[10px] text-gray-500 tracking-wider">/ 10</span>
                              </>
                            ) : (
                              <span className="text-gray-500 text-sm hover:text-white transition-colors">—</span>
                            )}
                          </button>
                        );
                      })()
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs capitalize ${user.role === 'admin' ? 'bg-[#C8A96E]/10 text-[#C8A96E]' : 'bg-white/5 text-gray-400'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {new Date(user.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="px-4 py-3 border-t border-white/10 flex items-center justify-between">
            <span className="text-sm text-gray-400">Page {page} of {pages}</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 border border-white/10 text-white disabled:opacity-40 hover:bg-white/5 text-sm transition-colors">Prev</button>
              <button disabled={page === pages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border border-white/10 text-white disabled:opacity-40 hover:bg-white/5 text-sm transition-colors">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Card Assignment Modal */}
      {cardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="bg-[#111111] border border-white/10 w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] tracking-[0.4em] uppercase text-[#C8A96E]">Loyalty Cards</p>
                <h2 className="text-white font-semibold mt-0.5">{cardModal.userName}</h2>
              </div>
              <button onClick={() => setCardModal(null)} className="text-gray-400 hover:text-white">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Current cards */}
            <div>
              <p className="text-[10px] text-gray-500 tracking-widest uppercase mb-2">
                Earned Cards ({getBestCardProgress(cardModal.cards, cardModal.gifts).bestCount}/10)
              </p>
              {cardModal.cards.length === 0 ? (
                <p className="text-gray-600 text-sm">No cards assigned yet.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {cardModal.cards.map((c: any) => (
                    <div key={c._id} className={`flex items-center justify-between px-3 py-2 border ${CARD_COLORS[c.cardType] || 'border-white/10 text-gray-300'}`}>
                      <div>
                        <span className="text-sm font-medium">{c.cardType} Card</span>
                        <span className="text-[10px] text-gray-500 ml-2">
                          {new Date(c.assignedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <button
                        onClick={() => removeCard(c._id)}
                        className="text-gray-600 hover:text-red-400 transition-colors text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {(() => {
                const displayGifts = getDisplayGifts(cardModal.cards, cardModal.gifts);
                if (displayGifts.length === 0) return null;
                
                return (
                  <div className="mt-3 space-y-2">
                    <p className="text-[10px] text-gray-500 tracking-widest uppercase flex items-center gap-1.5">
                      <GiftIcon className="h-3.5 w-3.5 text-amber-400" />
                      Gifts Earned ({displayGifts.length})
                    </p>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {displayGifts.map((gift: any, index: number) => {
                        const status = gift.status || 'pending';
                        const fulfilled = status === 'fulfilled';
                        return (
                          <div
                            key={gift._id || `${gift.cardType}-${index}`}
                            className={`flex items-center justify-between px-3 py-2 border ${
                              fulfilled ? 'bg-green-500/10 border-green-500/30' : 'bg-amber-500/10 border-amber-500/30'
                            }`}
                          >
                            <span className={`text-sm font-medium ${fulfilled ? 'text-green-400' : 'text-amber-400'}`}>
                              {gift.cardType} — 10/10
                            </span>
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] px-1.5 py-0.5 border ${
                                fulfilled
                                  ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                  : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                              }`}>
                                {fulfilled ? 'Fulfilled' : 'Pending'}
                              </span>
                              <button
                                onClick={() => toggleGiftStatus(gift.cardType, status, gift._id)}
                                className="text-[10px] text-gray-400 hover:text-white underline underline-offset-2 transition-colors"
                              >
                                {fulfilled ? 'Mark Pending' : 'Mark Fulfilled'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Assign new card */}
            {(() => {
              return (
                <div className="border-t border-white/10 pt-4 space-y-3">
                  <p className="text-[10px] text-gray-500 tracking-widest uppercase">Assign New Card</p>
                  <div className="grid grid-cols-5 gap-2">
                    {CARD_TYPES.map(type => (
                      <button
                        key={type}
                        onClick={() => setSelectedCard(type)}
                        className={`py-2 text-[9px] tracking-wider border transition-colors ${
                          selectedCard === type
                            ? CARD_COLORS[type]
                            : 'border-white/10 text-gray-500 hover:border-white/20'
                        }`}
                      >
                        {type === 'Pink Quartz' ? 'Pink\nQuartz' : type}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={assignCard}
                    disabled={assigning}
                    className="w-full py-2.5 bg-[#7B2D42] text-white text-[10px] tracking-[0.3em] uppercase hover:bg-[#8A3048] disabled:opacity-50 transition-colors"
                  >
                    {assigning ? 'Assigning...' : `Assign ${selectedCard} Card`}
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Gift Awarded Congratulations Popup */}
      <AnimatePresence>
        {giftAwardedPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 px-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#111111] border border-[#C8A96E]/40 w-full max-w-md p-6 text-center space-y-4 shadow-2xl relative"
            >
              <button
                onClick={() => setGiftAwardedPopup(null)}
                className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
                aria-label="Close gift popup"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
              
              <div className="mx-auto w-12 h-12 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center text-amber-400">
                <GiftIcon className="h-6 w-6" />
              </div>
              
              <div>
                <p className="text-[10px] tracking-[0.4em] uppercase text-[#C8A96E] mb-1">GIFT UNLOCKED</p>
                <h2 className="text-xl font-serif text-white font-semibold">Congratulations!</h2>
              </div>
              
              <p className="text-sm text-gray-400 leading-relaxed">
                <span className="text-white font-medium">{giftAwardedPopup.userName}</span> has completed{' '}
                <span className="text-[#C8A96E] font-medium">10/10</span> cards
                for the <span className="text-[#C8A96E] font-medium">{giftAwardedPopup.cardType}</span> category and won a Gift!
              </p>
              
              <button
                onClick={() => setGiftAwardedPopup(null)}
                className="w-full py-2.5 bg-[#C8A96E] text-black text-[10px] tracking-[0.3em] uppercase font-semibold hover:bg-[#D4B982] transition-colors"
              >
                Acknowledge
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
