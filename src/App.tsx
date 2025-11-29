import { useEffect, useState } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { Timer } from './components/Timer';
import { Settings } from './components/Settings';
import { Stats } from './components/Stats';
import { useSettingsStore } from './stores/settingsStore';
import { useTimerStore } from './stores/timerStore';
import './App.css';

type View = 'timer' | 'settings' | 'stats';

function App() {
  const [view, setView] = useState<View>('timer');
  const { loadSettings, isLoaded } = useSettingsStore();
  const syncWithSettings = useTimerStore((s) => s.syncWithSettings);

  // Load settings on mount
  useEffect(() => {
    loadSettings().then(() => {
      syncWithSettings();
    });
  }, []);

  // Hide window when clicking outside (blur)
  useEffect(() => {
    const currentWindow = getCurrentWindow();
    const unlisten = currentWindow.onFocusChanged(({ payload: focused }) => {
      if (!focused) {
        currentWindow.hide();
      }
    });

    return () => {
      unlisten.then(fn => fn());
    };
  }, []);

  if (!isLoaded) {
    return <div className="app">Loading...</div>;
  }

  return (
    <div className="app" data-tauri-drag-region>
      {view === 'settings' && <Settings onClose={() => setView('timer')} />}
      {view === 'stats' && <Stats onClose={() => setView('timer')} />}
      {view === 'timer' && (
        <>
          <Timer />
          <div className="nav-buttons">
            <button className="nav-btn" onClick={() => setView('stats')}>
              📊
            </button>
            <button className="nav-btn" onClick={() => setView('settings')}>
              ⚙
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default App;