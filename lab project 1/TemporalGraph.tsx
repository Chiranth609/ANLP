import { useMemo } from 'react';
import type { Event, Entity } from '@/lib/types';

interface TemporalGraphProps {
  events: Event[];
  entities: Entity[];
}

interface GraphRow {
  date: string;
  events: Event[];
}

export default function TemporalGraph({ events, entities }: TemporalGraphProps) {
  const rows = useMemo<GraphRow[]>(() => {
    const withDates = events.filter((e) => e.date);
    const grouped = new Map<string, Event[]>();
    withDates.forEach((e) => {
      const key = e.date;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(e);
    });
    const sorted = Array.from(grouped.entries()).sort((a, b) => {
      const da = parseDate(a[0]);
      const db = parseDate(b[0]);
      return da - db;
    });
    return sorted.map(([date, evts]) => ({ date, events: evts }));
  }, [events]);

  const uniqueParticipants = useMemo(() => {
    const set = new Set<string>();
    events.forEach((e) => e.participants.forEach((p) => set.add(p)));
    entities.forEach((e) => set.add(e.text));
    return Array.from(set).sort();
  }, [events, entities]);

  function parseDate(dateStr: string): number {
    const monthIdx = MONTHS.findIndex((m) =>
      dateStr.toLowerCase().includes(m.toLowerCase()),
    );
    const yearMatch = dateStr.match(/\d{4}/);
    const dayMatch = dateStr.match(/\b(\d{1,2})\b/);
    const year = yearMatch ? parseInt(yearMatch[0]) : 0;
    const month = monthIdx >= 0 ? monthIdx : 0;
    const day = dayMatch ? parseInt(dayMatch[1]) : 1;
    return year * 10000 + month * 100 + day;
  }

  if (rows.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <p>No dated events found. The temporal graph requires events with dates in the text.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 text-sm text-slate-400">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-400" /> Event
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-sky-400" /> Participant
        </span>
        <span className="text-slate-500">| Scroll horizontally if needed</span>
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="min-w-full">
          {/* Timeline */}
          <div className="relative pl-48">
            {/* Vertical line */}
            <div className="absolute left-48 top-0 bottom-0 w-px bg-slate-700" />

            {rows.map((row, idx) => (
              <div key={idx} className="relative flex items-start mb-6 last:mb-0">
                {/* Date label */}
                <div className="absolute -left-48 w-44 pr-4 text-right">
                  <span className="inline-block px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 text-sm font-medium border border-slate-700">
                    {row.date}
                  </span>
                </div>

                {/* Dot on timeline */}
                <div className="absolute left-48 -ml-[5px] top-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-4 ring-emerald-400/20" />
                </div>

                {/* Event cards */}
                <div className="ml-6 flex-1 space-y-2">
                  {row.events.map((event) => (
                    <div
                      key={event.id}
                      className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 hover:border-emerald-500/40 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                          {event.triggerLemma}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-700/50 text-slate-400 text-xs">
                          {event.tense}
                        </span>
                      </div>
                      {event.participants.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {event.participants.map((p, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 rounded-md bg-sky-500/10 text-sky-300 text-xs"
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Participant legend */}
      {uniqueParticipants.length > 0 && (
        <div className="border-t border-slate-800 pt-4">
          <h4 className="text-sm font-medium text-slate-400 mb-2">All Participants</h4>
          <div className="flex flex-wrap gap-2">
            {uniqueParticipants.map((p) => (
              <span
                key={p}
                className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 text-xs border border-slate-700"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
