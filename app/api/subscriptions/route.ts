import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const active   = searchParams.get('active');
  const type     = searchParams.get('type');
  const page     = parseInt(searchParams.get('page') ?? '1');
  const pageSize = 50;

  let query = supabaseAdmin
    .from('subscriptions')
    .select(`
      *,
      vehicle:vehicles(license_plate, owner_name, is_corporate, company_name),
      lot:parking_lots(name, city)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (active) query = query.eq('is_active', active === 'true');
  if (type)   query = query.eq('subscription_type', type);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data, total: count, page, pageSize });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { data, error } = await supabaseAdmin
    .from('subscriptions')
    .insert(body)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
