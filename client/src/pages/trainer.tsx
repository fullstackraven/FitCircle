import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Bot, User as UserIcon, Loader2 } from 'lucide-react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'trainer';
  timestamp: Date;
}

export default function TrainerPage() {
  const [, navigate] = useLocation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Check if we came from dashboard
  const fromDashboard = new URLSearchParams(window.location.search).get('from') === 'dashboard';
  
  const handleBack = () => {
    if (fromDashboard) {
      sessionStorage.setItem('fitcircle_dashboard_open', 'true');
      navigate('/');
    } else {
      navigate('/');
    }
  };

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load previous conversation from localStorage
  useEffect(() => {
    const savedMessages = localStorage.getItem('fitcircle_trainer_messages');
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages);
        setMessages(parsedMessages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })));
      } catch (error) {
        console.error('Failed to load trainer messages:', error);
      }
    } else {
      // Welcome message for first-time users
      const welcomeMessage: Message = {
        id: 'welcome',
        content: `Hi! I'm your AI Trainer. I can analyze your workout data, measurements, and fitness goals to provide personalized advice.

I can help with:
• Training routines and progression
• Nutrition recommendations
• Goal setting and adjustments
• Recovery and rest day planning
• Exercise form and technique tips

What would you like to discuss about your fitness journey?`,
        sender: 'trainer',
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('fitcircle_trainer_messages', JSON.stringify(messages));
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/trainer/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: userMessage.content,
          conversationHistory: messages.slice(-10) // Send last 10 messages for context
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get trainer response');
      }

      const data = await response.json();

      const trainerMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        sender: 'trainer',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, trainerMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I\'m having trouble connecting right now. Please try again in a moment.',
        sender: 'trainer',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
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

  const clearConversation = () => {
    setMessages([]);
    localStorage.removeItem('fitcircle_trainer_messages');
    // Add welcome message back
    const welcomeMessage: Message = {
      id: 'welcome-new',
      content: 'Conversation cleared! How can I help you with your fitness goals today?',
      sender: 'trainer',
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  };

  return (
    <div className="min-h-screen text-white flex flex-col pb-32" style={{ backgroundColor: 'hsl(222, 47%, 11%)' }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <button
          onClick={handleBack}
          className="text-slate-400 hover:text-white transition-colors flex items-center space-x-2"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>
        <div className="flex items-center space-x-2">
          <Bot className="w-6 h-6 text-green-400" />
          <h1 className="text-xl font-semibold">AI Trainer</h1>
        </div>
        <Button
          onClick={clearConversation}
          variant="ghost"
          size="sm"
          className="text-slate-400 hover:text-white"
        >
          Clear
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start space-x-3 ${
              message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              message.sender === 'trainer' ? 'bg-green-600' : 'bg-blue-600'
            }`}>
              {message.sender === 'trainer' ? (
                <Bot className="w-5 h-5 text-white" />
              ) : (
                <UserIcon className="w-5 h-5 text-white" />
              )}
            </div>
            <div className={`max-w-[80%] rounded-xl p-3 ${
              message.sender === 'trainer' 
                ? 'bg-slate-800 text-white' 
                : 'bg-blue-600 text-white'
            }`}>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {message.content}
              </p>
              <p className="text-xs opacity-60 mt-2">
                {message.timestamp.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-600">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="bg-slate-800 rounded-xl p-3">
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin text-green-400" />
                <span className="text-sm text-slate-300">Trainer is thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-700">
        <div className="flex space-x-2">
          <Textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask your trainer anything about fitness, nutrition, or training..."
            className="flex-1 bg-slate-800 border-slate-600 text-white placeholder-slate-400 rounded-xl resize-none"
            rows={2}
            disabled={isLoading}
          />
          <Button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="bg-green-600 hover:bg-green-700 px-4 rounded-xl"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}