import React, { useState, useRef, useEffect } from 'react';
import { Button, TextArea, BusyIndicator, MessageStrip } from '@ui5/webcomponents-react';

const AGENT_URL = import.meta.env.VITE_AGENT_URL || 'http://localhost:5000';

async function queryAgent(message, taskId) {
  const payload = {
    jsonrpc: '2.0', id: Date.now(), method: 'message/send',
    params: {
      message: {
        role: 'user',
        parts: [{ kind: 'text', text: message }],
        messageId: `msg-${Date.now()}`
      },
      ...(taskId ? { taskId } : {})
    }
  };

  const res = await fetch(`${AGENT_URL}/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`Agent error: HTTP ${res.status}`);
  const data = await res.json();
  // Extract text from A2A response
  const result = data?.result;
  const parts = result?.status?.message?.parts || result?.artifact?.parts || [];
  const text = parts.map(p => p.text || '').join('').trim();
  return { text: text || JSON.stringify(result), taskId: result?.id };
}

export default function ChatPanel({ open, onToggle }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hello! Ask me about exchange rates — e.g. "What is USD to EUR?" or "Convert 500 GBP to JPY".' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [taskId, setTaskId] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setError(null);
    setMessages(prev => [...prev, { role: 'user', text }]);
    setLoading(true);
    try {
      const { text: reply, taskId: tid } = await queryAgent(text, taskId);
      if (tid) setTaskId(tid);
      setMessages(prev => [...prev, { role: 'assistant', text: reply }]);
    } catch (err) {
      setError(err.message);
      setMessages(prev => [...prev, { role: 'assistant', text: `⚠️ ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={onToggle}
        style={{
          position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 100,
          width: '56px', height: '56px', borderRadius: '50%',
          background: '#0070f2', color: '#fff', border: 'none',
          fontSize: '1.5rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}
        title="Open AI Chat"
      >💬</button>
    );
  }

  return (
    <div style={{
      position: 'fixed', right: 0, top: 0, bottom: 0, width: '360px', zIndex: 99,
      background: '#fff', borderLeft: '1px solid #e0e0e0',
      display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 16px rgba(0,0,0,0.1)'
    }}>
      {/* Header */}
      <div style={{ padding: '1rem', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0070f2', color: '#fff' }}>
        <strong>🤖 Currency AI Assistant</strong>
        <button onClick={onToggle} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            maxWidth: '85%', padding: '0.6rem 0.9rem', borderRadius: '12px',
            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
            background: m.role === 'user' ? '#0070f2' : '#f4f4f4',
            color: m.role === 'user' ? '#fff' : '#333',
            fontSize: '0.875rem', lineHeight: '1.4'
          }}>
            {m.text}
          </div>
        ))}
        {loading && <BusyIndicator active size="Small" style={{ alignSelf: 'flex-start' }} />}
        {error && <MessageStrip design="Negative" style={{ fontSize: '0.8rem' }}>{error}</MessageStrip>}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '0.75rem', borderTop: '1px solid #e0e0e0', display: 'flex', gap: '0.5rem' }}>
        <TextArea
          value={input}
          onInput={e => setInput(e.target.value)}
          placeholder="Ask about exchange rates..."
          rows={2}
          growing
          style={{ flex: 1, fontSize: '0.875rem' }}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
        />
        <Button design="Emphasized" onClick={send} disabled={loading || !input.trim()}>
          Send
        </Button>
      </div>
    </div>
  );
}
