export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Order from '@/lib/models/Order';
import Product from '@/lib/models/Product';
import Voucher from '@/lib/models/Voucher';
import { authMiddleware } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authMiddleware(req);
    if (auth instanceof NextResponse) return auth;

    await connectToDatabase();
    const decoded = auth as any;

    const order = await Order.findOne({
      _id: params.id,
      user: decoded.userId,
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    if (order.orderStatus === 'cancelled') {
      return NextResponse.json(
        { error: 'Order is already cancelled' },
        { status: 400 }
      );
    }

    if (order.orderStatus === 'delivered') {
      const deliveryTime = order.deliveredAt || order.createdAt;
      const hoursSinceDelivery = (Date.now() - new Date(deliveryTime).getTime()) / (1000 * 60 * 60);

      if (hoursSinceDelivery > 24) {
        return NextResponse.json(
          { error: 'Cancellation period expired. Delivered orders can only be cancelled within 24 hours of delivery.' },
          { status: 400 }
        );
      }
    }

    const { reason } = await req.json().catch(() => ({ reason: '' }));

    // Determine time elapsed since payment (fallback to createdAt if paidAt is missing)
    const paymentTime = order.paidAt || order.createdAt;
    const hoursElapsed = (Date.now() - new Date(paymentTime).getTime()) / (1000 * 60 * 60);

    let responseData: any = {};

    if (hoursElapsed <= 24) {
      // Within 24 hours -> Full Refund
      order.orderStatus = 'cancelled';
      order.cancelledAt = new Date();
      order.cancelReason = reason || 'Cancelled by user within 24h of payment';
      order.cancellationType = 'full_refund';
      order.refundStatus = 'refunded';

      responseData = {
        success: true,
        cancellationType: 'full_refund',
        message: `Order #${order.orderNumber} has been cancelled within 24 hours of payment. A full refund of ₹${order.totalAmount.toLocaleString('en-IN')} has been initiated.`,
      };
    } else {
      // After 24 hours -> 90-Day Store Voucher (Manual Support Email)
      const voucherCode = `VOUCH-${Math.random().toString(36).substring(2, 8).toUpperCase()}${Date.now().toString().slice(-4)}`;
      const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days

      const voucher = await Voucher.create({
        code: voucherCode,
        user: decoded.userId,
        order: order._id,
        amount: order.totalAmount,
        expiresAt,
        isUsed: false,
      });

      order.orderStatus = 'cancelled';
      order.cancelledAt = new Date();
      order.cancelReason = reason || 'Cancelled by user after 24h of payment';
      order.cancellationType = 'voucher';
      order.refundStatus = 'voucher_issued';
      order.voucherCode = voucher.code;
      order.voucherExpiresAt = expiresAt;

      responseData = {
        success: true,
        cancellationType: 'voucher',
        voucherCode: voucher.code,
        expiresAt: expiresAt.toISOString(),
        message: `Order #${order.orderNumber} has been cancelled after 24 hours of payment. A store voucher of ₹${order.totalAmount.toLocaleString('en-IN')} (code: ${voucher.code}, valid for 90 days) has been issued. Our support team will manually email you the voucher details.`,
      };
    }

    // Restock product items
    for (const item of order.items || []) {
      if (item.product) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity },
        });
      }
    }

    await order.save();

    return NextResponse.json({
      order,
      ...responseData,
    });
  } catch (error: any) {
    console.error('Error cancelling order:', error);
    return NextResponse.json(
      { error: 'Failed to cancel order', details: error.message },
      { status: 500 }
    );
  }
}
