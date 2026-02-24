import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const method   = searchParams.get('method');
  const status   = searchParams.get('status');
  const page     = parseInt(searchParams.get('page') ?? '1');
  const pageSize = 50;

  let query = supabaseAdmin
    .from('payments')
    .select(`
      *,
      session:parking_sessions(
        vehicle:vehicles(license_plate, owner_name),
        lot:parking_lots(name)
      )
    `, { count: 'exact' })
    .order('payment_date', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (method) query = query.eq('payment_method', method);
  if (status) query = query.eq('status', status);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data, total: count, page, pageSize });
}
