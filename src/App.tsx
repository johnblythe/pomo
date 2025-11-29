import { useEffect, useState } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { Timer } from './components/Timer';
import { Settings } from './components/Settings';
import { useSettingsStore } from './stores/settingsStore';
import { useTimerStore } from './stores/timerStore';
import './App.css';

function App() {
  const [showSettings, setShowSettings] = useState(false);
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
    <div className="app">
      {showSettings ? (
        <Settings onClose={() => setShowSettings(false)} />
      ) : (
        <>
          <Timer />
          <button className="settings-toggle" onClick={() => setShowSettings(true)}>
            ⚙
          </button>
        </>
      )}
    </div>
  );
}

export default App;