import React from 'react';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught a component error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    const url = new URL(window.location.origin + window.location.pathname);
    window.location.href = url.toString();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '70vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '560px',
            width: '100%',
            padding: '36px 28px',
            textAlign: 'center'
          }}>
            <div style={{
              background: 'rgba(244, 63, 94, 0.15)',
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              border: '1px solid rgba(244, 63, 94, 0.4)'
            }}>
              <AlertCircle size={28} color="#fb7185" />
            </div>

            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '8px', color: 'var(--text-main)' }}>
              Something Went Wrong
            </h2>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '20px' }}>
              The contest page encountered an unexpected rendering error. Your account and contest submissions remain safe.
            </p>

            {this.state.error && (
              <div style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
                textAlign: 'left',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.78rem',
                color: '#fb7185',
                marginBottom: '24px',
                overflowX: 'auto',
                maxHeight: '120px'
              }}>
                {this.state.error.toString()}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button onClick={this.handleReload} className="btn btn-secondary btn-sm" style={{ padding: '8px 16px' }}>
                <RotateCcw size={15} /> Reload Page
              </button>
              <button onClick={this.handleGoHome} className="btn btn-primary btn-sm" style={{ padding: '8px 16px' }}>
                <Home size={15} /> Return to Lobbies
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
