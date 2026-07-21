'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  TruckIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  CogIcon,
  ShoppingBagIcon,
  ExclamationTriangleIcon,
  TicketIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface OrderCardProps {
  order: {
    _id: string;
    orderNumber: string;
    items: Array<{
      name: string;
      image: string;
      quantity: number;
      price: number;
    }>;
    totalAmount: number;
    orderStatus: string;
    paymentStatus: string;
    shippingAddress: any;
    createdAt: string;
    paidAt?: string;
    cancelledAt?: string;
    cancellationType?: 'full_refund' | 'voucher';
    refundStatus?: string;
    voucherCode?: string;
    voucherExpiresAt?: string;
    estimatedDelivery?: string;
    trackingNumber?: string;
    deliveredAt?: string;
  };
  onOrderCancelled?: () => void;
}

const STEPS = [
  { key: 'pending',    label: 'Placed',     Icon: ShoppingBagIcon },
  { key: 'processing', label: 'Processing', Icon: CogIcon },
  { key: 'shipped',    label: 'Shipped',    Icon: TruckIcon },
  { key: 'delivered',  label: 'Delivered',  Icon: CheckCircleIcon },
];

const stepIndex = (status: string) => STEPS.findIndex(s => s.key === status);

export default function OrderCard({ order: initialOrder, onOrderCancelled }: OrderCardProps) {
  const [order, setOrder] = useState(initialOrder);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelSuccessMessage, setCancelSuccessMessage] = useState<string | null>(null);

  const currentStep = stepIndex(order.orderStatus);

  const paymentTime = order.paidAt || order.createdAt;
  const hoursSincePayment = Math.max(0, (Date.now() - new Date(paymentTime).getTime()) / (1000 * 60 * 60));
  const isWithin24Hours = hoursSincePayment <= 24;

  const isDelivered = order.orderStatus === 'delivered';
  const deliveryTime = order.deliveredAt;
  const hoursSinceDelivery = isDelivered && deliveryTime
    ? Math.max(0, (Date.now() - new Date(deliveryTime).getTime()) / (1000 * 60 * 60))
    : 0;
  const isDeliveryCancellationDisabled = isDelivered && (hoursSinceDelivery > 24 || !deliveryTime);

  const statusStyle = (status: string) => {
    switch (status) {
      case 'delivered':  return 'bg-green-900/30 text-green-400';
      case 'processing': return 'bg-blue-900/30 text-blue-400';
      case 'shipped':    return 'bg-purple-900/30 text-purple-400';
      case 'cancelled':  return 'bg-red-900/30 text-red-400';
      default:           return 'bg-yellow-900/30 text-yellow-400';
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'delivered':  return <CheckCircleIcon className="h-4 w-4 text-green-400" />;
      case 'processing': return <ClockIcon className="h-4 w-4 text-blue-400" />;
      case 'shipped':    return <TruckIcon className="h-4 w-4 text-purple-400" />;
      case 'cancelled':  return <XCircleIcon className="h-4 w-4 text-red-400" />;
      default:           return <ClockIcon className="h-4 w-4 text-yellow-400" />;
    }
  };

  const handleCancelOrder = async () => {
    setCancelling(true);
    setCancelError(null);
    try {
      const res = await fetch(`/api/orders/${order._id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to cancel order');
      }

      setOrder(data.order);
      setCancelSuccessMessage(data.message);
      setShowCancelModal(false);
      if (onOrderCancelled) onOrderCancelled();
    } catch (err: any) {
      setCancelError(err.message || 'Something went wrong');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#111111] border border-white/10 overflow-hidden hover:border-white/20 transition-colors"
    >
      <div className="p-5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <p className="text-[10px] tracking-[0.3em] uppercase text-gray-500">Order #{order.orderNumber}</p>
              <p className="text-xs text-gray-600 mt-0.5">
                {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <div className={`px-2.5 py-1 text-[9px] tracking-widest uppercase flex items-center gap-1.5 ${statusStyle(order.orderStatus)}`}>
              {statusIcon(order.orderStatus)}
              {order.orderStatus}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] tracking-widest uppercase text-gray-500">Total</p>
              <p className="text-base font-semibold text-[#C8A96E]">₹{order.totalAmount.toLocaleString('en-IN')}</p>
            </div>

            {/* Cancel Order Button */}
            {order.orderStatus !== 'cancelled' && (
              <button
                onClick={() => setShowCancelModal(true)}
                disabled={isDeliveryCancellationDisabled}
                title={isDeliveryCancellationDisabled ? 'Cancellation period expired (24h post-delivery limit)' : 'Cancel Order'}
                className={`px-3 py-1.5 border text-[10px] tracking-[0.2em] uppercase transition-colors ${
                  isDeliveryCancellationDisabled
                    ? 'bg-gray-900/40 border-gray-800 text-gray-600 cursor-not-allowed opacity-50'
                    : 'bg-red-950/40 hover:bg-red-900/60 border-red-800/40 text-red-300'
                }`}
              >
                Cancel Order
              </button>
            )}

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-colors"
            >
              {isExpanded
                ? <ChevronUpIcon className="h-4 w-4" />
                : <ChevronDownIcon className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Cancel Feedback Banner */}
        {cancelSuccessMessage && (
          <div className="mt-4 p-3 bg-amber-950/30 border border-amber-500/30 text-amber-300 text-xs flex justify-between items-start gap-2">
            <span>{cancelSuccessMessage}</span>
            <button onClick={() => setCancelSuccessMessage(null)} className="text-amber-400/60 hover:text-amber-300">
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        )}

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-5 pt-5 border-t border-white/10"
            >
              {/* Stepper */}
              {order.orderStatus !== 'cancelled' && (
                <div className="mb-6">
                  <div className="flex items-center justify-between relative">
                    <div className="absolute top-4 left-0 right-0 h-px bg-white/10 z-0" />
                    <div
                      className="absolute top-4 left-0 h-px bg-[#7B2D42] z-0 transition-all duration-500"
                      style={{ width: `${currentStep === 0 ? 0 : (currentStep / (STEPS.length - 1)) * 100}%` }}
                    />
                    {STEPS.map((step, i) => {
                      const done = i <= currentStep;
                      return (
                        <div key={step.key} className="flex flex-col items-center z-10 gap-1.5">
                          <div className={`h-8 w-8 flex items-center justify-center border transition-colors ${
                            done ? 'bg-[#7B2D42] border-[#7B2D42]' : 'bg-[#1a1a1a] border-white/10'
                          }`}>
                            <step.Icon className={`h-4 w-4 ${done ? 'text-white' : 'text-gray-600'}`} />
                          </div>
                          <span className={`text-[9px] tracking-wider uppercase text-center w-16 ${done ? 'text-[#C8A96E]' : 'text-gray-600'}`}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {order.orderStatus === 'cancelled' && (
                <div className="mb-4 bg-red-900/10 border border-red-900/30 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <XCircleIcon className="h-5 w-5 text-red-400" />
                    <span className="text-sm font-semibold text-red-400 uppercase tracking-wider">This order has been cancelled</span>
                  </div>
                  {order.cancelledAt && (
                    <p className="text-xs text-gray-400">
                      Cancelled on: {new Date(order.cancelledAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                  {order.cancellationType === 'full_refund' && (
                    <div className="mt-2 text-xs text-green-400 flex items-center gap-1.5">
                      <CheckCircleIcon className="h-4 w-4" />
                      <span>Full refund of ₹{order.totalAmount.toLocaleString('en-IN')} has been initiated.</span>
                    </div>
                  )}
                  {order.cancellationType === 'voucher' && (
                    <div className="mt-2 p-3 bg-amber-950/40 border border-amber-500/30 space-y-1.5">
                      <div className="flex items-center gap-2 text-amber-300 text-xs font-semibold">
                        <TicketIcon className="h-4 w-4" />
                        <span>Store Voucher Issued (Valid for 90 Days)</span>
                      </div>
                      <p className="text-xs text-gray-300">
                        Voucher Code: <span className="font-mono text-[#C8A96E] font-bold">{order.voucherCode}</span>
                      </p>
                      {order.voucherExpiresAt && (
                        <p className="text-[11px] text-gray-400">
                          Expires On: {new Date(order.voucherExpiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      )}
                      <p className="text-[11px] text-amber-200/80 italic mt-1">
                        * Our support team will manually send an email with your voucher details.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Items */}
                <div>
                  <p className="text-[10px] tracking-[0.35em] uppercase text-gray-500 mb-3">Items</p>
                  <div className="space-y-2">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-[#1a1a1a] border border-white/5">
                        <div className="h-12 w-12 flex-shrink-0 bg-[#0a0a0a]">
                          <img src={item.image || ''} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white truncate">{item.name}</p>
                          <p className="text-[10px] text-gray-500 mt-0.5">
                            {item.quantity} × ₹{item.price.toLocaleString('en-IN')}
                          </p>
                        </div>
                        <p className="text-xs font-medium text-[#C8A96E] flex-shrink-0">
                          ₹{(item.quantity * item.price).toLocaleString('en-IN')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shipping */}
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] tracking-[0.35em] uppercase text-gray-500 mb-2">Shipping Address</p>
                    <div className="bg-[#1a1a1a] border border-white/5 p-3 space-y-0.5">
                      <p className="text-sm text-white">{order.shippingAddress.name}</p>
                      <p className="text-xs text-gray-400">{order.shippingAddress.street}</p>
                      <p className="text-xs text-gray-400">{order.shippingAddress.city}, {order.shippingAddress.state}</p>
                      <p className="text-xs text-gray-400">{order.shippingAddress.zipCode}</p>
                      <p className="text-xs text-gray-400">{order.shippingAddress.phone}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] tracking-[0.35em] uppercase text-gray-500 mb-2">Payment</p>
                    <span className={`text-[10px] px-2.5 py-1 tracking-wider uppercase ${
                      order.paymentStatus === 'paid'
                        ? 'bg-green-900/30 text-green-400'
                        : 'bg-yellow-900/30 text-yellow-400'
                    }`}>
                      {order.paymentStatus}
                    </span>
                  </div>

                  {order.trackingNumber && (
                    <div>
                      <p className="text-[10px] tracking-[0.35em] uppercase text-gray-500 mb-2">Tracking</p>
                      <p className="text-xs font-mono text-[#C8A96E] bg-[#1a1a1a] border border-white/5 px-3 py-1.5 inline-block">
                        {order.trackingNumber}
                      </p>
                    </div>
                  )}

                  {order.deliveredAt && (
                    <div>
                      <p className="text-[10px] tracking-[0.35em] uppercase text-gray-500 mb-1">Delivered On</p>
                      <p className="text-xs text-green-400">
                        {new Date(order.deliveredAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  )}

                  {order.estimatedDelivery && (
                    <div>
                      <p className="text-[10px] tracking-[0.35em] uppercase text-gray-500 mb-1">Estimated Delivery</p>
                      <p className="text-xs text-gray-400">
                        {new Date(order.estimatedDelivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showCancelModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4"
          >
            <div className="w-full max-w-md border border-white/10 bg-[#111111] p-6 shadow-2xl relative space-y-4">
              <button
                onClick={() => setShowCancelModal(false)}
                className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-3">
                <ExclamationTriangleIcon className="h-6 w-6 text-amber-400 flex-shrink-0" />
                <h3 className="text-lg font-serif text-white">Cancel Order #{order.orderNumber}</h3>
              </div>

              {isWithin24Hours ? (
                <div className="bg-green-950/30 border border-green-500/20 p-3 text-xs text-green-400 space-y-1">
                  <p className="font-semibold">⚡ Within 24 Hours of Payment</p>
                  <p className="text-green-300/80 leading-relaxed">
                    You are cancelling this order within 24 hours of payment. You will receive a <strong className="text-green-300">FULL REFUND</strong> of ₹{order.totalAmount.toLocaleString('en-IN')}.
                  </p>
                </div>
              ) : (
                <div className="bg-amber-950/30 border border-amber-500/30 p-3 text-xs text-amber-300 space-y-1">
                  <p className="font-semibold">⏳ After 24 Hours of Payment</p>
                  <p className="text-amber-200/80 leading-relaxed">
                    Because more than 24 hours have passed since payment, you will receive a <strong className="text-amber-300">STORE VOUCHER</strong> of ₹{order.totalAmount.toLocaleString('en-IN')} valid for <strong className="text-amber-300">90 DAYS</strong>. Our support team will manually email you the voucher code.
                  </p>
                </div>
              )}

              {cancelError && (
                <p className="text-xs text-red-400 bg-red-950/40 p-2 border border-red-900/40">{cancelError}</p>
              )}

              <p className="text-xs text-gray-400">Are you sure you want to proceed with cancelling this order?</p>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowCancelModal(false)}
                  disabled={cancelling}
                  className="px-4 py-2 border border-white/10 text-white text-[10px] tracking-[0.2em] uppercase hover:bg-white/5 disabled:opacity-50 transition-colors"
                >
                  Keep Order
                </button>
                <button
                  onClick={handleCancelOrder}
                  disabled={cancelling}
                  className="px-4 py-2 bg-red-800 hover:bg-red-700 text-white text-[10px] tracking-[0.2em] uppercase disabled:opacity-50 transition-colors"
                >
                  {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
