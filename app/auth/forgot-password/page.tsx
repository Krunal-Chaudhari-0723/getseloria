'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { EnvelopeIcon } from '@heroicons/react/24/outline';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Unable to send the reset email.');
        return;
      }

      setMessage(data.message);
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 pt-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-[#111111] border border-white/10 p-8"
      >
        <div className="text-center mb-8">
          <Link href="/" className="font-serif text-xl tracking-[0.3em] uppercase text-[#C8A96E]">Seloria</Link>
          <div className="mt-6 mb-2">
            <p className="text-[10px] tracking-[0.4em] uppercase text-gray-400">Account Recovery</p>
          </div>
          <h2 className="text-white text-lg font-light">Forgot your password?</h2>
          <p className="text-sm text-gray-500 mt-3">Enter your email and we&apos;ll send you a reset code.</p>
        </div>

        {error && <div className="bg-red-900/30 border border-red-500/20 text-red-400 p-3 mb-4 text-sm">{error}</div>}
        {message && <div className="bg-green-900/30 border border-green-500/20 text-green-400 p-3 mb-4 text-sm">{message}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] tracking-[0.3em] uppercase text-gray-400 mb-2">Email Address</label>
            <div className="relative">
              <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-600" />
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="bg-[#1a1a1a] border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-[#C8A96E] px-4 py-2.5 text-sm w-full pl-10"
                placeholder="you@example.com"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#7B2D42] text-white hover:bg-[#8A3048] transition-colors text-[10px] tracking-[0.3em] uppercase disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Reset Code'}
          </button>
        </form>

        <div className="mt-6 text-center border-t border-white/10 pt-6">
          <Link href="/auth/login" className="text-sm text-[#C8A96E] hover:text-white transition-colors">Back to Sign In</Link>
        </div>
      </motion.div>
    </div>
  );
}
