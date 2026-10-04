import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            minHeight: '280px',
            backgroundColor: '#0B1110',
            color: '#FAF9F5',
            padding: '32px 24px',
            textAlign: 'center'
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}
          >
            <AlertTriangle size={24} color="#EF4444" />
          </div>

          <h3
            style={{
              fontFamily: 'var(--font-serif, "Instrument Serif", Georgia, serif)',
              fontSize: '24px',
              fontWeight: 400,
              margin: '0 0 8px 0',
              color: '#FAF9F5'
            }}
          >
            {this.props.fallbackTitle || 'A rendering issue occurred in this panel'}
          </h3>

          <p
            style={{
              fontSize: '13px',
              color: '#8B918C',
              maxWidth: '460px',
              lineHeight: 1.5,
              margin: '0 0 20px 0'
            }}
          >
            The agent pipeline safely caught this exception to protect your workspace.
            {this.state.error?.message ? ` (${this.state.error.message})` : ''}
          </p>

          <button
            onClick={this.handleReset}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#10231D',
              border: '1px solid rgba(199, 243, 107, 0.4)',
              borderRadius: '6px',
              padding: '8px 16px',
              color: '#C7F36B',
              fontSize: '12px',
              fontFamily: 'var(--font-mono, monospace)',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <RotateCcw size={14} />
            RESET & REFRESH VIEW
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
