import { Button } from '@/components/ui/button';
import { ArrowLeft, Send, MessageCircle } from 'lucide-react';

interface ChatViewProps {
  onBack: () => void;
}

const ChatView = ({ onBack }: ChatViewProps) => {
  return (
    <div className="h-screen bg-gradient-to-br from-companion-cream via-background to-companion-cream-dark flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pt-12 bg-white/50 backdrop-blur-md border-b border-gray-200/20">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-medium text-foreground">Your Bestie</h1>
        <div className="w-10" />
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="p-6 rounded-full bg-companion-green-light mb-6">
            <MessageCircle className="h-12 w-12 text-companion-green-dark mx-auto" />
          </div>
          <h2 className="text-2xl font-medium text-foreground mb-2">Chat with Your Bestie</h2>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Your personal companion is here to listen, support, and help you grow.
          </p>
          <p className="text-sm text-muted-foreground">Coming soon... 🌱</p>
        </div>
      </div>

      {/* Input Area (placeholder) */}
      <div className="p-4 bg-white/50 backdrop-blur-md border-t border-gray-200/20">
        <div className="flex items-center gap-3">
          <div className="flex-1 px-4 py-3 bg-white/70 rounded-full border border-gray-200/30">
            <p className="text-muted-foreground text-sm">Say something...</p>
          </div>
          <Button size="icon" className="rounded-full bg-companion-green text-white">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatView;