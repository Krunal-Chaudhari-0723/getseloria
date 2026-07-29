'use client';

import { FormEvent, Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { LockClosedIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [code, setCode] = useState(token);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(token ? '' : 'Enter the reset code from your email.');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage('');
    setError('');

    const resetCode = code.trim();

    if (!resetCode) {
      setError('Enter the reset code from your email.');
      return;
    }
    if (password !== confirmation) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetCode, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Unable to reset password.');
        return;
      }

      setMessage(data.message);
      setPassword('');
      setConfirmation('');
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
          <h2 className="text-white text-lg font-light">Create a new password</h2>
          <p className="text-sm text-gray-500 mt-3">Enter the 6-digit code from your email and choose a new password.</p>
        </div>

        {error && <div className="bg-red-900/30 border border-red-500/20 text-red-400 p-3 mb-4 text-sm">{error}</div>}
        {message && <div className="bg-green-900/30 border border-green-500/20 text-green-400 p-3 mb-4 text-sm">{message}</div>}

        {!message && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] tracking-[0.3em] uppercase text-gray-400 mb-2">Reset Code</label>
              <div className="relative">
                <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-600" />
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  className="bg-[#1a1a1a] border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-[#C8A96E] px-4 py-2.5 text-sm w-full pl-10"
                  placeholder="Enter 6-digit code"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] tracking-[0.3em] uppercase text-gray-400 mb-2">New Password</label>
              <div className="relative">
                <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-600" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="bg-[#1a1a1a] border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-[#C8A96E] px-4 py-2.5 text-sm w-full pl-10 pr-10"
                  placeholder="At least 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors focus:outline-none"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[10px] tracking-[0.3em] uppercase text-gray-400 mb-2">Confirm Password</label>
              <div className="relative">
                <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-600" />
                <input
                  type={showConfirmation ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  className="bg-[#1a1a1a] border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-[#C8A96E] px-4 py-2.5 text-sm w-full pl-10 pr-10"
                  placeholder="Repeat your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmation(!showConfirmation)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors focus:outline-none"
                  title={showConfirmation ? 'Hide password' : 'Show password'}
                >
                  {showConfirmation ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#7B2D42] text-white hover:bg-[#8A3048] transition-colors text-[10px] tracking-[0.3em] uppercase disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Reset Password'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center border-t border-white/10 pt-6">
          <Link href="/auth/login" className="text-sm text-[#C8A96E] hover:text-white transition-colors">Back to Sign In</Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a]" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
