import React from 'react';
import { Heart, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border-color)',
      padding: '22px 20px',
      marginTop: 'auto',
      textAlign: 'center',
      background: 'rgba(19, 22, 32, 0.95)',
      fontSize: '0.85rem',
      color: 'var(--text-muted)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flexWrap: 'wrap' }}>
        <span>Made with</span>
        <Heart size={14} color="#ef4444" fill="#ef4444" style={{ display: 'inline' }} />
        <span>by</span>
        <a
          href="http://linkedin.com/in/fahad00cms"
          target="_blank"
          rel="noreferrer"
          style={{
            color: '#fbbf24',
            fontWeight: '600',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <span>Fahad Israr</span>
          <ExternalLink size={12} />
        </a>
      </div>
    </footer>
  );
}
