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
    return { valid: false, reason: 'Only SELECT queries are permitted.' };
  }
  if (BLOCKED_KEYWORDS.test(sql)) {
    return { valid: false, reason: 'Query contains disallowed keywords.' };
  }
  return { valid: true };
}

export async function POST(req: NextRequest) {
  try {
    const { question } = await req.json();
    if (!question?.trim()) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
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
      return NextResponse.json({ error: 'Unexpected AI response format' }, { status: 500 });
    }

    // ── Step 2: Parse JSON response ─────────────────────────
    let parsed: { sql: string; explanation: string; title: string };
    try {
      // Strip markdown code fences if present
      const jsonStr = rawContent.text
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      return NextResponse.json({
        error: 'AI returned malformed JSON. Please rephrase your question.',
        raw: rawContent.text.slice(0, 500),
      }, { status: 422 });
    }

    const { sql, explanation, title } = parsed;

    // ── Step 3: Validate SQL safety ─────────────────────────
    const validation = validateSQL(sql);
    if (!validation.valid) {
      return NextResponse.json({
        error: `SQL validation failed: ${validation.reason}`,
        sql,
      }, { status: 422 });
    }

    // ── Step 4: Execute via Supabase RPC ────────────────────
    const { data: rawData, error: rpcError } = await supabaseAdmin
      .rpc('execute_ai_query', { query_text: sql });

    if (rpcError) {
      return NextResponse.json({
        error: `Query execution failed: ${rpcError.message}`,
        sql,
        explanation,
        title,
      }, { status: 422 });
    }

    // rawData is JSONB array from the function
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
      { error: err?.message ?? 'Internal server error' },
      { status: 500 }
    );
  }
}
