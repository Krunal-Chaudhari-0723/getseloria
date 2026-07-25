'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ClipboardDocumentListIcon, HeartIcon } from '@heroicons/react/24/outline';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    gender: '',
    dob: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((userData) => {
        const u = userData.user;
        setUser(u);

        const dobStr = u?.dob ? new Date(u.dob).toISOString().split('T')[0] : '';
        setProfileForm({
          name: u?.name || '',
          email: u?.email || '',
          phone: u?.phone || '',
          gender: u?.gender || '',
          dob: dobStr,
          street: u?.address?.street || '',
          city: u?.address?.city || '',
          state: u?.address?.state || '',
          zipCode: u?.address?.zipCode || '',
          country: u?.address?.country || 'India',
        });
        setLoading(false);
      })
      .catch(() => {
        router.push('/auth/login');
      });
  }, []);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMessage(null);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profileForm.name,
          phone: profileForm.phone,
          gender: profileForm.gender,
          dob: profileForm.dob,
          address: {
            street: profileForm.street,
            city: profileForm.city,
            state: profileForm.state,
            zipCode: profileForm.zipCode,
            country: profileForm.country,
          },
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        setProfileMessage({ type: 'success', text: 'Profile details updated successfully!' });
        sessionStorage.setItem('user', JSON.stringify({ name: data.user.name, role: data.user.role, email: data.user.email }));
        window.dispatchEvent(new CustomEvent('authChanged', { detail: data.user }));
      } else {
        setProfileMessage({ type: 'error', text: data.error || 'Failed to update profile' });
      }
    } catch {
      setProfileMessage({ type: 'error', text: 'An error occurred while updating profile' });
    } finally {
      setSavingProfile(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center pt-16">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#7B2D42]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-16">
      {/* Hero Header */}
      <section className="bg-black py-12">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="w-20 h-20 bg-[#7B2D42] flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4 rounded-full border border-white/10">
            {user?.name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <h1 className="text-2xl font-serif text-white">{user?.name}</h1>
          <p className="text-gray-400 mt-1 text-sm">{user?.email}</p>
        </div>
      </section>

      <div className="border-t border-white/10" />

      <section className="py-10">
        <div className="max-w-3xl mx-auto px-4 space-y-8">
          {profileMessage && (
            <div
              className={`p-4 text-sm ${
                profileMessage.type === 'success'
                  ? 'bg-green-900/30 border border-green-500/20 text-green-400'
                  : 'bg-red-900/30 border border-red-500/20 text-red-400'
              }`}
            >
              {profileMessage.text}
            </div>
          )}

          <form onSubmit={handleProfileSave} className="bg-[#111111] border border-white/10 p-6 sm:p-8 space-y-6">
            <h2 className="text-[10px] font-semibold tracking-[0.45em] text-[#C8A96E] uppercase mb-4">
              Personal Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] tracking-[0.3em] uppercase text-gray-400 mb-1.5">
                  Full Name <span className="text-[#7B2D42]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full bg-[#1a1a1a] border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-[#C8A96E] px-4 py-2.5 text-sm transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] tracking-[0.3em] uppercase text-gray-400 mb-1.5">
                  Email Address (Read Only)
                </label>
                <input
                  type="email"
                  disabled
                  value={profileForm.email}
                  className="w-full bg-[#141414] border border-white/5 text-gray-400 px-4 py-2.5 text-sm cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] tracking-[0.3em] uppercase text-gray-400 mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={profileForm.phone}
                  onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full bg-[#1a1a1a] border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-[#C8A96E] px-4 py-2.5 text-sm transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] tracking-[0.3em] uppercase text-gray-400 mb-1.5">
                  Gender
                </label>
                <select
                  value={profileForm.gender}
                  onChange={e => setProfileForm({ ...profileForm, gender: e.target.value })}
                  className="w-full bg-[#1a1a1a] border border-white/10 text-white focus:outline-none focus:border-[#C8A96E] px-4 py-2.5 text-sm transition-colors"
                >
                  <option value="">Select gender</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] tracking-[0.3em] uppercase text-gray-400 mb-1.5">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={profileForm.dob}
                  onChange={e => setProfileForm({ ...profileForm, dob: e.target.value })}
                  className="w-full bg-[#1a1a1a] border border-white/10 text-white focus:outline-none focus:border-[#C8A96E] px-4 py-2.5 text-sm transition-colors"
                />
              </div>
            </div>

            <div className="border-t border-white/10 pt-6">
              <h2 className="text-[10px] font-semibold tracking-[0.45em] text-[#C8A96E] uppercase mb-4">
                Default Shipping Address
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] tracking-[0.3em] uppercase text-gray-400 mb-1.5">
                    Street Address
                  </label>
                  <input
                    type="text"
                    value={profileForm.street}
                    onChange={e => setProfileForm({ ...profileForm, street: e.target.value })}
                    placeholder="House no., street, area"
                    className="w-full bg-[#1a1a1a] border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-[#C8A96E] px-4 py-2.5 text-sm transition-colors"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] tracking-[0.3em] uppercase text-gray-400 mb-1.5">
                      City
                    </label>
                    <input
                      type="text"
                      value={profileForm.city}
                      onChange={e => setProfileForm({ ...profileForm, city: e.target.value })}
                      className="w-full bg-[#1a1a1a] border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-[#C8A96E] px-4 py-2.5 text-sm transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] tracking-[0.3em] uppercase text-gray-400 mb-1.5">
                      State
                    </label>
                    <input
                      type="text"
                      value={profileForm.state}
                      onChange={e => setProfileForm({ ...profileForm, state: e.target.value })}
                      className="w-full bg-[#1a1a1a] border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-[#C8A96E] px-4 py-2.5 text-sm transition-colors"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] tracking-[0.3em] uppercase text-gray-400 mb-1.5">
                      ZIP / Postal Code
                    </label>
                    <input
                      type="text"
                      value={profileForm.zipCode}
                      onChange={e => setProfileForm({ ...profileForm, zipCode: e.target.value })}
                      className="w-full bg-[#1a1a1a] border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-[#C8A96E] px-4 py-2.5 text-sm transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] tracking-[0.3em] uppercase text-gray-400 mb-1.5">
                      Country
                    </label>
                    <select
                      value={profileForm.country}
                      onChange={e => setProfileForm({ ...profileForm, country: e.target.value })}
                      className="w-full bg-[#1a1a1a] border border-white/10 text-white focus:outline-none focus:border-[#C8A96E] px-4 py-2.5 text-sm transition-colors"
                    >
                      <option value="India">India</option>
                      <option value="USA">USA</option>
                      <option value="UK">UK</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={savingProfile}
                className="px-8 py-3 bg-[#7B2D42] text-white text-[10px] tracking-[0.3em] uppercase hover:bg-[#8A3048] disabled:opacity-50 transition-colors"
              >
                {savingProfile ? 'Saving Changes...' : 'Save Profile Details'}
              </button>
            </div>
          </form>

          {/* Account Quick Links */}
          <div className="bg-[#111111] border border-white/10 p-6 space-y-4">
            <h2 className="text-[10px] tracking-[0.4em] uppercase text-gray-400 mb-4">Quick Account Links</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link href="/orders" className="flex items-center gap-3 py-3 px-4 bg-[#1a1a1a] border border-white/5 hover:border-white/20 transition-colors">
                <ClipboardDocumentListIcon className="h-5 w-5 text-[#C8A96E]" />
                <span className="text-white text-sm">My Orders</span>
              </Link>
              <Link href="/wishlist" className="flex items-center gap-3 py-3 px-4 bg-[#1a1a1a] border border-white/5 hover:border-white/20 transition-colors">
                <HeartIcon className="h-5 w-5 text-[#7B2D42]" />
                <span className="text-white text-sm">Wishlist</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
