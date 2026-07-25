'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { motion } from 'framer-motion';
import { EnvelopeIcon, LockClosedIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        sessionStorage.setItem('user', JSON.stringify({ name: data.user.name, role: data.user.role, email: data.user.email }));
        window.dispatchEvent(new CustomEvent('authChanged', { detail: data.user }));
        if (data.user?.role === 'admin') {
          window.location.href = '/admin/dashboard';
        } else {
          router.push('/');
        }
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (error) {
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
          <Link href="/" className="font-serif text-xl tracking-[0.3em] uppercase text-[#C8A96E]">Seliora</Link>
          <div className="mt-6 mb-2">
            <p className="text-[10px] tracking-[0.4em] uppercase text-gray-400">Welcome Back</p>
          </div>
          <h2 className="text-white text-lg font-light">Sign in to your account</h2>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-500/20 text-red-400 p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] tracking-[0.3em] uppercase text-gray-400 mb-2">
              Email Address
            </label>
            <div className="relative">
              <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-600" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-[#1a1a1a] border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-[#C8A96E] px-4 py-2.5 text-sm w-full pl-10"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] tracking-[0.3em] uppercase text-gray-400 mb-2">
              Password
            </label>
            <div className="relative">
              <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-600" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="bg-[#1a1a1a] border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-[#C8A96E] px-4 py-2.5 text-sm w-full pl-10 pr-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors focus:outline-none"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#7B2D42] text-white hover:bg-[#8A3048] transition-colors text-[10px] tracking-[0.3em] uppercase disabled:opacity-50 mt-2"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link href="/auth/forgot-password" className="text-sm text-[#C8A96E] hover:text-white transition-colors">
            Forgot password?
          </Link>
        </div>

        <div className="mt-6 text-center border-t border-white/10 pt-6">
          <p className="text-sm text-gray-600">
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" className="text-[#C8A96E] hover:text-white transition-colors">
              Sign Up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
