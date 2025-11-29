import { useSettingsStore } from '../stores/settingsStore';
import { useTimerStore } from '../stores/timerStore';

interface Props {
    onClose: () => void;
}

export function Settings({ onClose }: Props) {
    const { durations, setDuration, resetToDefaults } = useSettingsStore();
    const syncWithSettings = useTimerStore((s) => s.syncWithSettings);

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

                <div className="setting-row">
                    <label>Work</label>
                    <input
                        type="number"
                        min="1"
                        max="60"
                        value={durations.work}
                        onChange={(e) => handleChange('work', e.target.value)}
                    />
                </div>

                <div className="setting-row">
                    <label>Short Break</label>
                    <input
                        type="number"
                        min="1"
                        max="30"
                        value={durations.shortBreak}
                        onChange={(e) => handleChange('shortBreak', e.target.value)}
                    />
                </div>

                <div className="setting-row">
                    <label>Long Break</label>
                    <input
                        type="number"
                        min="1"
                        max="60"
                        value={durations.longBreak}
                        onChange={(e) => handleChange('longBreak', e.target.value)}
                    />
                </div>
            </div>

            <button className="reset-btn" onClick={handleReset}>
                Reset to Defaults
            </button>
        </div>
    );
}

export default Settings;
