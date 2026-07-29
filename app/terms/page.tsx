'use client';

import { useState, useEffect } from 'react';

export default function TermsPage() {
  const [terms, setTerms] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => {
        setTerms(data.terms || '');
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const renderTerms = () => {
    if (!terms.trim()) return (
      <p className="text-gray-600 italic">No terms and conditions have been added yet.</p>
    );
    return (
      <div
        className="prose prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: terms }}
      />
    );
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-16">
      {/* Hero */}
      <section className="bg-black py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-[#C8A96E] text-[10px] tracking-[0.4em] uppercase mb-4">✦</p>
          <h1 className="text-4xl md:text-5xl font-serif text-white mb-4 tracking-wide">Terms &amp; Conditions</h1>
          <p className="text-gray-400 text-sm">Please read these terms carefully before using Seloria.</p>
        </div>
      </section>

      <div className="border-t border-white/10" />

      <section className="py-16 bg-[#0a0a0a]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#111111] border border-white/10 p-4 mb-8">
            <p className="text-gray-400 text-sm">
              By using Seloria, you agree to these Terms and Conditions. If you do not agree, please do not use our website.
            </p>
          </div>

          <div className="text-gray-300">
            {loading ? (
              <div className="space-y-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-4 bg-[#111111] animate-pulse" style={{ width: `${70 + Math.random() * 30}%` }} />
                ))}
              </div>
            ) : renderTerms()}
          </div>
        </div>
      </section>
    </div>
  );
}
