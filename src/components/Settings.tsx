import { useSettingsStore } from '../stores/settingsStore';
import { useTimerStore } from '../stores/timerStore';

interface Props {
    onClose: () => void;
}

export function Settings({ onClose }: Props) {
    const { durations, setDuration, resetToDefaults } = useSettingsStore();
    const syncWithSettings = useTimerStore((s) => s.syncWithSettings);

    const durationFields = [
        { mode: 'work' as const, label: 'Work', max: 60 },
        { mode: 'shortBreak' as const, label: 'Short Break', max: 30 },
        { mode: 'longBreak' as const, label: 'Long Break', max: 60 },
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
