import React from 'react';
import { Heart, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border-color)',
      padding: '24px',
      marginTop: 'auto',
      textAlign: 'center',
      background: 'rgba(11, 15, 25, 0.95)',
      fontSize: '0.875rem',
      color: 'var(--text-muted)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flexWrap: 'wrap' }}>
        <span>Made with</span>
        <Heart size={15} color="#ef4444" fill="#ef4444" style={{ display: 'inline' }} />
        <span>by</span>
        <a
          href="http://linkedin.com/in/fahad00cms"
          target="_blank"
          rel="noreferrer"
          style={{
            color: '#60a5fa',
            fontWeight: '600',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px'
          }}
        >
          <span>Fahad Israr</span>
          <ExternalLink size={12} />
        </a>
      </div>
    </footer>
  );
}
