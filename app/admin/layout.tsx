'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  ShoppingBagIcon,
  TagIcon,
  UsersIcon,
  CogIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const checkMobile = () => {
      if (window.innerWidth < 768) setIsSidebarOpen(false);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: HomeIcon },
    { name: 'Products',  href: '/admin/products',  icon: ShoppingBagIcon },
    { name: 'Orders',    href: '/admin/orders',     icon: TagIcon },
    { name: 'Users',     href: '/admin/users',      icon: UsersIcon },
    { name: 'Settings',  href: '/admin/settings',   icon: CogIcon },
  ];

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    sessionStorage.removeItem('user');
    window.location.href = '/auth/login';
  };

  return (
    <div className="flex h-screen bg-[#0a0a0a]">

      {/* Mobile toggle */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 bg-[#111] border border-white/10 text-white"
      >
        {isSidebarOpen ? <XMarkIcon className="h-5 w-5" /> : <Bars3Icon className="h-5 w-5" />}
      </button>

      {/* Sidebar */}
      <aside className={`${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 fixed md:relative z-40 w-60 bg-[#0d0d0d] border-r border-white/10 transition-transform duration-300 ease-in-out flex flex-col h-full`}>

        {/* Logo */}
        <div className="px-6 py-6 border-b border-white/10">
          <p className="font-serif text-xl tracking-[0.3em] text-white uppercase">Seloria</p>
          <p className="text-[9px] tracking-[0.3em] text-[#C8A96E] uppercase mt-1">Admin Panel</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {navigation.map(item => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-3 py-2.5 transition-colors group ${
                  isActive
                    ? 'bg-[#7B2D42]/20 border-l-2 border-[#7B2D42] text-white'
                    : 'text-gray-500 hover:text-white hover:bg-white/5 border-l-2 border-transparent'
                }`}
              >
                <item.icon className={`h-4 w-4 mr-3 flex-shrink-0 ${isActive ? 'text-[#C8A96E]' : 'text-gray-600 group-hover:text-gray-400'}`} />
                <span className="text-[10px] tracking-[0.25em] uppercase">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-5 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-2.5 text-gray-600 hover:text-[#7B2D42] hover:bg-white/5 transition-colors group"
          >
            <XMarkIcon className="h-4 w-4 mr-3 group-hover:text-[#7B2D42]" />
            <span className="text-[10px] tracking-[0.25em] uppercase">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 overflow-auto bg-[#0a0a0a]">
        <div className="p-6 md:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
