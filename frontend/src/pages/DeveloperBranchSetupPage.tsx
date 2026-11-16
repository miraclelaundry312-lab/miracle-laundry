import React, { useState, useEffect } from 'react';
import {
  fetchMasterBranchesApi,
  addMasterBranchApi,
  updateMasterBranchApi,
  deleteMasterBranchApi,
  testBranchConnectionApi,
} from '../services/api';
import { BranchRegistry } from '../types';
import { useToast } from '../context/ToastContext';
import { useBranch } from '../context/BranchContext';
import {
  Server,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Zap,
  MapPin,
  Building2,
  ArrowUpRight,
  ShieldAlert,
  X,
  Lock,
} from 'lucide-react';

export const DeveloperBranchSetupPage: React.FC = () => {
  const { showToast } = useToast();
  const { refreshBranchData } = useBranch();
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState<BranchRegistry[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<BranchRegistry | null>(null);
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formApiKey, setFormApiKey] = useState('miracle-secret-key-2026');
  const [formLocation, setFormLocation] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formManager, setFormManager] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Live Test Connection State
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{
    tested: boolean;
    success: boolean;
    message: string;
    pingMs?: number;
    branchName?: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Ping statuses map
  const [pingStatuses, setPingStatuses] = useState<Record<string, { status: 'checking' | 'online' | 'offline'; pingMs?: number; error?: string }>>({});

  const loadBranches = async () => {
    setLoading(true);
    try {
      const res = await fetchMasterBranchesApi();
      if (res && res.success) {
        setBranches(res.branches || []);
        // Auto-ping branches
        pingAll(res.branches || []);
        refreshBranchData();
      } else {
        showToast(res.message || 'Failed to fetch branch list', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error loading branches', 'error');
    } finally {
      setLoading(false);
    }
  };

  const pingAll = async (branchList: BranchRegistry[]) => {
    const statuses: Record<string, any> = {};
    branchList.forEach((b) => {
      statuses[b._id] = { status: 'checking' };
    });
    setPingStatuses({ ...statuses });

    for (const b of branchList) {
      try {
        const res = await testBranchConnectionApi(b.url, b.apiKey || 'miracle-secret-key-2026');
        setPingStatuses((prev) => ({
          ...prev,
          [b._id]: {
            status: res.success ? 'online' : 'offline',
            pingMs: res.pingMs,
            error: res.message,
          },
        }));
      } catch (err: any) {
        setPingStatuses((prev) => ({
          ...prev,
          [b._id]: { status: 'offline', error: err.message },
        }));
      }
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  const handleOpenAddModal = () => {
    setEditingBranch(null);
    setFormName('');
    setFormCode(`ML-0${branches.length + 1}`);
    setFormUrl('');
    setFormApiKey('miracle-secret-key-2026');
    setFormLocation('');
    setFormPhone('');
    setFormManager('');
    setFormNotes('');
    setTestResult(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (branch: BranchRegistry) => {
    setEditingBranch(branch);
    setFormName(branch.name);
    setFormCode(branch.code);
    setFormUrl(branch.url);
    setFormApiKey(branch.apiKey || 'miracle-secret-key-2026');
    setFormLocation(branch.location || '');
    setFormPhone(branch.phone || '');
    setFormManager(branch.managerName || '');
    setFormNotes(branch.notes || '');
    setTestResult(null);
    setIsModalOpen(true);
  };

  const handleTestConnection = async () => {
    if (!formUrl.trim()) {
      showToast('Please enter the Branch Render URL first', 'error');
      return;
    }

    setTestingConnection(true);
    setTestResult(null);
    try {
      const res = await testBranchConnectionApi(formUrl.trim(), formApiKey.trim());
      setTestResult({
        tested: true,
        success: Boolean(res.success),
        message: res.message || (res.success ? 'Connected successfully' : 'Connection failed'),
        pingMs: res.pingMs,
        branchName: res.branchName,
      });
      if (res.success) {
        showToast(res.message || 'Branch connection verified!', 'success');
      } else {
        showToast(res.message || 'Connection failed', 'error');
      }
    } catch (err: any) {
      setTestResult({
        tested: true,
        success: false,
        message: err.message || 'Failed to ping branch URL',
      });
      showToast(err.message || 'Failed to test connection', 'error');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSaveBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formUrl.trim()) {
      showToast('Branch Name and URL are required', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: formName.trim(),
        code: formCode.trim().toUpperCase(),
        url: formUrl.trim(),
        apiKey: formApiKey.trim(),
        location: formLocation.trim(),
        phone: formPhone.trim(),
        managerName: formManager.trim(),
        notes: formNotes.trim(),
      };

      if (editingBranch) {
        const res = await updateMasterBranchApi(editingBranch._id, payload);
        if (res.success) {
          showToast(`✅ "${formName}" updated successfully!`, 'success');
          setIsModalOpen(false);
          loadBranches();
        } else {
          showToast(res.message || 'Failed to update branch', 'error');
        }
      } else {
        const res = await addMasterBranchApi(payload);
        if (res.success) {
          showToast(`🎉 "${formName}" registered successfully!`, 'success');
          setIsModalOpen(false);
          loadBranches();
        } else {
          showToast(res.message || 'Failed to register branch', 'error');
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Error saving branch', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBranch = async (branch: BranchRegistry) => {
    if (branch.isSelf) {
      showToast('Primary HQ Branch cannot be deleted', 'error');
      return;
    }

    if (!confirm(`Are you sure you want to delete branch "${branch.name}" from the network registry?`)) {
      return;
    }

    try {
      const res = await deleteMasterBranchApi(branch._id);
      if (res.success) {
        showToast(`Branch "${branch.name}" deleted from registry`, 'info');
        loadBranches();
      } else {
        showToast(res.message || 'Failed to delete branch', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error deleting branch', 'error');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Developer Notice Banner */}
      <div className="p-4 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-amber-500 shrink-0" />
          <span>
            <strong>Internal Developer Page:</strong> This page is private and not linked anywhere in the regular app navigation. Only accessible directly via this URL.
          </span>
        </div>
        <span className="font-mono text-[11px] opacity-75">/admin/network-setup</span>
      </div>

      {/* Top Header */}
      <div className="glass-card p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-200 dark:border-slate-800 shadow-xl">
        <div>
          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <Server className="w-4 h-4" /> Multi-Branch Infrastructure Registry
          </span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            Miracle Laundry Branch Connector & Setup
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Register new Render app URLs and MongoDB Atlas branch endpoints to the network
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => pingAll(branches)}
            className="px-3.5 py-2.5 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4 text-emerald-500" />
            <span>Re-Ping All</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-lg shadow-emerald-500/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Branch</span>
          </button>
        </div>
      </div>

      {/* Branch List Table / Cards */}
      <div className="space-y-4">
        {loading ? (
          <div className="glass-card p-12 text-center text-xs font-bold text-slate-500 rounded-3xl">
            Loading registered branches...
          </div>
        ) : branches.length === 0 ? (
          <div className="glass-card p-12 text-center space-y-3 rounded-3xl">
            <Building2 className="w-10 h-10 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No branches registered yet</p>
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
            >
              Add First Branch
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {branches.map((b) => {
              const pingInfo = pingStatuses[b._id];

              return (
                <div
                  key={b._id}
                  className="glass-card rounded-3xl p-5 border border-slate-200 dark:border-slate-800 space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-black text-base text-slate-900 dark:text-white">{b.name}</h3>
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-black uppercase">
                            {b.code}
                          </span>
                          {b.isSelf && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-black uppercase">
                              Primary HQ
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{b.location || 'Location unassigned'}</span>
                        </p>
                      </div>

                      {/* Ping Status */}
                      <div>
                        {pingInfo?.status === 'online' ? (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold flex items-center gap-1.5 border border-emerald-500/30">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Live ({pingInfo.pingMs}ms)
                          </span>
                        ) : pingInfo?.status === 'offline' ? (
                          <span className="px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[11px] font-bold flex items-center gap-1.5 border border-rose-500/30">
                            <span className="w-2 h-2 rounded-full bg-rose-500" />
                            Unreachable
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-[11px] font-bold flex items-center gap-1.5">
                            <RefreshCw className="w-3 h-3 animate-spin text-emerald-500" />
                            Pinging...
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Server URL */}
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1 font-mono text-xs">
                      <div className="flex items-center justify-between text-slate-500 text-[10px]">
                        <span>Render Backend Target URL:</span>
                        <a
                          href={b.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-brand-600 flex items-center gap-0.5 hover:underline"
                        >
                          Visit <ArrowUpRight className="w-3 h-3" />
                        </a>
                      </div>
                      <p className="text-slate-900 dark:text-white font-bold truncate">{b.url}</p>
                    </div>

                    {/* Metadata */}
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Manager:</span>
                        <span className="font-medium text-slate-900 dark:text-white">{b.managerName || '—'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Contact Phone:</span>
                        <span className="font-medium text-slate-900 dark:text-white">{b.phone || '—'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleOpenEditModal(b)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    {!b.isSelf && (
                      <button
                        onClick={() => handleDeleteBranch(b)}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 text-xs font-bold flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-xl w-full bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 bg-gradient-to-r from-emerald-950/30 to-teal-950/20 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-emerald-600" />
                  {editingBranch ? `Edit ${editingBranch.name}` : 'Register New Branch URL'}
                </h3>
                <p className="text-xs text-slate-500">
                  Setup Render target URL & API key for branch
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBranch} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Branch Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Miracle Laundry 2"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Branch Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ML-02"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Render Backend URL <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    required
                    placeholder="https://miraclelaundry-2.onrender.com"
                    value={formUrl}
                    onChange={(e) => {
                      setFormUrl(e.target.value);
                      setTestResult(null);
                    }}
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testingConnection || !formUrl.trim()}
                    className="px-3.5 py-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 text-emerald-800 dark:text-emerald-300 text-xs font-black flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Zap className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin' : ''}`} />
                    <span>{testingConnection ? 'Testing...' : 'Test Ping'}</span>
                  </button>
                </div>
              </div>

              {testResult && (
                <div
                  className={`p-3 rounded-2xl border text-xs flex items-start gap-2.5 ${
                    testResult.success
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                      : 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="font-extrabold">{testResult.message}</p>
                    {testResult.pingMs !== undefined && (
                      <p className="text-[11px] opacity-80 font-mono">Ping: {testResult.pingMs}ms</p>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Master API Secret Key
                </label>
                <input
                  type="text"
                  placeholder="miracle-secret-key-2026"
                  value={formApiKey}
                  onChange={(e) => setFormApiKey(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Store Location / Address
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. T Nagar Branch"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Branch Phone
                  </label>
                  <input
                    type="text"
                    placeholder="+91 98765 00002"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Branch Manager
                </label>
                <input
                  type="text"
                  placeholder="Manager Name"
                  value={formManager}
                  onChange={(e) => setFormManager(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingBranch ? 'Save Changes' : 'Register Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
