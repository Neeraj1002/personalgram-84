import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, Trash2 } from 'lucide-react';
import { useRealtimeChat } from '@/hooks/useRealtimeChat';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ChatViewProps {
  onBack: () => void;
}

const ChatView = ({ onBack }: ChatViewProps) => {
  const [input, setInput] = useState('');
  const { messages, sendMessage, isLoading, clearMessages } = useRealtimeChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    await sendMessage(input);
    setInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pt-12 bg-accent/40 border-b border-primary/10">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-6 w-6 text-primary" />
        </Button>
        <h1 className="text-lg font-medium text-foreground">Your Bestie</h1>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={clearMessages}
          disabled={messages.length === 0}
        >
          <Trash2 className="h-5 w-5 text-primary" />
        </Button>
      </div>

      {/* Chat Area */}
      <ScrollArea className="flex-1 p-4 pb-40" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <div className="text-6xl mb-4">💚</div>
              <h2 className="text-2xl font-medium text-foreground mb-2">Hey there! I'm Bestie</h2>
              <p className="text-muted-foreground">
                I'm here to listen, support, and chat about anything on your mind. What would you like to talk about today?
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 max-w-2xl mx-auto pb-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-companion-green text-foreground'
                      : 'bg-white/80 text-foreground'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white/80 rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-companion-green rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-companion-green rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-companion-green rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 bg-white/90 backdrop-blur-md border-t border-gray-200 sticky bottom-24 z-40">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Say something..."
            disabled={isLoading}
            className="flex-1 rounded-full bg-white border-gray-300 text-foreground placeholder:text-gray-500 focus-visible:ring-companion-green"
            style={{ color: '#000' }}
          />
          <Button 
            size="icon" 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="rounded-full bg-companion-green hover:bg-companion-green-dark text-white flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatView;