// Resilient Error Boundary for MasterTV Pages
// Strictly ASCII comments only

import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallbackTitle?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('MasterTV Runtime Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col items-center justify-center p-6 text-center select-none font-sans">
          <div className="max-w-md w-full bg-[#0b0e14] border border-white/10 rounded-3xl p-6 sm:p-8 flex flex-col items-center gap-4 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-black text-xl">
              !
            </div>
            <h2 className="text-lg font-black text-white">
              {this.props.fallbackTitle || 'Ocorreu um imprevisto na visualizacao'}
            </h2>
            <p className="text-xs text-slate-400">
              {this.state.error?.message || 'Os dados foram preservados com seguranca.'}
            </p>
            <div className="flex items-center gap-3 w-full mt-2">
              <button
                onClick={() => {
                  this.setState({ hasError: false });
                  window.location.hash = '#/ao-vivo';
                  window.location.reload();
                }}
                className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/25 transition-all cursor-pointer"
              >
                Voltar ao Player
              </button>
              <button
                onClick={() => {
                  this.setState({ hasError: false });
                  window.location.reload();
                }}
                className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/10 transition-all cursor-pointer"
              >
                Recarregar Pagina
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

