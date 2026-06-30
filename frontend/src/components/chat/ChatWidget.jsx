import { useState, useRef, useEffect } from 'react';
import api from '../../services/api';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'model', text: 'Hello! I am your CivicPulse Assistant powered by Gemini. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      // Send chat history (excluding the very first greeting to save tokens, or include it)
      const history = messages.slice(1);
      
      const res = await api._request('/chat', {
        method: 'POST',
        body: { message: userMessage, history }
      });

      setMessages(prev => [...prev, { role: 'model', text: res.reply }]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [...prev, { role: 'model', text: err.message || 'Sorry, I am having trouble connecting to the network right now.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="bg-civic-950/90 backdrop-blur-xl border border-civic-700 w-80 sm:w-96 h-[500px] rounded-2xl shadow-[0_0_40px_rgba(139,92,246,0.3)] flex flex-col overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-civic-900 to-civic-800 p-4 border-b border-civic-700 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-civic-950 flex items-center justify-center text-lg shadow-[0_0_10px_rgba(139,92,246,0.8)] border border-civic-600">
                🤖
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Civic Assistant</h3>
                <div className="text-xs text-success-400 flex items-center">
                  <span className="w-2 h-2 rounded-full bg-success-400 animate-pulse mr-1"></span>
                  Gemini Online
                </div>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-civic-300 hover:text-white transition-colors p-1"
            >
              ✕
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl p-3 text-sm ${
                  msg.role === 'user' 
                    ? 'bg-civic-600 text-white rounded-tr-none shadow-[0_0_15px_rgba(139,92,246,0.4)]' 
                    : 'bg-civic-800/80 border border-civic-700 text-civic-100 rounded-tl-none shadow-inner'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-civic-800/80 border border-civic-700 rounded-2xl rounded-tl-none p-3 shadow-inner flex space-x-1">
                  <div className="w-2 h-2 bg-civic-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-civic-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-civic-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} className="p-3 bg-civic-900 border-t border-civic-800">
            <div className="flex space-x-2">
              <input 
                type="text" 
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask about city services..."
                className="flex-1 bg-civic-950 border border-civic-700 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-civic-500 focus:shadow-[0_0_10px_rgba(139,92,246,0.3)] transition-all"
              />
              <button 
                type="submit" 
                disabled={isLoading || !input.trim()}
                className="bg-civic-600 hover:bg-civic-500 text-white rounded-full w-10 h-10 flex items-center justify-center disabled:opacity-50 shadow-[0_0_10px_rgba(139,92,246,0.5)] transition-all"
              >
                ↑
              </button>
            </div>
          </form>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-civic-600 hover:bg-civic-500 text-white rounded-full w-14 h-14 flex items-center justify-center text-2xl shadow-[0_0_20px_rgba(139,92,246,0.6)] hover:shadow-[0_0_30px_rgba(139,92,246,0.9)] hover:scale-105 transition-all animate-bounce"
        >
          🤖
        </button>
      )}
    </div>
  );
}
