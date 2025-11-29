import { create } from 'zustand';
import { load, Store } from '@tauri-apps/plugin-store';

export interface DurationSettings {
    work: number;        // minutes
    shortBreak: number;  // minutes
    longBreak: number;   // minutes
}

interface SettingsState {
    durations: DurationSettings;
    isLoaded: boolean;

    // Actions
    setDuration: (mode: keyof DurationSettings, minutes: number) => void;
    resetToDefaults: () => void;
    loadSettings: () => Promise<void>;
}

const DEFAULT_DURATIONS: DurationSettings = {
    work: 25,
    shortBreak: 5,
    longBreak: 15,
};

let store: Store | null = null;

const getStore = async (): Promise<Store> => {
    if (!store) {
        store = await load('settings.json', { autoSave: true });
    }
    return store;
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
    durations: { ...DEFAULT_DURATIONS },
    isLoaded: false,

    setDuration: async (mode, minutes) => {
        const clamped = Math.max(1, Math.min(mode === 'work' ? 60 : 30, minutes));
        const newDurations = { ...get().durations, [mode]: clamped };
        set({ durations: newDurations });

        const s = await getStore();
        await s.set('durations', newDurations);
    },

    resetToDefaults: async () => {
        set({ durations: { ...DEFAULT_DURATIONS } });
        const s = await getStore();
        await s.set('durations', DEFAULT_DURATIONS);
    },

    loadSettings: async () => {
        try {
            const s = await getStore();
            const saved = await s.get<DurationSettings>('durations');
            if (saved) {
                set({ durations: saved, isLoaded: true });
            } else {
                set({ isLoaded: true });
            }
        } catch (e) {
            console.error('Failed to load settings:', e);
            set({ isLoaded: true });
        }
    },
}));
