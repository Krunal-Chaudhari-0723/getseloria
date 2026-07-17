'use client';

import { useState, useEffect } from 'react';

interface ContactInfo {
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  country: string;
  businessHours: string;
  mapUrl: string;
  instagramUrl: string;
  facebookUrl: string;
}

export default function ContactPage() {
  const [contact, setContact] = useState<ContactInfo | null>(null);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => setContact(data.contact || {}));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError(null);

    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          access_key: 'f259c3b2-790e-481a-a6a6-79af0fa56b73',
          name: form.name,
          email: form.email,
          subject: form.subject,
          message: form.message,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSubmitted(true);
      } else {
        setError(data.message || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-16">
      {/* Hero */}
      <section className="bg-black py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-[#C8A96E] text-[10px] tracking-[0.4em] uppercase mb-4">✦</p>
          <h1 className="text-4xl md:text-5xl font-serif text-white mb-4 tracking-wide">Contact Us</h1>
          <p className="text-gray-400">We&apos;d love to hear from you. Reach out anytime.</p>
        </div>
      </section>

      <div className="border-t border-white/10" />

      <section className="py-16 bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

            {/* Contact Info from DB */}
            <div className="space-y-6">
              <h2 className="text-[10px] tracking-[0.4em] uppercase text-[#C8A96E] mb-4">Get in Touch</h2>

              {contact ? (
                <div className="space-y-4">
                  {contact.phone && (
                    <div className="flex items-start gap-4 p-4 bg-[#1a1a1a] border border-white/10">
                      <div className="p-2 bg-[#7B2D42]/20 flex-shrink-0">
                        <svg className="h-5 w-5 text-[#C8A96E]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                      </div>
                      <div>
                        <p className="text-[10px] tracking-[0.3em] uppercase text-gray-400 mb-1">Phone</p>
                        <a href={`tel:${contact.phone}`} className="text-[#C8A96E] hover:text-white transition-colors">{contact.phone}</a>
                      </div>
                    </div>
                  )}

                  {contact.email && (
                    <div className="flex items-start gap-4 p-4 bg-[#1a1a1a] border border-white/10">
                      <div className="p-2 bg-[#7B2D42]/20 flex-shrink-0">
                        <svg className="h-5 w-5 text-[#C8A96E]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      </div>
                      <div>
                        <p className="text-[10px] tracking-[0.3em] uppercase text-gray-400 mb-1">Email</p>
                        <a href={`mailto:${contact.email}`} className="text-[#C8A96E] hover:text-white transition-colors">{contact.email}</a>
                      </div>
                    </div>
                  )}

                  {(contact.address || contact.city) && (
                    <div className="flex items-start gap-4 p-4 bg-[#1a1a1a] border border-white/10">
                      <div className="p-2 bg-[#7B2D42]/20 flex-shrink-0">
                        <svg className="h-5 w-5 text-[#C8A96E]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      </div>
                      <div>
                        <p className="text-[10px] tracking-[0.3em] uppercase text-gray-400 mb-1">Address</p>
                        <p className="text-white text-sm">
                          {contact.address}{contact.address && contact.city ? ', ' : ''}{contact.city}{contact.city && contact.state ? ', ' : ''}{contact.state}{contact.state && contact.country ? ', ' : ''}{contact.country}
                        </p>
                      </div>
                    </div>
                  )}

                  {contact.businessHours && (
                    <div className="flex items-start gap-4 p-4 bg-[#1a1a1a] border border-white/10">
                      <div className="p-2 bg-[#7B2D42]/20 flex-shrink-0">
                        <svg className="h-5 w-5 text-[#C8A96E]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </div>
                      <div>
                        <p className="text-[10px] tracking-[0.3em] uppercase text-gray-400 mb-1">Business Hours</p>
                        <p className="text-white text-sm whitespace-pre-line">{contact.businessHours}</p>
                      </div>
                    </div>
                  )}

                  {(contact.instagramUrl || contact.facebookUrl) && (
                    <div className="flex gap-3 pt-2">
                      {contact.instagramUrl && (
                        <a href={contact.instagramUrl} target="_blank" rel="noopener noreferrer"
                          className="border border-white/20 text-white hover:bg-white/5 text-[10px] tracking-[0.3em] uppercase px-6 py-2.5 transition-colors">
                          Instagram
                        </a>
                      )}
                      {contact.facebookUrl && (
                        <a href={contact.facebookUrl} target="_blank" rel="noopener noreferrer"
                          className="border border-white/20 text-white hover:bg-white/5 text-[10px] tracking-[0.3em] uppercase px-6 py-2.5 transition-colors">
                          Facebook
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-[#111111] border border-white/10 animate-pulse" />)}
                </div>
              )}
            </div>

            {/* Contact Form */}
            <div>
              <h2 className="text-[10px] tracking-[0.4em] uppercase text-[#C8A96E] mb-6">Send a Message</h2>

              {submitted ? (
                <div className="bg-green-900/30 border border-green-500/20 p-8 text-center">
                  <div className="text-5xl mb-4">✅</div>
                  <h3 className="text-lg font-semibold text-green-400 mb-2">Message Sent!</h3>
                  <p className="text-green-400/70 text-sm">Thank you for reaching out. We&apos;ll get back to you within 24 hours.</p>
                  <button onClick={() => { setSubmitted(false); setForm({ name: '', email: '', subject: '', message: '' }); }}
                    className="mt-6 bg-[#7B2D42] text-white hover:bg-[#8A3048] transition-colors text-[10px] tracking-[0.3em] uppercase px-6 py-2.5">
                    Send Another
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                      <div className="bg-red-900/30 border border-red-500/20 text-red-400 p-3 text-xs">
                        {error}
                      </div>
                    )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] tracking-[0.3em] uppercase text-gray-400 mb-2">Name *</label>
                        <input required type="text" name="name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        className="bg-[#1a1a1a] border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-[#C8A96E] px-4 py-2.5 text-sm w-full" />
                    </div>
                    <div>
                      <label className="block text-[10px] tracking-[0.3em] uppercase text-gray-400 mb-2">Email *</label>
                        <input required type="email" name="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                        className="bg-[#1a1a1a] border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-[#C8A96E] px-4 py-2.5 text-sm w-full" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] tracking-[0.3em] uppercase text-gray-400 mb-2">Subject *</label>
                      <input required type="text" name="subject" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                      className="bg-[#1a1a1a] border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-[#C8A96E] px-4 py-2.5 text-sm w-full" />
                  </div>
                  <div>
                    <label className="block text-[10px] tracking-[0.3em] uppercase text-gray-400 mb-2">Message *</label>
                      <textarea required rows={5} name="message" value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                      className="bg-[#1a1a1a] border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-[#C8A96E] px-4 py-2.5 text-sm w-full resize-none" />
                  </div>
                    <button type="submit" disabled={sending}
                      className="w-full py-2.5 bg-[#7B2D42] text-white hover:bg-[#8A3048] transition-colors text-[10px] tracking-[0.3em] uppercase disabled:opacity-50">
                      {sending ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}