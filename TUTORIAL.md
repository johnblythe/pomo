# Build a Pomodoro Menu Bar App with Tauri

A step-by-step guide to building a macOS menu bar timer from scratch.

## What You'll Build
- A lightweight (~10MB) menu bar app
- Countdown timer visible directly in the menu bar
- Click to open popup with controls
- No dock icon - lives only in menu bar

## Tech Stack
| Tool | Purpose |
|------|---------|
| Tauri 2.0 | Native app framework (Rust backend, web frontend) |
| React + TypeScript | UI |
| Zustand | State management |
| Vite | Build tool |

### Why Tauri over Electron?
- **Size:** ~10MB vs ~150MB
- **Memory:** Uses system webview, not bundled Chromium
- **Battery:** Better for always-running menu bar apps
- You write TypeScript; Rust handles system APIs

---

## Step 1: Install Prerequisites

### 1.1 Install Rust
Tauri's backend is Rust. You won't write much Rust, but need the toolchain.

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

Follow prompts, then reload your shell:
```bash
source ~/.cargo/env
```

### 1.2 Verify Installations
```bash
rustc --version   # Should show 1.70+
cargo --version   # Rust's package manager
node --version    # Need 18+
```

**Troubleshooting:**
- If `rustc` not found: restart terminal or run `source ~/.cargo/env`
- Need Node 18+? Use `nvm install 18`

---

## Step 2: Create Tauri Project

### 2.1 Scaffold the App
```bash
npm create tauri-app@latest pomo -- --template react-ts
```

This creates a new directory `pomo/` with:
- React frontend in `src/`
- Rust backend in `src-tauri/`

### 2.2 Install Dependencies
```bash
cd pomo
npm install
npm install zustand   # State management
```

### 2.3 Test the Scaffold
```bash
npm run tauri dev
```

**Expected:** A desktop window opens with Tauri + React logos. This confirms everything works. Close it and continue.

**First run is slow** (~2-5 min) - Rust compiles dependencies. Subsequent runs are fast.

---

## Step 3: Configure as Menu Bar App

We'll convert from a regular window app to a menu bar-only app.

### 3.1 Enable Tray Icon Feature

Edit `src-tauri/Cargo.toml`. Find the `[dependencies]` section and update the tauri line:

```toml
[dependencies]
tauri = { version = "2", features = ["tray-icon"] }
```

### 3.2 Configure App Settings

Replace the contents of `src-tauri/tauri.conf.json`:

```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "Pomo",
  "version": "0.1.0",
  "identifier": "com.pomo.app",
  "build": {
    "beforeDevCommand": "npm run dev",
    "devUrl": "http://localhost:1420",
    "beforeBuildCommand": "npm run build",
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [
      {
        "title": "Pomo",
        "width": 300,
        "height": 200,
        "visible": false,
        "resizable": false,
        "decorations": false,
        "alwaysOnTop": true,
        "skipTaskbar": true
      }
    ],
    "trayIcon": {
      "iconPath": "icons/32x32.png",
      "iconAsTemplate": true
    },
    "macOSPrivateApi": true
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ],
    "macOS": {
      "minimumSystemVersion": "10.13"
    }
  }
}
```

**Key settings explained:**
- `visible: false` - Window hidden on launch
- `decorations: false` - No title bar
- `alwaysOnTop: true` - Popup stays above other windows
- `trayIcon` - Enables menu bar icon
- `iconAsTemplate: true` - Icon adapts to light/dark menu bar

### 3.3 Add LSUIElement to Info.plist

Create `src-tauri/Info.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>LSUIElement</key>
    <true/>
</dict>
</plist>
```

This hides the dock icon.

### 3.4 Set Up Tray Behavior

Replace `src-tauri/src/main.rs`:

```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{
    tray::TrayIconBuilder,
    Manager,
};

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // Build tray icon
            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .title("25:00")
                .on_tray_icon_event(|tray, event| {
                    use tauri::tray::TrayIconEvent;
                    if let TrayIconEvent::Click { .. } = event {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            if window.is_visible().unwrap_or(false) {
                                let _ = window.hide();
                            } else {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![update_tray_title])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn update_tray_title(app: tauri::AppHandle, title: String) {
    if let Some(tray) = app.tray_by_id("main") {
        let _ = tray.set_title(Some(&title));
    }
}
```

**What this does:**
1. Creates a tray icon showing "25:00"
2. Clicking the icon toggles the popup window
3. Exposes `update_tray_title` command for the frontend to call

---

## Step 4: Create Timer Store

Zustand manages timer state. Create the store:

### 4.1 Create Store Directory
```bash
mkdir -p src/stores
```

### 4.2 Create Timer Store

Create `src/stores/timerStore.ts`:

```typescript
import { create } from 'zustand';

type TimerMode = 'work' | 'shortBreak' | 'longBreak';
type TimerStatus = 'idle' | 'running' | 'paused';

interface TimerState {
  mode: TimerMode;
  status: TimerStatus;
  remainingSeconds: number;

  // Actions
  start: () => void;
  pause: () => void;
  reset: () => void;
  tick: () => void;
  setMode: (mode: TimerMode) => void;
}

const DURATIONS: Record<TimerMode, number> = {
  work: 25 * 60,        // 25 minutes
  shortBreak: 5 * 60,   // 5 minutes
  longBreak: 15 * 60,   // 15 minutes
};

export const useTimerStore = create<TimerState>((set, get) => ({
  mode: 'work',
  status: 'idle',
  remainingSeconds: DURATIONS.work,

  start: () => set({ status: 'running' }),

  pause: () => set({ status: 'paused' }),

  reset: () => set((state) => ({
    status: 'idle',
    remainingSeconds: DURATIONS[state.mode],
  })),

  tick: () => {
    const { remainingSeconds, status } = get();
    if (status === 'running' && remainingSeconds > 0) {
      set({ remainingSeconds: remainingSeconds - 1 });
    }
  },

  setMode: (mode) => set({
    mode,
    remainingSeconds: DURATIONS[mode],
    status: 'idle',
  }),
}));
```

**State shape:**
- `mode`: Current timer type (work/break)
- `status`: idle | running | paused
- `remainingSeconds`: Countdown value

**Actions:**
- `start/pause/reset`: Control playback
- `tick`: Called every second to decrement
- `setMode`: Switch between work/break

---

## Step 5: Create Timer Component

### 5.1 Create Components Directory
```bash
mkdir -p src/components
```

### 5.2 Create Timer Component

Create `src/components/Timer.tsx`:

```typescript
import { useEffect } from 'react';
import { useTimerStore } from '../stores/timerStore';
import { invoke } from '@tauri-apps/api/core';

export function Timer() {
  const { mode, status, remainingSeconds, start, pause, reset, tick, setMode } = useTimerStore();

  // Format seconds as MM:SS
  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Countdown interval
  useEffect(() => {
    if (status !== 'running') return;

    const interval = setInterval(() => {
      tick();
    }, 1000);

    return () => clearInterval(interval);
  }, [status, tick]);

  // Update menu bar title when time changes
  useEffect(() => {
    invoke('update_tray_title', { title: formatTime(remainingSeconds) })
      .catch(console.error);
  }, [remainingSeconds]);

  // Handle timer completion
  useEffect(() => {
    if (remainingSeconds === 0 && status === 'running') {
      // Auto-switch modes
      if (mode === 'work') {
        setMode('shortBreak');
      } else {
        setMode('work');
      }
    }
  }, [remainingSeconds, status, mode, setMode]);

  const modeLabels = {
    work: 'Focus',
    shortBreak: 'Short Break',
    longBreak: 'Long Break',
  };

  return (
    <div className="timer">
      <div className="mode">{modeLabels[mode]}</div>
      <div className="time">{formatTime(remainingSeconds)}</div>

      <div className="controls">
        {status === 'running' ? (
          <button onClick={pause}>Pause</button>
        ) : (
          <button onClick={start}>Start</button>
        )}
        <button onClick={reset}>Reset</button>
      </div>

      <div className="mode-switcher">
        <button
          className={mode === 'work' ? 'active' : ''}
          onClick={() => setMode('work')}
        >
          Work
        </button>
        <button
          className={mode === 'shortBreak' ? 'active' : ''}
          onClick={() => setMode('shortBreak')}
        >
          Short
        </button>
        <button
          className={mode === 'longBreak' ? 'active' : ''}
          onClick={() => setMode('longBreak')}
        >
          Long
        </button>
      </div>
    </div>
  );
}
```

**Key behaviors:**
- `useEffect` with interval runs the countdown
- Calls Rust backend to update menu bar text
- Auto-switches work → break when timer hits 0

---

## Step 6: Wire Up the App

### 6.1 Update App.tsx

Replace `src/App.tsx`:

```typescript
import { Timer } from './components/Timer';
import './App.css';

function App() {
  return (
    <div className="app">
      <Timer />
    </div>
  );
}

export default App;
```

### 6.2 Add Styling

Replace `src/App.css`:

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.app {
  padding: 16px;
  text-align: center;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
  background: #1a1a1a;
  color: #ffffff;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.timer .mode {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
  opacity: 0.6;
  margin-bottom: 4px;
}

.timer .time {
  font-size: 56px;
  font-weight: 200;
  font-variant-numeric: tabular-nums;
  margin-bottom: 16px;
}

.timer .controls {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-bottom: 16px;
}

.timer button {
  padding: 8px 20px;
  border: none;
  border-radius: 6px;
  background: #333;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.15s;
}

.timer button:hover {
  background: #444;
}

.timer .mode-switcher {
  display: flex;
  gap: 4px;
  justify-content: center;
}

.timer .mode-switcher button {
  padding: 4px 12px;
  font-size: 11px;
  background: #222;
}

.timer .mode-switcher button.active {
  background: #0066ff;
}

.timer .mode-switcher button:hover {
  background: #333;
}

.timer .mode-switcher button.active:hover {
  background: #0055dd;
}
```

---

## Step 7: Build and Test

### 7.1 Run Development Build
```bash
npm run tauri dev
```

### 7.2 Expected Behavior
1. **No dock icon** - App doesn't appear in dock
2. **Menu bar shows "25:00"** - Timer text in menu bar
3. **Click menu bar** - Popup window appears
4. **Click Start** - Timer counts down
5. **Menu bar updates** - Shows remaining time
6. **Click outside popup** - Window stays (we'll fix this later)

### 7.3 Troubleshooting

**"Can't find tray icon"**
- Check `src-tauri/icons/` has icon files
- Verify `iconPath` in `tauri.conf.json` matches

**Timer not updating menu bar**
- Check browser console for errors
- Verify `invoke` import is from `@tauri-apps/api/core`

**Dock icon still showing**
- Ensure `Info.plist` has `LSUIElement` set to `true`
- Rebuild: `npm run tauri build`

---

## Step 8: Build for Distribution

### 8.1 Create Release Build
```bash
npm run tauri build
```

Output is in `src-tauri/target/release/bundle/`:
- `macos/Pomo.app` - The app bundle
- `dmg/Pomo_0.1.0_aarch64.dmg` - Installer (if configured)

### 8.2 Run the Built App
```bash
open src-tauri/target/release/bundle/macos/Pomo.app
```

---

## What's Next?

The MVP is complete. Future enhancements:

### Phase 2: Customization
- Custom timer durations
- Round presets (e.g., "4x25min work, 5min breaks")
- Settings persistence

### Phase 3: Notifications & Sound
- System notifications on timer complete
- Subtle audio cues

### Phase 4: History & Analytics
- Track completed sessions
- Daily/weekly stats
- Streak tracking

### Phase 5: Polish
- Global keyboard shortcuts
- Click outside to close popup
- Gamification

---

## Quick Reference

### Project Structure
```
pomo/
├── src/                    # React frontend
│   ├── App.tsx
│   ├── App.css
│   ├── components/
│   │   └── Timer.tsx
│   └── stores/
│       └── timerStore.ts
├── src-tauri/              # Rust backend
│   ├── src/main.rs
│   ├── tauri.conf.json
│   └── icons/
└── package.json
```

### Useful Commands
```bash
npm run tauri dev      # Development with hot reload
npm run tauri build    # Production build
cargo check            # Check Rust code (from src-tauri/)
```

### Tauri Docs
- [Tauri v2 Docs](https://v2.tauri.app/)
- [System Tray](https://v2.tauri.app/learn/system-tray/)
- [Commands](https://v2.tauri.app/develop/calling-rust/)
