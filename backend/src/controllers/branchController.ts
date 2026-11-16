import { Request, Response } from 'express';
import Order from '../models/Order';
import Payment from '../models/Payment';
import Customer from '../models/Customer';
import Setting from '../models/Setting';
import Service from '../models/Service';

/**
 * Calculates current branch summary directly from MongoDB.
 * Reusable for local branch queries and HTTP endpoint.
 */
export const calculateLocalBranchSummary = async () => {
  const setting = await Setting.findOne();
  const branchName = process.env.BRANCH_NAME || setting?.shopName || 'Miracle Laundry 1';
  const branchCode = process.env.BRANCH_CODE || 'ML-01';

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);

  // 1. Sales & Revenue from Payments
  const [todayPayments, monthPayments, totalPayments] = await Promise.all([
    Payment.aggregate([
      { $match: { paidAt: { $gte: startOfToday } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Payment.aggregate([
      { $match: { paidAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Payment.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);

  const todaySales = todayPayments[0]?.total || 0;
  const monthSales = monthPayments[0]?.total || 0;
  const totalRevenue = totalPayments[0]?.total || 0;

  // 2. Order statistics
  const [
    totalOrders,
    activeOrders,
    deliveredToday,
    pendingBalanceAgg,
    totalCustomers,
    recentOrders,
    statusBreakdownAgg,
  ] = await Promise.all([
    Order.countDocuments({ status: { $ne: 'Cancelled' } }),
    Order.countDocuments({
      status: {
        $in: [
          'Received',
          'Washing',
          'Drying',
          'Ironing',
          'Packing',
          'Ready for Delivery',
          'Ready for Pickup',
        ],
      },
    }),
    Order.countDocuments({
      status: 'Delivered',
      updatedAt: { $gte: startOfToday },
    }),
    Order.aggregate([
      { $match: { remainingBalance: { $gt: 0 }, status: { $ne: 'Cancelled' } } },
      { $group: { _id: null, total: { $sum: '$remainingBalance' } } },
    ]),
    Customer.countDocuments(),
    Order.find({ status: { $ne: 'Cancelled' } })
      .sort({ createdAt: -1 })
      .limit(6)
      .select('orderNumber customerSnapshot totalAmount remainingBalance status paymentStatus createdAt')
      .lean(),
    Order.aggregate([
      { $match: { status: { $ne: 'Cancelled' } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ]);

  const pendingBalance = pendingBalanceAgg[0]?.total || 0;

  // Format Status Breakdown
  const statusBreakdown: Record<string, number> = {};
  statusBreakdownAgg.forEach((s: any) => {
    statusBreakdown[s._id] = s.count;
  });

  // 3. Last 7 Days Daily Sales History
  const last7DaysStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0);
  const dailySalesAgg = await Payment.aggregate([
    { $match: { paidAt: { $gte: last7DaysStart } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$paidAt' } },
        amount: { $sum: '$amount' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const dailySalesMap: Record<string, number> = {};
  dailySalesAgg.forEach((d: any) => {
    dailySalesMap[d._id] = d.amount;
  });

  const dailySalesHistory = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    dailySalesHistory.push({
      date: dateStr,
      amount: dailySalesMap[dateStr] || 0,
    });
  }

  return {
    success: true,
    branchName,
    branchCode,
    currencySymbol: setting?.currencySymbol || '₹',
    currencyCode: setting?.currencyCode || 'INR',
    phone: setting?.phone || '',
    address: setting?.address || '',
    todaySales,
    monthSales,
    totalRevenue,
    totalOrders,
    activeOrders,
    deliveredToday,
    totalCustomers,
    pendingBalance,
    recentOrders,
    statusBreakdown,
    dailySalesHistory,
    status: 'online',
    timestamp: new Date().toISOString(),
  };
};

/**
 * Public/Authorized Summary API for this branch.
 * Called by the Master Admin Aggregator.
 */
export const getBranchSummary = async (req: Request, res: Response) => {
  try {
    const masterSecret = process.env.BRANCH_API_KEY || process.env.MASTER_ADMIN_KEY || 'miracle-secret-key-2026';
    const providedKey =
      (req.headers['x-branch-key'] as string) ||
      (req.headers['authorization']?.replace(/^Bearer\s+/i, '')) ||
      (req.query.key as string);

    // If masterSecret is set, verify authorization (allow local bypass or matching key)
    if (masterSecret && providedKey !== masterSecret && req.ip !== '127.0.0.1' && req.ip !== '::1') {
      return res.status(401).json({ success: false, message: 'Unauthorized branch access' });
    }

    const summary = await calculateLocalBranchSummary();
    res.json(summary);
  } catch (error: any) {
    console.error('[Branch Summary Error]:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch branch summary' });
  }
};

/**
 * Sync / Update Pricing on this Branch.
 * Called by Master Admin when owner changes prices or applies discounts.
 */
export const syncBranchPricing = async (req: Request, res: Response) => {
  try {
    const masterSecret = process.env.BRANCH_API_KEY || process.env.MASTER_ADMIN_KEY || 'miracle-secret-key-2026';
    const providedKey =
      (req.headers['x-branch-key'] as string) ||
      (req.headers['authorization']?.replace(/^Bearer\s+/i, '')) ||
      (req.query.key as string);

    if (masterSecret && providedKey !== masterSecret && req.ip !== '127.0.0.1' && req.ip !== '::1') {
      return res.status(401).json({ success: false, message: 'Unauthorized branch access' });
    }

    const { services, promoNote } = req.body;
    if (!Array.isArray(services) || services.length === 0) {
      return res.status(400).json({ success: false, message: 'Services array is required' });
    }

    let updatedCount = 0;
    for (const item of services) {
      if (item.name && item.price !== undefined) {
        const updated = await Service.findOneAndUpdate(
          { name: { $regex: new RegExp(`^${item.name.trim()}$`, 'i') } },
          { $set: { price: Number(item.price) } },
          { new: true }
        );
        if (updated) {
          updatedCount++;
        }
      }
    }

    console.log(`[Branch Price Sync]: Successfully updated ${updatedCount} services on this branch (${promoNote || 'No note'}).`);
    res.json({
      success: true,
      message: `Successfully synchronized ${updatedCount} services on this branch.`,
      updatedCount,
      promoNote: promoNote || '',
    });
  } catch (error: any) {
    console.error('[Branch Price Sync Error]:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to sync branch pricing' });
  }
};
