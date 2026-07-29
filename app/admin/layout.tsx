'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  HomeIcon,
  ShoppingBagIcon,
  TagIcon,
  UsersIcon,
  CogIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowLeftOnRectangleIcon,
} from '@heroicons/react/24/outline';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const seenOrdersRef = useRef<Map<string, string>>(new Map());
  const isFirstRunRef = useRef(true);

  useEffect(() => {
    const checkMobile = () => {
      if (window.innerWidth < 768) setIsSidebarOpen(false);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Poll for new order bookings and cancellations
  useEffect(() => {
    const pollOrders = async () => {
      try {
        const res = await fetch(`/api/admin/orders?limit=25&t=${Date.now()}`);
        if (!res.ok) return;

        const data = await res.json();
        const orders = data.orders || [];

        if (isFirstRunRef.current) {
          orders.forEach((o: any) => {
            seenOrdersRef.current.set(o._id, o.orderStatus);
          });
          isFirstRunRef.current = false;
          return;
        }

        orders.forEach((order: any) => {
          const knownStatus = seenOrdersRef.current.get(order._id);

          if (!knownStatus) {
            // New order placed/booked
            seenOrdersRef.current.set(order._id, order.orderStatus);

            if (order.orderStatus === 'cancelled') {
              toast.error(
                `🚨 CANCELLED: Order #${order.orderNumber || order._id.slice(-8)} (₹${order.totalAmount?.toLocaleString('en-IN')}) was cancelled!`,
                { position: 'top-right', autoClose: 7000 }
              );
            } else {
              toast.success(
                `🎉 NEW ORDER BOOKED: #${order.orderNumber || order._id.slice(-8)} (₹${order.totalAmount?.toLocaleString('en-IN')})`,
                { position: 'top-right', autoClose: 7000 }
              );
            }
          } else if (knownStatus !== 'cancelled' && order.orderStatus === 'cancelled') {
            // Order was newly cancelled
            seenOrdersRef.current.set(order._id, 'cancelled');
            toast.error(
              `🚨 DANGER: Order #${order.orderNumber || order._id.slice(-8)} (₹${order.totalAmount?.toLocaleString('en-IN')}) HAS BEEN CANCELLED!`,
              { position: 'top-right', autoClose: 8000 }
            );
          } else {
            // Update cached status
            seenOrdersRef.current.set(order._id, order.orderStatus);
          }
        });
      } catch (error) {
        console.error('Error polling admin orders for notifications:', error);
      }
    };

    pollOrders();
    const interval = setInterval(pollOrders, 7000); // Check every 7 seconds
    return () => clearInterval(interval);
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
      {/* Toast notifications on top-right of page */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />

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
            className="flex items-center w-full px-3 py-2.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors group border-l-2 border-transparent hover:border-red-500"
          >
            <ArrowLeftOnRectangleIcon className="h-4 w-4 mr-3 text-gray-400 group-hover:text-red-400" />
            <span className="text-[10px] tracking-[0.25em] uppercase font-medium">Logout</span>
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
