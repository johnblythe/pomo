import { useEffect } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { Timer } from './components/Timer';
import './App.css';

function App() {
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

  return (
    <div className="app">
      <Timer />
    </div>
  );
}

export default App;