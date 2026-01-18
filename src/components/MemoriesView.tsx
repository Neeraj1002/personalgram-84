import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Calendar } from 'lucide-react';
import { ImageViewer } from './ImageViewer';

interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  fontSize: number;
}

interface Photo {
  id: number;
  url: string;
  timestamp: number;
  goalId?: string;
  goalName?: string;
  dayNumber?: number;
  textOverlays?: TextOverlay[];
}

const MemoriesView = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    try {
      // Load goals from localStorage for name lookup
      const savedGoals = localStorage.getItem('bestie-goals');
      const goalsMap: Record<string, string> = {};
      if (savedGoals) {
        const goals = JSON.parse(savedGoals);
        goals.forEach((goal: any) => {
          goalsMap[goal.id] = goal.title;
        });
      }

      const request = indexedDB.open('BestiePhotos', 2);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (db.objectStoreNames.contains('photos')) {
          db.deleteObjectStore('photos');
        }
        db.createObjectStore('photos', { keyPath: 'id', autoIncrement: true });
      };
      
      request.onsuccess = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('photos')) {
          console.log('Photos store not found');
          return;
        }
        const tx = db.transaction('photos', 'readonly');
        const store = tx.objectStore('photos');
        const getAllRequest = store.getAll();
        
        getAllRequest.onsuccess = () => {
          const results = getAllRequest.result;
          const photoUrls = results.map((item: any) => ({
            id: item.id,
            url: URL.createObjectURL(item.blob),
            timestamp: item.timestamp,
            goalId: item.goalId,
            goalName: item.goalId ? goalsMap[item.goalId] : undefined,
            dayNumber: item.dayNumber,
            textOverlays: item.textOverlays || [],
          }));
          setPhotos(photoUrls.reverse()); // Most recent first
        };
      };
    } catch (err) {
      console.error('Failed to load photos:', err);
    }
  };

  const handlePhotoClick = (index: number) => {
    setSelectedPhotoIndex(index);
    setViewerOpen(true);
  };

  const handleDeletePhoto = async (photoId: number) => {
    try {
      const request = indexedDB.open('BestiePhotos', 2);
      
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction('photos', 'readwrite');
        const store = tx.objectStore('photos');
        store.delete(photoId);
        
        tx.oncomplete = () => {
          setPhotos(prev => prev.filter(p => p.id !== photoId));
        };
      };
    } catch (err) {
      console.error('Failed to delete photo:', err);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-16 pb-24">
      <div className="container mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-light text-foreground mb-2">
            Your <span className="font-medium text-primary">Memories</span>
          </h1>
          <p className="text-muted-foreground">
            Captured moments and reflections
          </p>
        </div>

        <Card className="shadow-soft border-0 bg-card">
          <CardHeader className="bg-accent/40 rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/20">
                <Heart className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-xl font-medium text-foreground">Recent Captures</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {photos.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">No memories yet</p>
                <p className="text-sm">Start capturing moments to build your collection</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {photos.map((photo, index) => (
                  <button
                    key={photo.id}
                    onClick={() => handlePhotoClick(index)}
                    className="relative aspect-square rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-companion-peach"
                  >
                    <img 
                      src={photo.url} 
                      alt={`Memory from ${new Date(photo.timestamp).toLocaleDateString()}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                      <p className="text-white text-xs">
                        {new Date(photo.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Full Image Viewer */}
      {viewerOpen && (
        <ImageViewer
          photos={photos}
          initialIndex={selectedPhotoIndex}
          onClose={() => setViewerOpen(false)}
          onDelete={handleDeletePhoto}
        />
      )}
    </div>
  );
};

export default MemoriesView;
