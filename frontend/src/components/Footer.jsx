import React from 'react';
import { Heart, Github, ExternalLink, Code2 } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border-color)',
      padding: '20px 24px',
      marginTop: 'auto',
      background: 'var(--bg-card)',
      fontSize: '0.85rem',
      color: 'var(--text-muted)',
      transition: 'background 0.25s ease, border-color 0.25s ease'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        flexWrap: 'wrap'
      }}>
        {/* Attribution: </> with ❤️ by Fahad Israr */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-mono)',
              fontWeight: '800',
              fontSize: '0.8rem',
              background: 'var(--accent-primary-light)',
              color: 'var(--accent-primary)',
              padding: '2px 6px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(234, 88, 12, 0.25)',
              letterSpacing: '-0.05em'
            }}
            title="Code"
          >
            &lt;/&gt;
          </span>
          <span>with</span>
          <Heart size={14} color="#ef4444" fill="#ef4444" style={{ display: 'inline', verticalAlign: 'middle' }} />
          <span>by</span>
          <a
            href="https://www.linkedin.com/in/fahad00cms"
            target="_blank"
            rel="noreferrer"
            style={{
              color: 'var(--accent-primary)',
              fontWeight: '700',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'color 0.2s ease'
            }}
            className="hover-underline"
          >
            <span>Fahad Israr</span>
            <ExternalLink size={11} />
          </a>
        </div>

        {/* Divider */}
        <span style={{ color: 'var(--border-color)', display: 'inline-block' }}>•</span>

        {/* GitHub Repo Source Link */}
        <a
          href="https://github.com/fahad-israr/leetcompete"
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--text-main)',
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '0.85rem',
            padding: '4px 10px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-input)',
            border: '1px solid var(--border-color)',
            transition: 'all 0.2s ease'
          }}
          className="btn-ghost"
        >
          <Github size={15} color="var(--text-main)" />
          <span>GitHub</span>
          <ExternalLink size={11} color="var(--text-dim)" />
        </a>
      </div>
    </footer>
  );
}
