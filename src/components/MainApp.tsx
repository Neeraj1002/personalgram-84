import { useState, useEffect, useCallback } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import CameraView from './CameraView';
import Dashboard from './Dashboard';
import MemoriesView from './MemoriesView';
import ChatView from './ChatView';
import NotesView from './NotesView';
import GoalDetailView from './GoalDetailView';
import ScheduleView from './ScheduleView';
import BottomNavigation from './BottomNavigation';
import TagGoalDialog from './TagGoalDialog';
import useNotifications from '@/hooks/useNotifications';

const MainApp = () => {
  const [activeTab, setActiveTab] = useState<'schedule' | 'bestie' | 'capture' | 'memories' | 'notes'>('capture');
  const [currentView, setCurrentView] = useState<'main' | 'notes' | 'goals' | 'goal-detail'>('main');
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<{ dataUrl: string; blob: Blob } | null>(null);
  const [showTagDialog, setShowTagDialog] = useState(false);

  // Initialize notifications
  useNotifications();

  // Handle Android hardware back button
  useEffect(() => {
    let backButtonListener: { remove: () => void } | null = null;

    const setupBackHandler = async () => {
      try {
        backButtonListener = await CapacitorApp.addListener('backButton', ({ canGoBack }) => {
          // Handle captured image first
          if (capturedImage) {
            setCapturedImage(null);
            return;
          }

          // Handle overlay views
          if (currentView === 'goal-detail') {
            setCurrentView('goals');
            return;
          }

          if (currentView === 'goals') {
            setCurrentView('main');
            return;
          }

          // If on notes tab, go to capture
          if (activeTab === 'notes') {
            setActiveTab('capture');
            return;
          }

          // If on main view but not on capture tab, go to capture
          if (activeTab !== 'capture') {
            setActiveTab('capture');
            return;
          }

          // If on capture tab and main view, exit app
          CapacitorApp.exitApp();
        });
      } catch (error) {
        // Capacitor not available (web context)
        console.log('Capacitor back button not available');
      }
    };

    setupBackHandler();

    return () => {
      if (backButtonListener) {
        backButtonListener.remove();
      }
    };
  }, [currentView, activeTab, capturedImage]);

  const renderActiveView = () => {
    // Handle notes tab from footer
    if (activeTab === 'notes') {
      return <NotesView onBack={() => setActiveTab('capture')} />;
    }

    // Handle overlay views
    if (currentView === 'goals') {
      return (
        <Dashboard 
          onBack={() => setCurrentView('main')}
          onViewGoalDetail={(goalId) => {
            setSelectedGoalId(goalId);
            setCurrentView('goal-detail');
          }}
          onNavigateToSchedule={() => {
            setCurrentView('main');
            setActiveTab('schedule');
          }}
        />
      );
    }

    if (currentView === 'goal-detail' && selectedGoalId) {
      return (
        <GoalDetailView 
          goalId={selectedGoalId}
          onBack={() => setCurrentView('goals')}
        />
      );
    }

    // Handle main tab views
    switch (activeTab) {
      case 'schedule':
        return <ScheduleView />;
      case 'bestie':
        return <ChatView onBack={() => setActiveTab('capture')} />;
      case 'capture':
        return (
          <CameraView 
            onOpenGoals={() => setCurrentView('goals')}
            onOpenNotes={() => setActiveTab('notes')}
            onSaveMemory={() => setActiveTab('memories')}
            onCapture={setCapturedImage}
            onCloseCapture={() => setCapturedImage(null)}
            onViewGoalDetail={(goalId) => {
              setSelectedGoalId(goalId);
              setCurrentView('goal-detail');
            }}
          />
        );
      case 'memories':
        return <MemoriesView />;
      default:
        return (
          <CameraView 
            onOpenGoals={() => setCurrentView('goals')}
            onOpenNotes={() => setActiveTab('notes')}
            onSaveMemory={() => setActiveTab('memories')}
            onCapture={setCapturedImage}
            onCloseCapture={() => setCapturedImage(null)}
            onViewGoalDetail={(goalId) => {
              setSelectedGoalId(goalId);
              setCurrentView('goal-detail');
            }}
          />
        );
    }
  };

  return (
    <div className="relative safe-area-pt">
      {renderActiveView()}
      <BottomNavigation 
        activeTab={activeTab} 
        onTabChange={(tab) => {
          setCurrentView('main');
          setActiveTab(tab);
        }}
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
          onTagCapture={() => setShowTagDialog(true)}
          onCloseCapture={() => setCapturedImage(null)}
        />
      <TagGoalDialog 
        open={showTagDialog}
        onOpenChange={setShowTagDialog}
        onSelectGoal={(goalId) => {
          if (capturedImage) {
            // Update goal streak
            const storedGoals = localStorage.getItem('bestie-goals');
            if (storedGoals) {
              const goals = JSON.parse(storedGoals);
              const goalIndex = goals.findIndex((g: any) => g.id === goalId);
              
              if (goalIndex !== -1) {
                const goal = goals[goalIndex];
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                // Check if already completed today
                const alreadyCompleted = goal.completedDates.some((date: string) => {
                  const completedDate = new Date(date);
                  completedDate.setHours(0, 0, 0, 0);
                  return completedDate.getTime() === today.getTime();
                });
                
                if (!alreadyCompleted) {
                  const newCompletedDates = [...goal.completedDates, new Date()];
                  
                  // Check if completed yesterday for streak
                  const yesterday = new Date(today);
                  yesterday.setDate(yesterday.getDate() - 1);
                  
                  const hasYesterday = goal.completedDates.some((date: string) => {
                    const completedDate = new Date(date);
                    completedDate.setHours(0, 0, 0, 0);
                    return completedDate.getTime() === yesterday.getTime();
                  });
                  
                  const newStreak = hasYesterday ? goal.streak + 1 : 1;
                  
                  goals[goalIndex] = {
                    ...goal,
                    completedDates: newCompletedDates,
                    lastCompleted: new Date(),
                    streak: newStreak
                  };
                  
                  localStorage.setItem('bestie-goals', JSON.stringify(goals));
                }
              }
            }

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
                timestamp: timestamp,
                goalId: goalId
              });
            }).then(() => {
              setCapturedImage(null);
              setActiveTab('memories');
            }).catch(err => {
              console.error('Failed to save photo:', err);
            });
          }
        }}
      />
    </div>
  );
};

export default MainApp;