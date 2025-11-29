import { useEffect, useRef, useState } from 'react';
import { useTimerStore } from '../stores/timerStore';
import { invoke } from '@tauri-apps/api/core';
import { playWorkCompleteSound, playBreakCompleteSound } from '../lib/audio';
import { initNotifications, notifyTimerComplete } from '../lib/notifications';
import { saveSession } from '../lib/db';
import { useSettingsStore } from '../stores/settingsStore';

export function Timer() {
    const { mode, status, remainingSeconds, start, pause, reset, setMode } = useTimerStore();
    const [shouldAutoStart, setShouldAutoStart] = useState(false);

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

    // Track when timer started and initial seconds for accurate timing
    const startTimeRef = useRef<number | null>(null);
    const startSecondsRef = useRef<number>(0);

    // Countdown using timestamps (immune to browser throttling)
    useEffect(() => {
        if (status !== 'running') {
            startTimeRef.current = null;
            return;
        }

        // Capture start time and seconds when timer begins
        if (startTimeRef.current === null) {
            startTimeRef.current = Date.now();
            startSecondsRef.current = remainingSeconds;
        }

        const interval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTimeRef.current!) / 1000);
            const newRemaining = Math.max(0, startSecondsRef.current - elapsed);

            const store = useTimerStore.getState();
            if (store.remainingSeconds !== newRemaining) {
                useTimerStore.setState({ remainingSeconds: newRemaining });
            }
        }, 100); // Check more frequently, but update based on real elapsed time

        return () => clearInterval(interval);
    }, [status]);

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

            // Save session to database
            const { durations } = useSettingsStore.getState();
            saveSession(mode, durations[mode] * 60).catch(console.error);

            // Auto-switch modes
            if (mode === 'work') {
                setMode('shortBreak');
            } else {
                setMode('work');
                setShouldAutoStart(true);
            }
        }
    }, [remainingSeconds, status, mode, setMode]);

    // Auto-start work after mode switches to work (reliable, no race condition)
    useEffect(() => {
        if (shouldAutoStart && mode === 'work' && status === 'idle') {
            start();
            setShouldAutoStart(false);
        }
    }, [shouldAutoStart, mode, status, start]);

    const modeLabels = {
        work: 'Focus',
        shortBreak: 'Short Break',
        longBreak: 'Long Break',
    };

    const modes = [
        { key: 'work' as const, label: 'Work' },
        { key: 'shortBreak' as const, label: 'Short' },
        { key: 'longBreak' as const, label: 'Long' },
    ];

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
                {modes.map(({ key, label }) => (
                    <button
                        key={key}
                        className={mode === key ? 'active' : ''}
                        onClick={() => setMode(key)}
                    >
                        {label}
                    </button>
                ))}
            </div>
        </div>
    );
}

export default Timer;