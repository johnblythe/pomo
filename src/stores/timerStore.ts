import { create } from 'zustand';
import { useSettingsStore } from './settingsStore';

export type TimerMode = 'work' | 'shortBreak' | 'longBreak';
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
  syncWithSettings: () => void;
}

// Helper to get duration from settings
const getDuration = (mode: TimerMode): number => {
    const { durations } = useSettingsStore.getState();
    return durations[mode] * 60; // Convert minutes to seconds
};

export const useTimerStore = create<TimerState>((set, get) => ({
    mode: 'work',
    status: 'idle',
    remainingSeconds: 25 * 60, // Default, will be synced

    start: () => set({ status: 'running' }),

    pause: () => set({ status: 'paused' }),

    reset: () => set((state) => ({
        status: 'idle',
        remainingSeconds: getDuration(state.mode),
    })),

    tick: () => {
        const { remainingSeconds, status } = get();
        if (status === 'running' && remainingSeconds > 0) {
            set({ remainingSeconds: remainingSeconds - 1 });
        }
    },

    setMode: (mode) => set({
        mode,
        remainingSeconds: getDuration(mode),
        status: 'idle',
    }),

    syncWithSettings: () => {
        const { mode, status } = get();
        // Only sync if idle (don't interrupt running timer)
        if (status === 'idle') {
            set({ remainingSeconds: getDuration(mode) });
        }
    },
}));