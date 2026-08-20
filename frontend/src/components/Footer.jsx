import React from 'react';
import { Heart, ExternalLink } from 'lucide-react';

function GitHubIcon({ size = 15, color = 'currentColor' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

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
              letterSpacing: '-0.02em'
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
          >
            <span>Fahad Israr</span>
            <ExternalLink size={11} />
          </a>
        </div>

        {/* Subtle separator */}
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
            fontSize: '0.825rem',
            padding: '4px 10px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-input)',
            border: '1px solid var(--border-color)',
            transition: 'all 0.2s ease'
          }}
        >
          <GitHubIcon size={14} color="var(--text-main)" />
          <span>Source Code</span>
          <ExternalLink size={11} color="var(--text-dim)" />
        </a>
      </div>
    </footer>
  );
}
