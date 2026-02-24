import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search   = searchParams.get('search');
  const type     = searchParams.get('type');
  const corp     = searchParams.get('corporate');
  const page     = parseInt(searchParams.get('page') ?? '1');
  const pageSize = 50;

  let query = supabaseAdmin
    .from('vehicles')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (search) query = query.or(`license_plate.ilike.%${search}%,owner_name.ilike.%${search}%`);
  if (type)   query = query.eq('vehicle_type', type);
  if (corp)   query = query.eq('is_corporate', corp === 'true');

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data, total: count, page, pageSize });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { data, error } = await supabaseAdmin
    .from('vehicles')
    .insert(body)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
