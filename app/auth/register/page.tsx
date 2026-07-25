'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  UserIcon,
  EnvelopeIcon,
  LockClosedIcon,
  PhoneIcon,
  CalendarIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    gender: '',
    dob: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Registration successful! Please login.');
        setTimeout(() => {
          router.push('/auth/login');
        }, 2000);
      } else {
        setError(data.error || 'Registration failed');
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
            <p className="text-[10px] tracking-[0.4em] uppercase text-gray-400">Create Account</p>
          </div>
          <h2 className="text-white text-lg font-light">Join the Seliora family</h2>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-500/20 text-red-400 p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-900/30 border border-green-500/20 text-green-400 p-3 mb-4 text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] tracking-[0.3em] uppercase text-gray-400 mb-2">
              Full Name
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-600" />
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-[#1a1a1a] border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-[#C8A96E] px-4 py-2.5 text-sm w-full pl-10"
                placeholder="John Doe"
              />
            </div>
          </div>

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
              Phone Number <span className="text-[#7B2D42]">*</span>
            </label>
            <div className="relative">
              <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-600" />
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="bg-[#1a1a1a] border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-[#C8A96E] px-4 py-2.5 text-sm w-full pl-10"
                placeholder="+91 98765 43210"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] tracking-[0.3em] uppercase text-gray-400 mb-2">
              Gender
            </label>
            <select
              required
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              className="bg-[#1a1a1a] border border-white/10 text-white focus:outline-none focus:border-[#C8A96E] px-4 py-2.5 text-sm w-full"
            >
              <option value="" disabled>Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] tracking-[0.3em] uppercase text-gray-400 mb-2">
              Date of Birth
            </label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-600" />
              <input
                type="date"
                required
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                className="bg-[#1a1a1a] border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-[#C8A96E] px-4 py-2.5 text-sm w-full pl-10"
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
                minLength={6}
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
            <p className="text-xs text-gray-600 mt-1">Must be at least 6 characters</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#7B2D42] text-white hover:bg-[#8A3048] transition-colors text-[10px] tracking-[0.3em] uppercase disabled:opacity-50 mt-2"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center border-t border-white/10 pt-6">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-[#C8A96E] hover:text-white transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
