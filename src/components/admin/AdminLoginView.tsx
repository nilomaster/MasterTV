// MasterTV Administrative Login Gate Component
// Authenticates Master Admin or Reseller against api/auth.php before exposing /admin
// Strictly ASCII comments only

import React, { useState } from 'react';
import { Lock, User, ArrowLeft, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { AdminService, type AdminAuthSession } from '../../services/adminService';

interface AdminLoginViewProps {
  onLoginSuccess: (session: AdminAuthSession) => void;
  onBackToPlayer: () => void;
}

export const AdminLoginView: React.FC<AdminLoginViewProps> = ({
  onLoginSuccess,
  onBackToPlayer,
}) => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMessage('Informe usuario e senha administrativos.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await AdminService.loginAdmin(username.trim(), password.trim());
      if (result.success && result.session) {
        onLoginSuccess(result.session);
      } else {
        setErrorMessage(result.message || 'Credenciais administrativas invalidas.');
      }
    } catch {
      setErrorMessage('Nao foi possivel conectar ao servidor de autenticacao.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#070B16] text-[#F8FAFC] flex items-center justify-center p-4 font-sans select-none">
      <div className="w-full max-w-md bg-[#151E2E] border border-[#253247] rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-[#101827] border border-[#253247] p-2.5 flex items-center justify-center">
            <img
              src="./assets/img/icons/logo.png"
              alt="MasterTV"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="flex items-center justify-center gap-1.5 text-xl font-extrabold tracking-tight">
              <span className="text-[#F8FAFC]">Master</span>
              <span className="text-[#009DFF]">TV</span>
            </div>
            <div className="inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-0.5 rounded-full bg-[#009DFF]/15 border border-[#009DFF]/30 text-[#009DFF] text-[11px] font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Acesso Administrativo &amp; Revenda</span>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#94A3B8]">Usuario Administrativo</label>
            <div className="relative">
              <User className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoComplete="username"
                placeholder="Digite seu usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isSubmitting}
                className="w-full bg-[#0F1726] border border-[#253247] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#F8FAFC] placeholder-[#94A3B8]/60 focus:outline-none focus:border-[#009DFF] transition-colors"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#94A3B8]">Senha</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                autoComplete="current-password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                className="w-full bg-[#0F1726] border border-[#253247] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#F8FAFC] placeholder-[#94A3B8]/60 focus:outline-none focus:border-[#009DFF] transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-1 w-full py-3 rounded-xl bg-[#009DFF] hover:bg-[#0077D9] text-[#070B16] font-bold text-sm transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Autenticando...</span>
              </>
            ) : (
              <span>Entrar no Painel</span>
            )}
          </button>
        </form>

        {/* Back to Player Link */}
        <div className="pt-4 border-t border-[#253247] flex justify-center">
          <button
            type="button"
            onClick={onBackToPlayer}
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#94A3B8] hover:text-[#F8FAFC] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[#009DFF]" />
            <span>Voltar ao Player</span>
          </button>
        </div>
      </div>
    </div>
  );
};
