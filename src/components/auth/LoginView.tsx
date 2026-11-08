// MasterTV Client Login View for Web and Android APK
// Features username/password authentication, remote control focus, 1-click test shortcuts and admin access
// Strictly ASCII comments only as per project rules

import React, { useState } from 'react';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  MessageCircle,
} from 'lucide-react';
import type { ClientSession } from '../../types/admin';
import { AdminService } from '../../services/adminService';

interface LoginViewProps {
  onLoginSuccess: (session: ClientSession) => void;
  onOpenAdmin: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, onOpenAdmin }) => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const settings = AdminService.getSettings();

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMessage('Por favor, preencha o usuario e a senha.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await AdminService.authenticateClient(username, password);
      if (res.success && res.client) {
        if (!rememberMe) {
          // If rememberMe is unchecked, clear on session exit
          sessionStorage.setItem('mastertv_no_persist', 'true');
        }
        onLoginSuccess(res.client);
      } else {
        setErrorMessage(res.error || 'Nao foi possivel autenticar.');
      }
    } catch {
      setErrorMessage('Ocorreu um erro ao conectar com o servidor. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestTrial = () => {
    const phone = settings.supportPhone || '5511999999999';
    const text = encodeURIComponent(
      'Ola! Gostaria de solicitar um teste gratis para o MasterTV.'
    );
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  return (
    <div className="min-h-screen w-full bg-[#07090e] flex flex-col justify-between items-center p-4 relative overflow-hidden select-none">
      {/* Background Glow Decorations */}
      <div className="absolute top-[-150px] left-[-150px] w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-150px] right-[-150px] w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Header Brand */}
      <div className="w-full max-w-md pt-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#0a0d16] border border-cyan-500/30 p-1 flex items-center justify-center shadow-lg shadow-cyan-500/25 overflow-hidden">
            <img
              src="./assets/img/icons/logo.png"
              alt="MasterTV Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-wider">
              MASTER<span className="text-cyan-400">TV</span>
            </h1>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block -mt-1">
              IPTV & VOD Player
            </span>
          </div>
        </div>

        <button
          onClick={onOpenAdmin}
          className="text-xs font-semibold text-slate-400 hover:text-cyan-400 flex items-center gap-1.5 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-slate-900 border border-transparent hover:border-white/5 cursor-pointer"
          title="Acessar painel de controle"
        >
          <span>Painel Admin</span>
        </button>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md my-auto py-6 z-10">
        <div className="bg-[#0b0e14]/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-cyan-950/30 relative">
          <div className="mb-6 text-center sm:text-left flex flex-col items-center sm:items-start">
            <div className="w-16 h-16 mb-3 rounded-2xl bg-[#07090e] border border-cyan-500/40 p-2 flex items-center justify-center shadow-xl shadow-cyan-500/20">
              <img
                src="./assets/img/icons/logo.png"
                alt="MasterTV Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">Entrar na sua conta</h2>
            <p className="text-xs text-slate-400 mt-1">
              Digite seu usuario e senha para acessar canais ao vivo, filmes e series.
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 animate-in fade-in duration-200">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="text-xs font-bold text-red-300 block">Falha no Acesso</span>
                <span className="text-xs text-red-200/80">{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            {/* Username Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-cyan-400" />
                <span>Usuario ou Linha IPTV</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  autoFocus
                  required
                  placeholder="Ex: seu.usuario"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-white text-sm font-semibold placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Senha de Acesso</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-white text-sm font-semibold placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all pr-12"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1 rounded transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Toggle */}
            <div className="flex items-center justify-between py-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-400/30 focus:ring-offset-0"
                />
                <span className="text-xs font-semibold text-slate-300">Lembrar neste aparelho</span>
              </label>

              <button
                type="button"
                onClick={handleRequestTrial}
                className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Esqueceu a senha?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 disabled:opacity-50 text-slate-950 font-black text-sm tracking-wide transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-slate-950/30 border-t-slate-950 animate-spin" />
                  <span>Validando Acesso...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Entrar no MasterTV</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Trial Request Button */}
          <div className="mt-5 pt-5 border-t border-white/5 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={handleRequestTrial}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-white/5 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Solicitar Teste Gratis no WhatsApp</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer System Info */}
      <div className="w-full max-w-md pb-4 text-center z-10 flex items-center justify-between text-[11px] text-slate-500">
        <span>MasterTV v2.4</span>
        <button
          onClick={onOpenAdmin}
          className="hover:text-cyan-400 transition-colors cursor-pointer"
        >
          Acesso Painel Revenda
        </button>
        <span>100% Protegido</span>
      </div>
    </div>
  );
};
