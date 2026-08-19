import { Download } from 'lucide-react';
import type { Token, Entity, Relation, Event } from '@/lib/types';
import { tokensToCSV, entitiesToCSV, relationsToCSV, eventsToCSV, downloadCSV } from '@/lib/export';

interface DataTablesProps {
  tokens: Token[];
  entities: Entity[];
  relations: Relation[];
  events: Event[];
}

const typeColors: Record<string, string> = {
  PERSON: 'bg-emerald-500/15 text-emerald-300',
  ORG: 'bg-sky-500/15 text-sky-300',
  GPE: 'bg-amber-500/15 text-amber-300',
  DATE: 'bg-rose-500/15 text-rose-300',
  MISC: 'bg-violet-500/15 text-violet-300',
};

const posColors: Record<string, string> = {
  NOUN: 'bg-sky-500/15 text-sky-300',
  PROPN: 'bg-emerald-500/15 text-emerald-300',
  VERB: 'bg-fuchsia-500/15 text-fuchsia-300',
  ADJ: 'bg-amber-500/15 text-amber-300',
  ADV: 'bg-orange-500/15 text-orange-300',
  ADP: 'bg-slate-500/15 text-slate-300',
  DET: 'bg-slate-500/15 text-slate-400',
  NUM: 'bg-rose-500/15 text-rose-300',
  CCONJ: 'bg-slate-500/15 text-slate-400',
  PRON: 'bg-violet-500/15 text-violet-300',
  X: 'bg-slate-500/15 text-slate-400',
};

export default function DataTables({ tokens, entities, relations, events }: DataTablesProps) {
  return (
    <div className="space-y-8">
      {/* Tokens */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-slate-200">
            POS Tags <span className="text-slate-500 font-normal text-sm">({tokens.length} tokens)</span>
          </h3>
          <button
            onClick={() => downloadCSV('pos_tags.csv', tokensToCSV(tokens))}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition-colors border border-slate-700"
          >
            <Download className="w-4 h-4" /> CSV
          </button>
        </div>
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800/50 text-slate-400 text-left">
                <th className="px-4 py-2.5 font-medium">ID</th>
                <th className="px-4 py-2.5 font-medium">Token</th>
                <th className="px-4 py-2.5 font-medium">POS</th>
                <th className="px-4 py-2.5 font-medium">Tag</th>
                <th className="px-4 py-2.5 font-medium">Lemma</th>
                <th className="px-4 py-2.5 font-medium">Sent.</th>
              </tr>
            </thead>
            <tbody>
              {tokens.slice(0, 200).map((t) => (
                <tr key={t.id} className="border-t border-slate-800/50 hover:bg-slate-800/30">
                  <td className="px-4 py-2 text-slate-500">{t.id}</td>
                  <td className="px-4 py-2 text-slate-200 font-medium">{t.token}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${posColors[t.pos] || posColors.X}`}>
                      {t.pos}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-slate-400 font-mono text-xs">{t.tag}</td>
                  <td className="px-4 py-2 text-slate-300 italic">{t.lemma}</td>
                  <td className="px-4 py-2 text-slate-500">{t.sentenceIdx}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {tokens.length > 200 && (
          <p className="text-xs text-slate-500 mt-2">Showing first 200 of {tokens.length} tokens. Download CSV for all.</p>
        )}
      </section>

      {/* Entities */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-slate-200">
            Named Entities <span className="text-slate-500 font-normal text-sm">({entities.length} entities)</span>
          </h3>
          <button
            onClick={() => downloadCSV('entities.csv', entitiesToCSV(entities))}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition-colors border border-slate-700"
          >
            <Download className="w-4 h-4" /> CSV
          </button>
        </div>
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800/50 text-slate-400 text-left">
                <th className="px-4 py-2.5 font-medium">ID</th>
                <th className="px-4 py-2.5 font-medium">Text</th>
                <th className="px-4 py-2.5 font-medium">Type</th>
                <th className="px-4 py-2.5 font-medium">Sent.</th>
              </tr>
            </thead>
            <tbody>
              {entities.map((e) => (
                <tr key={e.id} className="border-t border-slate-800/50 hover:bg-slate-800/30">
                  <td className="px-4 py-2 text-slate-500">{e.id}</td>
                  <td className="px-4 py-2 text-slate-200 font-medium">{e.text}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${typeColors[e.type] || typeColors.MISC}`}>
                      {e.label}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-slate-500">{e.sentenceIdx}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Relations */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-slate-200">
            Relations <span className="text-slate-500 font-normal text-sm">({relations.length} relations)</span>
          </h3>
          <button
            onClick={() => downloadCSV('relations.csv', relationsToCSV(relations))}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition-colors border border-slate-700"
          >
            <Download className="w-4 h-4" /> CSV
          </button>
        </div>
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800/50 text-slate-400 text-left">
                <th className="px-4 py-2.5 font-medium">ID</th>
                <th className="px-4 py-2.5 font-medium">Subject</th>
                <th className="px-4 py-2.5 font-medium">Predicate</th>
                <th className="px-4 py-2.5 font-medium">Object</th>
                <th className="px-4 py-2.5 font-medium">Sent.</th>
              </tr>
            </thead>
            <tbody>
              {relations.map((r) => (
                <tr key={r.id} className="border-t border-slate-800/50 hover:bg-slate-800/30">
                  <td className="px-4 py-2 text-slate-500">{r.id}</td>
                  <td className="px-4 py-2 text-emerald-300 font-medium">{r.subject}</td>
                  <td className="px-4 py-2 text-fuchsia-300">{r.predicate}</td>
                  <td className="px-4 py-2 text-sky-300 font-medium">{r.object}</td>
                  <td className="px-4 py-2 text-slate-500">{r.sentenceIdx}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Events */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-slate-200">
            Events <span className="text-slate-500 font-normal text-sm">({events.length} events)</span>
          </h3>
          <button
            onClick={() => downloadCSV('events.csv', eventsToCSV(events))}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition-colors border border-slate-700"
          >
            <Download className="w-4 h-4" /> CSV
          </button>
        </div>
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800/50 text-slate-400 text-left">
                <th className="px-4 py-2.5 font-medium">ID</th>
                <th className="px-4 py-2.5 font-medium">Trigger</th>
                <th className="px-4 py-2.5 font-medium">Lemma</th>
                <th className="px-4 py-2.5 font-medium">Tense</th>
                <th className="px-4 py-2.5 font-medium">Participants</th>
                <th className="px-4 py-2.5 font-medium">Date</th>
                <th className="px-4 py-2.5 font-medium">Sent.</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id} className="border-t border-slate-800/50 hover:bg-slate-800/30">
                  <td className="px-4 py-2 text-slate-500">{e.id}</td>
                  <td className="px-4 py-2 text-fuchsia-300 font-medium">{e.trigger}</td>
                  <td className="px-4 py-2 text-slate-300 italic">{e.triggerLemma}</td>
                  <td className="px-4 py-2">
                    <span className="px-2 py-0.5 rounded-md text-xs bg-slate-700/50 text-slate-300">
                      {e.tense}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex flex-wrap gap-1">
                      {e.participants.map((p, i) => (
                        <span key={i} className="px-1.5 py-0.5 rounded text-xs bg-sky-500/10 text-sky-300">
                          {p}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-rose-300">{e.date || '—'}</td>
                  <td className="px-4 py-2 text-slate-500">{e.sentenceIdx}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
