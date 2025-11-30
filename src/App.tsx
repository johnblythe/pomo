import { useEffect, useState } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { listen } from '@tauri-apps/api/event';
import { Timer } from './components/Timer';
import { Settings } from './components/Settings';
import { Stats } from './components/Stats';
import { useSettingsStore } from './stores/settingsStore';
import { useTimerStore } from './stores/timerStore';
import './App.css';

type View = 'timer' | 'settings' | 'stats';

function App() {
  const [view, setView] = useState<View>('timer');
  const { loadSettings, isLoaded, theme } = useSettingsStore();
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

  // Register global shortcut listeners
  useEffect(() => {
    const unlisteners: Array<() => void> = [];

    const setupShortcuts = async () => {
      const unlisten1 = await listen('shortcut-startWork', () => {
        const { reset, setMode, start } = useTimerStore.getState();

        // Reset timer, switch to work mode, then start
        // Same as clicking: Reset → Work mode → Start
        reset();
        setTimeout(() => {
          setMode('work');
          setTimeout(() => start(), 10);
        }, 10);
      });

      const unlisten2 = await listen('shortcut-pause', () => {
        const { status, start, pause } = useTimerStore.getState();
        // Same as clicking the Pause or Start button
        if (status === 'running') {
          pause();
        } else {
          start();
        }
      });

      const unlisten3 = await listen('shortcut-startBreak', () => {
        const { reset, setMode, start } = useTimerStore.getState();
        const { workSessionCount } = useSettingsStore.getState();

        // Smart break selection
        const breakMode = workSessionCount >= 4 ? 'longBreak' : 'shortBreak';

        // Reset timer, switch to break mode, then start
        // Same as clicking: Reset → Break mode → Start
        reset();
        setTimeout(() => {
          setMode(breakMode);
          setTimeout(() => start(), 10);
        }, 10);
      });

      unlisteners.push(unlisten1, unlisten2, unlisten3);
    };

    setupShortcuts();
    return () => unlisteners.forEach(fn => fn());
  }, []);

  if (!isLoaded) {
    return <div className="app">Loading...</div>;
  }

  return (
    <div className="app" data-tauri-drag-region data-theme={theme}>
      {/* Timer always mounted to keep countdown running */}
      <div style={{ display: view === 'timer' ? 'contents' : 'none' }}>
        <Timer />
        <div className="nav-buttons">
          <button className="nav-btn" onClick={() => setView('stats')}>
            📊
          </button>
          <button className="nav-btn" onClick={() => setView('settings')}>
            ⚙
          </button>
        </div>
      </div>

      {view === 'settings' && <Settings onClose={() => setView('timer')} />}
      {view === 'stats' && <Stats onClose={() => setView('timer')} />}
    </div>
  );
}

export default App;