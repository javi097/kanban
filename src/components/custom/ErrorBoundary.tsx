import React, { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.removeItem('kanban-storage');
    } catch {
      // Ignorar errores de acceso a localStorage
    }
    window.location.reload();
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#f8f8f6] p-6 text-center text-[#202124]">
          <div className="max-w-md rounded-2xl border border-[#e5e5e1] bg-white p-8 shadow-sm">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-[#1e2025]">
              Ha ocurrido un error inesperado
            </h2>
            <p className="mt-2 text-xs text-[#85868b]">
              El tablero encontró un error en la interfaz. Puedes reiniciar el estado para continuar trabajando sin problemas.
            </p>
            {this.state.error && (
              <pre className="mt-4 max-h-32 overflow-auto rounded bg-slate-50 p-2 text-left text-[11px] text-slate-700">
                {this.state.error.message}
              </pre>
            )}
            <button
              type="button"
              onClick={this.handleReset}
              className="mt-6 inline-flex h-9 items-center justify-center rounded-lg bg-[#252a45] px-4 text-xs font-medium text-white transition-colors hover:bg-[#333957]"
            >
              Reiniciar tablero
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
