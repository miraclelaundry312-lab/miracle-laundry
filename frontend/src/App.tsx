import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { BranchProvider, useBranch } from './context/BranchContext';

import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { BottomNav } from './components/layout/BottomNav';

import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { OrdersPage } from './pages/OrdersPage';
import { CreateOrderPage } from './pages/CreateOrderPage';
import { CustomersPage } from './pages/CustomersPage';
import { ServicesPage } from './pages/ServicesPage';
import { ItemsPage } from './pages/ItemsPage';
import { GarmentCategoriesPage } from './pages/GarmentCategoriesPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { PublicReceiptPage } from './pages/PublicReceiptPage';
import { LandingWebsitePage } from './pages/LandingWebsitePage';
import { AccountsPage } from './pages/AccountsPage';
import { StaffPage } from './pages/StaffPage';
import { MachinePage } from './pages/MachinePage';
import { DeveloperBranchSetupPage } from './pages/DeveloperBranchSetupPage';
import { NotFoundPage } from './pages/NotFoundPage';

const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState<boolean>(
    () => localStorage.getItem('sidebar_collapsed') === 'true'
  );

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('sidebar_collapsed', String(next));
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-400">Loading Miracle Laundry POS...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Desktop Sidebar */}
      <Sidebar isCollapsed={isSidebarCollapsed} onToggleCollapse={toggleSidebar} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header isSidebarCollapsed={isSidebarCollapsed} onToggleSidebar={toggleSidebar} />

        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>

        {/* Mobile Bottom Bar */}
        <BottomNav />
      </div>
    </div>
  );
};

// Wrapper to activate Admin Mode (Multi-Branch Overview & Broadcast Tools)
const AdminRouteWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { setIsAdminMode } = useBranch();
  React.useEffect(() => {
    setIsAdminMode(true);
  }, [setIsAdminMode]);
  return <>{children}</>;
};

// Wrapper to ensure Single-Branch POS Mode (Hides Multi-Branch Switcher)
const BranchRouteWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { setIsAdminMode } = useBranch();
  React.useEffect(() => {
    setIsAdminMode(false);
  }, [setIsAdminMode]);
  return <>{children}</>;
};

export const AppContent: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/receipt/:orderNumber" element={<PublicReceiptPage />} />
      <Route path="/receipt/*" element={<PublicReceiptPage />} />
      <Route path="/receipt" element={<PublicReceiptPage />} />
      <Route path="/index.html" element={<PublicReceiptPage />} />

      {/* Local Store Branch Access Link (Single Store POS) */}
      <Route
        path="/dashboard"
        element={
          <ProtectedLayout>
            <BranchRouteWrapper>
              <DashboardPage />
            </BranchRouteWrapper>
          </ProtectedLayout>
        }
      />

      {/* Central Admin Access Links (Multi-Branch Chain Overview & Branch Switcher) */}
      <Route
        path="/admin"
        element={
          <ProtectedLayout>
            <AdminRouteWrapper>
              <DashboardPage />
            </AdminRouteWrapper>
          </ProtectedLayout>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedLayout>
            <AdminRouteWrapper>
              <DashboardPage />
            </AdminRouteWrapper>
          </ProtectedLayout>
        }
      />

      <Route
        path="/orders"
        element={
          <ProtectedLayout>
            <OrdersPage />
          </ProtectedLayout>
        }
      />

      <Route
        path="/orders/new"
        element={
          <ProtectedLayout>
            <CreateOrderPage />
          </ProtectedLayout>
        }
      />

      <Route
        path="/accounts"
        element={
          <ProtectedLayout>
            <AccountsPage />
          </ProtectedLayout>
        }
      />

      <Route
        path="/customers"
        element={
          <ProtectedLayout>
            <CustomersPage />
          </ProtectedLayout>
        }
      />

      <Route
        path="/staff"
        element={
          <ProtectedLayout>
            <StaffPage />
          </ProtectedLayout>
        }
      />

      <Route
        path="/machines"
        element={
          <ProtectedLayout>
            <MachinePage />
          </ProtectedLayout>
        }
      />

      <Route
        path="/services"
        element={
          <ProtectedLayout>
            <ServicesPage />
          </ProtectedLayout>
        }
      />

      <Route
        path="/items"
        element={
          <ProtectedLayout>
            <ItemsPage />
          </ProtectedLayout>
        }
      />

      <Route
        path="/categories"
        element={
          <ProtectedLayout>
            <GarmentCategoriesPage />
          </ProtectedLayout>
        }
      />

      <Route
        path="/reports"
        element={
          <ProtectedLayout>
            <ReportsPage />
          </ProtectedLayout>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedLayout>
            <SettingsPage />
          </ProtectedLayout>
        }
      />

      {/* Client Multi-Branch Admin Portal Link Aliases (Redirect to /admin) */}
      <Route path="/admin-portal" element={<Navigate to="/admin" replace />} />
      <Route path="/hq" element={<Navigate to="/admin" replace />} />
      <Route path="/master-admin" element={<Navigate to="/admin" replace />} />
      <Route path="/super-admin" element={<Navigate to="/admin" replace />} />

      {/* Secret Developer Branch Infrastructure & Render Setup Page (Direct Link Only) */}
      <Route
        path="/admin/network-setup"
        element={
          <ProtectedLayout>
            <DeveloperBranchSetupPage />
          </ProtectedLayout>
        }
      />
      <Route path="/dev-branches" element={<Navigate to="/admin/network-setup" replace />} />

      <Route path="/" element={<LandingWebsitePage />} />
      <Route path="/website" element={<LandingWebsitePage />} />
      <Route
        path="*"
        element={
          <ProtectedLayout>
            <NotFoundPage />
          </ProtectedLayout>
        }
      />
    </Routes>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BranchProvider>
          <ToastProvider>
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
          </ToastProvider>
        </BranchProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
