# Phase 2: Notifications & Sound

Add system notifications and audio feedback when the timer completes.

## What You'll Add
- macOS system notifications when timer ends
- Subtle audio chime on completion
- Permission handling for notifications

---

## Step 1: Install Notification Plugin

Tauri uses plugins for system features. We need the notification plugin.

### 1.1 Install JavaScript Package
```bash
bun add @tauri-apps/plugin-notification
```

### 1.2 Install Rust Crate
```bash
cd src-tauri
cargo add tauri-plugin-notification
cd ..
```

### 1.3 Register Plugin in Rust

Edit `src-tauri/src/main.rs`. Add the plugin to the builder:

```rust
fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())  // Add this line
        .setup(|app| {
            // ... existing setup code
        })
        // ... rest of builder
}
```

### 1.4 Add Permission

Edit `src-tauri/capabilities/default.json`. Add notification permission:

```json
{
  "permissions": [
    "core:default",
    "core:window:allow-hide",
    "core:window:allow-show",
    "core:window:allow-set-focus",
    "core:window:allow-is-visible",
    "core:event:default",
    "notification:default",
    "opener:default"
  ]
}
```

---

## Step 2: Create Audio Utility

We'll use the Web Audio API to generate a pleasant chime programmatically—no sound file needed.

### 2.1 Create Audio Directory
```bash
mkdir -p src/lib
```

### 2.2 Create Audio Utility

Create `src/lib/audio.ts`:

```typescript
/**
 * Generates a pleasant chime sound using Web Audio API
 * No external sound file needed
 */
export function playCompletionSound() {
  const audioContext = new AudioContext();

  // Create oscillator for the tone
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  // Connect nodes
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  // Configure sound - a pleasant bell-like tone
  oscillator.frequency.value = 830; // High C note
  oscillator.type = 'sine';

  // Configure volume envelope (fade in/out for smoothness)
  const now = audioContext.currentTime;
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01); // Quick fade in
  gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5); // Slow fade out

  // Play for 0.5 seconds
  oscillator.start(now);
  oscillator.stop(now + 0.5);

  // Cleanup
  oscillator.onended = () => {
    audioContext.close();
  };
}

/**
 * Play a double-chime for work session completion (more noticeable)
 */
export function playWorkCompleteSound() {
  playCompletionSound();
  setTimeout(() => playCompletionSound(), 150);
}

/**
 * Play a single soft chime for break completion
 */
export function playBreakCompleteSound() {
  const audioContext = new AudioContext();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  // Lower, softer tone for breaks
  oscillator.frequency.value = 523; // Middle C
  oscillator.type = 'sine';

  const now = audioContext.currentTime;
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(0.2, now + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

  oscillator.start(now);
  oscillator.stop(now + 0.4);

  oscillator.onended = () => {
    audioContext.close();
  };
}
```

**What this does:**
- Uses Web Audio API to synthesize tones (no sound files needed)
- `playWorkCompleteSound()` - Double chime for work sessions
- `playBreakCompleteSound()` - Softer single chime for breaks
- Tones fade in/out smoothly to sound pleasant, not jarring

---

## Step 3: Create Notification Utility

Create `src/lib/notifications.ts`:

```typescript
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from '@tauri-apps/plugin-notification';

let permissionGranted = false;

/**
 * Check and request notification permission
 * Call this on app startup
 */
export async function initNotifications(): Promise<boolean> {
  permissionGranted = await isPermissionGranted();

  if (!permissionGranted) {
    const permission = await requestPermission();
    permissionGranted = permission === 'granted';
  }

  return permissionGranted;
}

/**
 * Send a notification for timer completion
 */
export async function notifyTimerComplete(mode: 'work' | 'shortBreak' | 'longBreak') {
  if (!permissionGranted) {
    permissionGranted = await isPermissionGranted();
  }

  if (!permissionGranted) return;

  const titles = {
    work: 'Focus session complete!',
    shortBreak: 'Break is over',
    longBreak: 'Long break is over',
  };

  const bodies = {
    work: 'Time for a break. Great work!',
    shortBreak: 'Ready to focus again?',
    longBreak: 'Ready to get back to work?',
  };

  sendNotification({
    title: titles[mode],
    body: bodies[mode],
  });
}
```

---

## Step 4: Update Timer Component

Now wire everything together in the Timer component.

### 4.1 Update Timer.tsx

Edit `src/components/Timer.tsx`:

```typescript
import { useEffect } from 'react';
import { useTimerStore } from '../stores/timerStore';
import { invoke } from '@tauri-apps/api/core';
import { playWorkCompleteSound, playBreakCompleteSound } from '../lib/audio';
import { initNotifications, notifyTimerComplete } from '../lib/notifications';

export function Timer() {
  const { mode, status, remainingSeconds, start, pause, reset, tick, setMode } = useTimerStore();

  // Format seconds as MM:SS
  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Initialize notifications on mount
  useEffect(() => {
    initNotifications();
  }, []);

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
      // Play sound based on completed mode
      if (mode === 'work') {
        playWorkCompleteSound();
      } else {
        playBreakCompleteSound();
      }

      // Send notification
      notifyTimerComplete(mode);

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

export default Timer;
```

---

## Step 5: Test It

### 5.1 Restart Dev Server
```bash
bun run tauri dev
```

### 5.2 Test Notification Permission
- First run should prompt for notification permission
- Grant it when asked

### 5.3 Test Timer Completion
- Set a short duration for testing (or wait for timer to complete)
- You should hear a chime and see a macOS notification

### 5.4 Quick Test (Optional)
To test without waiting, temporarily change the work duration in `src/stores/timerStore.ts`:

```typescript
const DURATIONS: Record<TimerMode, number> = {
  work: 5,              // 5 seconds for testing
  shortBreak: 3,        // 3 seconds for testing
  longBreak: 15 * 60,
};
```

Remember to change it back after testing!

---

## Troubleshooting

### No Sound
- Check system volume
- Check if browser/webview has audio permissions
- Try clicking in the app first (some browsers require user interaction before playing audio)

### No Notification
- Check System Preferences → Notifications → Pomo
- Make sure you granted permission when prompted
- Check console for errors

### Plugin Not Found Error
- Make sure you ran both `bun add` and `cargo add`
- Make sure you registered the plugin in `main.rs`
- Restart the dev server after adding plugins

---

## File Summary

Files created:
- `src/lib/audio.ts` - Sound generation
- `src/lib/notifications.ts` - Notification handling

Files modified:
- `src-tauri/Cargo.toml` - Added notification plugin
- `src-tauri/src/main.rs` - Registered plugin
- `src-tauri/capabilities/default.json` - Added permission
- `src/components/Timer.tsx` - Trigger sound + notification

---

## What's Next?

Phase 3 options:
- **Custom Durations** - Let users set their own work/break times
- **Keyboard Shortcuts** - Global hotkeys to start/pause
- **Session History** - Track completed sessions
