// Electronic Program Guide (EPG) interactive timeline component
// Strictly ASCII comments only

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  LayoutGrid, 
  Search, 
  Clock, 
  X,
  Tv
} from 'lucide-react';
import type { Channel, EPGProgram, Category } from '../types/iptv';
import { getChannelTimelinePrograms, type EPGTimelineProgram } from '../services/epgService';

interface EPGGuideViewProps {
  channels: Channel[];
  currentChannel?: Channel | null;
  onSelectChannel: (channel: Channel) => void;
  onClose: () => void;
  onToggleFavorite?: (channelId: string) => void;
  onSelectProgramDetails?: (program: EPGProgram, channel: Channel) => void;
  categories?: Category[];
  epgPrograms?: EPGProgram[];
  timeHeaders?: string[];
  onOpenPlayer?: () => void;
}

export const EPGGuideView: React.FC<EPGGuideViewProps> = ({
  channels,
  currentChannel,
  onSelectChannel,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [now, setNow] = useState<Date>(() => new Date());
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Update current time every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Listen for real-time online EPG updates
  const [epgRev, setEpgRev] = useState<number>(0);
  useEffect(() => {
    const handleUpdate = () => {
      setEpgRev((prev) => prev + 1);
      setNow(new Date());
    };
    window.addEventListener('mastertv_epg_updated', handleUpdate);
    return () => window.removeEventListener('mastertv_epg_updated', handleUpdate);
  }, []);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Total timeline window: 24 slots of 30 minutes (12 hours)
  // Window starts 30 minutes before current half hour
  const SLOT_WIDTH = 140; // Pixels per 30 minutes
  const TOTAL_SLOTS = 24; // 12 hours
  const PX_PER_MINUTE = SLOT_WIDTH / 30;

  const { windowStart, windowEnd, timeSlots } = useMemo(() => {
    const start = new Date(now);
    const m = start.getMinutes();
    start.setMinutes(m < 30 ? 0 : 30, 0, 0);
    // Offset by -30 minutes so current time is inside the first slots
    start.setMinutes(start.getMinutes() - 30);

    const end = new Date(start.getTime() + TOTAL_SLOTS * 30 * 60000);

    const slots: { label: string; timeMs: number }[] = [];
    for (let i = 0; i < TOTAL_SLOTS; i++) {
      const slotTime = new Date(start.getTime() + i * 30 * 60000);
      const hStr = String(slotTime.getHours()).padStart(2, '0');
      const mStr = String(slotTime.getMinutes()).padStart(2, '0');
      slots.push({
        label: `${hStr}:${mStr}`,
        timeMs: slotTime.getTime(),
      });
    }

    return {
      windowStart: start,
      windowEnd: end,
      timeSlots: slots,
    };
  }, [now]);

  // Current red line position
  const nowMs = now.getTime();
  const windowStartMs = windowStart.getTime();
  const windowEndMs = windowEnd.getTime();
  const currentOffsetMin = Math.max(0, (nowMs - windowStartMs) / 60000);
  const currentLeftPx = currentOffsetMin * PX_PER_MINUTE;

  const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const formattedDateStr = `Hoje, ${currentTimeStr}`;

  // Filter channels by search query
  const filteredChannels = useMemo(() => {
    if (!searchQuery.trim()) return channels;
    const q = searchQuery.toLowerCase();
    return channels.filter(
      (c) => c.name.toLowerCase().includes(q) || String(c.number).includes(q)
    );
  }, [channels, searchQuery]);

  // Scroll to current time on mount and on "Agora" button click
  const scrollToNow = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        left: Math.max(0, currentLeftPx - 250),
        behavior: 'smooth',
      });
    }
  };

  useEffect(() => {
    // Initial centering with slight delay to allow layout calculation
    const timeout = setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollLeft = Math.max(0, currentLeftPx - 250);
      }
    }, 100);
    return () => clearTimeout(timeout);
  }, [currentLeftPx]);

  // Cache timeline programs for visible channels
  const channelProgramsMap = useMemo(() => {
    void epgRev;
    const map: Record<string, EPGTimelineProgram[]> = {};
    filteredChannels.forEach((ch) => {
      map[ch.id] = getChannelTimelinePrograms(ch.id, windowStartMs, windowEndMs, nowMs);
    });
    return map;
  }, [filteredChannels, windowStartMs, windowEndMs, nowMs, epgRev]);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      {/* Modal Dialog Container - Matching Saimo TV design */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[1300px] h-[90vh] max-h-[820px] bg-[#0d0e15] border border-white/10 rounded-2xl md:rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden text-white font-sans animate-in zoom-in-95 duration-150"
      >
        {/* Top Header Bar */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-white/10 flex items-center justify-between gap-3 sm:gap-4 bg-[#0d0e15] shrink-0">
          {/* Left Title and Subtitle */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 flex items-center justify-center shrink-0">
              <LayoutGrid className="w-5 h-5 text-[#8b5cf6]" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight leading-tight">
                Guia de programação
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400 font-medium leading-none mt-1">
                {formattedDateStr}
              </p>
            </div>
          </div>

          {/* Right Controls: Search, Agora Button, Close Button */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search Channel Box */}
            <div className="relative w-36 sm:w-56 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar canal"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-[#171822] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#8b5cf6] transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Agora (Now) Button */}
            <button
              onClick={scrollToNow}
              className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl bg-[#8b5cf6] hover:bg-[#7c3aed] text-white text-xs font-semibold shadow-md shadow-[#8b5cf6]/25 transition-all shrink-0 cursor-pointer"
              title="Ir para o horario atual"
            >
              <Clock className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Agora</span>
            </button>

            {/* Close Modal Button */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
              title="Fechar guia"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Timeline Grid */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-auto custom-scroll relative bg-[#0d0e15] select-none"
        >
          <div className="flex min-w-max relative">
            {/* 1. STICKY LEFT COLUMN (Channels) */}
            <div className="w-40 sm:w-52 shrink-0 sticky left-0 z-40 bg-[#0d0e15] border-r border-white/10 flex flex-col">
              {/* Corner Header: HOJE */}
              <div className="h-11 sticky top-0 z-50 bg-[#0d0e15] border-b border-white/10 px-4 flex items-center font-bold text-[11px] text-[#818cf8] uppercase tracking-wider">
                HOJE
              </div>

              {/* Channel Items Column */}
              {filteredChannels.length === 0 ? (
                <div className="p-6 text-xs text-slate-500 text-center">
                  Nenhum canal encontrado.
                </div>
              ) : (
                filteredChannels.map((ch) => {
                  const isCurrent = currentChannel?.id === ch.id;
                  return (
                    <div
                      key={ch.id}
                      onClick={() => {
                        onSelectChannel(ch);
                        onClose();
                      }}
                      className={`h-16 px-3 border-b border-white/5 flex items-center gap-2.5 cursor-pointer transition-colors ${
                        isCurrent
                          ? 'bg-[#8b5cf6]/10 text-white'
                          : 'hover:bg-white/5 text-slate-300'
                      }`}
                      title={`Assistir ${ch.name}`}
                    >
                      {/* Channel Number */}
                      <span className="text-xs text-slate-500 font-mono w-5 text-right shrink-0">
                        {String(ch.number).padStart(2, '0')}
                      </span>

                      {/* Channel Logo */}
                      <div className="w-7 h-7 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center p-1 overflow-hidden shrink-0">
                        {ch.logo ? (
                          <img
                            src={ch.logo}
                            alt={ch.name}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <Tv className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </div>

                      {/* Channel Name */}
                      <span className="text-xs font-semibold text-white truncate flex-1">
                        {ch.name}
                      </span>

                      {/* Live Indicator Dot for Current Channel */}
                      {isCurrent && (
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* 2. TIMELINE TRACKS (SCROLLABLE RIGHT CONTAINER) */}
            <div
              style={{ width: `${TOTAL_SLOTS * SLOT_WIDTH}px` }}
              className="relative shrink-0 flex flex-col"
            >
              {/* Timeline Header Row (Sticky Top) */}
              <div className="h-11 sticky top-0 z-30 bg-[#0d0e15] border-b border-white/10 flex items-center">
                {timeSlots.map((slot, idx) => (
                  <div
                    key={idx}
                    style={{ width: `${SLOT_WIDTH}px` }}
                    className="shrink-0 text-center text-[11px] font-mono font-medium text-slate-400 border-r border-white/5 h-full flex items-center justify-center"
                  >
                    {slot.label}
                  </div>
                ))}

                {/* Red Current Time Badge on Header */}
                <div
                  style={{ left: `${currentLeftPx}px` }}
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-30 pointer-events-none"
                >
                  <span className="px-1.5 py-0.5 rounded bg-red-600 text-white font-mono text-[10px] font-bold shadow-md shadow-red-600/50 leading-none">
                    {currentTimeStr}
                  </span>
                </div>
              </div>

              {/* Channel Program Rows */}
              {filteredChannels.map((ch) => {
                const programs = channelProgramsMap[ch.id] || [];
                return (
                  <div
                    key={ch.id}
                    className="h-16 relative border-b border-white/5 hover:bg-white/[0.015] transition-colors"
                  >
                    {programs.length === 0 ? (
                      <div className="absolute inset-0 flex items-center px-4 text-xs text-slate-600 italic">
                        Sem programacao
                      </div>
                    ) : (
                      programs.map((prog) => {
                        const startOffsetMin = (prog.startMs - windowStartMs) / 60000;
                        const durationMin = Math.max(15, (prog.stopMs - prog.startMs) / 60000);
                        const leftPx = Math.max(0, startOffsetMin * PX_PER_MINUTE);
                        const widthPx = Math.max(50, durationMin * PX_PER_MINUTE - 4);

                        return (
                          <div
                            key={prog.id}
                            onClick={() => {
                              onSelectChannel(ch);
                              onClose();
                            }}
                            style={{
                              left: `${leftPx}px`,
                              width: `${widthPx}px`,
                            }}
                            className={`absolute top-1.5 bottom-1.5 rounded-xl cursor-pointer transition-all flex flex-col justify-between px-3 py-1.5 overflow-hidden ${
                              prog.isLive
                                ? 'bg-[#241d3b]/95 border border-[#8b5cf6]/50 shadow-md hover:border-[#8b5cf6] text-white z-10'
                                : 'bg-[#13141f]/75 border border-white/5 hover:border-white/20 hover:bg-[#1a1b28] text-slate-300'
                            }`}
                            title={`${prog.title} (${prog.startTime} - ${prog.endTime})`}
                          >
                            {/* Program Title */}
                            <span className="text-xs font-semibold text-white truncate leading-tight">
                              {prog.title}
                            </span>

                            {/* Program Time and Live Status */}
                            {prog.isLive ? (
                              <div className="flex items-center gap-1.5 text-[10px] font-mono leading-none">
                                <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse shrink-0" />
                                <span className="font-bold text-pink-400 uppercase tracking-wider text-[9px]">
                                  AO VIVO
                                </span>
                                <span className="text-slate-400">
                                  {prog.startTime} - {prog.endTime}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-mono leading-none">
                                {prog.startTime} - {prog.endTime}
                              </span>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                );
              })}

              {/* Vertical Red Current Time Line */}
              <div
                style={{ left: `${currentLeftPx}px` }}
                className="absolute top-11 bottom-0 w-[2px] bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)] z-20 pointer-events-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
