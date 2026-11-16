import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  fetchSettings,
  updateSettingsApi,
  clearAllDataApi,
  downloadMasterExcelBackupApi,
  restoreMasterExcelBackupApi,
  importOldAppOrdersJsonApi,
} from '../services/api';
import { useToast } from '../context/ToastContext';
import { Setting } from '../types';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { Settings, Store, Receipt, CheckCircle, Save, Trash2, Upload, X, FileSpreadsheet, Download, UploadCloud, CheckCircle2, FileJson, Image as ImageIcon, QrCode } from 'lucide-react';

// Client-side image compressor for lightweight, fast 0ms storage in MongoDB
const processAndCompressImage = (file: File, maxWidth = 600, maxHeight = 600): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.90));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
};

export const SettingsPage: React.FC = () => {
  const { showToast } = useToast();
  const [setting, setSetting] = useState<Setting>({
    shopName: 'Miracle Laundry',
    shopTagline: 'Laundry & Dry Cleaning Live Studio',
    logoUrl: '/logo.jpg',
    phone: '+91 98765 43210',
    email: 'contact@miraclelaundry.com',
    address: '123 Sparkle Avenue, Suite 4B, Commercial Hub',
    gstNumber: '27AABCU9603R1ZM',
    gstPercentage: 18,
    currencySymbol: '₹',
    currencyCode: 'INR',
    invoicePrefix: 'ORD-',
    termsAndConditions: 'Items not collected within 30 days are subject to storage charges.',
  });

  const [activeTab, setActiveTab] = useState<'shop' | 'invoice' | 'backup'>('shop');
  const [isSaved, setIsSaved] = useState(false);

  // Backup & Restore state
  const [isExporting, setIsExporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backupMsg, setBackupMsg] = useState('');
  const [restoreSummary, setRestoreSummary] = useState<any>(null);

  // Old Software JSON Importer state
  const [jsonPasteText, setJsonPasteText] = useState('');
  const [isImportingJson, setIsImportingJson] = useState(false);

  const handleImportOldJson = async () => {
    if (!jsonPasteText.trim()) return;
    setIsImportingJson(true);
    setBackupMsg('');
    setRestoreSummary(null);
    try {
      let parsed = JSON.parse(jsonPasteText.trim());
      const res = await importOldAppOrdersJsonApi(parsed);
      if (res.success) {
        setRestoreSummary(res.summary);
        setBackupMsg(res.message || 'Successfully imported all past orders and customers!');
        setJsonPasteText('');
      } else {
        alert(res.message || 'Failed to import JSON data');
      }
    } catch (err: any) {
      alert('Invalid JSON format: ' + err.message);
    } finally {
      setIsImportingJson(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchSettings();
        if (res.success && res.setting) {
          setSetting(res.setting);
        }
      } catch (err) {
        console.error('Failed to load settings', err);
      }
    };
    load();
  }, []);

  const [isSaving, setIsSaving] = useState(false);

  const handleSaveSettings = async (e: React.FormEvent, source: 'shop' | 'invoice') => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await updateSettingsApi(setting);
      if (res && res.success) {
        if (res.setting) {
          setSetting(res.setting);
        }
        setIsSaved(true);
        showToast(
          source === 'shop'
            ? '✅ Shop profile updated successfully!'
            : '✅ Invoice preferences & QR code updated successfully!',
          'success'
        );
        setTimeout(() => setIsSaved(false), 3000);
      } else {
        throw new Error(res?.message || 'Failed to update settings');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const [showResetModal, setShowResetModal] = useState(false);

  const confirmResetAllData = async () => {
    setShowResetModal(false);
    try {
      await clearAllDataApi();
      showToast('✅ All data cleared successfully!', 'info');
      window.location.reload();
    } catch (err: any) {
      console.error('Failed to reset data', err);
    }
  };

  const handleDownloadBackup = async () => {
    setIsExporting(true);
    setBackupMsg('');
    try {
      const res = await downloadMasterExcelBackupApi();
      if (res.success) {
        setBackupMsg('Excel Master Backup downloaded successfully!');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to download backup');
    } finally {
      setIsExporting(false);
    }
  };

  const handleRestoreBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsRestoring(true);
    setBackupMsg('');
    setRestoreSummary(null);
    try {
      const res = await restoreMasterExcelBackupApi(file);
      if (res.success) {
        setRestoreSummary(res.summary);
        setBackupMsg(res.message || 'Data restored successfully from Excel!');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to restore backup from file');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-brand-600" /> Shop Settings & Configuration
        </h1>
        <p className="hidden sm:block text-xs text-slate-500">
          Manage shop branding, logo, tax rules, invoice formatting, admin security & data backups
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('shop')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'shop'
              ? 'bg-brand-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Store className="w-4 h-4" /> Shop Profile
        </button>

        <button
          onClick={() => setActiveTab('invoice')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'invoice'
              ? 'bg-brand-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Receipt className="w-4 h-4" /> Invoice & Taxes
        </button>

        <button
          onClick={() => setActiveTab('backup')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'backup'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" /> Excel Backup & Restore
        </button>
      </div>

      {isSaved && (
        <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          <span>Shop configuration updated successfully!</span>
        </div>
      )}

      {/* Shop Profile Tab */}
      {activeTab === 'shop' && (
        <form onSubmit={(e) => handleSaveSettings(e, 'shop')} className="glass-card p-6 space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
              Store Identity & Contact Details
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              These details represent your laundry business across the POS, customer bills, and online store.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Shop Name *
              </label>
              <input
                type="text"
                required
                value={setting.shopName}
                onChange={(e) => setSetting({ ...setting, shopName: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-brand-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Shop Tagline
              </label>
              <input
                type="text"
                value={setting.shopTagline || ''}
                onChange={(e) => setSetting({ ...setting, shopTagline: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Store Phone Number *
              </label>
              <input
                type="text"
                required
                value={setting.phone}
                onChange={(e) => setSetting({ ...setting, phone: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-brand-500 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Support Email *
              </label>
              <input
                type="email"
                required
                value={setting.email}
                onChange={(e) => setSetting({ ...setting, email: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Shop Address *
            </label>
            <input
              type="text"
              required
              value={setting.address}
              onChange={(e) => setSetting({ ...setting, address: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-brand-500"
            />
          </div>

          {/* Store Logo Section with Visual Preview & Upload */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Shop Brand Logo
            </label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="w-20 h-20 bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm shrink-0 flex items-center justify-center overflow-hidden">
                <img
                  src={setting.logoUrl || '/logo.jpg'}
                  alt="Shop Logo"
                  className="w-full h-full object-contain rounded-xl"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/logo.jpg';
                  }}
                />
              </div>

              <div className="flex-1 space-y-2 w-full">
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  This logo appears in the app navigation, login screen, digital receipts, and printable bills.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-extrabold cursor-pointer inline-flex items-center gap-1.5 shadow-xs transition-all active:scale-95">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Logo Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const compressed = await processAndCompressImage(file, 400, 400);
                            setSetting({ ...setting, logoUrl: compressed });
                            showToast('Logo image loaded! Click Save to apply.', 'info');
                          } catch (err) {
                            showToast('Failed to read image', 'error');
                          }
                        }
                      }}
                    />
                  </label>

                  <span className="text-xs text-slate-400 font-bold">OR</span>

                  <input
                    type="text"
                    placeholder="Enter image URL (/logo.jpg or web link)..."
                    value={setting.logoUrl || ''}
                    onChange={(e) => setSetting({ ...setting, logoUrl: e.target.value })}
                    className="flex-1 min-w-[200px] px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md flex items-center gap-2 active:scale-95 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save Shop Profile'}
            </button>

            <button
              type="button"
              onClick={() => setShowResetModal(true)}
              className="px-4 py-2.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white dark:bg-rose-950/50 dark:text-rose-400 font-extrabold text-xs transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" /> Reset All Orders & Customers
            </button>
          </div>
        </form>
      )}

      {/* Invoice & Tax Settings */}
      {activeTab === 'invoice' && (
        <form onSubmit={(e) => handleSaveSettings(e, 'invoice')} className="glass-card p-6 space-y-5">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
              Invoice Formatting & Billing Rules
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Configure bill numbering, GST tax calculations, payment QR codes, and printed terms.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Currency Symbol
              </label>
              <input
                type="text"
                value={setting.currencySymbol}
                onChange={(e) => setSetting({ ...setting, currencySymbol: e.target.value })}
                placeholder="₹ or $"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Invoice Prefix
              </label>
              <input
                type="text"
                value={setting.invoicePrefix}
                onChange={(e) => setSetting({ ...setting, invoicePrefix: e.target.value })}
                placeholder="ORD- or INV-"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                GST / Tax Rate (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={setting.gstPercentage}
                onChange={(e) => setSetting({ ...setting, gstPercentage: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                GSTIN / Tax ID (Optional)
              </label>
              <input
                type="text"
                value={setting.gstNumber || ''}
                onChange={(e) => setSetting({ ...setting, gstNumber: e.target.value })}
                placeholder="e.g. 27AAAAA0000A1Z5"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none font-mono"
              />
            </div>
          </div>

          {/* Payment & Scan-to-Pay QR Code Setup */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div>
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-brand-700 dark:text-brand-400 flex items-center gap-1.5">
                <QrCode className="w-4 h-4" /> Customer Invoice Scan & Pay QR Code
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Choose how customers pay you on bills: upload your official shop GPay/PhonePe standee QR, or enter your UPI ID for an automatic QR code.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Shop UPI ID / VPA
                </label>
                <input
                  type="text"
                  value={setting.upiId || ''}
                  onChange={(e) => setSetting({ ...setting, upiId: e.target.value })}
                  placeholder="e.g. miraclelaundry@okaxis or 9876543210@paytm"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none font-bold text-brand-600"
                />
                <p className="text-[10px] text-slate-400 mt-1">Used to generate dynamic scan-and-pay UPI QR code.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Mobile (GPay / PhonePe)
                </label>
                <input
                  type="text"
                  value={setting.gpayNumber || ''}
                  onChange={(e) => setSetting({ ...setting, gpayNumber: e.target.value })}
                  placeholder={setting.phone ? `Defaults to Store Phone (${setting.phone})` : 'e.g. 9876543210'}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none font-semibold"
                />
                <p className="text-[10px] text-slate-400 mt-1">Printed on bill for GPay/PhonePe number transfers (optional).</p>
              </div>
            </div>

            {/* QR Code Upload & Live Preview Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* QR Preview Display */}
              <div className="relative shrink-0 flex flex-col items-center">
                <div className="w-28 h-28 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-300 dark:border-slate-700 shadow-xs flex items-center justify-center overflow-hidden">
                  {setting.paymentQrUrl ? (
                    <img
                      src={setting.paymentQrUrl}
                      alt="Custom Payment QR Standee"
                      className="w-full h-full object-contain rounded-xl"
                    />
                  ) : (
                    <QRCodeSVG
                      value={`upi://pay?pa=${encodeURIComponent(setting.upiId || 'miraclelaundry@okaxis')}&pn=${encodeURIComponent(setting.shopName || 'Miracle Laundry')}&cu=INR`}
                      size={96}
                      level="M"
                      includeMargin={false}
                    />
                  )}
                </div>

                {setting.paymentQrUrl ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSetting({ ...setting, paymentQrUrl: '' });
                      showToast('Custom QR removed. Switched to Dynamic UPI QR.', 'info');
                    }}
                    className="mt-1.5 text-[10px] text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <X className="w-3 h-3" /> Remove Custom QR
                  </button>
                ) : (
                  <span className="mt-1.5 text-[10px] font-bold text-brand-600 dark:text-brand-400">
                    Auto-generated UPI QR
                  </span>
                )}
              </div>

              {/* Upload Controls */}
              <div className="flex-1 space-y-2 w-full">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>
                    {setting.paymentQrUrl
                      ? 'Live on Bills: Uploaded Custom Standee QR Image'
                      : 'Live on Bills: Automatic UPI QR (from your UPI ID)'}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Upload an image of your store's printed GPay / PhonePe / BharatPe standee to display it verbatim on customer invoices.
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <label className="px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-extrabold cursor-pointer inline-flex items-center gap-1.5 shadow-xs transition-all active:scale-95">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Standee QR Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const compressed = await processAndCompressImage(file, 500, 500);
                            setSetting({ ...setting, paymentQrUrl: compressed });
                            showToast('Standee QR loaded! Click Save Invoice Settings below.', 'info');
                          } catch (err) {
                            showToast('Failed to process image', 'error');
                          }
                        }
                      }}
                    />
                  </label>

                  <span className="text-xs text-slate-400 font-bold">OR</span>

                  <input
                    type="text"
                    placeholder="Paste image URL directly..."
                    value={setting.paymentQrUrl || ''}
                    onChange={(e) => setSetting({ ...setting, paymentQrUrl: e.target.value })}
                    className="flex-1 min-w-[200px] px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Receipt Terms & Conditions */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Receipt & Invoice Terms & Conditions
            </label>
            <p className="text-[11px] text-slate-500">
              These terms appear at the bottom of printed and digital customer receipts. Each new line will be printed as a separate term.
            </p>
            <textarea
              rows={4}
              value={setting.termsAndConditions || ''}
              onChange={(e) => setSetting({ ...setting, termsAndConditions: e.target.value })}
              placeholder="1. Please check garments at the time of delivery.&#10;2. Clothes uncollected after 30 days are subject to storage charges."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none leading-relaxed focus:border-brand-500 font-medium"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md flex items-center gap-2 active:scale-95 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save Invoice Settings'}
            </button>
          </div>
        </form>
      )}

      {/* Excel Backup & Restore Tab */}
      {activeTab === 'backup' && (
        <div className="space-y-6">
          {backupMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{backupMsg}</span>
            </div>
          )}

          {restoreSummary && (
            <div className="p-4 rounded-2xl bg-brand-50 dark:bg-brand-950/50 border border-brand-200 dark:border-brand-800 text-xs space-y-1.5">
              <h4 className="font-extrabold text-brand-900 dark:text-brand-200 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-brand-600" /> Restoration Completed Summary:
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-semibold text-slate-700 dark:text-slate-300">
                <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 block">Orders</span>
                  <span className="text-sm font-black text-brand-600">{restoreSummary.restoredOrdersCount || 0}</span>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 block">Customers</span>
                  <span className="text-sm font-black text-indigo-600">{restoreSummary.restoredCustomersCount || 0}</span>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 block">Payments</span>
                  <span className="text-sm font-black text-emerald-600">{restoreSummary.restoredPaymentsCount || 0}</span>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 block">Expenses</span>
                  <span className="text-sm font-black text-amber-600">{restoreSummary.restoredExpensesCount || 0}</span>
                </div>
              </div>
            </div>
          )}

          {/* CARD 1: EXPORT BACKUP */}
          <div className="glass-card p-6 space-y-4 border-l-4 border-l-emerald-500">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  <span>Download Master Excel Backup (.xlsx)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Export all your shop's Orders, Customer Directory, Payment Receipts, and Expenses into a multi-sheet Excel file. Keep a safe copy on your PC or Google Drive.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-extrabold text-[10px]">
                Recommended Daily
              </span>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={isExporting}
                onClick={handleDownloadBackup}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-black shadow-md flex items-center gap-2 active:scale-95 transition-all"
              >
                <Download className={`w-4 h-4 ${isExporting ? 'animate-bounce' : ''}`} />
                <span>{isExporting ? 'Generating Excel File...' : 'Download Master Backup (.xlsx)'}</span>
              </button>
              <span className="text-[11px] text-slate-400 font-medium">
                Includes Orders, Customers, Payments, & Expenses sheets
              </span>
            </div>
          </div>

          {/* CARD 2: RESTORE BACKUP */}
          <div className="glass-card p-6 space-y-4 border-l-4 border-l-brand-500">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <UploadCloud className="w-5 h-5 text-brand-600" />
                  <span>Emergency Restore Database from Excel (.xlsx)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  If your computer crashed or server database was reset, upload your previously saved <code className="text-brand-600 bg-brand-50 px-1 py-0.5 rounded font-mono">Laundry_Master_Backup.xlsx</code> file to automatically restore all orders, customers, and expenses in seconds.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <label className="px-5 py-3 rounded-2xl border-2 border-dashed border-brand-300 dark:border-brand-700 hover:border-brand-500 bg-brand-50/50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300 text-xs font-black cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-2 transition-all">
                <Upload className={`w-5 h-5 ${isRestoring ? 'animate-spin' : ''}`} />
                <span>{isRestoring ? 'Parsing & Restoring Data...' : 'Select & Upload Excel Backup File (.xlsx)'}</span>
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  disabled={isRestoring}
                  onChange={handleRestoreBackup}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* CARD 2.5: IMPORT OLD SOFTWARE JSON */}
          <div className="glass-card p-6 space-y-4 border-l-4 border-l-indigo-500">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <FileJson className="w-5 h-5 text-indigo-600" />
                  <span>Import Old Software JSON Payload (410+ Past Orders & Customers)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Paste the JSON object copied from your old app's DevTools Network tab (containing all 410+ past orders and customer details) to automatically migrate them into MongoDB!
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <textarea
                rows={6}
                value={jsonPasteText}
                onChange={(e) => setJsonPasteText(e.target.value)}
                placeholder='Paste raw JSON here e.g. {"status":"success", "orders": [...]} or [{"id":"411", "customer_name":"Surya Kumar", ...}]'
                className="w-full p-3 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none leading-relaxed"
              />

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={isImportingJson || !jsonPasteText.trim()}
                  onClick={handleImportOldJson}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-black shadow-md flex items-center gap-2 active:scale-95 transition-all"
                >
                  <UploadCloud className={`w-4 h-4 ${isImportingJson ? 'animate-spin' : ''}`} />
                  <span>{isImportingJson ? 'Importing Past Orders & Customers...' : 'Start Automatic JSON Import'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* CARD 3: RESET ALL DATA */}
          <div className="glass-card p-6 space-y-3 border-l-4 border-l-rose-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-rose-500" /> Reset All Database Records
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Wipe all customer profiles, orders, invoices, and expense records to test completely from scratch.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowResetModal(true)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm"
              >
                Reset Database
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Database Confirmation Modal */}
      <ConfirmModal
        isOpen={showResetModal}
        title="Reset All Shop Database"
        message="Are you sure you want to delete ALL existing customers, orders, invoices, and expenses? This will wipe all data to test 100% from scratch."
        confirmText="Wipe & Reset Everything"
        variant="danger"
        onConfirm={confirmResetAllData}
        onCancel={() => setShowResetModal(false)}
      />
    </div>
  );
};
