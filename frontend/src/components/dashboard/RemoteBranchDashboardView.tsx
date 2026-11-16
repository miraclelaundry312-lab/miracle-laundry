import React from 'react';
import { BranchDataNode } from '../../types';
import {
  MapPin,
  ArrowUpRight,
  Layers,
  ShoppingBag,
  AlertCircle,
} from 'lucide-react';

interface RemoteBranchDashboardViewProps {
  branch: BranchDataNode;
  onBackToAll: () => void;
}

export const RemoteBranchDashboardView: React.FC<RemoteBranchDashboardViewProps> = ({
  branch,
  onBackToAll,
}) => {
  const s = branch.summary;

  return (
    <div className="space-y-6">
      {/* Branch Header Banner */}
      <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-black uppercase">
              {branch.code}
            </span>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              {branch.name}
            </h2>
            {branch.isSelf && (
              <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 text-[10px] font-black uppercase">
                Main Studio HQ
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>{branch.location || 'Location unassigned'}</span>
            {branch.phone && (
              <>
                <span className="opacity-40">•</span>
                <span>Phone: {branch.phone}</span>
              </>
            )}
            {branch.managerName && (
              <>
                <span className="opacity-40">•</span>
                <span>Manager: {branch.managerName}</span>
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onBackToAll}
            className="px-3 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold"
          >
            &larr; View All Branches
          </button>

          <a
            href={branch.url}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
          >
            <span>Open Branch POS</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {s ? (
        <>
          {/* 4 Branch KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Today's Store Sales
              </span>
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                ₹{s.todaySales.toLocaleString('en-IN')}
              </span>
              <p className="text-xs text-slate-400">Collected today</p>
            </div>

            <div className="glass-card p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Current Month Revenue
              </span>
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                ₹{s.monthSales.toLocaleString('en-IN')}
              </span>
              <p className="text-xs text-slate-400">Total this month</p>
            </div>

            <div className="glass-card p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Active Orders In Shop
              </span>
              <span className="text-2xl font-black text-teal-600 dark:text-teal-400">
                {s.activeOrders}
              </span>
              <p className="text-xs text-slate-400">In washing, drying & ironing</p>
            </div>

            <div className="glass-card p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Pending Balance
              </span>
              <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
                ₹{s.pendingBalance.toLocaleString('en-IN')}
              </span>
              <p className="text-xs text-slate-400">Customer dues to collect</p>
            </div>
          </div>

          {/* Operational Status Queues */}
          {s.statusBreakdown && (
            <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-lg">
              <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-500" /> Laundry Processing Status Queues
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                {Object.entries(s.statusBreakdown).map(([st, cnt]) => (
                  <div
                    key={st}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 text-center"
                  >
                    <span className="text-[10px] font-bold text-slate-400 uppercase block truncate">
                      {st}
                    </span>
                    <span className="text-lg font-black text-slate-900 dark:text-white">
                      {cnt}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Branch Recent Orders */}
          {s.recentOrders && s.recentOrders.length > 0 && (
            <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-lg">
              <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-500" /> Recent Orders at {branch.name}
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold">
                      <th className="py-2.5">Order #</th>
                      <th className="py-2.5">Customer</th>
                      <th className="py-2.5">Status</th>
                      <th className="py-2.5">Payment</th>
                      <th className="py-2.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {s.recentOrders.map((ord: any) => (
                      <tr key={ord._id}>
                        <td className="py-3 font-mono font-bold text-slate-900 dark:text-white">
                          #{ord.orderNumber}
                        </td>
                        <td className="py-3 font-medium text-slate-700 dark:text-slate-300">
                          {ord.customerSnapshot?.name || 'Customer'}
                        </td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {ord.status}
                          </span>
                        </td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              ord.paymentStatus === 'Paid'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                            }`}
                          >
                            {ord.paymentStatus}
                          </span>
                        </td>
                        <td className="py-3 text-right font-black text-slate-900 dark:text-white">
                          ₹{(ord.totalAmount || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="p-8 rounded-3xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <p className="text-sm font-bold text-rose-800 dark:text-rose-300">
            Cannot reach {branch.name} server
          </p>
          <p className="text-xs text-rose-600 dark:text-rose-400">
            {branch.error || 'Server did not respond. Verify Render hosting status.'}
          </p>
        </div>
      )}
    </div>
  );
};
