import { useEffect, useRef, useState } from 'react';
import { useTimerStore } from '../stores/timerStore';
import { invoke } from '@tauri-apps/api/core';
import { playWorkCompleteSound, playBreakCompleteSound } from '../lib/audio';
import { initNotifications, notifyTimerComplete } from '../lib/notifications';
import { saveSession } from '../lib/db';
import { useSettingsStore } from '../stores/settingsStore';

export function Timer() {
    const { mode, status, remainingSeconds, start, pause, reset, setMode } = useTimerStore();
    const { durations } = useSettingsStore();
    const [shouldAutoStart, setShouldAutoStart] = useState(false);

    // Calculate progress percentage for visual ring
    const totalSeconds = durations[mode] * 60;
    const progress = (remainingSeconds / totalSeconds) * 100;

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
            console.log('[Timer] Completing session:', { mode, durations: useSettingsStore.getState().durations });

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
            console.log('[Timer] Saving session:', mode, durations[mode] * 60);
            saveSession(mode, durations[mode] * 60)
                .then(() => console.log('[Timer] Session saved successfully'))
                .catch(err => console.error('[Timer] Failed to save session:', err));

            // Auto-switch modes and trigger auto-start
            if (mode === 'work') {
                setMode('shortBreak');
                setShouldAutoStart(true);
            } else {
                setMode('work');
                setShouldAutoStart(true);
            }
        }
    }, [remainingSeconds, status, mode, setMode]);

    // Auto-start next session after mode switch (reliable, no race condition)
    useEffect(() => {
        if (shouldAutoStart && status === 'idle') {
            start();
            setShouldAutoStart(false);
        }
    }, [shouldAutoStart, status, start]);

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
            <div className="progress-ring">
                <svg className="progress-ring-svg" viewBox="0 0 200 200">
                    {/* Background circle */}
                    <circle
                        className="progress-ring-bg"
                        cx="100"
                        cy="100"
                        r="85"
                        fill="none"
                        strokeWidth="4"
                    />
                    {/* Progress circle */}
                    <circle
                        className={`progress-ring-circle ${status === 'running' ? 'running' : ''}`}
                        cx="100"
                        cy="100"
                        r="85"
                        fill="none"
                        strokeWidth="4"
                        strokeDasharray={`${2 * Math.PI * 85}`}
                        strokeDashoffset={`${2 * Math.PI * 85 * (1 - progress / 100)}`}
                        transform="rotate(-90 100 100)"
                    />
                </svg>
                <div className="timer-content">
                    <div className="mode">{modeLabels[mode]}</div>
                    <div className="time">{formatTime(remainingSeconds)}</div>
                </div>
            </div>

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