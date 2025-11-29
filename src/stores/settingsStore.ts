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
        const maxValues = { work: 60, shortBreak: 30, longBreak: 60 };
        const clamped = Math.max(1, Math.min(maxValues[mode], minutes));
        const newDurations = { ...get().durations, [mode]: clamped };
        set({ durations: newDurations });

        try {
            const s = await getStore();
            await s.set('durations', newDurations);
        } catch (error) {
            console.error('Failed to save duration settings:', error);
            // Settings changed in UI but won't persist - user will see on next restart
        }
    },

    resetToDefaults: async () => {
        set({ durations: { ...DEFAULT_DURATIONS } });
        try {
            const s = await getStore();
            await s.set('durations', DEFAULT_DURATIONS);
        } catch (error) {
            console.error('Failed to save default settings:', error);
            // Reset shown in UI but won't persist
        }
    },

    loadSettings: async () => {
        try {
            const s = await getStore();
            const saved = await s.get<DurationSettings>('durations');
            set({ durations: saved ?? DEFAULT_DURATIONS, isLoaded: true });
        } catch (error) {
            console.warn('Settings file not found or corrupted, using defaults:', error);
            set({ durations: DEFAULT_DURATIONS, isLoaded: true });
        }
    },
}));
