'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  content: string;
  isUser: boolean;
}

const EXAMPLE_PROMPTS = [
  'Schedule a technical interview with Alice next Tuesday at 2pm',
  'What times are available next week?',
  'Reschedule to Wednesday',
  'Cancel my interview',
];

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      content: '👋 Hello! I\'m your AI scheduling assistant. I can help you schedule, reschedule, and manage interviews and meetings. What would you like to do today?',
      isUser: false,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    if (!textToSend || isLoading) return;

    // Add user message
    const userMessage: Message = { content: textToSend, isUser: true };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: textToSend,
          userId: 'demo-user',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const agentMessage: Message = {
          content: data.message,
          isUser: false,
        };
        setMessages((prev) => [...prev, agentMessage]);
      } else {
        const errorMessage: Message = {
          content: `⚠️ Error: ${data.error || 'Failed to get response'}`,
          isUser: false,
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage: Message = {
        content: '⚠️ Error: Failed to connect to the server',
        isUser: false,
      };
      setMessages((prev) => [...prev, errorMessage]);
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleExampleClick = (example: string) => {
    setInput(example);
    sendMessage(example);
  };

  return (
    <div className="container">
      <div className="header">
        <h1>🤖 AI Scheduling Agent</h1>
        <p>Powered by OpenAI Agents SDK + Next.js 15</p>
      </div>

      <div className="examples">
        <h3>💡 Try these examples:</h3>
        <div className="example-chips">
          {EXAMPLE_PROMPTS.map((prompt, index) => (
            <div
              key={index}
              className="example-chip"
              onClick={() => handleExampleClick(prompt)}
            >
              {prompt.length > 30 ? prompt.substring(0, 30) + '...' : prompt}
            </div>
          ))}
        </div>
      </div>

      <div className="chat-container" ref={chatContainerRef}>
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.isUser ? 'user' : 'agent'}`}>
            <div>
              <div className="message-content">{message.content}</div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="message agent">
            <div>
              <div className="typing-indicator">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="input-container">
        <div className="input-wrapper">
          <input
            type="text"
            className="message-input"
            placeholder="Type your scheduling request..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
          />
          <button
            className="send-button"
            onClick={() => sendMessage()}
            disabled={isLoading || !input.trim()}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
