import { useState } from 'react';
import CameraView from './CameraView';
import Dashboard from './Dashboard';
import MemoriesView from './MemoriesView';
import ChatView from './ChatView';
import NotesView from './NotesView';
import BottomNavigation from './BottomNavigation';

const MainApp = () => {
  const [activeTab, setActiveTab] = useState<'bestie' | 'capture' | 'memories'>('capture');
  const [currentView, setCurrentView] = useState<'main' | 'notes'>('main');
  const [capturedImage, setCapturedImage] = useState<{ dataUrl: string; blob: Blob } | null>(null);

  const renderActiveView = () => {
    // Handle overlay views first
    if (currentView === 'notes') {
      return <NotesView onBack={() => setCurrentView('main')} />;
    }

    // Handle main tab views
    switch (activeTab) {
      case 'bestie':
        return <ChatView onBack={() => setActiveTab('capture')} />;
      case 'capture':
        return (
          <CameraView 
            onOpenGoals={() => setActiveTab('memories')}
            onOpenNotes={() => setCurrentView('notes')}
            onSaveMemory={() => setActiveTab('memories')}
            onCapture={setCapturedImage}
            onCloseCapture={() => setCapturedImage(null)}
          />
        );
      case 'memories':
        return <MemoriesView />;
      default:
        return (
          <CameraView 
            onOpenGoals={() => setActiveTab('memories')}
            onOpenNotes={() => setCurrentView('notes')}
            onSaveMemory={() => setActiveTab('memories')}
            onCapture={setCapturedImage}
            onCloseCapture={() => setCapturedImage(null)}
          />
        );
    }
  };

  return (
    <div className="relative">
      {renderActiveView()}
      <BottomNavigation 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        capturedImage={capturedImage}
        onSaveCapture={() => {
          if (capturedImage) {
            // Save to IndexedDB
            const openDB = (): Promise<IDBDatabase> => {
              return new Promise((resolve, reject) => {
                const request = indexedDB.open('BestiePhotos', 2);
                request.onerror = () => reject(request.error);
                request.onsuccess = () => resolve(request.result);
                request.onupgradeneeded = (event) => {
                  const db = (event.target as IDBOpenDBRequest).result;
                  if (db.objectStoreNames.contains('photos')) {
                    db.deleteObjectStore('photos');
                  }
                  db.createObjectStore('photos', { keyPath: 'id', autoIncrement: true });
                };
              });
            };

            openDB().then(db => {
              const timestamp = Date.now();
              const tx = db.transaction('photos', 'readwrite');
              return tx.objectStore('photos').add({
                id: timestamp,
                blob: capturedImage.blob,
                timestamp: timestamp
              });
            }).then(() => {
              setCapturedImage(null);
              setActiveTab('memories');
            }).catch(err => {
              console.error('Failed to save photo:', err);
            });
          }
        }}
        onTagCapture={() => {
          // TODO: Implement tagging functionality
          console.log('Tag photo');
        }}
        onCloseCapture={() => setCapturedImage(null)}
      />
    </div>
  );
};

export default MainApp;