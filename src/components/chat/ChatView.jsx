import React, { useState } from 'react';
import './../../App.css';

// Simplified Chat Component for Manuscript Oracle
// Integrated from scriptpro chat functionality

export default function ChatView() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [conversations, setConversations] = useState([
    { id: 1, title: 'Story Development', messageCount: 0 }
  ]);
  const [currentConversationId, setCurrentConversationId] = useState(1);

  const handleSendMessage = () => {
    if (!input.trim()) return;

    const newMessage = {
      id: Date.now(),
      content: input,
      role: 'user',
      timestamp: new Date().toISOString()
    };

    setMessages([...messages, newMessage]);
    setInput('');

    // Simulate AI response
    setTimeout(() => {
      const aiMessage = {
        id: Date.now() + 1,
        content: 'This is a placeholder response. Connect your AI API in Settings to enable full chat functionality.',
        role: 'assistant',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, aiMessage]);
    }, 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'system-ui' }}>
      {/* Conversation Sidebar */}
      <div style={{
        width: '250px',
        borderRight: '1px solid #e5e7eb',
        background: '#f9fafb',
        padding: '1rem'
      }}>
        <button style={{
          width: '100%',
          padding: '0.75rem',
          background: '#4f46e5',
          color: 'white',
          border: 'none',
          borderRadius: '0.5rem',
          cursor: 'pointer',
          fontWeight: '600',
          marginBottom: '1rem'
        }}>
          + New Chat
        </button>
        
        {conversations.map(conv => (
          <div
            key={conv.id}
            onClick={() => setCurrentConversationId(conv.id)}
            style={{
              padding: '0.75rem',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              background: currentConversationId === conv.id ? '#e0e7ff' : 'transparent',
              marginBottom: '0.5rem'
            }}
          >
            <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>{conv.title}</div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
              {conv.messageCount} messages
            </div>
          </div>
        ))}
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{
          padding: '1rem',
          borderBottom: '1px solid #e5e7eb',
          background: '#f9fafb'
        }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>
            Story Development Chat
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
            Ask questions about your manuscript
          </p>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.5rem',
          background: 'white'
        }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💬</div>
              <h3>Start a Conversation</h3>
              <p>Ask questions about your story, brainstorm ideas, or get writing help.</p>
            </div>
          ) : (
            messages.map(msg => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  marginBottom: '1rem'
                }}
              >
                <div style={{
                  maxWidth: '70%',
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  background: msg.role === 'user' ? '#4f46e5' : '#f3f4f6',
                  color: msg.role === 'user' ? 'white' : '#111827'
                }}>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                  <div style={{
                    fontSize: '0.75rem',
                    marginTop: '0.5rem',
                    opacity: 0.7
                  }}>
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input Area */}
        <div style={{
          padding: '1rem',
          borderTop: '1px solid #e5e7eb',
          background: '#f9fafb'
        }}>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              rows={2}
              style={{
                flex: 1,
                padding: '0.75rem',
                borderRadius: '0.5rem',
                border: '1px solid #d1d5db',
                resize: 'none',
                fontFamily: 'system-ui',
                fontSize: '0.875rem'
              }}
            />
            <button
              onClick={handleSendMessage}
              disabled={!input.trim()}
              style={{
                padding: '0.75rem 1.5rem',
                background: input.trim() ? '#4f46e5' : '#d1d5db',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: input.trim() ? 'pointer' : 'not-allowed',
                fontWeight: '600'
              }}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
