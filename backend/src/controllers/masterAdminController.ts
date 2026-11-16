import { Request, Response } from 'express';
import BranchRegistry from '../models/BranchRegistry';
import Service from '../models/Service';
import { calculateLocalBranchSummary } from './branchController';

/**
 * Fetch branch summary from a remote or local branch.
 */
const fetchSingleBranchSummary = async (branch: any) => {
  const startTime = Date.now();

  // If this is the local branch (Self), query directly without network roundtrip
  if (branch.isSelf) {
    try {
      const summary = await calculateLocalBranchSummary();
      const pingMs = Date.now() - startTime;
      return {
        _id: branch._id,
        name: branch.name,
        code: branch.code,
        url: branch.url,
        location: branch.location,
        phone: branch.phone,
        managerName: branch.managerName,
        isSelf: true,
        isActive: branch.isActive,
        status: 'online',
        pingMs,
        summary,
      };
    } catch (err: any) {
      return {
        _id: branch._id,
        name: branch.name,
        code: branch.code,
        url: branch.url,
        location: branch.location,
        isSelf: true,
        isActive: branch.isActive,
        status: 'offline',
        error: err.message,
        summary: null,
      };
    }
  }

  // Remote branch HTTP fetch
  try {
    const cleanUrl = branch.url.replace(/\/+$/, '');
    const targetUrl = `${cleanUrl}/api/branch/summary`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);

    const res = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-branch-key': branch.apiKey || 'miracle-secret-key-2026',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const pingMs = Date.now() - startTime;

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      return {
        _id: branch._id,
        name: branch.name,
        code: branch.code,
        url: branch.url,
        location: branch.location,
        phone: branch.phone,
        managerName: branch.managerName,
        isSelf: false,
        isActive: branch.isActive,
        status: 'offline',
        pingMs,
        error: `HTTP ${res.status}: ${errText.substring(0, 100) || 'Error'}`,
        summary: null,
      };
    }

    const data: any = await res.json();
    return {
      _id: branch._id,
      name: branch.name,
      code: branch.code,
      url: branch.url,
      location: branch.location,
      phone: branch.phone,
      managerName: branch.managerName,
      isSelf: false,
      isActive: branch.isActive,
      status: 'online',
      pingMs,
      summary: data,
    };
  } catch (err: any) {
    return {
      _id: branch._id,
      name: branch.name,
      code: branch.code,
      url: branch.url,
      location: branch.location,
      phone: branch.phone,
      managerName: branch.managerName,
      isSelf: false,
      isActive: branch.isActive,
      status: 'offline',
      error: err.name === 'AbortError' ? 'Connection Timed Out (4.5s)' : err.message,
      summary: null,
    };
  }
};

/**
 * 1. Master Consolidated Dashboard
 * Parallel queries all registered branches and returns aggregated KPIs & branch breakdown.
 */
export const getMasterDashboard = async (req: Request, res: Response) => {
  try {
    const branches = await BranchRegistry.find({ isActive: true }).sort({ isSelf: -1, createdAt: 1 });

    // Parallel fetch from all branches
    const results = await Promise.allSettled(
      branches.map((b) => fetchSingleBranchSummary(b))
    );

    const branchesData: any[] = [];
    let totalRevenue = 0;
    let todaySales = 0;
    let monthSales = 0;
    let totalOrders = 0;
    let activeOrders = 0;
    let deliveredToday = 0;
    let totalPendingBalance = 0;
    let totalCustomers = 0;
    let onlineBranches = 0;

    const allRecentOrders: any[] = [];

    results.forEach((resItem) => {
      if (resItem.status === 'fulfilled') {
        const item = resItem.value;
        branchesData.push(item);

        if (item.status === 'online' && item.summary) {
          onlineBranches += 1;
          const s = item.summary;
          totalRevenue += Number(s.totalRevenue || 0);
          todaySales += Number(s.todaySales || 0);
          monthSales += Number(s.monthSales || 0);
          totalOrders += Number(s.totalOrders || 0);
          activeOrders += Number(s.activeOrders || 0);
          deliveredToday += Number(s.deliveredToday || 0);
          totalPendingBalance += Number(s.pendingBalance || 0);
          totalCustomers += Number(s.totalCustomers || 0);

          if (Array.isArray(s.recentOrders)) {
            s.recentOrders.forEach((ord: any) => {
              allRecentOrders.push({
                ...ord,
                branchName: item.name,
                branchCode: item.code,
                branchId: item._id,
              });
            });
          }
        }
      }
    });

    // Sort recent network orders
    allRecentOrders.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    const topRecentOrders = allRecentOrders.slice(0, 10);

    // Build branch revenue ranking for comparative visualization
    const branchComparison = branchesData
      .filter((b) => b.status === 'online' && b.summary)
      .map((b) => ({
        name: b.name,
        code: b.code,
        todaySales: b.summary.todaySales,
        monthSales: b.summary.monthSales,
        totalRevenue: b.summary.totalRevenue,
        totalOrders: b.summary.totalOrders,
        activeOrders: b.summary.activeOrders,
        sharePercentage: totalRevenue > 0 ? Math.round((b.summary.totalRevenue / totalRevenue) * 100) : 0,
      }))
      .sort((a, b) => b.monthSales - a.monthSales);

    res.json({
      success: true,
      networkTotals: {
        totalRevenue,
        todaySales,
        monthSales,
        totalOrders,
        activeOrders,
        deliveredToday,
        totalPendingBalance,
        totalCustomers,
        onlineBranches,
        totalBranches: branches.length,
      },
      branchesData,
      branchComparison,
      recentNetworkOrders: topRecentOrders,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Master Admin Dashboard Error]:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to aggregate dashboard' });
  }
};

/**
 * 2. Get All Registered Branches
 */
export const getBranches = async (req: Request, res: Response) => {
  try {
    const branches = await BranchRegistry.find().sort({ isSelf: -1, createdAt: 1 });
    res.json({ success: true, branches });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 3. Add New Branch
 */
export const addBranch = async (req: Request, res: Response) => {
  try {
    const { name, code, url, apiKey, location, phone, managerName, notes, isSelf } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Branch name is required' });
    }
    if (!url || !url.trim()) {
      return res.status(400).json({ success: false, message: 'Branch URL is required' });
    }

    const cleanUrl = url.trim().replace(/\/+$/, '');

    // Check duplicate URL
    const existing = await BranchRegistry.findOne({ url: cleanUrl });
    if (existing) {
      return res.status(400).json({ success: false, message: `A branch with URL "${cleanUrl}" is already registered (${existing.name}).` });
    }

    const branch = new BranchRegistry({
      name: name.trim(),
      code: code ? code.trim().toUpperCase() : `ML-0${(await BranchRegistry.countDocuments()) + 1}`,
      url: cleanUrl,
      apiKey: apiKey?.trim() || 'miracle-secret-key-2026',
      location: location?.trim() || '',
      phone: phone?.trim() || '',
      managerName: managerName?.trim() || '',
      notes: notes?.trim() || '',
      isSelf: Boolean(isSelf),
      isActive: true,
      lastStatus: 'untested',
    });

    await branch.save();
    res.status(201).json({ success: true, message: 'Branch registered successfully', branch });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 4. Update Branch
 */
export const updateBranch = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, code, url, apiKey, location, phone, managerName, notes, isActive } = req.body;

    const branch = await BranchRegistry.findById(id);
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch not found' });
    }

    if (name) branch.name = name.trim();
    if (code) branch.code = code.trim().toUpperCase();
    if (url) branch.url = url.trim().replace(/\/+$/, '');
    if (apiKey) branch.apiKey = apiKey.trim();
    if (location !== undefined) branch.location = location.trim();
    if (phone !== undefined) branch.phone = phone.trim();
    if (managerName !== undefined) branch.managerName = managerName.trim();
    if (notes !== undefined) branch.notes = notes.trim();
    if (isActive !== undefined) branch.isActive = Boolean(isActive);

    await branch.save();
    res.json({ success: true, message: 'Branch updated successfully', branch });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 5. Delete Branch
 */
export const deleteBranch = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const branch = await BranchRegistry.findById(id);
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch not found' });
    }

    if (branch.isSelf) {
      return res.status(400).json({ success: false, message: 'Cannot delete the primary local branch (HQ).' });
    }

    await BranchRegistry.findByIdAndDelete(id);
    res.json({ success: true, message: 'Branch deleted from registry' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 6. Live Test Branch Connection
 */
export const testBranchConnection = async (req: Request, res: Response) => {
  try {
    const { url, apiKey } = req.body;
    if (!url || !url.trim()) {
      return res.status(400).json({ success: false, message: 'URL is required for testing connection' });
    }

    const cleanUrl = url.trim().replace(/\/+$/, '');
    const startTime = Date.now();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const targetUrl = `${cleanUrl}/api/branch/summary`;
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-branch-key': apiKey?.trim() || 'miracle-secret-key-2026',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const pingMs = Date.now() - startTime;

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      return res.json({
        success: false,
        message: `HTTP Error ${response.status}: ${errText.slice(0, 120) || 'Branch rejected connection'}`,
        pingMs,
      });
    }

    const data: any = await response.json();
    return res.json({
      success: true,
      message: `Connection successful! Reached "${data.branchName || cleanUrl}" in ${pingMs}ms.`,
      pingMs,
      branchName: data.branchName,
      branchCode: data.branchCode,
      currencySymbol: data.currencySymbol,
      todaySales: data.todaySales,
    });
  } catch (error: any) {
    return res.json({
      success: false,
      message: error.name === 'AbortError' ? 'Connection timed out after 4 seconds' : error.message,
    });
  }
};

/**
 * 7. Broadcast Pricing / Discounts to All Active Branches
 */
export const broadcastPricingToAllBranches = async (req: Request, res: Response) => {
  try {
    const { services, promoNote } = req.body;
    if (!Array.isArray(services) || services.length === 0) {
      return res.status(400).json({ success: false, message: 'Services array is required' });
    }

    const branches = await BranchRegistry.find({ isActive: true });
    if (branches.length === 0) {
      return res.status(400).json({ success: false, message: 'No active branches found' });
    }

    const successfulBranches: string[] = [];
    const failedBranches: { branch: string; reason: string }[] = [];

    // Push in parallel to all branches
    await Promise.all(
      branches.map(async (branch) => {
        if (branch.isSelf) {
          try {
            let updatedCount = 0;
            for (const s of services) {
              if (s.name && s.price !== undefined) {
                const res = await Service.findOneAndUpdate(
                  { name: { $regex: new RegExp(`^${s.name.trim()}$`, 'i') } },
                  { $set: { price: Number(s.price) } },
                  { new: true }
                );
                if (res) updatedCount++;
              }
            }
            successfulBranches.push(`${branch.name} (${updatedCount} services updated locally)`);
          } catch (err: any) {
            failedBranches.push({ branch: branch.name, reason: err.message });
          }
        } else {
          try {
            const cleanUrl = branch.url.replace(/\/+$/, '');
            const targetUrl = `${cleanUrl}/api/branch/sync-pricing`;
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 6000);

            const resp = await fetch(targetUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-branch-key': branch.apiKey || 'miracle-secret-key-2026',
              },
              body: JSON.stringify({ services, promoNote }),
              signal: controller.signal,
            });
            clearTimeout(timeout);

            if (resp.ok) {
              const resData: any = await resp.json();
              successfulBranches.push(`${branch.name} (${resData.updatedCount || 0} services)`);
            } else {
              const errText = await resp.text().catch(() => '');
              failedBranches.push({
                branch: branch.name,
                reason: `HTTP ${resp.status}: ${errText.slice(0, 100) || 'Rejected'}`,
              });
            }
          } catch (err: any) {
            failedBranches.push({
              branch: branch.name,
              reason: err.name === 'AbortError' ? 'Timeout (6s)' : err.message,
            });
          }
        }
      })
    );

    res.json({
      success: true,
      message: `Pricing broadcasted: ${successfulBranches.length} updated successfully, ${failedBranches.length} failed.`,
      successfulBranches,
      failedBranches,
      totalBranches: branches.length,
      promoNote: promoNote || '',
    });
  } catch (error: any) {
    console.error('[Broadcast Pricing Error]:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to broadcast pricing' });
  }
};
