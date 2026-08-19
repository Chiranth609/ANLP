import type { Token, Entity, Relation, Event } from './types';

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function tokensToCSV(tokens: Token[]): string {
  const header = 'ID,Token,POS,Tag,Lemma,Sentence';
  const rows = tokens.map(
    (t) => `${t.id},${escapeCSV(t.token)},${escapeCSV(t.pos)},${escapeCSV(t.tag)},${escapeCSV(t.lemma)},${t.sentenceIdx}`,
  );
  return [header, ...rows].join('\n');
}

export function entitiesToCSV(entities: Entity[]): string {
  const header = 'ID,Text,Label,Type,Sentence';
  const rows = entities.map(
    (e) => `${e.id},${escapeCSV(e.text)},${escapeCSV(e.label)},${e.type},${e.sentenceIdx}`,
  );
  return [header, ...rows].join('\n');
}

export function relationsToCSV(relations: Relation[]): string {
  const header = 'ID,Subject,Predicate,Object,Sentence';
  const rows = relations.map(
    (r) => `${r.id},${escapeCSV(r.subject)},${escapeCSV(r.predicate)},${escapeCSV(r.object)},${r.sentenceIdx}`,
  );
  return [header, ...rows].join('\n');
}

export function eventsToCSV(events: Event[]): string {
  const header = 'ID,Trigger,Lemma,Tense,Participants,Date,Sentence';
  const rows = events.map(
    (e) =>
      `${e.id},${escapeCSV(e.trigger)},${escapeCSV(e.triggerLemma)},${escapeCSV(e.tense)},${escapeCSV(e.participants.join('; '))},${escapeCSV(e.date)},${e.sentenceIdx}`,
  );
  return [header, ...rows].join('\n');
}

export function downloadCSV(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
