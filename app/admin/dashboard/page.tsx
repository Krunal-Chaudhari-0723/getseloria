'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ShoppingBagIcon,
  CurrencyRupeeIcon,
  UsersIcon,
  TagIcon,
  TruckIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    totalUsers: 0,
    ordersByStatus: []
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [search, setSearch] = useState('');

  const fetchDashboardData = async (isSearch = false) => {
    if (isSearch) {
      setOrdersLoading(true);
    } else {
      setLoading(true);
    }
    try {
      const response = await fetch(`/api/admin/stats?search=${encodeURIComponent(search)}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setRecentOrders(data.recentOrders);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setOrdersLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData(false);
  }, []);

  // Fetch when search changes
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchDashboardData(true);
    }, 400); // Debounce search fetches by 400ms to save DB request overhead

    return () => clearTimeout(delayDebounce);
  }, [search]);

  const statCards = [
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      icon: ShoppingBagIcon,
      color: 'bg-blue-900/40 border border-blue-500/20'
    },
    {
      title: 'Revenue',
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      icon: CurrencyRupeeIcon,
      color: 'bg-green-900/40 border border-green-500/20'
    },
    {
      title: 'Products',
      value: stats.totalProducts,
      icon: TagIcon,
      color: 'bg-purple-900/40 border border-purple-500/20'
    },
    {
      title: 'Users',
      value: stats.totalUsers,
      icon: UsersIcon,
      color: 'bg-[#7B2D42]/40 border border-[#7B2D42]/30'
    }
  ];

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-900/30 text-yellow-400',
    processing: 'bg-blue-900/30 text-blue-400',
    shipped: 'bg-purple-900/30 text-purple-400',
    delivered: 'bg-green-900/30 text-green-400',
    cancelled: 'bg-red-900/30 text-red-400'
  };

  const statusIcons: Record<string, any> = {
    pending: ClockIcon,
    processing: ClockIcon,
    shipped: TruckIcon,
    delivered: CheckCircleIcon,
    cancelled: XCircleIcon
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[10px] tracking-[0.4em] uppercase text-[#C8A96E] mb-1">Overview</p>
        <h1 className="text-2xl font-serif text-white">Dashboard</h1>
        <p className="text-gray-400 mt-1 text-sm">Welcome back! Here&apos;s what&apos;s happening with your store.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="bg-[#111111] border border-white/10 p-6 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="space-y-3">
                  <div className="h-2 w-16 bg-white/10" />
                  <div className="h-6 w-24 bg-white/10" />
                </div>
                <div className="w-12 h-12 bg-white/10" />
              </div>
            </div>
          ))
        ) : (
          statCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-[#111111] border border-white/10 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] tracking-[0.3em] uppercase text-gray-400">{stat.title}</p>
                  <p className="text-2xl font-bold mt-2 text-[#C8A96E]">{stat.value}</p>
                </div>
                <div className={`p-3 ${stat.color}`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Order Status Distribution */}
      {loading ? (
        <div className="bg-[#111111] border border-white/10 p-6 animate-pulse">
          <div className="h-3 w-28 bg-white/10 mb-6" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex flex-col items-center space-y-2">
                <div className="w-12 h-12 rounded bg-white/10" />
                <div className="h-4 w-6 bg-white/10" />
                <div className="h-2 w-12 bg-white/10" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        stats.ordersByStatus && stats.ordersByStatus.length > 0 && (
          <div className="bg-[#111111] border border-white/10 p-6">
            <h2 className="text-[10px] font-semibold tracking-[0.45em] text-white uppercase mb-6">Order Status</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {stats.ordersByStatus.map((status: any) => {
                const Icon = statusIcons[status._id] || ClockIcon;
                return (
                  <div key={status._id} className="text-center">
                    <div className={`inline-flex p-3 ${statusColors[status._id]}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <p className="font-semibold mt-2 text-white">{status.count}</p>
                    <p className="text-[10px] tracking-[0.2em] uppercase text-gray-400 mt-1 capitalize">{status._id}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )
      )}

      {/* Recent Orders / Search */}
      <div className="bg-[#111111] border border-white/10 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-[10px] font-semibold tracking-[0.45em] text-white uppercase">
            {search ? 'Search Results' : 'Recent Orders'}
          </h2>
          {/* Order Search Box */}
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Search Order ID, Name, Phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-[#C8A96E] pl-10 pr-4 py-2.5 text-xs transition-all"
            />
            <MagnifyingGlassIcon className="h-4 w-4 text-gray-500 absolute left-3 top-3" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#0d0d0d]">
              <tr>
                <th className="px-4 py-3 text-left text-[10px] font-medium text-gray-400 uppercase tracking-wider border-b border-white/5">
                  Order ID
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-medium text-gray-400 uppercase tracking-wider border-b border-white/5">
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-medium text-gray-400 uppercase tracking-wider border-b border-white/5">
                  Total
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-medium text-gray-400 uppercase tracking-wider border-b border-white/5">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-medium text-gray-400 uppercase tracking-wider border-b border-white/5">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading || ordersLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-4"><div className="h-4 w-24 bg-white/10" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-20 bg-white/10" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-14 bg-white/10" /></td>
                    <td className="px-4 py-4"><div className="h-5 w-16 bg-white/10 rounded" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-24 bg-white/10" /></td>
                  </tr>
                ))
              ) : recentOrders.length > 0 ? (
                recentOrders.map((order: any) => (
                  <tr key={order._id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-white">
                      #{order.orderNumber || order._id.slice(-8)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {order.user?.name || 'Guest'}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-[#C8A96E]">
                      ₹{order.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs capitalize ${statusColors[order.orderStatus]}`}>
                        {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-xs text-gray-500 tracking-wider uppercase">
                    No orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
