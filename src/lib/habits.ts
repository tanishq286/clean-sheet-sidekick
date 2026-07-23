// Public API contract for the separate Habit Tracker project.
// When that service is live, set VITE_HABITS_API_BASE to its origin.
// Until then, this returns null and templates render no HabitsBlock.

export interface HabitsSnapshot {
  current_streak: number;
  longest_streak: number;
  habits: { id: string; name: string; emoji?: string; streak: number }[];
  last_30_days: { date: string; completed: number; total: number }[];
}

const BASE = (import.meta.env.VITE_HABITS_API_BASE as string | undefined)?.replace(/\/$/, "");

export async function fetchHabits(slug: string): Promise<HabitsSnapshot | null> {
  if (!BASE) return null;
  try {
    const res = await fetch(`${BASE}/api/habits/${encodeURIComponent(slug)}`);
    if (!res.ok) return null;
    return (await res.json()) as HabitsSnapshot;
  } catch {
    return null;
  }
}

// Demo data — used by Design preview only.
export const DEMO_HABITS: HabitsSnapshot = {
  current_streak: 14,
  longest_streak: 42,
  habits: [
    { id: "1", name: "Customer calls", emoji: "📞", streak: 14 },
    { id: "2", name: "Ship something", emoji: "🚢", streak: 9 },
    { id: "3", name: "Deep work block", emoji: "🧠", streak: 21 },
  ],
  last_30_days: Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 86400000).toISOString().slice(0, 10),
    completed: Math.floor(Math.random() * 4),
    total: 3,
  })),
};