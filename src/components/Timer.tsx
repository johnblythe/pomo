import { useEffect } from 'react';
import { useTimerStore } from '../stores/timerStore';
import { invoke } from '@tauri-apps/api/core';

export function Timer() {
    const { mode, status, remainingSeconds, start, pause, reset, tick, setMode } = useTimerStore();

    // Format seconds as MM:SS
    const formatTime = (seconds: number): string => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // Countdown interval
    useEffect(() => {
        if (status !== 'running') return;

        const interval = setInterval(() => {
            tick();
        }, 1000);

        return () => clearInterval(interval);
    }, [status, tick]);

    // Update menu bar title when time changes
    useEffect(() => {
        invoke('update_tray_title', { title: formatTime(remainingSeconds) })
            .catch(console.error);
    }, [remainingSeconds]);

    // Handle timer completion
    useEffect(() => {
        if (remainingSeconds === 0 && status === 'running') {
            // Auto-switch modes
            if (mode === 'work') {
                setMode('shortBreak');
            } else {
                setMode('work');
            }
        }
    }, [remainingSeconds, status, mode, setMode]);

    const modeLabels = {
        work: 'Focus',
        shortBreak: 'Short Break',
        longBreak: 'Long Break',
    };

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
                <button
                    className={mode === 'work' ? 'active' : ''}
                    onClick={() => setMode('work')}
                >
                    Work
                </button>
                <button
                    className={mode === 'shortBreak' ? 'active' : ''}
                    onClick={() => setMode('shortBreak')}
                >
                    Short
                </button>
                <button
                    className={mode === 'longBreak' ? 'active' : ''}
                    onClick={() => setMode('longBreak')}
                >
                    Long
                </button>
            </div>
        </div>
    );
}

export default Timer;