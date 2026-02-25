'use client';
import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Code2, Table2, Lightbulb, Clock, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import Spinner from '@/components/ui/Spinner';

interface QueryResult {
  sql: string;
  explanation: string;
  title: string;
  data: Record<string, unknown>[];
  columns: string[];
  row_count: number;
}

interface HistoryItem {
  question: string;
  result: QueryResult;
  ts: number;
}

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
  const keywords = ['SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT', 'INNER', 'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'AND', 'OR', 'ON', 'AS', 'COUNT', 'SUM', 'AVG', 'MAX', 'MIN', 'DISTINCT', 'WITH', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'NOT', 'IN', 'IS', 'NULL', 'DESC', 'ASC'];
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
              <th key={c} className="px-3 py-2 text-right text-gray-500 text-xs font-medium uppercase tracking-wider whitespace-nowrap">{c.replace(/_/g, ' ')}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-b border-[#1F2937]/50 hover:bg-white/[0.02]">
              {columns.map(c => {
                const val = row[c];
                const str = val === null || val === undefined ? '—' : String(val);
                const isNum = typeof val === 'number';
                const isMoney = isNum && (c.includes('revenue') || c.includes('amount') || c.includes('price') || c.includes('charge') || c.includes('fine'));
                return (
                  <td key={c} className={`px-3 py-2 text-xs whitespace-nowrap ${isNum ? 'text-left font-mono' : ''} ${isMoney ? 'text-emerald-400 font-semibold' : 'text-gray-300'}`}>
                    {isMoney ? `₪${Number(val).toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : str}
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

export default function AiConsolePage() {
  const [question, setQuestion]       = useState('');
  const [loading, setLoading]         = useState(false);
  const [result, setResult]           = useState<QueryResult | null>(null);
  const [error, setError]             = useState('');
  const [history, setHistory]         = useState<HistoryItem[]>([]);
  const [showSql, setShowSql]         = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem('ai_query_history');
    if (stored) { try { setHistory(JSON.parse(stored)); } catch {} }
  }, []);

  const saveHistory = (items: HistoryItem[]) => {
    localStorage.setItem('ai_query_history', JSON.stringify(items.slice(0, 20)));
  };

  const ask = async (q?: string) => {
    const text = (q ?? question).trim();
    if (!text || loading) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'השאילתה נכשלה');
      setResult(json);
      const newItem: HistoryItem = { question: text, result: json, ts: Date.now() };
      setHistory(prev => {
        const updated = [newItem, ...prev.filter(h => h.question !== text)];
        saveHistory(updated);
        return updated;
      });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); ask(); }
  };

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
          <Sparkles size={20} className="text-purple-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">קונסול שאילתות AI</h1>
          <p className="text-gray-500 text-sm">שאל כל שאלה על נתוני החניה שלך בעברית</p>
        </div>
      </div>

      {/* Input */}
      <div className="card p-4 space-y-3">
        <textarea
          ref={textareaRef}
          rows={3}
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={handleKey}
          placeholder="לדוגמה: איזה חניון הרוויח הכי הרבה החודש?"
          className="w-full bg-[#0C1220] border border-[#1F2937] rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 resize-none"
        />
        <div className="flex items-center justify-between">
          <p className="text-gray-600 text-xs">⌘ + Enter להרצה</p>
          <button
            onClick={() => ask()}
            disabled={loading || !question.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
          >
            {loading ? <Spinner size={14} className="text-white" /> : <Send size={14} />}
            {loading ? 'מעבד…' : 'הרץ שאילתה'}
          </button>
        </div>
      </div>

      {/* Example chips */}
      <div>
        <p className="text-gray-600 text-xs mb-2 flex items-center gap-1.5"><Lightbulb size={12} /> שאלות לדוגמה</p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map(ex => (
            <button
              key={ex}
              onClick={() => { setQuestion(ex); ask(ex); }}
              className="text-xs px-3 py-1.5 rounded-full bg-[#111827] border border-[#1F2937] text-gray-400 hover:border-purple-500/40 hover:text-purple-300 transition-colors"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="card border-red-500/30 bg-red-500/5 p-4">
          <p className="text-red-400 text-sm font-medium">שגיאה בשאילתה</p>
          <p className="text-red-300/70 text-xs mt-1">{error}</p>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Explanation */}
          <div className="card p-4">
            <div className="flex items-start gap-3">
              <Sparkles size={16} className="text-purple-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-white font-semibold text-sm">{result.title}</p>
                <p className="text-gray-400 text-sm mt-1 leading-relaxed">{result.explanation}</p>
                <p className="text-gray-600 text-xs mt-2">{result.row_count.toLocaleString()} {result.row_count === 1 ? 'שורה' : 'שורות'} הוחזרו</p>
              </div>
            </div>
          </div>

          {/* SQL Toggle */}
          <div className="card overflow-hidden">
            <button
              onClick={() => setShowSql(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3 text-right hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-2">
                <Code2 size={14} className="text-blue-400" />
                <span className="text-sm font-medium text-gray-300">SQL שנוצר</span>
              </div>
              {showSql ? <ChevronUp size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
            </button>
            {showSql && (
              <div className="px-4 pb-4 border-t border-[#1F2937] pt-3 bg-[#0C1220]">
                <SqlBlock sql={result.sql} />
              </div>
            )}
          </div>

          {/* Data Table */}
          <div className="card overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1F2937]">
              <Table2 size={14} className="text-emerald-400" />
              <span className="text-sm font-medium text-gray-300">תוצאות</span>
              <span className="mr-auto text-xs text-gray-600">{result.row_count} שורות</span>
            </div>
            <div className="p-2">
              <ResultTable columns={result.columns} data={result.data} />
            </div>
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="card overflow-hidden">
          <button
            onClick={() => setShowHistory(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-400">שאילתות אחרונות</span>
              <span className="text-xs text-gray-600 bg-[#1F2937] rounded-full px-2 py-0.5">{history.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={e => { e.stopPropagation(); setHistory([]); localStorage.removeItem('ai_query_history'); }}
                className="text-gray-600 hover:text-red-400 transition-colors p-1"
              >
                <Trash2 size={13} />
              </button>
              {showHistory ? <ChevronUp size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
            </div>
          </button>
          {showHistory && (
            <div className="border-t border-[#1F2937]">
              {history.map((h, i) => (
                <button
                  key={i}
                  onClick={() => { setQuestion(h.question); setResult(h.result); setError(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="w-full px-4 py-3 text-right hover:bg-white/[0.02] border-b border-[#1F2937]/50 last:border-0 transition-colors group"
                >
                  <p className="text-gray-300 text-sm group-hover:text-white transition-colors truncate">{h.question}</p>
                  <p className="text-gray-600 text-xs mt-0.5">{h.result.row_count} שורות · {new Date(h.ts).toLocaleTimeString('he-IL')}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
