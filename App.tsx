import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Database, Search, MessageSquare, Bot, User } from 'lucide-react';
import { answerQuestion, SUGGESTED_QUESTIONS, type QAResult } from '@/lib/qaEngine';

interface Message {
  id: number;
  role: 'user' | 'bot';
  text: string;
  result?: QAResult;
}

const sourceMeta: Record<string, { icon: typeof Database; label: string; color: string }> = {
  'Dialogue Manager': { icon: MessageSquare, label: 'Dialogue', color: 'text-sky-600 bg-sky-50 border-sky-200' },
  'Knowledge Base': { icon: Database, label: 'Knowledge Base', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  'IR + spaCy': { icon: Search, label: 'IR + spaCy', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  'No Answer': { icon: Search, label: 'No Answer', color: 'text-rose-600 bg-rose-50 border-rose-200' },
};

function confidenceColor(score: number): string {
  if (score >= 0.8) return 'bg-emerald-500';
  if (score >= 0.4) return 'bg-amber-500';
  if (score > 0) return 'bg-rose-500';
  return 'bg-gray-300';
}

function confidenceLabel(score: number): string {
  if (score >= 0.8) return 'High';
  if (score >= 0.4) return 'Medium';
  if (score > 0) return 'Low';
  return 'None';
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: 'bot',
      text: "Hi! I'm your Hybrid QA Chatbot. Ask me about Python, AI, Machine Learning, India, HTML, CSS, and more.",
    },
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const idCounter = useRef(1);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isThinking]);

  function send(question: string) {
    const q = question.trim();
    if (!q || isThinking) return;

    const userMsg: Message = { id: idCounter.current++, role: 'user', text: q };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setIsThinking(true);

    const result = answerQuestion(q);
    const botMsg: Message = {
      id: idCounter.current++,
      role: 'bot',
      text: result.answer,
      result,
    };
    setMessages((m) => [...m, botMsg]);
    setIsThinking(false);
    inputRef.current?.focus();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-3xl px-4 py-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 text-white shadow-lg shadow-sky-500/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900 leading-tight">Hybrid QA Chatbot</h1>
            <p className="text-xs text-slate-500">TF-IDF retrieval · Knowledge base · spaCy-style extraction</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Online
            </span>
          </div>
        </div>
      </header>

      {/* Chat area */}
      <main ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-6 space-y-4">
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}

          {isThinking && (
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                <Bot className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-white px-4 py-3 shadow-sm ring-1 ring-slate-100">
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
              </div>
            </div>
          )}

          {/* Suggested questions - show until user sends first message */}
          {messages.length <= 1 && !isThinking && (
            <div className="pt-2">
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-400">Try asking</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    className="group flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-700 shadow-sm transition hover:border-sky-300 hover:bg-sky-50 hover:shadow-md"
                  >
                    <Search className="h-3.5 w-3.5 shrink-0 text-slate-400 transition group-hover:text-sky-500" />
                    <span>{q}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Input bar */}
      <footer className="sticky bottom-0 border-t border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question..."
                className="w-full rounded-full border border-slate-200 bg-slate-50 py-3 pl-5 pr-4 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={!input.trim() || isThinking}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 text-white shadow-lg shadow-sky-500/20 transition hover:shadow-xl hover:shadow-sky-500/30 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
          <p className="mt-2 text-center text-xs text-slate-400">
            Runs entirely in your browser — no server required.
          </p>
        </div>
      </footer>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex items-start justify-end gap-3">
        <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-gradient-to-br from-sky-500 to-indigo-500 px-4 py-3 text-sm text-white shadow-md shadow-sky-500/10">
          {message.text}
        </div>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-600">
          <User className="h-4 w-4" />
        </div>
      </div>
    );
  }

  const result = message.result;
  const meta = result ? sourceMeta[result.source] : null;

  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 text-white">
        <Bot className="h-4 w-4" />
      </div>
      <div className="max-w-[80%]">
        <div className="rounded-2xl rounded-tl-sm bg-white px-4 py-3 text-sm text-slate-800 shadow-sm ring-1 ring-slate-100">
          {message.text}
        </div>

        {result && meta && result.source !== 'Dialogue Manager' && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${meta.color}`}>
              <meta.icon className="h-3 w-3" />
              {meta.label}
            </span>

            {result.source !== 'No Answer' && (
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-full rounded-full transition-all ${confidenceColor(result.confidence)}`}
                    style={{ width: `${Math.round(result.confidence * 100)}%` }}
                  />
                </div>
                <span className="text-xs text-slate-500">
                  {confidenceLabel(result.confidence)} · {result.confidence.toFixed(3)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
