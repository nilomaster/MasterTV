// Lightweight Layered Animated Kids Background using official Fundo_Kids.png base
// Layers gentle drifting clouds, subtle butterflies, stars and swaying flowers over the scenic backdrop
// Respects prefers-reduced-motion and pauses automatically when tab is hidden
// Strictly ASCII comments only as per project guidelines

import React, { useEffect, useState } from 'react';

export const KidsAnimatedBackground: React.FC = () => {
  const [isTabHidden, setIsTabHidden] = useState<boolean>(false);

  // Pause decorative animations when page is not visible
  useEffect(() => {
    const handleVisibility = () => {
      setIsTabHidden(document.visibilityState === 'hidden');
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 pointer-events-none z-0 overflow-hidden select-none bg-[#0874CB] ${
        isTabHidden ? 'kids-animations-paused' : ''
      }`}
    >
      {/* Official Kids Scenic Backdrop Image */}
      <img
        src="./assets/img/home/fundo_kids.png"
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Subtle Decorative Stars */}
      <svg className="kids-star absolute top-20 left-[14%] w-5 h-5" style={{ animationDelay: '0s' }} viewBox="0 0 24 24" fill="#FFD93D">
        <path d="M12 2l2.6 6.4L21 9.2l-5 4.4 1.5 6.4L12 16.6 6.5 20 8 13.6 3 9.2l6.4-.8z" />
      </svg>
      <svg className="kids-star absolute top-24 left-[46%] w-4 h-4" style={{ animationDelay: '1.8s' }} viewBox="0 0 24 24" fill="#FFFFFF">
        <path d="M12 2l2.6 6.4L21 9.2l-5 4.4 1.5 6.4L12 16.6 6.5 20 8 13.6 3 9.2l6.4-.8z" />
      </svg>
      <svg className="kids-star absolute top-16 right-[30%] w-4 h-4" style={{ animationDelay: '3.2s' }} viewBox="0 0 24 24" fill="#FFD93D">
        <path d="M12 2l2.6 6.4L21 9.2l-5 4.4 1.5 6.4L12 16.6 6.5 20 8 13.6 3 9.2l6.4-.8z" />
      </svg>

      {/* Drifting Fluffy White Clouds */}
      <svg
        className="kids-cloud-slow absolute top-14 left-0 w-40 h-18 opacity-75"
        style={{ animationDelay: '-18s' }}
        viewBox="0 0 180 80"
        fill="#FFFFFF"
      >
        <circle cx="52" cy="48" r="24" />
        <circle cx="84" cy="36" r="30" />
        <circle cx="118" cy="46" r="24" />
        <rect x="48" y="46" width="72" height="26" rx="13" />
      </svg>

      <svg
        className="kids-cloud-medium absolute top-28 left-0 w-28 h-12 opacity-60"
        style={{ animationDelay: '-36s' }}
        viewBox="0 0 180 80"
        fill="#FFFFFF"
      >
        <circle cx="52" cy="48" r="24" />
        <circle cx="86" cy="38" r="28" />
        <circle cx="120" cy="48" r="22" />
        <rect x="50" y="46" width="72" height="24" rx="12" />
      </svg>

      {/* Small Gentle Butterflies */}
      <svg
        className="kids-butterfly hidden md:block absolute top-32 left-[22%] w-7 h-7 opacity-85"
        style={{ animationDelay: '-2s' }}
        viewBox="0 0 32 32"
        fill="none"
      >
        <ellipse cx="10" cy="13" rx="7" ry="6" fill="#FFD93D" />
        <ellipse cx="22" cy="13" rx="7" ry="6" fill="#FFD93D" />
        <ellipse cx="11" cy="21" rx="5" ry="4" fill="#FF70B5" />
        <ellipse cx="21" cy="21" rx="5" ry="4" fill="#FF70B5" />
        <rect x="15" y="10" width="2" height="13" rx="1" fill="#07539A" />
      </svg>

      <svg
        className="kids-butterfly hidden lg:block absolute top-24 right-[10%] w-6 h-6 opacity-80"
        style={{ animationDelay: '-7s', animationDuration: '17s' }}
        viewBox="0 0 32 32"
        fill="none"
      >
        <ellipse cx="10" cy="13" rx="7" ry="6" fill="#FF70B5" />
        <ellipse cx="22" cy="13" rx="7" ry="6" fill="#FF70B5" />
        <ellipse cx="11" cy="21" rx="5" ry="4" fill="#FFD93D" />
        <ellipse cx="21" cy="21" rx="5" ry="4" fill="#FFD93D" />
        <rect x="15" y="10" width="2" height="13" rx="1" fill="#07539A" />
      </svg>

      {/* Gentle Swaying Flowers Along the Bottom Edge */}
      <div className="absolute bottom-2 left-[4%] flex items-end gap-5">
        <svg className="kids-flower w-7 h-10" style={{ animationDelay: '0s' }} viewBox="0 0 32 46" fill="none">
          <path d="M16 44 V20" stroke="#368A28" strokeWidth="3" strokeLinecap="round" />
          <circle cx="16" cy="11" r="5" fill="#FFD93D" />
          <circle cx="10" cy="17" r="5" fill="#FFD93D" />
          <circle cx="22" cy="17" r="5" fill="#FFD93D" />
          <circle cx="12" cy="23" r="5" fill="#FFD93D" />
          <circle cx="20" cy="23" r="5" fill="#FFD93D" />
          <circle cx="16" cy="17" r="4" fill="#FF70B5" />
        </svg>
        <svg className="kids-flower w-6 h-9" style={{ animationDelay: '1.4s' }} viewBox="0 0 32 46" fill="none">
          <path d="M16 44 V20" stroke="#368A28" strokeWidth="3" strokeLinecap="round" />
          <circle cx="16" cy="11" r="5" fill="#FF70B5" />
          <circle cx="10" cy="17" r="5" fill="#FF70B5" />
          <circle cx="22" cy="17" r="5" fill="#FF70B5" />
          <circle cx="12" cy="23" r="5" fill="#FF70B5" />
          <circle cx="20" cy="23" r="5" fill="#FF70B5" />
          <circle cx="16" cy="17" r="4" fill="#FFD93D" />
        </svg>
      </div>

      <div className="hidden sm:flex absolute bottom-2 right-[5%] items-end gap-5">
        <svg className="kids-flower w-7 h-10" style={{ animationDelay: '0.8s' }} viewBox="0 0 32 46" fill="none">
          <path d="M16 44 V20" stroke="#368A28" strokeWidth="3" strokeLinecap="round" />
          <circle cx="16" cy="11" r="5" fill="#FFFFFF" />
          <circle cx="10" cy="17" r="5" fill="#FFFFFF" />
          <circle cx="22" cy="17" r="5" fill="#FFFFFF" />
          <circle cx="12" cy="23" r="5" fill="#FFFFFF" />
          <circle cx="20" cy="23" r="5" fill="#FFFFFF" />
          <circle cx="16" cy="17" r="4" fill="#FFD93D" />
        </svg>
        <svg className="kids-flower w-6 h-9" style={{ animationDelay: '2.1s' }} viewBox="0 0 32 46" fill="none">
          <path d="M16 44 V20" stroke="#368A28" strokeWidth="3" strokeLinecap="round" />
          <circle cx="16" cy="11" r="5" fill="#FFD93D" />
          <circle cx="10" cy="17" r="5" fill="#FFD93D" />
          <circle cx="22" cy="17" r="5" fill="#FFD93D" />
          <circle cx="12" cy="23" r="5" fill="#FFD93D" />
          <circle cx="20" cy="23" r="5" fill="#FFD93D" />
          <circle cx="16" cy="17" r="4" fill="#FF70B5" />
        </svg>
      </div>
    </div>
  );
};
