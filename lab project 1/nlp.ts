import nlp from 'compromise';
import type {
  Token,
  Entity,
  Relation,
  Event,
  Sentence,
  AnnotatedToken,
  ProcessedText,
} from './types';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface TermData {
  text: string;
  tags: string[];
}

interface VerbData {
  text: string;
  terms: { text: string }[];
  verb?: {
    infinitive?: string;
    grammar?: {
      tense?: string;
    };
  };
}

function tagToPOS(tags: string[]): string {
  if (tags.includes('Verb')) return 'VERB';
  if (tags.includes('Noun')) return 'NOUN';
  if (tags.includes('Adjective')) return 'ADJ';
  if (tags.includes('Adverb')) return 'ADV';
  if (tags.includes('Preposition')) return 'ADP';
  if (tags.includes('Determiner')) return 'DET';
  if (tags.includes('Conjunction')) return 'CCONJ';
  if (tags.includes('Pronoun')) return 'PRON';
  if (tags.includes('Value') || tags.includes('Cardinal')) return 'NUM';
  return 'X';
}

function tagToTag(tags: string[]): string {
  if (tags.includes('ProperNoun')) return 'PROPN';
  if (tags.includes('PastTense')) return 'VBD';
  if (tags.includes('PresentTense')) return 'VBZ';
  if (tags.includes('Gerund')) return 'VBG';
  if (tags.includes('Infinitive')) return 'VB';
  if (tags.includes('Singular')) return 'NN';
  if (tags.includes('Plural')) return 'NNS';
  if (tags.includes('Comparative')) return 'JJR';
  if (tags.includes('Superlative')) return 'JJS';
  if (tags.includes('Modal')) return 'MD';
  if (tags.includes('QuestionWord')) return 'WP';
  if (tags.includes('Preposition')) return 'IN';
  if (tags.includes('Determiner')) return 'DT';
  if (tags.includes('Conjunction')) return 'CC';
  if (tags.includes('Pronoun')) return 'PRP';
  if (tags.includes('Cardinal')) return 'CD';
  if (tags.includes('Adjective')) return 'JJ';
  if (tags.includes('Adverb')) return 'RB';
  if (tags.includes('Noun')) return 'NN';
  if (tags.includes('Verb')) return 'VB';
  return 'X';
}

function getLemma(text: string, tags: string[], verbData?: { infinitive?: string }): string {
  if (tags.includes('Verb') && verbData?.infinitive) {
    return verbData.infinitive;
  }
  if (tags.includes('Noun') && tags.includes('Plural')) {
    return text.toLowerCase().replace(/s$/, '');
  }
  return text.toLowerCase();
}

function cleanEntityText(text: string): string {
  return text.replace(/[.,;:!?]+$/, '').trim();
}

function extractDates(text: string): string[] {
  const dates: string[] = [];
  const patterns: RegExp[] = [
    /\b(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})\b/gi,
    /\b((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4})\b/gi,
    /\b(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December))\b/gi,
    /\b((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})\b/gi,
    /\b(\d{4})\b/g,
  ];
  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      if (!dates.includes(match[1])) {
        dates.push(match[1]);
      }
    }
  }
  return dates;
}

export function processText(text: string): ProcessedText {
  const doc = nlp(text);
  const sentences: Sentence[] = [];
  const sentenceDocs = doc.sentences();
  const sentenceList = sentenceDocs.out('array') as string[];

  sentenceList.forEach((s: string, i: number) => {
    sentences.push({ idx: i, text: s.trim() });
  });

  // --- Tokens ---
  const tokens: Token[] = [];
  let tokenId = 0;
  const verbJson = doc.verbs().json() as VerbData[];

  sentenceList.forEach((sentText: string, sentIdx: number) => {
    const sentDoc = nlp(sentText);
    const termsData = sentDoc.terms().json() as { terms: TermData[] }[];
    termsData.forEach((termGroup: { terms: TermData[] }) => {
      const term = termGroup.terms[0];
      const verbInfo = verbJson.find((v: VerbData) =>
        v.terms.some((t: { text: string }) => t.text === term.text),
      );
      tokens.push({
        id: tokenId++,
        token: term.text,
        pos: tagToPOS(term.tags),
        tag: tagToTag(term.tags),
        lemma: getLemma(term.text, term.tags, verbInfo?.verb),
        sentenceIdx: sentIdx,
      });
    });
  });

  // --- Entities ---
  const entities: Entity[] = [];
  let entityId = 0;

  const people = (doc.people().out('array') as string[]).map(cleanEntityText);
  const orgs = (doc.organizations().out('array') as string[]).map(cleanEntityText);
  const places = (doc.places().out('array') as string[]).map(cleanEntityText);
  const dates = extractDates(text);

  const addEntity = (entText: string, type: Entity['type'], label: string) => {
    const cleaned = cleanEntityText(entText);
    if (!cleaned) return;
    const sentIdx = sentences.findIndex(
      (s) => s.text.includes(cleaned) || cleaned.includes(s.text.split(' ').slice(0, 3).join(' ')),
    );
    entities.push({
      id: entityId++,
      text: cleaned,
      label,
      type,
      sentenceIdx: sentIdx >= 0 ? sentIdx : 0,
    });
  };

  people.forEach((p: string) => addEntity(p, 'PERSON', 'PERSON'));
  orgs.forEach((o: string) => addEntity(o, 'ORG', 'ORG'));
  places.forEach((pl: string) => addEntity(pl, 'GPE', 'GPE'));
  dates.forEach((d: string) => addEntity(d, 'DATE', 'DATE'));

  // --- Relations ---
  const relations: Relation[] = [];
  let relationId = 0;

  sentenceList.forEach((sentText: string, sentIdx: number) => {
    const sentDoc = nlp(sentText);
    const sentPeople = people.filter((p: string) => sentText.includes(p));
    const sentOrgs = orgs.filter((o: string) => sentText.includes(o));
    const sentPlaces = places.filter((p: string) => sentText.includes(p));
    const sentDates = dates.filter((d: string) => sentText.includes(d));

    const verbs = sentDoc.verbs().json() as VerbData[];
    if (verbs.length > 0) {
      const verb = verbs[0];
      const predicate = verb.verb?.infinitive || verb.text || '';
      if (predicate) {
        const subjects = [...sentPeople, ...sentOrgs];
        const objects = [...sentOrgs, ...sentPlaces, ...sentPeople];

        if (subjects.length > 0 && objects.length > 0) {
          const subject = subjects[0];
          let object = objects.find((o: string) => o !== subject);
          if (!object && objects.length > 0) object = objects[0];
          if (object && subject !== object) {
            relations.push({
              id: relationId++,
              subject,
              predicate,
              object,
              sentenceIdx: sentIdx,
            });
          }
        } else if (subjects.length > 0) {
          relations.push({
            id: relationId++,
            subject: subjects[0],
            predicate,
            object: sentText,
            sentenceIdx: sentIdx,
          });
        }
      }
    }
  });

  // --- Events ---
  const events: Event[] = [];
  let eventId = 0;

  sentenceList.forEach((sentText: string, sentIdx: number) => {
    const sentDoc = nlp(sentText);
    const verbs = sentDoc.verbs().json() as VerbData[];

    verbs.forEach((verb: VerbData) => {
      const trigger = verb.text;
      const triggerLemma = verb.verb?.infinitive || trigger;
      const tense = verb.verb?.grammar?.tense || 'Unknown';

      const participants: string[] = [];
      const sentPeople = people.filter((p: string) => sentText.includes(p));
      const sentOrgs = orgs.filter((o: string) => sentText.includes(o));
      const sentPlaces = places.filter((p: string) => sentText.includes(p));
      participants.push(...sentPeople, ...sentOrgs, ...sentPlaces);

      const sentDates = dates.filter((d: string) => sentText.includes(d));
      const date = sentDates.length > 0 ? sentDates[0] : '';

      events.push({
        id: eventId++,
        trigger,
        triggerLemma,
        tense,
        participants,
        date,
        sentenceIdx: sentIdx,
      });
    });
  });

  // --- Annotated tokens ---
  const annotated: AnnotatedToken[][] = [];
  sentenceList.forEach((sentText: string) => {
    const sentDoc = nlp(sentText);
    const sentAnnotated: AnnotatedToken[] = [];

    const sentPeople = people.filter((p: string) => sentText.includes(p));
    const sentOrgs = orgs.filter((o: string) => sentText.includes(o));
    const sentPlaces = places.filter((p: string) => sentText.includes(p));
    const sentDates = dates.filter((d: string) => sentText.includes(d));

    const entityRanges: { start: number; end: number; type: AnnotatedToken['type'] }[] = [];

    const addRange = (entityText: string, type: AnnotatedToken['type']) => {
      let searchFrom = 0;
      while (searchFrom < sentText.length) {
        const idx = sentText.indexOf(entityText, searchFrom);
        if (idx === -1) break;
        entityRanges.push({ start: idx, end: idx + entityText.length, type });
        searchFrom = idx + entityText.length;
      }
    };

    sentPeople.forEach((p: string) => addRange(p, 'entity-person'));
    sentOrgs.forEach((o: string) => addRange(o, 'entity-org'));
    sentPlaces.forEach((pl: string) => addRange(pl, 'entity-gpe'));
    sentDates.forEach((d: string) => addRange(d, 'entity-date'));

    entityRanges.sort((a, b) => a.start - b.start);
    const mergedRanges: typeof entityRanges = [];
    entityRanges.forEach((r) => {
      const last = mergedRanges[mergedRanges.length - 1];
      if (last && r.start < last.end) {
        if (r.end > last.end) last.end = r.end;
      } else {
        mergedRanges.push({ ...r });
      }
    });

    // Get verb positions
    const verbPositions = new Set<number>();
    const verbTexts = sentDoc.verbs().out('array') as string[];
    verbTexts.forEach((vText: string) => {
      let searchFrom = 0;
      while (searchFrom < sentText.length) {
        const idx = sentText.indexOf(vText, searchFrom);
        if (idx === -1) break;
        for (let i = idx; i < idx + vText.length; i++) {
          verbPositions.add(i);
        }
        searchFrom = idx + vText.length;
      }
    });

    let pos = 0;
    while (pos < sentText.length) {
      const entityRange = mergedRanges.find((r) => r.start === pos);
      if (entityRange) {
        sentAnnotated.push({
          text: sentText.substring(entityRange.start, entityRange.end),
          type: entityRange.type,
        });
        pos = entityRange.end;
        continue;
      }

      if (verbPositions.has(pos)) {
        let end = pos;
        while (end < sentText.length && verbPositions.has(end)) end++;
        sentAnnotated.push({
          text: sentText.substring(pos, end),
          type: 'verb',
        });
        pos = end;
        continue;
      }

      let end = pos + 1;
      while (
        end < sentText.length &&
        !mergedRanges.find((r) => r.start === end) &&
        !verbPositions.has(end)
      ) {
        end++;
      }
      sentAnnotated.push({
        text: sentText.substring(pos, end),
        type: 'normal',
      });
      pos = end;
    }

    annotated.push(sentAnnotated);
  });

  return {
    tokens,
    entities,
    relations,
    events,
    sentences,
    annotated,
  };
}

export { MONTHS };
