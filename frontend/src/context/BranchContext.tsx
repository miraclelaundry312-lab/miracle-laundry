import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchMasterAdminDashboardApi } from '../services/api';
import { MasterDashboardData, BranchDataNode } from '../types';
import { useAuth } from './AuthContext';

interface BranchContextType {
  branches: BranchDataNode[];
  selectedBranchId: string;
  setSelectedBranchId: (id: string) => void;
  selectedBranch: BranchDataNode | null;
  masterData: MasterDashboardData | null;
  isLoading: boolean;
  isAdminMode: boolean;
  setIsAdminMode: (val: boolean) => void;
  refreshBranchData: () => Promise<void>;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export const BranchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [branches, setBranches] = useState<BranchDataNode[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  const [masterData, setMasterData] = useState<MasterDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Admin Mode detection: true if path starts with /admin or was explicitly set
  const [isAdminMode, setIsAdminModeState] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path.startsWith('/admin') || path.startsWith('/super-admin') || path.startsWith('/hq')) {
        return true;
      }
      return sessionStorage.getItem('ml_admin_mode') === 'true';
    }
    return false;
  });

  const setIsAdminMode = (val: boolean) => {
    setIsAdminModeState(val);
    if (typeof window !== 'undefined') {
      if (val) {
        sessionStorage.setItem('ml_admin_mode', 'true');
      } else {
        sessionStorage.removeItem('ml_admin_mode');
      }
    }
  };

  const refreshBranchData = async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const res = await fetchMasterAdminDashboardApi();
      if (res && res.success) {
        setMasterData(res);
        setBranches(res.branchesData || []);
      }
    } catch (err) {
      console.error('[BranchContext] Error fetching master dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshBranchData();
    }
  }, [isAuthenticated]);

  const selectedBranch =
    selectedBranchId === 'all'
      ? null
      : branches.find((b) => b._id === selectedBranchId) || null;

  return (
    <BranchContext.Provider
      value={{
        branches,
        selectedBranchId,
        setSelectedBranchId,
        selectedBranch,
        masterData,
        isLoading,
        isAdminMode,
        setIsAdminMode,
        refreshBranchData,
      }}
    >
      {children}
    </BranchContext.Provider>
  );
};

export const useBranch = () => {
  const context = useContext(BranchContext);
  if (!context) {
    throw new Error('useBranch must be used within a BranchProvider');
  }
  return context;
};
