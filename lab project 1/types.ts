export interface Token {
  id: number;
  token: string;
  pos: string;
  tag: string;
  lemma: string;
  sentenceIdx: number;
}

export interface Entity {
  id: number;
  text: string;
  label: string;
  type: 'PERSON' | 'ORG' | 'GPE' | 'DATE' | 'MISC';
  sentenceIdx: number;
}

export interface Relation {
  id: number;
  subject: string;
  predicate: string;
  object: string;
  sentenceIdx: number;
}

export interface Event {
  id: number;
  trigger: string;
  triggerLemma: string;
  tense: string;
  participants: string[];
  date: string;
  sentenceIdx: number;
}

export interface Sentence {
  idx: number;
  text: string;
}

export interface AnnotatedToken {
  text: string;
  type: 'entity-person' | 'entity-org' | 'entity-gpe' | 'entity-date' | 'entity-misc' | 'verb' | 'normal';
}

export interface GraphNode {
  id: string;
  label: string;
  type: 'event' | 'entity';
  date?: string;
}

export interface GraphEdge {
  source: string;
  target: string;
  label: string;
}

export interface ProcessedText {
  tokens: Token[];
  entities: Entity[];
  relations: Relation[];
  events: Event[];
  sentences: Sentence[];
  annotated: AnnotatedToken[][];
}
