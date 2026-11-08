// Dedicated Settings Page for Client and Admin Configuration
// Strictly ASCII comments only

import React, { useState } from 'react';
import { MainLayout } from '../../layouts/MainLayout';
import { useApp } from '../../context/AppContext';
import { useNavigation } from '../../context/NavigationContext';
import {
  Sliders,
  User,
  ShieldCheck,
  Calendar,
  LogOut,
  Trash2,
  Lock,
  Cpu,
  Zap,
  Volume2,
  Check,
} from 'lucide-react';
import {
  getClientPreferences,
  saveClientPreferences,
  type ClientPlayerPreferences,
} from './settingsConfig';

export const SettingsPage: React.FC = () => {
  const { clientSession, handleLogout, handleClearCache } = useApp();
  const { navigateTo } = useNavigation();

  const [prefs, setPrefs] = useState<ClientPlayerPreferences>(() => getClientPreferences());
  const [saveFeedback, setSaveFeedback] = useState<boolean>(false);

  const updatePreference = <K extends keyof ClientPlayerPreferences>(
    key: K,
    value: ClientPlayerPreferences[K]
  ) => {
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    saveClientPreferences(updated);
    setSaveFeedback(true);
    setTimeout(() => setSaveFeedback(false), 1500);
  };

  return (
    <MainLayout>
      <div className="w-full max-w-5xl mx-auto px-4 lg:px-8 py-8 flex flex-col gap-8 flex-1 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Configuracoes do MasterTV</h1>
              <p className="text-xs text-slate-400">
                Gerencie sua conta, preferencias de reproducao e acesso administrativo
              </p>
            </div>
          </div>

          {saveFeedback && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold animate-in fade-in">
              <Check className="w-4 h-4" />
              <span>Salvo</span>
            </div>
          )}
        </div>

        {/* Section 1: Client Account */}
        {clientSession && (
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-white/10 flex flex-col gap-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <User className="w-4 h-4 text-cyan-400" />
              <span>Sua Conta &amp; Assinatura</span>
            </h2>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#0b0e14] border border-white/5">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-black text-lg">
                  {clientSession.customerName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-base">
                      {clientSession.customerName}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {clientSession.planDuration}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{clientSession.username}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>
                        Vencimento:{' '}
                        {new Date(clientSession.expiresAt).toLocaleDateString('pt-BR')}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Desconectar Conta</span>
              </button>
            </div>
          </div>
        )}

        {/* Section 2: Playback and Performance Preferences */}
        <div className="p-6 rounded-2xl bg-slate-900/50 border border-white/10 flex flex-col gap-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span>Preferencias de Reproducao e Streaming</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Hardware Acceleration */}
            <div className="p-4 rounded-xl bg-[#0b0e14] border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Cpu className="w-5 h-5 text-slate-400" />
                <div>
                  <h4 className="text-xs font-bold text-white">Aceleracao por Hardware</h4>
                  <p className="text-[11px] text-slate-400">
                    Decodificacao GPU para melhor fluidez em Smart TVs
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={prefs.hardwareAcceleration}
                onChange={(e) => updatePreference('hardwareAcceleration', e.target.checked)}
                className="w-4 h-4 accent-cyan-500 cursor-pointer"
              />
            </div>

            {/* Low Latency Zero Delay */}
            <div className="p-4 rounded-xl bg-[#0b0e14] border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-slate-400" />
                <div>
                  <h4 className="text-xs font-bold text-white">Modo Zero Delay</h4>
                  <p className="text-[11px] text-slate-400">
                    Sincronizacao em tempo real de transmissao ao vivo
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={prefs.lowLatency}
                onChange={(e) => updatePreference('lowLatency', e.target.checked)}
                className="w-4 h-4 accent-cyan-500 cursor-pointer"
              />
            </div>

            {/* Smart Audio */}
            <div className="p-4 rounded-xl bg-[#0b0e14] border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Volume2 className="w-5 h-5 text-slate-400" />
                <div>
                  <h4 className="text-xs font-bold text-white">Audio Inteligente</h4>
                  <p className="text-[11px] text-slate-400">
                    Normalizacao de volume entre canais e filmes
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={prefs.smartAudio}
                onChange={(e) => updatePreference('smartAudio', e.target.checked)}
                className="w-4 h-4 accent-cyan-500 cursor-pointer"
              />
            </div>

            {/* Buffer Size */}
            <div className="p-4 rounded-xl bg-[#0b0e14] border border-white/5 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white">Tamanho do Buffer</h4>
                <p className="text-[11px] text-slate-400">Margem preventiva contra travamentos</p>
              </div>
              <select
                value={prefs.bufferSize}
                onChange={(e) => updatePreference('bufferSize', e.target.value)}
                className="bg-slate-900 border border-white/10 text-white rounded-lg px-2.5 py-1 text-xs cursor-pointer focus:outline-none focus:border-cyan-400"
              >
                <option value="15s">15 segundos (Rapido)</option>
                <option value="30s">30 segundos (Padrao)</option>
                <option value="60s">60 segundos (Conexoes Lentas)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Storage & Maintenance */}
        <div className="p-6 rounded-2xl bg-slate-900/50 border border-white/10 flex flex-col gap-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-cyan-400" />
            <span>Armazenamento &amp; Cache</span>
          </h2>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#0b0e14] border border-white/5">
            <div>
              <h4 className="text-xs font-bold text-white">Limpar Cache e Dados Temporarios</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Remove dados salvos localmente e forca a resincronizacao completa do catalogo
              </p>
            </div>
            <button
              onClick={() => {
                if (window.confirm('Deseja realmente limpar o cache e recarregar o MasterTV?')) {
                  handleClearCache();
                }
              }}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 text-xs font-bold transition-all cursor-pointer"
            >
              Limpar Cache
            </button>
          </div>
        </div>

        {/* Section 4: Administration & Reseller Gateway */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-cyan-950/20 via-slate-900/50 to-slate-900/50 border border-cyan-500/20 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Painel do Administrador &amp; Revenda</h3>
                <p className="text-xs text-slate-400">
                  Gerenciamento de clientes, controle de canais, catalogo de VOD e listas M3U
                </p>
              </div>
            </div>

            <button
              onClick={() => navigateTo('admin')}
              className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-cyan-500/20 cursor-pointer"
            >
              Acessar Painel Admin
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

