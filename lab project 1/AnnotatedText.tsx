import type { AnnotatedToken } from '@/lib/types';

interface AnnotatedTextProps {
  annotated: AnnotatedToken[][];
}

const entityStyles: Record<AnnotatedToken['type'], string> = {
  'entity-person': 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  'entity-org': 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  'entity-gpe': 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  'entity-date': 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  'entity-misc': 'bg-violet-500/15 text-violet-300 border-violet-500/30',
  'verb': 'bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/20',
  'normal': 'border-transparent',
};

const entityLegend: { type: AnnotatedToken['type']; label: string }[] = [
  { type: 'entity-person', label: 'Person' },
  { type: 'entity-org', label: 'Organization' },
  { type: 'entity-gpe', label: 'Place' },
  { type: 'entity-date', label: 'Date' },
  { type: 'verb', label: 'Verb' },
];

export default function AnnotatedText({ annotated }: AnnotatedTextProps) {
  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {entityLegend.map((item) => (
          <span
            key={item.type}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${entityStyles[item.type]}`}
          >
            {item.label}
          </span>
        ))}
      </div>

      {/* Annotated sentences */}
      <div className="space-y-3">
        {annotated.map((sentence, sIdx) => (
          <p
            key={sIdx}
            className="text-slate-200 leading-relaxed text-lg"
          >
            {sentence.map((token, tIdx) => {
              if (token.type === 'normal') {
                return <span key={tIdx}>{token.text}</span>;
              }
              return (
                <span
                  key={tIdx}
                  className={`inline px-1.5 py-0.5 mx-0.5 rounded-md border ${entityStyles[token.type]}`}
                >
                  {token.text}
                </span>
              );
            })}
          </p>
        ))}
      </div>
    </div>
  );
}
