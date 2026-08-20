import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare } from 'lucide-react';

export default function LobbyChat({ messages = [], onSendMessage, currentUsername }) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  return (
    <div
      className="glass-panel"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: '480px',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden'
      }}
    >
      {/* Chat Header */}
      <div style={{
        padding: '14px 18px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'var(--bg-card)'
      }}>
        <MessageSquare size={16} color="var(--accent-primary)" />
        <span style={{ fontWeight: '700', fontSize: '0.9rem', letterSpacing: '0.02em', color: 'var(--text-main)' }}>
          Lobby Activity & Chat
        </span>
      </div>

      {/* Messages Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '40px' }}>
            No messages yet. Chat or solve problems to see activity here!
          </div>
        ) : (
          messages.map((m) => {
            const isMe = currentUsername && m.username?.toLowerCase() === currentUsername.toLowerCase();
            return (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignSelf: isMe ? 'flex-end' : 'flex-start',
                  maxWidth: '85%'
                }}
              >
                <span style={{
                  fontSize: '0.725rem',
                  fontWeight: '600',
                  color: 'var(--text-muted)',
                  marginBottom: '3px',
                  marginLeft: isMe ? 'auto' : '4px',
                  marginRight: isMe ? '4px' : 'auto'
                }}>
                  {m.username}
                </span>
                <div
                  style={{
                    padding: '8px 14px',
                    borderRadius: isMe ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                    background: isMe ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-primary-hover))' : 'var(--bg-input)',
                    color: isMe ? '#ffffff' : 'var(--text-main)',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    border: isMe ? 'none' : '1px solid var(--border-color)',
                    wordBreak: 'break-word',
                    boxShadow: isMe ? '0 2px 10px var(--accent-orange-glow)' : 'var(--shadow-sm)',
                    lineHeight: '1.4'
                  }}
                >
                  {m.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Footer */}
      <form
        onSubmit={handleSend}
        style={{
          padding: '12px',
          borderTop: '1px solid var(--border-color)',
          background: 'var(--bg-card)',
          display: 'flex',
          gap: '8px'
        }}
      >
        <input
          type="text"
          placeholder="Type a message to lobby..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="form-input"
          style={{
            padding: '8px 12px',
            fontSize: '0.875rem',
            background: 'var(--bg-input)',
            color: 'var(--text-main)',
            border: '1px solid var(--border-color)'
          }}
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="btn btn-primary"
          style={{ padding: '8px 14px' }}
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}
