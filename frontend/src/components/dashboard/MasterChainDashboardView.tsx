import React from 'react';
import { MasterDashboardData, BranchDataNode } from '../../types';
import {
  Building2,
  TrendingUp,
  ShoppingBag,
  Users,
  Receipt,
  MapPin,
  Sparkles,
  Zap,
} from 'lucide-react';

interface MasterChainDashboardViewProps {
  data: MasterDashboardData | null;
  onSelectBranch: (branchId: string) => void;
}

export const MasterChainDashboardView: React.FC<MasterChainDashboardViewProps> = ({
  data,
  onSelectBranch,
}) => {
  const totals = data?.networkTotals;

  return (
    <div className="space-y-6">
      {/* Network Header Banner */}
      <div className="glass-card p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl bg-gradient-to-r from-emerald-950/20 via-slate-900/40 to-teal-950/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5" /> Chain Executive Overview
            </span>
            {totals && (
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold">
                🟢 {totals.onlineBranches} / {totals.totalBranches} Branches Online
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Consolidated Network Performance
          </h2>
          <p className="text-xs text-slate-500">
            Real-time aggregated metrics across all active Miracle Laundry stores
          </p>
        </div>
      </div>

      {/* 4 Network KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Revenue */}
        <div className="glass-card p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Combined Network Revenue</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            ₹{(totals?.totalRevenue || 0).toLocaleString('en-IN')}
          </span>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-extrabold">
            <span>+₹{(totals?.todaySales || 0).toLocaleString('en-IN')} today</span>
            <span className="text-slate-400 font-normal">• all stores</span>
          </div>
        </div>

        {/* Card 2: Orders */}
        <div className="glass-card p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Total Orders (All Branches)</span>
            <ShoppingBag className="w-4 h-4 text-teal-500" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {(totals?.totalOrders || 0).toLocaleString('en-IN')}
          </span>
          <p className="text-xs text-teal-600 dark:text-teal-400 font-extrabold">
            {totals?.activeOrders || 0} active in laundry
          </p>
        </div>

        {/* Card 3: Customers */}
        <div className="glass-card p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Total Registered Clients</span>
            <Users className="w-4 h-4 text-cyan-500" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {(totals?.totalCustomers || 0).toLocaleString('en-IN')}
          </span>
          <p className="text-xs text-slate-400">Across entire chain</p>
        </div>

        {/* Card 4: Dues */}
        <div className="glass-card p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Total Unpaid Balance</span>
            <Receipt className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
            ₹{(totals?.totalPendingBalance || 0).toLocaleString('en-IN')}
          </span>
          <p className="text-xs text-slate-400">Pending customer dues</p>
        </div>
      </div>

      {/* Branch Comparison Table */}
      <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-500" /> Branch Revenue Breakdown & Comparison
            </h3>
            <p className="text-xs text-slate-500">
              Live sales and volume share by store location
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {data?.branchesData?.map((branch, idx) => {
            const s = branch.summary;
            const totRev = totals?.totalRevenue || 1;
            const sharePct = s ? Math.round((s.totalRevenue / totRev) * 100) : 0;

            return (
              <div
                key={branch._id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-2.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-black flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                          {branch.name}
                        </h4>
                        {branch.isSelf && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-black uppercase">
                            HQ
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span>{branch.location || 'Location unassigned'}</span>
                      </p>
                    </div>
                  </div>

                  {s ? (
                    <div className="flex items-center gap-4 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Today's Sales</span>
                        <span className="font-black text-emerald-600 dark:text-emerald-400">
                          ₹{s.todaySales.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Month Sales</span>
                        <span className="font-black text-slate-900 dark:text-white">
                          ₹{s.monthSales.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Orders</span>
                        <span className="font-black text-slate-900 dark:text-white">
                          {s.totalOrders}
                        </span>
                      </div>
                      <button
                        onClick={() => onSelectBranch(branch._id)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold"
                      >
                        View Store &rarr;
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-rose-500 font-bold">Store Offline</span>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(sharePct, 2)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cross-Branch Recent Orders Stream */}
      {data?.recentNetworkOrders && data.recentNetworkOrders.length > 0 && (
        <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-lg">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-500" /> Recent Laundry Activity Across Chain
            </h3>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.recentNetworkOrders.map((ord: any, idx) => (
              <div
                key={ord._id || idx}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-black uppercase">
                    {ord.branchName}
                  </span>
                  <div>
                    <span className="font-black text-xs text-slate-900 dark:text-white">
                      #{ord.orderNumber}
                    </span>
                    <span className="text-xs text-slate-500 ml-1.5">
                      • {ord.customerSnapshot?.name || 'Customer'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {ord.status}
                  </span>
                  <span className="text-xs font-black text-slate-900 dark:text-white">
                    ₹{(ord.totalAmount || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
