// UniTV-style Real-time Digital Clock for Smart TV Header
// Strictly ASCII comments only as per project guidelines

import React, { useState, useEffect } from 'react';

export const UniTVClock: React.FC = () => {
  const [timeStr, setTimeStr] = useState<string>(() => {
    const d = new Date();
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const d = new Date();
      setTimeStr(`${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 text-sm font-mono font-black tracking-wider text-slate-200 select-none">
      <span>{timeStr}</span>
    </div>
  );
};
