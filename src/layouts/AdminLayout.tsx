// Dedicated Full-Width Admin Layout Shell
// Delegates navigation header and collapsible sidebar to AdminDashboard
// Strictly ASCII comments only

import React from 'react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen w-full bg-[#070B16] text-[#F8FAFC] font-sans overflow-x-hidden">
      {children}
    </div>
  );
};
