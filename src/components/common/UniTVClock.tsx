// Real-time Digital Clock with optional formatted Date for MasterTV Header
// Strictly ASCII comments only as per project guidelines

import React, { useState, useEffect } from 'react';

interface UniTVClockProps {
  showDate?: boolean;
}

const WEEKDAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
const MONTHS_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function formatNow() {
  const d = new Date();
  const timeStr = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  const weekday = WEEKDAYS_PT[d.getDay()] || '';
  const day = d.getDate().toString().padStart(2, '0');
  const month = MONTHS_PT[d.getMonth()] || '';
  const dateStr = `${weekday}, ${day} de ${month}`;
  return { timeStr, dateStr };
}

export const UniTVClock: React.FC<UniTVClockProps> = ({ showDate = false }) => {
  const [now, setNow] = useState(() => formatNow());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(formatNow());
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  if (showDate) {
    return (
      <div className="flex flex-col items-end justify-center leading-tight select-none">
        <span className="text-base sm:text-lg font-bold tracking-wide text-white tabular-nums">
          {now.timeStr}
        </span>
        <span className="text-[11px] font-medium text-slate-300/80 tracking-normal">
          {now.dateStr}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 text-sm font-mono font-black tracking-wider text-slate-200 select-none">
      <span>{now.timeStr}</span>
    </div>
  );
};
