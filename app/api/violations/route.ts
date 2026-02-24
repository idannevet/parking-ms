import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const paid    = searchParams.get('paid');
  const lot_id  = searchParams.get('lot_id');
  const type    = searchParams.get('type');
  const page    = parseInt(searchParams.get('page') ?? '1');
  const pageSize = 50;

  let query = supabaseAdmin
    .from('violations')
    .select(`
      *,
      vehicle:vehicles(license_plate, owner_name),
      lot:parking_lots(name)
    `, { count: 'exact' })
    .order('issued_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (paid !== null && paid !== '') query = query.eq('paid', paid === 'true');
  if (lot_id) query = query.eq('lot_id', lot_id);
  if (type)   query = query.eq('violation_type', type);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data, total: count, page, pageSize });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { data, error } = await supabaseAdmin
    .from('violations')
    .insert(body)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
