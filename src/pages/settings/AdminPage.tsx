// Dedicated Admin Page Component with Administrative Authentication Gate (P0 Security)
// Requires valid Admin Master or Reseller session token before rendering AdminDashboard
// Strictly ASCII comments only

import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { AdminLayout } from '../../layouts/AdminLayout';
import { AdminDashboard } from '../../components/admin/AdminDashboard';
import { AdminLoginView } from '../../components/admin/AdminLoginView';
import { useNavigation } from '../../context/NavigationContext';
import { AdminService, type AdminAuthSession } from '../../services/adminService';

export const AdminPage: React.FC = () => {
  const { navigateTo } = useNavigation();
  const [authSession, setAuthSession] = useState<AdminAuthSession | null>(() =>
    AdminService.getAdminAuthSession()
  );
  const [isVerifying, setIsVerifying] = useState<boolean>(() => Boolean(AdminService.getAdminAuthSession()));

  useEffect(() => {
    let active = true;
    const existing = AdminService.getAdminAuthSession();
    if (existing) {
      AdminService.verifyAdminSession()
        .then((verified) => {
          if (active) setAuthSession(verified);
        })
        .finally(() => {
          if (active) setIsVerifying(false);
        });
    }

    const handleUnauthorized = () => {
      if (active) setAuthSession(null);
    };
    window.addEventListener('mastertv_admin_unauthorized', handleUnauthorized);
    return () => {
      active = false;
      window.removeEventListener('mastertv_admin_unauthorized', handleUnauthorized);
    };
  }, []);

  const handleLogoutAdmin = async () => {
    await AdminService.logoutAdmin();
    setAuthSession(null);
  };

  if (isVerifying) {
    return (
      <AdminLayout>
        <div className="min-h-screen w-full flex flex-col items-center justify-center gap-3 text-[#94A3B8]">
          <Loader2 className="w-7 h-7 text-[#009DFF] animate-spin" />
          <span className="text-xs font-semibold">Validando sessao administrativa...</span>
        </div>
      </AdminLayout>
    );
  }

  if (!authSession) {
    return (
      <AdminLayout>
        <AdminLoginView
          onLoginSuccess={(session) => setAuthSession(session)}
          onBackToPlayer={() => navigateTo('player')}
        />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <AdminDashboard
        onBackToPlayer={() => navigateTo('player')}
        authSession={authSession}
        onLogoutAdmin={handleLogoutAdmin}
      />
    </AdminLayout>
  );
};
