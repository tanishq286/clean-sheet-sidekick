import { useEffect, useState } from "react";
import { fetchHabits, type HabitsSnapshot } from "@/lib/habits";

// Slot rendered inside templates when profile.theme.display_habits is true
// and the Habit Tracker service returns data. Pass `demo` to force-render
// (used by Design preview).
export default function HabitsBlock({ slug, demo }: { slug: string; demo?: HabitsSnapshot }) {
  const [data, setData] = useState<HabitsSnapshot | null>(demo ?? null);
  useEffect(() => {
    if (demo) return;
    let cancelled = false;
    fetchHabits(slug).then((d) => { if (!cancelled) setData(d); });
    return () => { cancelled = true; };
  }, [slug, demo]);

  if (!data) return null;

  return (
    <section className="border-t border-border py-12">
      <div className="max-w-3xl mx-auto px-6">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="text-2xl font-bold">Habits</h2>
          <div className="text-sm text-muted-foreground">
            <span className="font-semibold" style={{ color: "var(--accent)" }}>{data.current_streak}</span> day streak
            <span className="mx-2">·</span>
            best {data.longest_streak}
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-3 mb-6">
          {data.habits.map((h) => (
            <div key={h.id} className="border rounded-lg p-4">
              <div className="text-2xl mb-1">{h.emoji ?? "·"}</div>
              <div className="font-medium text-sm">{h.name}</div>
              <div className="text-xs text-muted-foreground mt-1">{h.streak} day streak</div>
            </div>
          ))}
        </div>

        <div className="flex gap-[3px]">
          {data.last_30_days.map((d) => {
            const ratio = d.total ? d.completed / d.total : 0;
            return (
              <div key={d.date} className="flex-1 h-8 rounded-sm"
                style={{ background: `color-mix(in oklab, var(--accent) ${ratio * 90 + 5}%, transparent)` }}
                title={`${d.date} · ${d.completed}/${d.total}`} />
            );
          })}
        </div>
      </div>
    </section>
  );
}