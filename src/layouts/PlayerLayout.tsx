// Fullscreen Cinema Player Layout for Live TV and VOD playback
// Strictly ASCII comments only

import React, { useEffect } from 'react';
import { useNavigation } from '../context/NavigationContext';

interface PlayerLayoutProps {
  children: React.ReactNode;
  onBack?: () => void;
}

export const PlayerLayout: React.FC<PlayerLayoutProps> = ({ children, onBack }) => {
  const { goBack } = useNavigation();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'GoBack' || e.keyCode === 10009) {
        if (onBack) {
          onBack();
        } else {
          goBack();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack, goBack]);

  return (
    <div className="fixed inset-0 w-screen h-[100dvh] bg-[#000000] text-slate-100 overflow-hidden select-none z-50">
      {children}
    </div>
  );
};

