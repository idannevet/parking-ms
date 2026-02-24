import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type   = searchParams.get('type');
  const active = searchParams.get('active');

  let query = supabaseAdmin
    .from('parking_lots')
    .select(`*, parking_spots(count)`)
    .order('name');

  if (type)   query = query.eq('lot_type', type);
  if (active) query = query.eq('is_active', active === 'true');

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Attach occupancy
  const lots = await Promise.all((data || []).map(async (lot: any) => {
    const { count: occupied } = await supabaseAdmin
      .from('parking_spots')
      .select('*', { count: 'exact', head: true })
      .eq('lot_id', lot.id)
      .eq('is_occupied', true);
    const { count: total } = await supabaseAdmin
      .from('parking_spots')
      .select('*', { count: 'exact', head: true })
      .eq('lot_id', lot.id);
    return { ...lot, occupied_spots: occupied ?? 0, spot_count: total ?? 0 };
  }));

  return NextResponse.json(lots);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { data, error } = await supabaseAdmin
    .from('parking_lots')
    .insert(body)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
