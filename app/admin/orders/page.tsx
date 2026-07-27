'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const STATUS_OPTIONS = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-900/30 text-yellow-400',
  processing: 'bg-blue-900/30 text-blue-400',
  shipped: 'bg-purple-900/30 text-purple-400',
  delivered: 'bg-green-900/30 text-green-400',
  cancelled: 'bg-red-900/30 text-red-400',
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => { fetchOrders(); }, [page, statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (statusFilter) params.append('status', statusFilter);
    const res = await fetch(`/api/admin/orders?${params}`);
    const data = await res.json();
    setOrders(data.orders || []);
    setTotal(data.total || 0);
    setPages(data.pages || 1);
    setLoading(false);
  };

  const updateStatus = async (id: string, orderStatus: string) => {
    setUpdatingId(id);
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderStatus }),
    });
    setUpdatingId(null);
    if (res.ok) {
      if (orderStatus === 'cancelled') {
        toast.error(`Order status updated to CANCELLED`, { position: 'top-right' });
      } else {
        toast.success(`Order status updated to ${orderStatus.toUpperCase()}`, { position: 'top-right' });
      }
    }
    fetchOrders();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] tracking-[0.4em] uppercase text-[#C8A96E] mb-1">Manage</p>
          <h1 className="text-2xl font-serif text-white">Orders</h1>
          <p className="text-gray-400 mt-1 text-sm">{total} total orders</p>
        </div>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="bg-[#1a1a1a] border border-white/10 text-white focus:outline-none focus:border-[#C8A96E] px-4 py-2.5 text-sm"
        >
          <option value="" className="bg-[#1a1a1a]">All Statuses</option>
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s} className="bg-[#1a1a1a]">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      <div className="bg-[#111111] border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#0d0d0d]">
              <tr>
                <th className="px-4 py-3 text-left text-[10px] font-medium text-gray-400 uppercase tracking-wider border-b border-white/5">Order</th>
                <th className="px-4 py-3 text-left text-[10px] font-medium text-gray-400 uppercase tracking-wider border-b border-white/5">Customer</th>
                <th className="px-4 py-3 text-left text-[10px] font-medium text-gray-400 uppercase tracking-wider border-b border-white/5">Total</th>
                <th className="px-4 py-3 text-left text-[10px] font-medium text-gray-400 uppercase tracking-wider border-b border-white/5">Payment</th>
                <th className="px-4 py-3 text-left text-[10px] font-medium text-gray-400 uppercase tracking-wider border-b border-white/5">Status</th>
                <th className="px-4 py-3 text-left text-[10px] font-medium text-gray-400 uppercase tracking-wider border-b border-white/5">Date</th>
                <th className="px-4 py-3 text-left text-[10px] font-medium text-gray-400 uppercase tracking-wider border-b border-white/5">Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}><td colSpan={7} className="px-4 py-4"><div className="h-4 bg-[#1a1a1a] animate-pulse w-full" /></td></tr>
                ))
              ) : orders.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">No orders found</td></tr>
              ) : orders.map(order => (
                <React.Fragment key={order._id}>
                  <tr
                    className="hover:bg-white/5 cursor-pointer transition-colors"
                    onClick={() => setExpandedId(expandedId === order._id ? null : order._id)}
                  >
                    <td className="px-4 py-3 text-sm font-medium text-white">
                      #{order.orderNumber || order._id.slice(-8)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      <div className="text-white">{order.user?.name || 'Guest'}</div>
                      <div className="text-xs text-gray-600">{order.user?.email}</div>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-[#C8A96E]">₹{order.totalAmount?.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs ${order.paymentStatus === 'paid' ? 'bg-green-900/30 text-green-400' : order.paymentStatus === 'failed' ? 'bg-red-900/30 text-red-400' : 'bg-yellow-900/30 text-yellow-400'}`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs capitalize ${STATUS_COLORS[order.orderStatus]}`}>
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      <div className="text-white">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')}
                      </div>
                      <div className="text-xs text-gray-600 mt-0.5">
                        {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                      </div>
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <select
                        value={order.orderStatus}
                        disabled={updatingId === order._id}
                        onChange={e => updateStatus(order._id, e.target.value)}
                        className="text-xs bg-[#1a1a1a] border border-white/10 text-white px-2 py-1 focus:outline-none focus:border-[#C8A96E]"
                      >
                        {STATUS_OPTIONS.map(s => (
                          <option key={s} value={s} className="bg-[#1a1a1a]">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                  {expandedId === order._id && (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 bg-[#0d0d0d] border-b border-white/5">
                        <div className="text-sm text-gray-300 space-y-3">
                          {order.orderStatus === 'cancelled' && (
                            <div className="p-3 bg-red-950/30 border border-red-900/40 rounded space-y-1">
                              <p className="text-xs font-semibold text-red-400 uppercase tracking-wider">Order Cancelled</p>
                              {order.cancellationType && (
                                <p className="text-xs text-gray-300">
                                  Type: <span className="font-medium text-white">{order.cancellationType === 'full_refund' ? 'Full Refund (within 24h)' : 'Store Voucher (after 24h)'}</span>
                                </p>
                              )}
                              {order.voucherCode && (
                                <div className="mt-2 p-2.5 bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs space-y-1">
                                  <p className="font-semibold text-amber-300">✉️ Support Team Action Required (Manual Email):</p>
                                  <p>Customer Email: <strong className="text-white">{order.shippingAddress?.email || order.user?.email}</strong></p>
                                  <p>Voucher Code: <strong className="font-mono text-[#C8A96E]">{order.voucherCode}</strong></p>
                                  <p>Amount: <strong className="text-white">₹{order.totalAmount?.toLocaleString()}</strong></p>
                                  <p>Expires On: <strong className="text-white">{order.voucherExpiresAt ? new Date(order.voucherExpiresAt).toLocaleDateString('en-IN') : '90 days from cancellation'}</strong></p>
                                </div>
                              )}
                            </div>
                          )}

                          <div>
                            <p className="text-[10px] tracking-[0.3em] uppercase text-gray-400">Items:</p>
                            <ul className="space-y-1 mt-1">
                              {order.items?.map((item: any, i: number) => (
                                <li key={i} className="flex justify-between text-gray-300 text-xs">
                                  <span>{item.name} × {item.quantity}</span>
                                  <span className="text-[#C8A96E]">₹{(item.price * item.quantity).toLocaleString()}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <p className="text-[10px] tracking-[0.3em] uppercase text-gray-400">Shipping:</p>
                            <p className="text-xs text-gray-300 mt-1">{order.shippingAddress?.name}, {order.shippingAddress?.street}, {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.zipCode}</p>
                            <p className="text-xs text-gray-400">Email: {order.shippingAddress?.email || order.user?.email} | Phone: {order.shippingAddress?.phone}</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="px-4 py-3 border-t border-white/10 flex items-center justify-between">
            <span className="text-sm text-gray-400">Page {page} of {pages}</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 border border-white/10 text-white disabled:opacity-40 hover:bg-white/5 text-sm transition-colors">Prev</button>
              <button disabled={page === pages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border border-white/10 text-white disabled:opacity-40 hover:bg-white/5 text-sm transition-colors">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
