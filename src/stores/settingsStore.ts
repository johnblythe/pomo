import { create } from 'zustand';
import { load, Store } from '@tauri-apps/plugin-store';

export type Theme = 'glass' | 'warmth' | 'brutalist';

export interface DurationSettings {
    work: number;        // minutes
    shortBreak: number;  // minutes
    longBreak: number;   // minutes
}

interface SettingsState {
    durations: DurationSettings;
    theme: Theme;
    isLoaded: boolean;

    // Actions
    setDuration: (mode: keyof DurationSettings, minutes: number) => void;
    setTheme: (theme: Theme) => void;
    resetToDefaults: () => void;
    loadSettings: () => Promise<void>;
}

const DEFAULT_DURATIONS: DurationSettings = {
    work: 25,
    shortBreak: 5,
    longBreak: 15,
};

const DEFAULT_THEME: Theme = 'glass';

let store: Store | null = null;

const getStore = async (): Promise<Store> => {
    if (!store) {
        store = await load('settings.json', { autoSave: true });
    }
    return store;
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
    durations: { ...DEFAULT_DURATIONS },
    theme: DEFAULT_THEME,
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

    setTheme: async (theme) => {
        set({ theme });
        try {
            const s = await getStore();
            await s.set('theme', theme);
        } catch (error) {
            console.error('Failed to save theme:', error);
        }
    },

    resetToDefaults: async () => {
        set({ durations: { ...DEFAULT_DURATIONS }, theme: DEFAULT_THEME });
        try {
            const s = await getStore();
            await s.set('durations', DEFAULT_DURATIONS);
            await s.set('theme', DEFAULT_THEME);
        } catch (error) {
            console.error('Failed to save default settings:', error);
            // Reset shown in UI but won't persist
        }
    },

    loadSettings: async () => {
        try {
            const s = await getStore();
            const savedDurations = await s.get<DurationSettings>('durations');
            const savedTheme = await s.get<Theme>('theme');
            set({
                durations: savedDurations ?? DEFAULT_DURATIONS,
                theme: savedTheme ?? DEFAULT_THEME,
                isLoaded: true
            });
        } catch (error) {
            console.warn('Settings file not found or corrupted, using defaults:', error);
            set({ durations: DEFAULT_DURATIONS, theme: DEFAULT_THEME, isLoaded: true });
        }
    },
}));
