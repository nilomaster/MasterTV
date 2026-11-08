// Dedicated Client Login Page Component
// Strictly ASCII comments only

import React from 'react';
import { LoginView } from '../../components/auth/LoginView';
import { useApp } from '../../context/AppContext';
import { useNavigation } from '../../context/NavigationContext';

export const LoginPage: React.FC = () => {
  const { setClientSession } = useApp();
  const { navigateTo } = useNavigation();

  return (
    <div className="min-h-screen bg-[#07090e] flex flex-col justify-center items-center">
      <LoginView
        onLoginSuccess={(session) => {
          setClientSession(session);
          navigateTo('home');
        }}
        onOpenAdmin={() => navigateTo('admin')}
      />
    </div>
  );
};

