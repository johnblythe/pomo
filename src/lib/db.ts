import Database from '@tauri-apps/plugin-sql';

let db: Database | null = null;

export async function getDb(): Promise<Database> {
  if (!db) {
    db = await Database.load('sqlite:pomo.db');
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

export async function saveSession(session: Session): Promise<void> {
  const database = await getDb();
  await database.execute(
    'INSERT INTO sessions (mode, duration_seconds, completed_at, completed) VALUES (?, ?, ?, ?)',
    [session.mode, session.durationSeconds, session.completedAt, session.completed]
  );
}

export async function getTodaySessions(): Promise<Session[]> {
  const database = await getDb();
  const today = new Date().toISOString().split('T')[0];
  const sessions = await database.select<Session[]>(`SELECT * FROM sessions WHERE completed_at LIKE ?`, [today]);
  return sessions;
}

export async function getWeekSessions(): Promise<Session[]> {
  const database = await getDb();
  const startOfWeek = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000));
  const sessions = await database.select<Session[]>(`SELECT * FROM sessions WHERE completed_at >= ?`, [startOfWeek.toISOString()]);
  return sessions;
} 

export async function getMonthSessions(): Promise<Session[]> {
  const database = await getDb();
  const startOfMonth = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));
  const sessions = await database.select<Session[]>(`SELECT * FROM sessions WHERE completed_at >= ?`, [startOfMonth.toISOString()]);
  return sessions;
}

export async function getYearSessions(): Promise<Session[]> {
  const database = await getDb();
  const startOfYear = new Date(Date.now() - (365 * 24 * 60 * 60 * 1000));
  const sessions = await database.select<Session[]>(`SELECT * FROM sessions WHERE completed_at >= ?`, [startOfYear.toISOString()]);
  return sessions;
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