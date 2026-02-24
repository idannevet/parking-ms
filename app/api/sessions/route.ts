import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status   = searchParams.get('status');
  const lot_id   = searchParams.get('lot_id');
  const active   = searchParams.get('active');
  const page     = parseInt(searchParams.get('page') ?? '1');
  const pageSize = 50;

  let query = supabaseAdmin
    .from('parking_sessions')
    .select(`
      *,
      vehicle:vehicles(license_plate, owner_name, vehicle_type),
      lot:parking_lots(name, city)
    `, { count: 'exact' })
    .order('entry_time', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (status) query = query.eq('payment_status', status);
  if (lot_id) query = query.eq('lot_id', lot_id);
  if (active === 'true') query = query.is('exit_time', null);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data, total: count, page, pageSize });
}
