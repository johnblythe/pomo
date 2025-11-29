import { useEffect, useState } from 'react';
import { getTodaySessions, getWeekSessions, Session } from '../lib/db';

interface Props {
    onClose: () => void;
}

export function Stats({ onClose }: Props) {
    const [todaySessions, setTodaySessions] = useState<Session[]>([]);
    const [weekSessions, setWeekSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            getTodaySessions(),
            getWeekSessions()
        ]).then(([today, week]) => {
            setTodaySessions(today);
            setWeekSessions(week);
            setLoading(false);
        }).catch(err => {
            console.error('Failed to load stats:', err);
            setLoading(false);
        });
    }, []);

    const calculateStats = (sessions: Session[]) => {
        const workSessions = sessions.filter(s => s.mode === 'work' && s.completed);
        const totalMinutes = Math.floor(
            sessions.reduce((sum, s) => sum + s.duration_seconds, 0) / 60
        );
        return {
            count: workSessions.length,
            totalMinutes,
            hours: Math.floor(totalMinutes / 60),
            minutes: totalMinutes % 60,
        };
    };

    const todayStats = calculateStats(todaySessions);
    const weekStats = calculateStats(weekSessions);

    if (loading) {
        return (
            <div className="stats">
                <div className="stats-header">
                    <h2>Stats</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>
                <div className="loading">Loading...</div>
            </div>
        );
    }

    return (
        <div className="stats">
            <div className="stats-header">
                <h2>Stats</h2>
                <button className="close-btn" onClick={onClose}>×</button>
            </div>

            <div className="stats-section">
                <h3>Today</h3>
                <div className="stat-row">
                    <span className="stat-label">Sessions</span>
                    <span className="stat-value">{todayStats.count}</span>
                </div>
                <div className="stat-row">
                    <span className="stat-label">Focus time</span>
                    <span className="stat-value">
                        {todayStats.hours > 0 && `${todayStats.hours}h `}
                        {todayStats.minutes}m
                    </span>
                </div>
            </div>

            <div className="stats-section">
                <h3>This Week</h3>
                <div className="stat-row">
                    <span className="stat-label">Sessions</span>
                    <span className="stat-value">{weekStats.count}</span>
                </div>
                <div className="stat-row">
                    <span className="stat-label">Focus time</span>
                    <span className="stat-value">
                        {weekStats.hours > 0 && `${weekStats.hours}h `}
                        {weekStats.minutes}m
                    </span>
                </div>
            </div>

            {todaySessions.length > 0 && (
                <div className="stats-section">
                    <h3>Recent Sessions</h3>
                    <div className="session-list">
                        {todaySessions.slice(0, 5).map(session => (
                            <div key={session.id} className="session-item">
                                <span className="session-mode">
                                    {session.mode === 'work' ? '🎯' : '☕'}
                                    {' '}
                                    {session.mode === 'work' ? 'Focus' : 'Break'}
                                </span>
                                <span className="session-time">
                                    {Math.floor(session.duration_seconds / 60)}m
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Stats;
