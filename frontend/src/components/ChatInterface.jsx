/**
 * Chat Interface Component
 * Main chat UI with message history and input
 * Glass morphism design
 */

import { useState, useRef, useEffect } from 'react';
import { marked } from 'marked';
import { useStreamingChat } from '../hooks/useStreamingChat';
import { GlassPanel, glassInputStyle } from './GlassPanel';

export function ChatInterface() {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const { messages, isStreaming, error, sendMessage, clearMessages } = useStreamingChat();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !isStreaming) {
      sendMessage(input);
      setInput('');
    }
  };

  return (
    <GlassPanel 
      variant="card" 
      hover={false}
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '600px',
      }}
    >
      {/* Header */}
      <div style={{ 
        padding: '1.25rem 1.5rem', 
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        background: 'rgba(255, 255, 255, 0.03)'
      }}>
        <h2 style={{ 
          margin: 0, 
          color: '#f5f5f5', 
          fontSize: '1.25rem', 
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span>💬</span> The Sovereign Architect
        </h2>
        {messages.length > 0 && (
          <button 
            onClick={clearMessages} 
            style={{ 
              fontSize: '0.85rem',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              padding: '0.5rem 1rem',
              color: '#d4d4d4',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.15)';
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.1)';
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)';
            }}
          >
            Clear Chat
          </button>
        )}
      </div>

      {/* Messages */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: '1.5rem', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '1rem' 
      }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#a3a3a3', marginTop: '3rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>🤖</div>
            <p style={{ marginBottom: '0.5rem' }}>Welcome! Ask me anything about smart contracts, DeFi, or blockchain development.</p>
            <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>Try: "Generate an ERC-20 token contract"</p>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '80%',
              padding: '1rem 1.25rem',
              borderRadius: '16px',
              background: msg.role === 'user' 
                ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.3) 0%, rgba(37, 99, 235, 0.3) 100%)'
                : 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(8px)',
              border: msg.role === 'user' 
                ? '1px solid rgba(59, 130, 246, 0.3)'
                : '1px solid rgba(255, 255, 255, 0.1)',
              color: '#f5f5f5',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div style={{ 
              fontSize: '0.7rem', 
              marginBottom: '0.5rem', 
              opacity: 0.6,
              color: msg.role === 'user' ? '#93c5fd' : '#86efac',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              {msg.role === 'user' ? 'You' : 'Agent'}
            </div>
            <div
              dangerouslySetInnerHTML={{
                __html: marked(msg.content || '...')
              }}
              style={{ 
                fontSize: '0.95rem',
                lineHeight: '1.6'
              }}
              className="chat-message-content"
            />
          </div>
        ))}
        
        {error && (
          <div style={{ 
            padding: '1rem 1.25rem', 
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#fca5a5', 
            borderRadius: '12px' 
          }}>
            Error: {error}
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form 
        onSubmit={handleSubmit} 
        style={{ 
          padding: '1.25rem', 
          borderTop: '1px solid rgba(255, 255, 255, 0.1)', 
          display: 'flex', 
          gap: '0.75rem',
          background: 'rgba(255, 255, 255, 0.03)'
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me anything..."
          disabled={isStreaming}
          style={{
            flex: 1,
            padding: '0.875rem 1.25rem',
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            fontSize: '1rem',
            color: '#f5f5f5',
            outline: 'none',
            transition: 'all 0.2s ease'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            e.target.style.boxShadow = '0 0 15px rgba(255, 255, 255, 0.08)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            e.target.style.boxShadow = 'none';
          }}
        />
        <button
          type="submit"
          disabled={!input.trim() || isStreaming}
          style={{
            padding: '0.875rem 1.75rem',
            background: isStreaming 
              ? 'rgba(255, 255, 255, 0.1)' 
              : 'linear-gradient(135deg, rgba(59, 130, 246, 0.4) 0%, rgba(37, 99, 235, 0.4) 100%)',
            color: isStreaming ? '#737373' : '#f5f5f5',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '12px',
            cursor: isStreaming ? 'not-allowed' : 'pointer',
            fontSize: '1rem',
            fontWeight: '600',
            transition: 'all 0.2s ease',
            backdropFilter: 'blur(8px)'
          }}
          onMouseEnter={(e) => {
            if (!isStreaming) {
              e.target.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.5) 0%, rgba(37, 99, 235, 0.5) 100%)';
              e.target.style.transform = 'translateY(-2px)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isStreaming) {
              e.target.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.4) 0%, rgba(37, 99, 235, 0.4) 100%)';
              e.target.style.transform = 'translateY(0)';
            }
          }}
        >
          {isStreaming ? '...' : 'Send'}
        </button>
      </form>

      {/* Chat message styling */}
      <style>{`
        .chat-message-content p {
          margin: 0 0 0.5rem 0;
        }
        .chat-message-content p:last-child {
          margin-bottom: 0;
        }
        .chat-message-content code {
          background: rgba(0, 0, 0, 0.3);
          padding: 0.2rem 0.4rem;
          border-radius: 4px;
          font-size: 0.85em;
          color: #fbbf24;
        }
        .chat-message-content pre {
          background: rgba(0, 0, 0, 0.4);
          padding: 1rem;
          border-radius: 8px;
          overflow-x: auto;
          margin: 0.75rem 0;
        }
        .chat-message-content pre code {
          background: none;
          padding: 0;
          color: #d4d4d4;
        }
        .chat-message-content ul, .chat-message-content ol {
          margin: 0.5rem 0;
          padding-left: 1.5rem;
        }
        .chat-message-content li {
          margin: 0.25rem 0;
        }
      `}</style>
    </GlassPanel>
  );
}
