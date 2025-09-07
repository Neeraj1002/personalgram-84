import { useState } from 'react';
import CameraView from './CameraView';
import Dashboard from './Dashboard';
import MemoriesView from './MemoriesView';
import ChatView from './ChatView';
import NotesView from './NotesView';
import BottomNavigation from './BottomNavigation';

const MainApp = () => {
  const [activeTab, setActiveTab] = useState<'goals' | 'capture' | 'memories'>('capture');
  const [currentView, setCurrentView] = useState<'main' | 'chat' | 'notes'>('main');

  const renderActiveView = () => {
    // Handle overlay views first
    if (currentView === 'chat') {
      return <ChatView onBack={() => setCurrentView('main')} />;
    }
    if (currentView === 'notes') {
      return <NotesView onBack={() => setCurrentView('main')} />;
    }

    // Handle main tab views
    switch (activeTab) {
      case 'goals':
        return <Dashboard />;
      case 'capture':
        return (
          <CameraView 
            onOpenChat={() => setCurrentView('chat')}
            onOpenNotes={() => setCurrentView('notes')}
          />
        );
      case 'memories':
        return <MemoriesView />;
      default:
        return (
          <CameraView 
            onOpenChat={() => setCurrentView('chat')}
            onOpenNotes={() => setCurrentView('notes')}
          />
        );
    }
  };

  return (
    <div className="relative">
      {renderActiveView()}
      {/* Only show bottom navigation on main views */}
      {currentView === 'main' && (
        <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      )}
    </div>
  );
};

export default MainApp;