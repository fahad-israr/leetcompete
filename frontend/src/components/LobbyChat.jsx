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
      <div style={{
        padding: '14px 18px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'var(--bg-card)'
      }}>
        <MessageSquare size={16} color="var(--accent-purple)" />
        <span style={{ fontWeight: '700', fontSize: '0.9rem', letterSpacing: '0.02em' }}>
          Lobby Activity & Chat
        </span>
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem', marginTop: '40px' }}>
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
                <span style={{ fontSize: '0.725rem', color: 'var(--text-dim)', marginBottom: '2px', marginLeft: isMe ? 'auto' : '4px' }}>
                  {m.username}
                </span>
                <div
                  style={{
                    padding: '8px 14px',
                    borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                    background: isMe ? 'var(--accent-purple)' : 'var(--bg-input)',
                    color: '#fff',
                    fontSize: '0.875rem',
                    border: isMe ? 'none' : '1px solid var(--border-color)',
                    wordBreak: 'break-word'
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

      <form
        onSubmit={handleSend}
        style={{
          padding: '12px',
          borderTop: '1px solid var(--border-color)',
          background: 'var(--bg-surface)',
          display: 'flex',
          gap: '8px'
        }}
      >
        <input
          type="text"
          placeholder="Enter message..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="form-input"
          style={{ padding: '8px 12px', fontSize: '0.875rem' }}
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
