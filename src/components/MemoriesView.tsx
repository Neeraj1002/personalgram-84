import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Calendar } from 'lucide-react';

const MemoriesView = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-companion-cream via-background to-companion-cream-dark pt-16 pb-24">
      <div className="container mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-light text-foreground mb-2">
            Your <span className="font-medium text-companion-peach">Memories</span>
          </h1>
          <p className="text-muted-foreground">
            Captured moments and reflections
          </p>
        </div>

        <Card className="shadow-soft border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-companion-peach-light">
                <Heart className="h-5 w-5 text-accent-foreground" />
              </div>
              <CardTitle className="text-xl font-medium">Recent Captures</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No memories yet</p>
              <p className="text-sm">Start capturing moments to build your collection</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MemoriesView;