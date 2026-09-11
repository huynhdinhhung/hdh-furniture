'use client';
import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, User, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'bot', content: string}[]>([
    { role: 'bot', content: 'Chào bạn! Tôi có thể giúp gì cho không gian sống của bạn hôm nay?' }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    setInput('');
    
    // Simulate bot response
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'bot', content: 'Cảm ơn bạn đã quan tâm. Hiện tại tính năng tư vấn trực tuyến đang được thử nghiệm. Bạn vui lòng để lại thông tin hoặc lướt xem các bộ sưu tập của chúng tôi nhé!' }]);
    }, 1000);
  };

  return (
    <>
      {/* Floating button */}
      <button 
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-40 bg-forest text-white p-4 rounded-full shadow-lg hover:bg-forest/90 transition-transform ${isOpen ? 'scale-0' : 'scale-100 hover:scale-105'}`}
        aria-label="Mở chat tư vấn"
      >
        <MessageSquare size={24} />
      </button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50 w-[350px] max-w-[calc(100vw-48px)] bg-white rounded-2xl shadow-2xl border border-line overflow-hidden flex flex-col"
            style={{ height: '500px', maxHeight: 'calc(100vh - 48px)' }}
          >
            {/* Header */}
            <div className="bg-forest text-white p-4 flex justify-between items-center">
              <div>
                <h3 className="font-medium text-lg flex items-center gap-2">
                  <Bot size={20} />
                  HDH Assistant
                </h3>
                <p className="text-xs text-white/70">Thường trả lời ngay lập tức</p>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-white/70 hover:text-white transition-colors"
                aria-label="Đóng chat"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-paper/30">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-wood text-white' : 'bg-forest/10 text-forest'}`}>
                    {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  <div className={`px-4 py-2.5 rounded-2xl max-w-[80%] text-sm ${
                    msg.role === 'user' 
                      ? 'bg-wood text-white rounded-tr-none' 
                      : 'bg-white border border-line text-gray-700 rounded-tl-none'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-line bg-white flex gap-2">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Nhập tin nhắn..." 
                className="flex-1 border border-line rounded-full px-4 py-2 text-sm focus:outline-none focus:border-wood"
              />
              <button 
                type="submit"
                disabled={!input.trim()}
                className="bg-forest text-white w-10 h-10 rounded-full flex items-center justify-center shrink-0 hover:bg-forest/90 transition-colors disabled:opacity-50"
              >
                <Send size={16} className="ml-1" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
