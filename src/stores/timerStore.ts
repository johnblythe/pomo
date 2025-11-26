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