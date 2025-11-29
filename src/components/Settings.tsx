import { useSettingsStore, Theme } from '../stores/settingsStore';
import { useTimerStore } from '../stores/timerStore';

interface Props {
    onClose: () => void;
}

export function Settings({ onClose }: Props) {
    const { durations, theme, setDuration, setTheme, resetToDefaults } = useSettingsStore();
    const syncWithSettings = useTimerStore((s) => s.syncWithSettings);

    const durationFields = [
        { mode: 'work' as const, label: 'Work', max: 60 },
        { mode: 'shortBreak' as const, label: 'Short Break', max: 30 },
        { mode: 'longBreak' as const, label: 'Long Break', max: 60 },
    ];

    const themes: { value: Theme; label: string; description: string }[] = [
        { value: 'glass', label: 'Glass Terminal', description: 'Frosted glass, cyan & green' },
        { value: 'warmth', label: 'Analog Warmth', description: 'Cozy, handwritten feel' },
        { value: 'brutalist', label: 'Brutalist Focus', description: 'High contrast, minimal' },
    ];

    const handleChange = (mode: 'work' | 'shortBreak' | 'longBreak', value: string) => {
        const num = parseInt(value, 10);
        if (!isNaN(num)) {
            setDuration(mode, num);
            syncWithSettings();
        }
    };

    const handleReset = () => {
        resetToDefaults();
        syncWithSettings();
    };

    return (
        <div className="settings">
            <div className="settings-header">
                <h2>Settings</h2>
                <button className="close-btn" onClick={onClose}>×</button>
            </div>

            <div className="settings-section">
                <h3>Appearance</h3>
                {themes.map(({ value, label, description }) => (
                    <div key={value} className="theme-option">
                        <label>
                            <input
                                type="radio"
                                name="theme"
                                value={value}
                                checked={theme === value}
                                onChange={() => setTheme(value)}
                            />
                            <div className="theme-info">
                                <span className="theme-label">{label}</span>
                                <span className="theme-description">{description}</span>
                            </div>
                        </label>
                    </div>
                ))}
            </div>

            <div className="settings-section">
                <h3>Durations (minutes)</h3>
                {durationFields.map(({ mode, label, max }) => (
                    <div key={mode} className="setting-row">
                        <label>{label}</label>
                        <input
                            type="number"
                            min="1"
                            max={max}
                            value={durations[mode]}
                            onChange={(e) => handleChange(mode, e.target.value)}
                        />
                    </div>
                ))}
            </div>

            <button className="reset-btn" onClick={handleReset}>
                Reset to Defaults
            </button>
        </div>
    );
}

export default Settings;
