'use client';

import { useState, useEffect } from 'react';
import { UserCircleIcon, LockClosedIcon, PhoneIcon, DocumentTextIcon, TagIcon } from '@heroicons/react/24/outline';
import RichTextEditor from '@/components/RichTextEditor';

const defaultTerms = `<h2><strong>1. Acceptance of Terms</strong></h2><p>By accessing and using the Seliora website, you accept and agree to be bound by these Terms and Conditions.</p><h2><strong>2. Products and Pricing</strong></h2><p>All products listed on Seliora are subject to availability. Prices are listed in Indian Rupees (INR) and are inclusive of applicable taxes unless stated otherwise.</p><h2><strong>3. Orders and Payments</strong></h2><p>Payment must be made in full at the time of order. We use Razorpay for secure payment processing.</p><h2><strong>4. Shipping and Delivery</strong></h2><p>We aim to dispatch orders within 2–5 business days. We are not responsible for delays caused by courier services.</p><h2><strong>5. Returns and Refunds</strong></h2><p>If you receive a damaged or defective item, please contact us within 48 hours of delivery. Refunds will be credited within 7–10 business days.</p><h2><strong>6. Privacy Policy</strong></h2><p>We collect personal information only as necessary to process your orders. We do not sell your personal information to third parties.</p><h2><strong>7. Changes to Terms</strong></h2><p>We reserve the right to update these Terms and Conditions at any time. Continued use of the website constitutes acceptance of the revised terms.</p>`;

export default function AdminSettingsPage() {
  const [profile, setProfile] = useState({ name: '', email: '' });
  const [form, setForm] = useState({ name: '', email: '', currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [contact, setContact] = useState({
    phone: '', email: '', address: '', city: '', state: '', country: 'India',
    businessHours: 'Mon – Sat: 10:00 AM – 7:00 PM', mapUrl: '', instagramUrl: '', facebookUrl: '',
  });
  const [savingContact, setSavingContact] = useState(false);
  const [contactMessage, setContactMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [terms, setTerms] = useState('');
  const [savingTerms, setSavingTerms] = useState(false);
  const [termsMessage, setTermsMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [savingCats, setSavingCats] = useState(false);
  const [catsMessage, setCatsMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then(r => r.json()),
      fetch('/api/admin/settings').then(r => r.json()),
    ]).then(([auth, settings]) => {
      if (auth.user) {
        setProfile(auth.user);
        setForm(f => ({ ...f, name: auth.user.name, email: auth.user.email }));
      }
      if (settings.contact) setContact(settings.contact);
      setTerms(settings.terms || defaultTerms);
      setCategories(settings.categories || ['Necklace', 'Ring', 'Earring', 'Bracelet', 'Pendant', 'Bangle']);
      setLoading(false);
    });
  }, []);

  const addCategory = () => {
    const trimmed = newCategory.trim();
    if (!trimmed || categories.includes(trimmed)) return;
    setCategories(prev => [...prev, trimmed]);
    setNewCategory('');
  };

  const removeCategory = (cat: string) => setCategories(prev => prev.filter(c => c !== cat));

  const handleCategoriesSave = async () => {
    setSavingCats(true);
    setCatsMessage(null);
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categories }),
    });
    setSavingCats(false);
    setCatsMessage(res.ok
      ? { type: 'success', text: 'Categories saved successfully' }
      : { type: 'error', text: 'Failed to save categories' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    if (!form.currentPassword) {
      setMessage({ type: 'error', text: 'Current password is required to save changes' });
      return;
    }
    setSaving(true);
    const payload: any = { name: form.name, email: form.email, currentPassword: form.currentPassword };
    if (form.newPassword) payload.newPassword = form.newPassword;
    const res = await fetch('/api/admin/profile', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      setMessage({ type: 'success', text: 'Profile updated successfully.' });
      setProfile(data.user);
      setForm(f => ({ ...f, currentPassword: '', newPassword: '', confirmPassword: '' }));
    } else {
      setMessage({ type: 'error', text: data.error || 'Failed to update profile' });
    }
  };

  const handleContactSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingContact(true);
    setContactMessage(null);
    const res = await fetch('/api/admin/settings', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contact }),
    });
    setSavingContact(false);
    setContactMessage(res.ok
      ? { type: 'success', text: 'Contact information updated successfully' }
      : { type: 'error', text: 'Failed to update contact info' });
  };

  const handleTermsSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingTerms(true);
    setTermsMessage(null);
    const res = await fetch('/api/admin/settings', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ terms }),
    });
    setSavingTerms(false);
    setTermsMessage(res.ok
      ? { type: 'success', text: 'Terms & Conditions updated successfully' }
      : { type: 'error', text: 'Failed to update terms' });
  };

  const inputClass = "bg-[#1a1a1a] border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-[#C8A96E] px-4 py-2.5 text-sm w-full";

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#7B2D42]" /></div>;
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <p className="text-[10px] tracking-[0.4em] uppercase text-[#C8A96E] mb-1">Admin</p>
        <h1 className="text-2xl font-serif text-white">Settings</h1>
        <p className="text-gray-400 mt-1 text-sm">Manage admin credentials, contact info, and site content</p>
      </div>

      {/* ── Admin Account ── */}
      <div className="bg-[#111111] border border-white/10 p-4 flex items-center gap-3">
        <UserCircleIcon className="h-10 w-10 text-[#C8A96E] flex-shrink-0" />
        <div>
          <p className="font-medium text-white">{profile.name}</p>
          <p className="text-sm text-gray-400">{profile.email}</p>
        </div>
      </div>

      {message && (
        <div className={`p-4 text-sm ${message.type === 'success' ? 'bg-green-900/30 border border-green-500/20 text-green-400' : 'bg-red-900/30 border border-red-500/20 text-red-400'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-[#111111] border border-white/10 p-6 space-y-5">
        <h2 className="text-[10px] font-semibold tracking-[0.45em] text-white uppercase flex items-center gap-2">
          <UserCircleIcon className="h-5 w-5 text-[#C8A96E]" /> Account Info
        </h2>
        <div>
          <label className="block text-[10px] tracking-[0.3em] uppercase text-gray-400 mb-2">Name</label>
          <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className={inputClass} />
        </div>
        <div>
          <label className="block text-[10px] tracking-[0.3em] uppercase text-gray-400 mb-2">Email</label>
          <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            className={inputClass} />
        </div>
        <hr className="border-white/10" />
        <h2 className="text-[10px] font-semibold tracking-[0.45em] text-white uppercase flex items-center gap-2">
          <LockClosedIcon className="h-5 w-5 text-[#C8A96E]" /> Change Password
        </h2>
        <p className="text-xs text-gray-600 -mt-3">Leave blank to keep the current password</p>
        <div>
          <label className="block text-[10px] tracking-[0.3em] uppercase text-gray-400 mb-2">New Password</label>
          <input type="password" value={form.newPassword} onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))}
            placeholder="Min 6 characters" className={inputClass} />
        </div>
        <div>
          <label className="block text-[10px] tracking-[0.3em] uppercase text-gray-400 mb-2">Confirm New Password</label>
          <input type="password" value={form.confirmPassword} onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
            className={inputClass} />
        </div>
        <hr className="border-white/10" />
        <div>
          <label className="block text-[10px] tracking-[0.3em] uppercase text-gray-400 mb-2">
            Current Password <span className="text-red-400">*</span>
          </label>
          <input type="password" required value={form.currentPassword} onChange={e => setForm(f => ({ ...f, currentPassword: e.target.value }))}
            placeholder="Required to save any changes"
            className={inputClass} />
        </div>
        <button type="submit" disabled={saving}
          className="w-full py-2.5 bg-[#7B2D42] text-white hover:bg-[#8A3048] disabled:opacity-50 transition-colors text-[10px] tracking-[0.3em] uppercase">
          {saving ? 'Saving...' : 'Save Account Changes'}
        </button>
      </form>

      {/* ── Contact Information ── */}
      {contactMessage && (
        <div className={`p-4 text-sm ${contactMessage.type === 'success' ? 'bg-green-900/30 border border-green-500/20 text-green-400' : 'bg-red-900/30 border border-red-500/20 text-red-400'}`}>
          {contactMessage.text}
        </div>
      )}

      <form onSubmit={handleContactSave} className="bg-[#111111] border border-white/10 p-6 space-y-5">
        <h2 className="text-[10px] font-semibold tracking-[0.45em] text-white uppercase flex items-center gap-2">
          <PhoneIcon className="h-5 w-5 text-[#C8A96E]" /> Contact Information
        </h2>
        <p className="text-xs text-gray-600 -mt-3">Displayed on the public Contact Us page</p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] tracking-[0.3em] uppercase text-gray-400 mb-2">Phone</label>
            <input type="text" value={contact.phone} onChange={e => setContact(c => ({ ...c, phone: e.target.value }))}
              placeholder="+91 99999 99999"
              className={inputClass} />
          </div>
          <div>
            <label className="block text-[10px] tracking-[0.3em] uppercase text-gray-400 mb-2">Email</label>
            <input type="email" value={contact.email} onChange={e => setContact(c => ({ ...c, email: e.target.value }))}
              placeholder="support@seliora.com"
              className={inputClass} />
          </div>
        </div>

        <div>
          <label className="block text-[10px] tracking-[0.3em] uppercase text-gray-400 mb-2">Address</label>
          <input type="text" value={contact.address} onChange={e => setContact(c => ({ ...c, address: e.target.value }))}
            placeholder="Street / Area"
            className={inputClass} />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] tracking-[0.3em] uppercase text-gray-400 mb-2">City</label>
            <input type="text" value={contact.city} onChange={e => setContact(c => ({ ...c, city: e.target.value }))}
              className={inputClass} />
          </div>
          <div>
            <label className="block text-[10px] tracking-[0.3em] uppercase text-gray-400 mb-2">State</label>
            <input type="text" value={contact.state} onChange={e => setContact(c => ({ ...c, state: e.target.value }))}
              className={inputClass} />
          </div>
          <div>
            <label className="block text-[10px] tracking-[0.3em] uppercase text-gray-400 mb-2">Country</label>
            <input type="text" value={contact.country} onChange={e => setContact(c => ({ ...c, country: e.target.value }))}
              className={inputClass} />
          </div>
        </div>

        <div>
          <label className="block text-[10px] tracking-[0.3em] uppercase text-gray-400 mb-2">Business Hours</label>
          <input type="text" value={contact.businessHours} onChange={e => setContact(c => ({ ...c, businessHours: e.target.value }))}
            placeholder="Mon – Sat: 10:00 AM – 7:00 PM"
            className={inputClass} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] tracking-[0.3em] uppercase text-gray-400 mb-2">Instagram URL</label>
            <input type="url" value={contact.instagramUrl} onChange={e => setContact(c => ({ ...c, instagramUrl: e.target.value }))}
              placeholder="https://www.instagram.com/get.seloria?igsh=MWQ5ZzZid256OXR0cg%3D%3D"
              className={inputClass} />
          </div>
          <div>
            <label className="block text-[10px] tracking-[0.3em] uppercase text-gray-400 mb-2">Facebook URL</label>
            <input type="url" value={contact.facebookUrl} onChange={e => setContact(c => ({ ...c, facebookUrl: e.target.value }))}
              placeholder="https://www.facebook.com/people/Seloria/61591484412113/?rdid=n5htaMQ2zuoVHEkV&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1Atcv4Vu67%2F"
              className={inputClass} />
          </div>
        </div>

        <button type="submit" disabled={savingContact}
          className="w-full py-2.5 bg-[#7B2D42] text-white hover:bg-[#8A3048] disabled:opacity-50 transition-colors text-[10px] tracking-[0.3em] uppercase">
          {savingContact ? 'Saving...' : 'Save Contact Info'}
        </button>
      </form>

      {/* ── Categories ── */}
      {catsMessage && (
        <div className={`p-4 text-sm ${catsMessage.type === 'success' ? 'bg-green-900/30 border border-green-500/20 text-green-400' : 'bg-red-900/30 border border-red-500/20 text-red-400'}`}>
          {catsMessage.text}
        </div>
      )}
      <div className="bg-[#111111] border border-white/10 p-6 space-y-4">
        <h2 className="text-[10px] font-semibold tracking-[0.45em] text-white uppercase flex items-center gap-2">
          <TagIcon className="h-5 w-5 text-[#C8A96E]" /> Manage Categories
        </h2>
        <p className="text-xs text-gray-600 -mt-2">These categories appear in product forms and the shop filter</p>

        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <span key={cat} className="flex items-center gap-1 px-3 py-1 bg-[#1a1a1a] border border-white/10 text-gray-300 text-sm">
              {cat}
              <button onClick={() => removeCategory(cat)} className="ml-1 text-gray-500 hover:text-red-400 font-bold leading-none transition-colors">×</button>
            </span>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newCategory}
            onChange={e => setNewCategory(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCategory())}
            placeholder="New category name..."
            className="flex-1 bg-[#1a1a1a] border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-[#C8A96E] px-4 py-2.5 text-sm"
          />
          <button onClick={addCategory}
            className="px-4 py-2.5 bg-[#7B2D42] text-white hover:bg-[#8A3048] transition-colors text-[10px] tracking-[0.3em] uppercase">
            Add
          </button>
        </div>

        <button onClick={handleCategoriesSave} disabled={savingCats}
          className="w-full py-2.5 bg-[#7B2D42] text-white hover:bg-[#8A3048] disabled:opacity-50 transition-colors text-[10px] tracking-[0.3em] uppercase">
          {savingCats ? 'Saving...' : 'Save Categories'}
        </button>
      </div>

      {/* ── Terms & Conditions ── */}
      {termsMessage && (
        <div className={`p-4 text-sm ${termsMessage.type === 'success' ? 'bg-green-900/30 border border-green-500/20 text-green-400' : 'bg-red-900/30 border border-red-500/20 text-red-400'}`}>
          {termsMessage.text}
        </div>
      )}

      <form onSubmit={handleTermsSave} className="bg-[#111111] border border-white/10 p-6 space-y-5">
        <h2 className="text-[10px] font-semibold tracking-[0.45em] text-white uppercase flex items-center gap-2">
          <DocumentTextIcon className="h-5 w-5 text-[#C8A96E]" /> Terms &amp; Conditions
        </h2>
        <p className="text-xs text-gray-600 -mt-3">Displayed on the public Terms &amp; Conditions page</p>

        <div>
          <RichTextEditor value={terms} onChange={setTerms} />
          <p className="text-xs text-gray-600 mt-1">
            Tip: Use numbered sections (1. Section Title) for clear formatting on the public page.
          </p>
        </div>

        <button type="submit" disabled={savingTerms}
          className="w-full py-2.5 bg-[#7B2D42] text-white hover:bg-[#8A3048] disabled:opacity-50 transition-colors text-[10px] tracking-[0.3em] uppercase">
          {savingTerms ? 'Saving...' : 'Save Terms & Conditions'}
        </button>
      </form>
    </div>
  );
}
