import React from 'react';
import { Heart, ExternalLink } from 'lucide-react';

// Official GitHub Invertocat Vector
function OfficialGitHubIcon({ size = 15 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"
      />
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
        gap: '6px',
        flexWrap: 'wrap'
      }}>
        {/* Code Badge: </> */}
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
            letterSpacing: '-0.02em',
            marginRight: '2px'
          }}
          title="Code"
        >
          &lt;/&gt;
        </span>

        <span>with</span>
        <Heart size={14} color="#ef4444" fill="#ef4444" style={{ display: 'inline', verticalAlign: 'middle' }} />
        <span>by</span>

        {/* Fahad Israr Link */}
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
            gap: '3px',
            transition: 'color 0.2s ease',
            marginRight: '4px'
          }}
        >
          <span>Fahad Israr</span>
          <ExternalLink size={11} />
        </a>

        {/* Official GitHub Icon Badge directly beside */}
        <a
          href="https://github.com/fahad-israr/leetcompete"
          target="_blank"
          rel="noreferrer"
          aria-label="GitHub Repository"
          title="GitHub Repository (LeetCompete)"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: '#ffffff',
            color: '#181717',
            border: '1px solid rgba(0, 0, 0, 0.15)',
            boxShadow: '0 1px 4px rgba(0, 0, 0, 0.15)',
            textDecoration: 'none',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            flexShrink: 0
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.15)';
            e.currentTarget.style.boxShadow = '0 0 10px var(--accent-orange-glow)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 1px 4px rgba(0, 0, 0, 0.15)';
          }}
        >
          <OfficialGitHubIcon size={14} />
        </a>
      </div>
    </footer>
  );
}
