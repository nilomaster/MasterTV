// Dedicated Admin Page Component
// Strictly ASCII comments only

import React from 'react';
import { AdminLayout } from '../../layouts/AdminLayout';
import { AdminDashboard } from '../../components/admin/AdminDashboard';
import { useNavigation } from '../../context/NavigationContext';

export const AdminPage: React.FC = () => {
  const { navigateTo } = useNavigation();

  return (
    <AdminLayout>
      <AdminDashboard onBackToPlayer={() => navigateTo('player')} />
    </AdminLayout>
  );
};

