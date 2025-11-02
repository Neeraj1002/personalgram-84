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
            onOpenChat={() => setActiveTab('bestie')}
            onOpenNotes={() => setCurrentView('notes')}
          />
        );
      case 'memories':
        return <MemoriesView />;
      default:
        return (
          <CameraView 
            onOpenChat={() => setActiveTab('bestie')}
            onOpenNotes={() => setCurrentView('notes')}
          />
        );
    }
  };

  return (
    <div className="relative">
      {renderActiveView()}
      {/* Only show bottom navigation on main views */}
      {(currentView === 'main' && activeTab !== 'bestie') && (
        <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      )}
    </div>
  );
};

export default MainApp;