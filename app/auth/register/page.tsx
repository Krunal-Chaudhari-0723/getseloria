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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const errors: Record<string, string> = {};

    // Name validation
    if (!formData.name.trim()) {
      errors.name = 'Full name is required';
    } else if (formData.name.trim().length < 3) {
      errors.name = 'Name must be at least 3 characters long';
    } else if (!/^[A-Za-z\s]+$/.test(formData.name.trim())) {
      errors.name = 'Name must only contain letters and spaces';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    // Phone validation
    const phoneRegex = /^\+?[0-9\s-]{10,15}$/;
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!phoneRegex.test(formData.phone.trim().replace(/\s+/g, ''))) {
      errors.phone = 'Please enter a valid 10 to 12 digit phone number';
    }

    // Gender validation
    if (!formData.gender) {
      errors.gender = 'Please select a gender';
    }

    // DOB validation
    if (!formData.dob) {
      errors.dob = 'Date of birth is required';
    } else {
      const dobDate = new Date(formData.dob);
      const today = new Date();
      if (isNaN(dobDate.getTime())) {
        errors.dob = 'Please enter a valid date of birth';
      } else if (dobDate >= today) {
        errors.dob = 'Date of birth must be in the past';
      } else {
        const age = today.getFullYear() - dobDate.getFullYear();
        const m = today.getMonth() - dobDate.getMonth();
        if (age < 13 || (age === 13 && m < 0) || (age === 13 && m === 0 && today.getDate() < dobDate.getDate())) {
          errors.dob = 'You must be at least 13 years old to register';
        }
      }
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFieldErrors({});

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        sessionStorage.setItem('user', JSON.stringify({ name: data.user.name, role: data.user.role, email: data.user.email }));
        window.dispatchEvent(new CustomEvent('authChanged', { detail: data.user }));
        setSuccess('Registration successful! Logging you in...');
        setTimeout(() => {
          const searchParams = new URLSearchParams(window.location.search);
          const redirect = searchParams.get('redirect');
          if (redirect) {
            router.push(redirect);
          } else {
            router.push('/');
          }
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

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Full Name */}
          <div>
            <label className="block text-[10px] tracking-[0.3em] uppercase text-gray-400 mb-2">
              Full Name
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-600" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`bg-[#1a1a1a] border text-white placeholder-gray-600 focus:outline-none px-4 py-2.5 text-sm w-full pl-10 ${
                  fieldErrors.name ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-[#C8A96E]'
                }`}
                placeholder="John Doe"
              />
            </div>
            {fieldErrors.name && (
              <p className="text-red-400 text-[11px] mt-1 tracking-wide">{fieldErrors.name}</p>
            )}
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-[10px] tracking-[0.3em] uppercase text-gray-400 mb-2">
              Email Address
            </label>
            <div className="relative">
              <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-600" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`bg-[#1a1a1a] border text-white placeholder-gray-600 focus:outline-none px-4 py-2.5 text-sm w-full pl-10 ${
                  fieldErrors.email ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-[#C8A96E]'
                }`}
                placeholder="you@example.com"
              />
            </div>
            {fieldErrors.email && (
              <p className="text-red-400 text-[11px] mt-1 tracking-wide">{fieldErrors.email}</p>
            )}
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-[10px] tracking-[0.3em] uppercase text-gray-400 mb-2">
              Phone Number <span className="text-[#7B2D42]">*</span>
            </label>
            <div className="relative">
              <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-600" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={`bg-[#1a1a1a] border text-white placeholder-gray-600 focus:outline-none px-4 py-2.5 text-sm w-full pl-10 ${
                  fieldErrors.phone ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-[#C8A96E]'
                }`}
                placeholder="+91 98765 43210"
              />
            </div>
            {fieldErrors.phone && (
              <p className="text-red-400 text-[11px] mt-1 tracking-wide">{fieldErrors.phone}</p>
            )}
          </div>

          {/* Gender */}
          <div>
            <label className="block text-[10px] tracking-[0.3em] uppercase text-gray-400 mb-2">
              Gender
            </label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              className={`bg-[#1a1a1a] border text-white focus:outline-none px-4 py-2.5 text-sm w-full ${
                fieldErrors.gender ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-[#C8A96E]'
              }`}
            >
              <option value="" disabled>Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
            {fieldErrors.gender && (
              <p className="text-red-400 text-[11px] mt-1 tracking-wide">{fieldErrors.gender}</p>
            )}
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-[10px] tracking-[0.3em] uppercase text-gray-400 mb-2">
              Date of Birth
            </label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-600" />
              <input
                type="date"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                className={`bg-[#1a1a1a] border text-white placeholder-gray-600 focus:outline-none px-4 py-2.5 text-sm w-full pl-10 ${
                  fieldErrors.dob ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-[#C8A96E]'
                }`}
              />
            </div>
            {fieldErrors.dob && (
              <p className="text-red-400 text-[11px] mt-1 tracking-wide">{fieldErrors.dob}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-[10px] tracking-[0.3em] uppercase text-gray-400 mb-2">
              Password
            </label>
            <div className="relative">
              <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-600" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={`bg-[#1a1a1a] border text-white placeholder-gray-600 focus:outline-none px-4 py-2.5 text-sm w-full pl-10 pr-10 ${
                  fieldErrors.password ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-[#C8A96E]'
                }`}
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
            {fieldErrors.password ? (
              <p className="text-red-400 text-[11px] mt-1 tracking-wide">{fieldErrors.password}</p>
            ) : (
              <p className="text-xs text-gray-600 mt-1">Must be at least 6 characters</p>
            )}
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
