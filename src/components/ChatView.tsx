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
    const viewport = scrollRef.current?.querySelector(
      '[data-radix-scroll-area-viewport]'
    ) as HTMLDivElement | null;

    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight;
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
    <div className="h-screen bg-background flex flex-col pt-12">
      {/* Chat Area */}
      <ScrollArea className="flex-1 p-4 pb-40" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <div className="text-6xl mb-4">💙</div>
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
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card text-foreground'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-card rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 bg-card border-t border-border sticky bottom-24 z-40">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Say something..."
            disabled={isLoading}
            className="flex-1 rounded-full bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
            style={{ color: '#000' }}
          />
          <Button 
            size="icon" 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatView;