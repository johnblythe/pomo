import Database from '@tauri-apps/plugin-sql';

let db: Database | null = null;

export async function getDb(): Promise<Database> {
  if (!db) {
    try {
      db = await Database.load('sqlite:pomo.db');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw new Error('Could not connect to database. Please restart the application.');
    }
  }
  return db;
}

export interface Session {
  id: number;
  mode: 'work' | 'shortBreak' | 'longBreak';
  durationSeconds: number;
  completedAt: string;
  completed: boolean;
}

export async function saveSession(
  mode: string,
  durationSeconds: number,
  completed: boolean = true
): Promise<void> {
  try {
    const database = await getDb();
    await database.execute(
      'INSERT INTO sessions (mode, duration_seconds, completed_at, completed) VALUES (?, ?, ?, ?)',
      [mode, durationSeconds, new Date().toISOString(), completed ? 1 : 0]
    );
  } catch (error) {
    console.error('Failed to save session:', { mode, durationSeconds, error });
    throw new Error('Could not save session to database. Your progress may not be recorded.');
  }
}

export async function getTodaySessions(): Promise<Session[]> {
  try {
    const database = await getDb();
    const today = new Date().toISOString().split('T')[0];
    const sessions = await database.select<Session[]>(
      `SELECT id, mode, duration_seconds AS durationSeconds, completed_at AS completedAt, completed FROM sessions WHERE completed_at LIKE ?`,
      [`${today}%`]
    );
    return sessions;
  } catch (error) {
    console.error('Failed to load today\'s sessions:', error);
    throw new Error('Could not load today\'s statistics.');
  }
}

async function getSessionsSince(days: number, errorContext: string): Promise<Session[]> {
  try {
    const database = await getDb();
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const sessions = await database.select<Session[]>(
      `SELECT id, mode, duration_seconds AS durationSeconds, completed_at AS completedAt, completed FROM sessions WHERE completed_at >= ? ORDER BY completed_at DESC`,
      [since.toISOString()]
    );
    return sessions;
  } catch (error) {
    console.error(`Failed to load ${errorContext} sessions:`, error);
    throw new Error(`Could not load ${errorContext} statistics.`);
  }
}

export const getWeekSessions = () => getSessionsSince(7, 'week\'s');
export const getMonthSessions = () => getSessionsSince(30, 'month\'s');
export const getYearSessions = () => getSessionsSince(365, 'year\'s');

export async function getAllTimeSessions(): Promise<Session[]> {
  try {
    const database = await getDb();
    const sessions = await database.select<Session[]>(
      `SELECT id, mode, duration_seconds AS durationSeconds, completed_at AS completedAt, completed FROM sessions ORDER BY completed_at DESC`
    );
    return sessions;
  } catch (error) {
    console.error('Failed to load all-time sessions:', error);
    throw new Error('Could not load all-time statistics.');
  }
}

export async function getTotalSessionDuration(): Promise<number> {
  const database = await getDb();
  const result = await database.select<Array<{ sum: number | null }>>('SELECT SUM(duration_seconds) as sum FROM sessions');
  return result[0]?.sum || 0;
}

export async function getTotalCompletedSessions(): Promise<number> {
  const database = await getDb();
  const result = await database.select<Array<{ count: number }>>('SELECT COUNT(*) as count FROM sessions WHERE completed = 1');
  return result[0]?.count || 0;
}