import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { supabaseAdmin } from '@/lib/supabase';
import { PARKING_SYSTEM_PROMPT } from '@/lib/ai-prompt';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Block destructive SQL keywords
const BLOCKED_KEYWORDS = /\b(DROP|DELETE|UPDATE|INSERT|ALTER|TRUNCATE|GRANT|REVOKE|CREATE|EXEC|EXECUTE|COPY|VACUUM|ANALYZE)\b/gi;

function validateSQL(sql: string): { valid: boolean; reason?: string } {
  const clean = sql.trim().toUpperCase();
  if (!clean.startsWith('SELECT')) {
    return { valid: false, reason: 'מותרות רק שאילתות SELECT.' };
  }
  if (BLOCKED_KEYWORDS.test(sql)) {
    return { valid: false, reason: 'השאילתה מכילה מילת מפתח אסורה.' };
  }
  return { valid: true };
}

function extractJSON(text: string): string {
  // Try to find a JSON object anywhere in the response
  const start = text.indexOf('{');
  const end   = text.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    return text.slice(start, end + 1);
  }
  // Fallback: strip markdown fences
  return text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

export async function POST(req: NextRequest) {
  try {
    const { question } = await req.json();
    if (!question?.trim()) {
      return NextResponse.json({ error: 'שאלה נדרשת' }, { status: 400 });
    }

    // ── Step 1: Ask Claude to generate SQL ──────────────────
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: PARKING_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: question }],
    });

    const rawContent = message.content[0];
    if (rawContent.type !== 'text') {
      return NextResponse.json({ error: 'תגובת AI בפורמט לא צפוי' }, { status: 500 });
    }

    // ── Step 2: Parse JSON response ─────────────────────────
    let parsed: { sql: string; explanation: string; title: string };
    try {
      const jsonStr = extractJSON(rawContent.text);
      parsed = JSON.parse(jsonStr);
    } catch {
      return NextResponse.json({
        error: 'ה-AI החזיר תגובה לא תקינה. נסה לנסח מחדש את השאלה.',
        raw: rawContent.text.slice(0, 500),
      }, { status: 422 });
    }

    const { sql, explanation, title } = parsed;
    if (!sql) {
      return NextResponse.json({ error: 'ה-AI לא הצליח לייצר שאילתת SQL.' }, { status: 422 });
    }

    // ── Step 3: Validate SQL safety ─────────────────────────
    const validation = validateSQL(sql);
    if (!validation.valid) {
      return NextResponse.json({
        error: `אימות SQL נכשל: ${validation.reason}`,
        sql,
      }, { status: 422 });
    }

    // ── Step 4: Execute via Supabase RPC ────────────────────
    const { data: rawData, error: rpcError } = await supabaseAdmin
      .rpc('execute_ai_query', { query_text: sql });

    if (rpcError) {
      return NextResponse.json({
        error: `ביצוע השאילתה נכשל: ${rpcError.message}`,
        sql,
        explanation,
        title,
      }, { status: 422 });
    }

    // Check if the function returned an error object instead of rows
    if (rawData && typeof rawData === 'object' && !Array.isArray(rawData) && (rawData as any).error) {
      return NextResponse.json({
        error: `שגיאת מסד נתונים: ${(rawData as any).error}`,
        sql,
        explanation,
        title,
      }, { status: 422 });
    }

    const rows = Array.isArray(rawData) ? rawData : [];
    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

    return NextResponse.json({
      sql,
      explanation,
      title,
      data: rows,
      columns,
      row_count: rows.length,
    });
  } catch (err: any) {
    console.error('AI query error:', err);
    return NextResponse.json(
      { error: err?.message ?? 'שגיאה פנימית בשרת' },
      { status: 500 }
    );
  }
}
