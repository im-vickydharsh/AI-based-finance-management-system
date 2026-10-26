import React, { useState, useRef, useEffect } from 'react';
import { Bot, User, Send, Sparkles, Trash2, HelpCircle, Check, ArrowRight } from 'lucide-react';
import { processFinancialQuery } from '../utils/aiEngine';

const INITIAL_SUGGESTIONS = [
  "What is my current balance?",
  "Where am I spending the most?",
  "Can I afford a ₹1,500 purchase?",
  "How much did I spend on Food?",
  "Give me a full financial summary",
  "How can I save more money?"
];

const AiInsights = ({ transactions }) => {
  const [messages, setMessages] = useState([
    {
      id: 'init-1',
      sender: 'bot',
      text: `👋 **Hello! I'm your AI Personal Finance Assistant.**\n\nI have real-time access to your transactions and can answer any financial questions you have in plain English. Try asking me:\n\n• *"What is my balance right now?"*\n• *"Where am I spending the most?"*\n• *"Can I afford a ₹2,000 jacket?"*\n• *"How much have I spent on food or rent?"*\n• *"Give me personalized tips to save more money."*`,
      suggestions: INITIAL_SUGGESTIONS
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendQuery = (queryText) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || isTyping) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend.trim()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate intelligent reasoning delay
    setTimeout(() => {
      const response = processFinancialQuery(textToSend, transactions);
      const botMsg = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: response.text,
        suggestions: response.suggestions || INITIAL_SUGGESTIONS
      };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 400);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSendQuery(input);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `init-${Date.now()}`,
        sender: 'bot',
        text: `🧹 **Chat cleared.** How can I assist with your finances today?`,
        suggestions: INITIAL_SUGGESTIONS
      }
    ]);
  };

  // Helper to render formatted text with markdown-style bolding and bullet lists
  const renderFormattedMessage = (content) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      if (!line.trim()) {
        return <div key={idx} style={{ height: '8px' }} />;
      }

      // Format bold text **text**
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const formattedLine = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={pIdx}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('*') && part.endsWith('*')) {
          return <em key={pIdx}>{part.slice(1, -1)}</em>;
        }
        return part;
      });

      if (line.startsWith('• ') || line.startsWith('- ')) {
        return (
          <div key={idx} style={{ display: 'flex', gap: '6px', marginLeft: '6px', marginBottom: '4px' }}>
            <span>•</span>
            <div>{formattedLine}</div>
          </div>
        );
      }

      return <p key={idx} style={{ marginBottom: '6px' }}>{formattedLine}</p>;
    });
  };

  // Get active suggestions from latest bot message or fallback
  const lastBotMessage = [...messages].reverse().find(m => m.sender === 'bot');
  const activeSuggestions = lastBotMessage?.suggestions || INITIAL_SUGGESTIONS;

  return (
    <div>
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <Sparkles size={22} color="#4f46e5" /> Conversational AI Insights
          </h2>
          <p className="section-desc">
            Ask any question in natural language about your balance, spending, purchases, or saving strategies.
          </p>
        </div>
        <button className="btn-clear-chat" onClick={handleClearChat} title="Clear conversation">
          <Trash2 size={14} style={{ display: 'inline', marginRight: '4px' }} /> Clear Chat
        </button>
      </div>

      <div className="chat-container">
        {/* Chat Header */}
        <div className="chat-header">
          <div className="chat-header-info">
            <div className="chat-bot-avatar">
              <Bot size={22} />
            </div>
            <div className="chat-header-text">
              <h3>FinAI Financial Advisor</h3>
              <p>Grounded on {transactions.length} live transaction record(s)</p>
            </div>
          </div>
        </div>

        {/* Message Area */}
        <div className="chat-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`message-row ${msg.sender}`}>
              <div className="message-avatar">
                {msg.sender === 'bot' ? <Bot size={18} /> : <User size={18} />}
              </div>
              <div className="message-bubble">
                {renderFormattedMessage(msg.text)}
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="message-row bot">
              <div className="message-avatar">
                <Bot size={18} />
              </div>
              <div className="message-bubble typing-indicator">
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Suggested Quick Questions */}
        <div className="chat-suggestions-area">
          {activeSuggestions.map((suggestion, sIdx) => (
            <button
              key={sIdx}
              className="suggestion-chip"
              onClick={() => handleSendQuery(suggestion)}
            >
              <Sparkles size={12} color="#4f46e5" />
              <span>{suggestion}</span>
            </button>
          ))}
        </div>

        {/* Chat Input Bar */}
        <form className="chat-input-bar" onSubmit={handleFormSubmit}>
          <input
            type="text"
            className="chat-input-field"
            placeholder="Type any financial question (e.g., 'Can I afford ₹1,000?', 'Top expenses', 'What is my balance?')..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isTyping}
          />
          <button 
            type="submit" 
            className="btn-send" 
            disabled={!input.trim() || isTyping}
            title="Send question"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AiInsights;
