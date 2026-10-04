import React, { useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { useTrip } from '../../context/TripContext';

export const ChatInput: React.FC = () => {
  const { sendMessage, isAgentStreaming } = useTrip();
  const [inputText, setInputText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isAgentStreaming) return;
    sendMessage(inputText.trim());
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div
      style={{
        padding: '14px 16px',
        backgroundColor: '#0B1110',
        borderTop: '1px solid rgba(216, 213, 203, 0.12)',
        flexShrink: 0
      }}
    >
      <form onSubmit={handleSubmit} style={{ position: 'relative' }}>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Travel Architect to re-sequence, adjust diet, or swap hotels…"
          rows={2}
          style={{
            width: '100%',
            backgroundColor: '#10231D',
            border: '1px solid rgba(216, 213, 203, 0.2)',
            borderRadius: '6px',
            padding: '10px 40px 10px 12px',
            color: '#FAF9F5',
            fontSize: '13px',
            resize: 'none',
            lineHeight: 1.4,
            fontFamily: 'var(--font-sans, sans-serif)',
            outline: 'none',
            boxSizing: 'border-box'
          }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--route-lime, #C7F36B)')}
          onBlur={(e) => (e.target.style.borderColor = 'rgba(216, 213, 203, 0.2)')}
        />

        <button
          type="submit"
          disabled={!inputText.trim() || isAgentStreaming}
          style={{
            position: 'absolute',
            right: '10px',
            bottom: '12px',
            width: '28px',
            height: '28px',
            borderRadius: '4px',
            backgroundColor:
              inputText.trim() && !isAgentStreaming ? 'var(--route-lime, #C7F36B)' : 'rgba(255, 255, 255, 0.1)',
            color: inputText.trim() && !isAgentStreaming ? '#0B1110' : '#8B918C',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: inputText.trim() && !isAgentStreaming ? 'pointer' : 'default',
            transition: 'all 0.15s ease'
          }}
        >
          <ArrowUp size={15} />
        </button>
      </form>
    </div>
  );
};