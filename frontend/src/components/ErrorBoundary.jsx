import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Fatal Frontend Crash:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-dark, #121826)', color: 'var(--text-primary, #ffffff)', padding: '20px', textAlign: 'center' }}>
          <h1 style={{ color: 'var(--danger, #ef4444)', marginBottom: '10px' }}>System Render Failure</h1>
          <p style={{ maxWidth: '600px', opacity: 0.8 }}>Something went critically wrong in the React rendering tree.</p>
          <pre style={{ maxWidth: '80%', padding: '15px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', overflowX: 'auto', marginTop: '20px', fontSize: '13px', border: '1px solid var(--danger, #ef4444)' }}>
            {this.state.error && this.state.error.toString()}
          </pre>
          <button style={{ marginTop: '20px', padding: '10px 20px', background: 'var(--accent-neon-blue, #2563eb)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }} onClick={() => window.location.href = '/'}>
            Force Reboot
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
