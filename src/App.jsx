import React, { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Fetch chat history on load
  useEffect(() => {
    fetch('http://192.168.100.84:5000/api/chat')
      .then((res) => res.json())
      .then((data) => setMessages(data))
      .catch((error) => console.error('Error fetching chat history:', error));
  }, []);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() && !file) return;

    const userMessage = { role: 'user', content: input || (file ? `Uploaded: ${file.name}` : '') };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const formData = new FormData();
    formData.append('messages', JSON.stringify([...messages, userMessage]));
    if (file) {
      formData.append('file', file);
      setFile(null);
    }

    try {
      const response = await fetch('http://192.168.100.84:5000/api/chat/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.message }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error processing your request. Please try again later.'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatMessage = (content) => {
    if (typeof content !== 'string') return content;

    return content.split('```').map((part, index) => {
      if (index % 2 === 0) {
        // Process normal text with line breaks
        return (
          <div key={index} className="whitespace-pre-wrap">
            {part}
          </div>
        );
      } else {
        // Process code blocks
        const [language, ...code] = part.split('\n');
        return (
          <div key={index} className="code-block" style={{ margin: '12px 0', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{
              backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9',
              padding: '8px 16px',
              fontSize: '12px',
              color: isDarkMode ? '#94a3b8' : '#64748b',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>{language || 'code'}</span>
              <button
                style={{
                  color: isDarkMode ? '#94a3b8' : '#64748b',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer'
                }}
                onClick={() => navigator.clipboard.writeText(code.join('\n'))}
              >
                Copy
              </button>
            </div>
            <pre style={{ fontSize: '14px' }}>
              <code>{code.join('\n')}</code>
            </pre>
          </div>
        );
      }
    });
  };

  const clearChat = () => {
    if (window.confirm('Are you sure you want to clear the chat history?')) {
      setMessages([]);
      // You may want to also clear the chat history from the server
      fetch('http://192.168.100.84:5000/api/chat', { method: 'delete' });
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className={`app-container ${isDarkMode ? 'dark-bg' : 'light-bg'}`}>
      {/* Header */}
      <header className={`header ${isDarkMode ? 'dark-header' : 'light-header'}`}>
        <div className="header-content">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div className="header-avatar" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
              <span style={{ fontSize: '20px' }}>🤖</span>
            </div>
            <h1 className="header-title">AI Chat Assistant</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={toggleTheme}
              style={{
                padding: '8px',
                borderRadius: '50%',
                border: 'none',
                background: 'rgba(255, 255, 255, 0.1)',
                cursor: 'pointer'
              }}
              aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
            <button
              onClick={clearChat}
              style={{
                padding: '8px',
                borderRadius: '50%',
                border: 'none',
                background: 'rgba(255, 255, 255, 0.1)',
                cursor: 'pointer'
              }}
              aria-label="Clear chat"
            >
              🧹
            </button>
            <div className="status-indicator" style={{
              backgroundColor: isDarkMode ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.2)',
              color: isDarkMode ? '#86efac' : '#166534'
            }}>
              Online
            </div>
          </div>
        </div>
      </header>

      {/* Chat container */}
      <div className="chat-container">
        {/* Messages area */}
        <div className="messages-area">
          <div className="messages-list">
            {messages.length === 0 && !isLoading && (
              <div className="welcome-container">
                <div className="welcome-card fade-in" style={{
                  backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.5)' : 'rgba(255, 255, 255, 0.7)',
                  color: isDarkMode ? '#e2e8f0' : '#334155'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>💬</div>
                  <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px' }}>Welcome to AI Chat</h2>
                  <p style={{ marginBottom: '16px' }}>Ask me anything - I'm here to help with your questions, tasks, and creative needs.</p>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '8px',
                    textAlign: 'left',
                    fontSize: '14px'
                  }}>
                    <div style={{
                      padding: '8px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)'
                    }}>
                      <p style={{ fontWeight: '500' }}>Try asking:</p>
                      <p style={{ opacity: '0.75' }}>"Summarize this document for me"</p>
                    </div>
                    <div style={{
                      padding: '8px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)'
                    }}>
                      <p style={{ fontWeight: '500' }}>Or upload:</p>
                      <p style={{ opacity: '0.75' }}>Images, PDFs, or text files</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`message-row ${msg.role === 'user' ? 'user' : 'assistant'} fade-in`}
              >
                <div
                  className={`message message-bubble ${msg.role === 'user'
                    ? isDarkMode ? 'dark-user-message' : 'light-user-message'
                    : isDarkMode ? 'dark-bot-message' : 'light-bot-message'
                    }`}
                >
                  <div className="message-header">
                    <div className="avatar" style={{
                      backgroundColor: msg.role === 'user'
                        ? 'rgba(59, 130, 246, 0.3)'
                        : isDarkMode ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.2)'
                    }}>
                      {msg.role === 'user' ? '👤' : '🤖'}
                    </div>
                    <div style={{ fontWeight: '600', fontSize: '14px' }}>
                      {msg.role === 'user' ? 'You' : 'AI Assistant'}
                    </div>
                    <div style={{ marginLeft: 'auto', fontSize: '12px', opacity: '0.5' }}>
                      {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div className="message-content">
                    {formatMessage(msg.content)}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="message-row assistant fade-in">
                <div className={`message message-bubble ${isDarkMode ? 'dark-bot-message' : 'light-bot-message'
                  }`}>
                  <div className="message-header">
                    <div className="avatar" style={{
                      backgroundColor: isDarkMode ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.2)'
                    }}>
                      🤖
                    </div>
                    <div style={{ fontWeight: '600', fontSize: '14px' }}>AI Assistant</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div>Thinking</div>
                    <div className="typing-indicator" style={{ display: 'flex', gap: '4px' }}>
                      <span style={{ backgroundColor: isDarkMode ? '#60a5fa' : '#3b82f6' }}></span>
                      <span style={{ backgroundColor: isDarkMode ? '#60a5fa' : '#3b82f6' }}></span>
                      <span style={{ backgroundColor: isDarkMode ? '#60a5fa' : '#3b82f6' }}></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <form onSubmit={handleSubmit} className={`input-form ${isDarkMode ? 'dark-bot-message' : 'light-bot-message'
            }`}>
            <div className="input-container">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className={`text-input ${isDarkMode ? 'dark-input' : 'light-input'
                  }`}
                disabled={isLoading}
              />
              <div className="action-buttons">
                <input
                  type="file"
                  accept="image/*,.pdf,.txt,.doc,.docx"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  id="file-upload"
                  ref={fileInputRef}
                  disabled={isLoading}
                />
                <label
                  htmlFor="file-upload"
                  className="file-upload-label button"
                  style={{
                    backgroundColor: isDarkMode ? '#374151' : '#e2e8f0',
                    color: isDarkMode ? 'white' : '#1e293b'
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </label>
                <button
                  type="submit"
                  className={`button ${isDarkMode ? 'dark-button' : 'light-button'
                    }`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div style={{
                      width: '20px',
                      height: '20px',
                      border: '2px solid white',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            {file && (
              <div className={`file-preview ${isDarkMode ? 'dark-input' : 'light-input'
                }`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div className="file-name">{file.name}</div>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="close-button"
                  style={{ color: isDarkMode ? '#94a3b8' : '#64748b' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;