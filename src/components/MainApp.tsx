import { useState, useEffect, useRef } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import CameraView from './CameraView';
import MemoriesView from './MemoriesView';
import ChatView from './ChatView';
import GoalDetailView from './GoalDetailView';
import NoteDetailView from './NoteDetailView';
import PlannerView from './PlannerView';
import BottomNavigation from './BottomNavigation';
import TagGoalDialog from './TagGoalDialog';
import useNotifications from '@/hooks/useNotifications';
import { Note } from './Dashboard';

const MainApp = () => {
  const [activeTab, setActiveTab] = useState<'schedule' | 'bestie' | 'capture' | 'memories'>('capture');
  const [currentView, setCurrentView] = useState<'main' | 'goal-detail' | 'note-detail'>('main');
  const [plannerTab, setPlannerTab] = useState<'schedule' | 'goals' | 'notes'>('schedule');
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [capturedImage, setCapturedImage] = useState<{ dataUrl: string; blob: Blob } | null>(null);
  const [showTagDialog, setShowTagDialog] = useState(false);
  const [plannerAddMenuRequest, setPlannerAddMenuRequest] = useState(0);

  // Simple in-app navigation stack so Android back goes to the actual previous screen.
  type NavSnapshot = {
    activeTab: 'schedule' | 'bestie' | 'capture' | 'memories';
    currentView: 'main' | 'goal-detail' | 'note-detail';
    plannerTab: 'schedule' | 'goals' | 'notes';
    selectedGoalId: string | null;
    selectedNote: Note | null;
  };

  const navStackRef = useRef<NavSnapshot[]>([]);

  const getSnapshot = (): NavSnapshot => ({
    activeTab,
    currentView,
    plannerTab,
    selectedGoalId,
    selectedNote,
  });

  const isSameSnapshot = (a: NavSnapshot, b: NavSnapshot) =>
    a.activeTab === b.activeTab &&
    a.currentView === b.currentView &&
    a.plannerTab === b.plannerTab &&
    a.selectedGoalId === b.selectedGoalId &&
    a.selectedNote?.id === b.selectedNote?.id;

  const pushSnapshot = (next: NavSnapshot) => {
    const stack = navStackRef.current;
    const last = stack[stack.length - 1];
    if (!last || !isSameSnapshot(last, next)) {
      stack.push(next);
    }
  };

  const restoreSnapshot = (snap: NavSnapshot) => {
    setActiveTab(snap.activeTab);
    setCurrentView(snap.currentView);
    setPlannerTab(snap.plannerTab);
    setSelectedGoalId(snap.selectedGoalId);
    setSelectedNote(snap.selectedNote);
  };

  const goBack = () => {
    // Photo review flow is special (can't restore blob from history). Treat as the top-most modal.
    if (capturedImage) {
      setCapturedImage(null);
      return;
    }

    const stack = navStackRef.current;

    // If we don't have history, fall back to old behavior.
    if (stack.length <= 1) {
      CapacitorApp.exitApp();
      return;
    }

    // Pop current snapshot, restore previous.
    stack.pop();
    const prev = stack[stack.length - 1];
    if (prev) restoreSnapshot(prev);
  };

  // Initialize notifications
  useNotifications();

  // Bootstrap the nav stack with the initial state once.
  useEffect(() => {
    if (navStackRef.current.length === 0) {
      navStackRef.current.push(getSnapshot());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep nav stack in sync with navigation state
  useEffect(() => {
    pushSnapshot(getSnapshot());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, currentView, plannerTab, selectedGoalId, selectedNote]);

  // Handle Android hardware back button
  useEffect(() => {
    let backButtonListener: { remove: () => void } | null = null;

    const setupBackHandler = async () => {
      try {
        backButtonListener = await CapacitorApp.addListener('backButton', () => {
          goBack();
        });
      } catch (error) {
        console.log('Capacitor back button not available');
      }
    };

    setupBackHandler();

    return () => {
      if (backButtonListener) {
        backButtonListener.remove();
      }
    };
  }, [capturedImage]);

  const renderActiveView = () => {
    // Handle goal detail view
    if (currentView === 'goal-detail' && selectedGoalId) {
      return (
        <GoalDetailView
          goalId={selectedGoalId}
          onBack={goBack}
        />
      );
    }

    // Handle note detail view
    if (currentView === 'note-detail' && selectedNote) {
      return (
        <NoteDetailView
          note={selectedNote}
          onBack={goBack}
          onEdit={(note) => {
            // Go back to planner notes tab where edit dialog will be triggered
            setPlannerTab('notes');
            setCurrentView('main');
            setActiveTab('schedule');
            // Use a timeout to ensure the tab is switched before triggering edit
            setTimeout(() => {
              // Dispatch a custom event to trigger edit in PlannerView
              window.dispatchEvent(new CustomEvent('edit-note', { detail: note }));
            }, 100);
          }}
          onDelete={(noteId) => {
            // Update localStorage
            const savedNotes = localStorage.getItem('companion-notes');
            if (savedNotes) {
              const notes = JSON.parse(savedNotes);
              const updatedNotes = notes.filter((n: Note) => n.id !== noteId);
              localStorage.setItem('companion-notes', JSON.stringify(updatedNotes));
            }
          }}
        />
      );
    }

    // Handle main tab views
    switch (activeTab) {
      case 'schedule':
        return (
          <PlannerView
            addMenuRequest={plannerAddMenuRequest}
            activeTab={plannerTab}
            onActiveTabChange={setPlannerTab}
            onViewGoalDetail={(goalId) => {
              setPlannerTab('goals');
              setSelectedGoalId(goalId);
              setCurrentView('goal-detail');
            }}
            onViewGoalChat={(goalId) => {
              setPlannerTab('goals');
              setSelectedGoalId(goalId);
              setCurrentView('goal-detail');
            }}
            onViewNote={(note) => {
              setPlannerTab('notes');
              setSelectedNote(note);
              setCurrentView('note-detail');
            }}
          />
        );
      case 'bestie':
        return <ChatView onBack={goBack} />;
      case 'capture':
        return (
          <CameraView
            onOpenGoals={() => {
              setPlannerTab('goals');
              setActiveTab('schedule');
            }}
            onOpenNotes={() => {
              setPlannerTab('notes');
              setActiveTab('schedule');
            }}
            onSaveMemory={() => setActiveTab('memories')}
            onCapture={setCapturedImage}
            onCloseCapture={() => setCapturedImage(null)}
            onViewGoalDetail={(goalId) => {
              setPlannerTab('goals');
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
            onOpenGoals={() => {
              setPlannerTab('goals');
              setActiveTab('schedule');
            }}
            onOpenNotes={() => {
              setPlannerTab('notes');
              setActiveTab('schedule');
            }}
            onSaveMemory={() => setActiveTab('memories')}
            onCapture={setCapturedImage}
            onCloseCapture={() => setCapturedImage(null)}
            onViewGoalDetail={(goalId) => {
              setPlannerTab('goals');
              setSelectedGoalId(goalId);
              setCurrentView('goal-detail');
            }}
          />
        );
    }
  };

  // Close planner FAB menu when navigating away from schedule tab
  const handleTabChange = (tab: 'schedule' | 'bestie' | 'capture' | 'memories') => {
    setCurrentView('main');
    // Reset the add menu request when leaving schedule to ensure FAB closes
    if (tab !== 'schedule') {
      setPlannerAddMenuRequest(0);
    }
    setActiveTab(tab);
  };

  return (
    <div className="relative safe-area-pt">
      {renderActiveView()}
      <BottomNavigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onAddPress={() => {
          setCurrentView('main');
          setActiveTab('schedule');
          setPlannerAddMenuRequest((n) => n + 1);
        }}
        capturedImage={capturedImage}
        onSaveCapture={() => {
          if (capturedImage) {
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

            openDB()
              .then((db) => {
                const timestamp = Date.now();
                const tx = db.transaction('photos', 'readwrite');
                return tx.objectStore('photos').add({
                  id: timestamp,
                  blob: capturedImage.blob,
                  timestamp: timestamp,
                });
              })
              .then(() => {
                setCapturedImage(null);
                setActiveTab('memories');
              })
              .catch((err) => {
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
        onSelectGoal={(goalId, dayNumber) => {
          if (capturedImage) {
            const storedGoals = localStorage.getItem('bestie-goals');
            if (storedGoals) {
              const goals = JSON.parse(storedGoals);
              const goalIndex = goals.findIndex((g: any) => g.id === goalId);
              
              if (goalIndex !== -1) {
                const goal = goals[goalIndex];
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                const alreadyCompleted = goal.completedDates.some((date: string) => {
                  const completedDate = new Date(date);
                  completedDate.setHours(0, 0, 0, 0);
                  return completedDate.getTime() === today.getTime();
                });
                
                if (!alreadyCompleted) {
                  const newCompletedDates = [...goal.completedDates, new Date()];
                  
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
                goalId: goalId,
                dayNumber: dayNumber // Save the day number with the photo
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
