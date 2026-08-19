import { useState, useMemo, useRef } from 'react';
import { FileText, Tag, Link2, Calendar, Sparkles, Loader2, Upload, FileUp } from 'lucide-react';
import { processText } from '@/lib/nlp';
import { sampleTexts } from '@/lib/sampleTexts';
import AnnotatedText from '@/components/AnnotatedText';
import DataTables from '@/components/DataTables';
import TemporalGraph from '@/components/TemporalGraph';

type Tab = 'annotated' | 'postags' | 'entities' | 'relations' | 'events' | 'graph';

const tabs: { id: Tab; label: string; icon: typeof FileText }[] = [
  { id: 'annotated', label: 'Annotated Text', icon: Sparkles },
  { id: 'postags', label: 'POS Tags', icon: Tag },
  { id: 'entities', label: 'Entities', icon: FileText },
  { id: 'relations', label: 'Relations', icon: Link2 },
  { id: 'events', label: 'Events', icon: Calendar },
  { id: 'graph', label: 'Temporal Graph', icon: Calendar },
];

export default function App() {
  const [text, setText] = useState(sampleTexts[0].text);
  const [activeTab, setActiveTab] = useState<Tab>('annotated');
  const [processing, setProcessing] = useState(false);
  const [processed, setProcessed] = useState(() => processText(sampleTexts[0].text));
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProcess = () => {
    if (!text.trim()) return;
    setProcessing(true);
    setTimeout(() => {
      const result = processText(text);
      setProcessed(result);
      setProcessing(false);
    }, 100);
  };

  const runExtraction = (input: string) => {
    setProcessing(true);
    setTimeout(() => {
      const result = processText(input);
      setProcessed(result);
      setProcessing(false);
    }, 100);
  };

  const handleFile = (file: File) => {
    setFileError(null);
    if (!file.name.match(/\.(txt|md|csv|log)$/i)) {
      setFileError('Please upload a text file (.txt, .md, .csv, or .log)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFileError('File is too large. Please keep it under 5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setText(content);
      setFileName(file.name);
      runExtraction(content);
    };
    reader.onerror = () => setFileError('Could not read the file. Please try again.');
    reader.readAsText(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleSampleSelect = (sampleId: string) => {
    const sample = sampleTexts.find((s) => s.id === sampleId);
    if (sample) {
      setText(sample.text);
      setFileName(null);
      setFileError(null);
      runExtraction(sample.text);
    }
  };

  const stats = useMemo(() => ({
    tokens: processed.tokens.length,
    entities: processed.entities.length,
    relations: processed.relations.length,
    events: processed.events.length,
    sentences: processed.sentences.length,
  }), [processed]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-sky-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Information Extraction System</h1>
                <p className="text-xs text-slate-400">POS Tagging, NER, Relations, Events & Temporal Graphs</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-4 text-sm">
              <div className="text-center">
                <div className="text-lg font-bold text-emerald-400">{stats.tokens}</div>
                <div className="text-xs text-slate-500">Tokens</div>
              </div>
              <div className="w-px h-8 bg-slate-800" />
              <div className="text-center">
                <div className="text-lg font-bold text-sky-400">{stats.entities}</div>
                <div className="text-xs text-slate-500">Entities</div>
              </div>
              <div className="w-px h-8 bg-slate-800" />
              <div className="text-center">
                <div className="text-lg font-bold text-fuchsia-400">{stats.relations}</div>
                <div className="text-xs text-slate-500">Relations</div>
              </div>
              <div className="w-px h-8 bg-slate-800" />
              <div className="text-center">
                <div className="text-lg font-bold text-amber-400">{stats.events}</div>
                <div className="text-xs text-slate-500">Events</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Input Panel */}
      <div className="max-w-6xl mx-auto px-6 pt-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-300">Input Text</label>
              {fileName && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-xs border border-emerald-500/20">
                  <FileUp className="w-3.5 h-3.5" />
                  {fileName}
                  <button
                    onClick={() => { setFileName(null); setText(''); }}
                    className="ml-1 text-emerald-500/60 hover:text-emerald-300 transition-colors"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Samples:</span>
              {sampleTexts.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleSampleSelect(s.id)}
                  className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors border border-slate-700"
                >
                  {s.title}
                </button>
              ))}
            </div>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            placeholder="Enter text to analyze, or attach a file below..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm resize-y focus:outline-none focus:border-emerald-500/50 transition-colors placeholder:text-slate-600"
          />
          {/* File upload dropzone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onClick={() => fileInputRef.current?.click()}
            className={`mt-3 border-2 border-dashed rounded-xl px-4 py-5 text-center cursor-pointer transition-colors ${
              dragging
                ? 'border-emerald-500 bg-emerald-500/5'
                : 'border-slate-700 hover:border-slate-600 bg-slate-950/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.csv,.log"
              onChange={handleFileInputChange}
              className="hidden"
            />
            <div className="flex items-center justify-center gap-2 text-slate-400">
              <Upload className="w-4 h-4" />
              <span className="text-sm">
                {dragging ? 'Drop the file here' : 'Attach a text file, or click to browse'}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">Supports .txt, .md, .csv, .log — up to 5 MB</p>
          </div>
          {fileError && (
            <p className="mt-2 text-sm text-rose-400">{fileError}</p>
          )}
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-slate-500">{text.length} characters</span>
            <button
              onClick={handleProcess}
              disabled={processing || !text.trim()}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Extract
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-6 pt-6">
        <div className="flex items-center gap-1 border-b border-slate-800 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-6 pb-16">
        {activeTab === 'annotated' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Annotated Text</h2>
            <AnnotatedText annotated={processed.annotated} />
          </div>
        )}
        {activeTab === 'postags' && (
          <DataTables tokens={processed.tokens} entities={[]} relations={[]} events={[]} />
        )}
        {activeTab === 'entities' && (
          <DataTables tokens={[]} entities={processed.entities} relations={[]} events={[]} />
        )}
        {activeTab === 'relations' && (
          <DataTables tokens={[]} entities={[]} relations={processed.relations} events={[]} />
        )}
        {activeTab === 'events' && (
          <DataTables tokens={[]} entities={[]} relations={[]} events={processed.events} />
        )}
        {activeTab === 'graph' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Temporal Event Graph</h2>
            <TemporalGraph events={processed.events} entities={processed.entities} />
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-4">
        <div className="max-w-6xl mx-auto px-6 text-center text-xs text-slate-600">
          Information Extraction System — POS Tagging, NER, Relation Extraction, Event Extraction & Temporal Graph
        </div>
      </footer>
    </div>
  );
}
