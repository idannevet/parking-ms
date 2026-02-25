'use client';
import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Code2, Table2, Lightbulb, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import Spinner from '@/components/ui/Spinner';
import { translateValue } from '@/lib/utils';

interface QueryResult {
  sql: string;
  explanation: string;
  narrative: string;
  title: string;
  data: Record<string, unknown>[];
  columns: string[];
  row_count: number;
}

type UserMessage    = { role: 'user'; text: string };
type AssistantMessage = { role: 'assistant'; loading: boolean; result?: QueryResult; error?: string };
type ChatMessage    = UserMessage | AssistantMessage;

const EXAMPLES = [
  'איזה חניון הניב את ההכנסות הגבוהות ביותר החודש?',
  'הצג את 10 כלי הרכב עם הכי הרבה הפרות',
  'מה משך החנייה הממוצע לפי סוג חניון?',
  'כמה מנויים פעילים יפוגו ב-30 הימים הקרובים?',
  'רשום את כל ההפרות הלא שולמות מעל ₪200',
  'באיזו שעה יש הכי הרבה חניות?',
  'הצג פירוט הכנסות לפי אמצעי תשלום',
  'מצא רכבים שיש להם גם מנוי וגם הפרות אחרונות',
  'מה האחוז בין חניות ששולמו לחניות שלא שולמו?',
  'הצג חניונים עם תפוסה מעל 80%',
];

function SqlBlock({ sql }: { sql: string }) {
  const keywords = ['SELECT','FROM','WHERE','JOIN','LEFT','INNER','GROUP BY','ORDER BY','HAVING','LIMIT','AND','OR','ON','AS','COUNT','SUM','AVG','MAX','MIN','DISTINCT','WITH','CASE','WHEN','THEN','ELSE','END','NOT','IN','IS','NULL','DESC','ASC'];
  const highlighted = sql.split('\n').map((line, i) => {
    let out = line;
    keywords.forEach(kw => {
      out = out.replace(new RegExp(`\\b(${kw})\\b`, 'g'), `<span class="text-blue-400 font-semibold">$1</span>`);
    });
    out = out.replace(/'([^']*)'/g, `<span class="text-emerald-400">'$1'</span>`);
    out = out.replace(/\b(\d+)\b/g, `<span class="text-orange-400">$1</span>`);
    return <div key={i} dangerouslySetInnerHTML={{ __html: out || '&nbsp;' }} />;
  });
  return (
    <pre className="text-xs font-mono leading-5 text-gray-300 overflow-x-auto" dir="ltr">
      {highlighted}
    </pre>
  );
}

function ResultTable({ columns, data }: { columns: string[]; data: Record<string, unknown>[] }) {
  if (!data.length) return <p className="text-gray-500 text-sm py-4 text-center">לא הוחזרו שורות.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#1F2937]">
            {columns.map(c => (
              <th key={c} className="px-3 py-2 text-right text-gray-500 text-xs font-medium uppercase tracking-wider whitespace-nowrap">
                {c.replace(/_/g, ' ')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-b border-[#1F2937]/50 hover:bg-white/[0.02]">
              {columns.map(c => {
                const val = row[c];
                const isNum   = typeof val === 'number';
                const isMoney = isNum && (c.includes('revenue') || c.includes('amount') || c.includes('price') || c.includes('charge') || c.includes('fine'));
                const isEnum  = typeof val === 'string' && val.length <= 30 && !/\s/.test(val);
                const display = isMoney
                  ? `₪${Number(val).toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : isEnum ? translateValue(val)
                  : (val === null || val === undefined ? '—' : String(val));
                return (
                  <td key={c} className={`px-3 py-2 text-xs whitespace-nowrap ${isNum ? 'text-left font-mono' : ''} ${isMoney ? 'text-emerald-400 font-semibold' : 'text-gray-300'}`}>
                    {display}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AssistantBubble({ msg }: { msg: AssistantMessage }) {
  const [showTable, setShowTable] = useState(true);
  const [showSql, setShowSql]     = useState(false);

  if (msg.loading) {
    return (
      <div className="flex gap-3 items-start">
        <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
          <Sparkles size={14} className="text-purple-400 animate-pulse" />
        </div>
        <div className="flex items-center gap-2 bg-[#111827] border border-[#1F2937] rounded-2xl rounded-tr-sm px-4 py-3">
          <Spinner size={13} className="text-purple-400" />
          <span className="text-gray-400 text-sm">מנתח נתונים…</span>
        </div>
      </div>
    );
  }

  if (msg.error) {
    return (
      <div className="flex gap-3 items-start">
        <div className="w-8 h-8 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center flex-shrink-0">
          <Sparkles size={14} className="text-red-400" />
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl rounded-tr-sm px-4 py-3 max-w-xl">
          <p className="text-red-300 text-sm">{msg.error}</p>
        </div>
      </div>
    );
  }

  const result = msg.result!;
  return (
    <div className="flex gap-3 items-start">
      <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Sparkles size={14} className="text-purple-400" />
      </div>

      <div className="flex-1 space-y-2 min-w-0">
        {/* Narrative */}
        <div className="bg-[#111827] border border-[#1F2937] rounded-2xl rounded-tr-sm px-4 py-3 space-y-1.5">
          <p className="text-white font-semibold text-sm">{result.title}</p>
          <p className="text-gray-300 text-sm leading-relaxed">{result.narrative ?? result.explanation}</p>
          <p className="text-gray-600 text-xs">{result.row_count.toLocaleString()} שורות הוחזרו</p>
        </div>

        {/* Data table */}
        {result.row_count > 0 && (
          <div className="border border-[#1F2937] rounded-xl overflow-hidden">
            <button
              onClick={() => setShowTable(v => !v)}
              className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <Table2 size={12} className="text-emerald-400" />
                <span className="text-xs text-gray-400">טבלת נתונים</span>
                <span className="text-xs text-gray-600 bg-[#1F2937] rounded-full px-1.5">{result.row_count}</span>
              </div>
              {showTable
                ? <ChevronUp size={12} className="text-gray-600" />
                : <ChevronDown size={12} className="text-gray-600" />}
            </button>
            {showTable && (
              <div className="border-t border-[#1F2937] bg-[#0C1220] p-2">
                <ResultTable columns={result.columns} data={result.data} />
              </div>
            )}
          </div>
        )}

        {/* SQL toggle */}
        <button
          onClick={() => setShowSql(v => !v)}
          className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-400 transition-colors py-0.5"
        >
          <Code2 size={11} />
          {showSql ? 'הסתר SQL' : 'הצג SQL'}
          {showSql ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
        </button>
        {showSql && (
          <div className="border border-[#1F2937] rounded-xl bg-[#0C1220] px-4 py-3">
            <SqlBlock sql={result.sql} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function AiConsolePage() {
  const [question, setQuestion] = useState('');
  const [loading, setLoading]   = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const chatEndRef  = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const ask = async (q?: string) => {
    const text = (q ?? question).trim();
    if (!text || loading) return;

    setMessages(prev => [
      ...prev,
      { role: 'user', text },
      { role: 'assistant', loading: true },
    ]);
    setQuestion('');
    setLoading(true);

    try {
      const res  = await fetch('/api/ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'השאילתה נכשלה');
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'assistant', loading: false, result: json };
        return updated;
      });
    } catch (e: any) {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'assistant', loading: false, error: e.message };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); ask(); }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-48px)] max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
            <Sparkles size={20} className="text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">קונסול שאילתות AI</h1>
            <p className="text-gray-500 text-sm">שאל כל שאלה על נתוני החניה שלך</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-red-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-500/10"
          >
            <Trash2 size={12} /> נקה שיחה
          </button>
        )}
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto space-y-5 pb-4 pl-1">
        {/* Empty state */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center mx-auto mb-3">
                <Sparkles size={28} className="text-purple-400" />
              </div>
              <p className="text-white font-medium">במה אוכל לעזור?</p>
              <p className="text-gray-500 text-sm mt-1">שאל שאלה על נתוני החניה שלך</p>
            </div>
            <div className="text-center">
              <p className="text-gray-600 text-xs mb-3 flex items-center justify-center gap-1.5">
                <Lightbulb size={12} /> שאלות לדוגמה
              </p>
              <div className="flex flex-wrap gap-2 justify-center max-w-2xl">
                {EXAMPLES.map(ex => (
                  <button
                    key={ex}
                    onClick={() => ask(ex)}
                    className="text-xs px-3 py-1.5 rounded-full bg-[#111827] border border-[#1F2937] text-gray-400 hover:border-purple-500/40 hover:text-purple-300 transition-colors"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Message list */}
        {messages.map((msg, i) =>
          msg.role === 'user' ? (
            <div key={i} className="flex">
              <div className="ml-auto bg-[#1E1B4B] border border-purple-500/20 rounded-2xl rounded-bl-sm px-4 py-2.5 max-w-[70%]">
                <p className="text-white text-sm">{msg.text}</p>
              </div>
            </div>
          ) : (
            <AssistantBubble key={i} msg={msg} />
          )
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input bar */}
      <div className="flex-shrink-0 border-t border-[#1F2937] pt-4">
        <div className="flex gap-3 items-end">
          <textarea
            ref={textareaRef}
            rows={2}
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={handleKey}
            placeholder="שאל שאלה על נתוני החניה…"
            className="flex-1 bg-[#111827] border border-[#1F2937] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 resize-none"
          />
          <button
            onClick={() => ask()}
            disabled={loading || !question.trim()}
            className="flex items-center justify-center w-11 h-11 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-colors flex-shrink-0"
          >
            {loading ? <Spinner size={14} className="text-white" /> : <Send size={15} />}
          </button>
        </div>
        <p className="text-gray-700 text-xs mt-1.5 text-center">⌘ + Enter להרצה</p>
      </div>
    </div>
  );
}
