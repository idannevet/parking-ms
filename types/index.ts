export interface ParkingLot {
  id: string;
  name: string;
  location: string;
  city: string;
  lot_type: 'city' | 'airport' | 'mall' | 'residential' | 'corporate' | 'hospital' | 'stadium';
  total_spots: number;
  hourly_rate: number;
  daily_rate: number;
  monthly_rate: number;
  is_active: boolean;
  opening_time: string;
  closing_time: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
}

export interface ParkingSpot {
  id: string;
  lot_id: string;
  spot_number: string;
  floor_level: number;
  spot_type: 'regular' | 'disabled' | 'ev' | 'vip' | 'reserved' | 'motorcycle';
  is_occupied: boolean;
  sensor_status: 'active' | 'faulty' | 'offline';
  last_updated: string;
  created_at: string;
}

export interface Vehicle {
  id: string;
  license_plate: string;
  owner_name: string;
  owner_email?: string;
  owner_phone?: string;
  vehicle_type: 'car' | 'motorcycle' | 'truck' | 'ev' | 'van' | 'suv';
  make?: string;
  model?: string;
  color?: string;
  year?: number;
  is_corporate: boolean;
  company_name?: string;
  created_at: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'operator' | 'security' | 'maintenance' | 'cashier' | 'manager';
  lot_id?: string;
  shift_start?: string;
  shift_end?: string;
  hourly_wage?: number;
  is_active: boolean;
  created_at: string;
}

export interface ParkingSession {
  id: string;
  vehicle_id: string;
  lot_id: string;
  spot_id?: string;
  entry_time: string;
  exit_time?: string;
  duration_minutes?: number;
  total_charge?: number;
  payment_status: 'pending' | 'paid' | 'unpaid' | 'waived' | 'subscription';
  session_type: 'regular' | 'subscription' | 'guest' | 'vip';
  created_at: string;
  // joined fields
  vehicle?: { license_plate: string; owner_name: string; vehicle_type: string };
  lot?: { name: string; city: string };
}

export interface Subscription {
  id: string;
  vehicle_id: string;
  lot_id: string;
  subscription_type: 'monthly' | 'yearly' | 'corporate' | 'daily_pass' | 'student';
  start_date: string;
  end_date: string;
  price: number;
  is_active: boolean;
  auto_renew: boolean;
  created_at: string;
  vehicle?: { license_plate: string; owner_name: string; is_corporate?: boolean; company_name?: string };
  lot?: { name: string };
}

export interface Payment {
  id: string;
  session_id?: string;
  subscription_id?: string;
  payment_method: 'cash' | 'credit_card' | 'debit_card' | 'mobile_pay' | 'corporate_account' | 'online';
  amount: number;
  payment_date: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  transaction_id?: string;
  created_at: string;
  session?: { vehicle?: { license_plate: string; owner_name: string }; lot?: { name: string } };
}

export interface Violation {
  id: string;
  vehicle_id: string;
  lot_id: string;
  spot_id?: string;
  violation_type: 'overtime' | 'no_permit' | 'disabled_zone' | 'fire_lane' | 'wrong_spot' | 'expired_meter' | 'double_parked' | 'unpaid_session';
  fine_amount: number;
  issued_at: string;
  due_date?: string;
  paid: boolean;
  paid_at?: string;
  notes?: string;
  issued_by?: string;
  created_at: string;
  vehicle?: { license_plate: string; owner_name: string };
  lot?: { name: string };
}

export interface DashboardStats {
  total_lots: number;
  total_spots: number;
  occupied_spots: number;
  total_vehicles: number;
  active_sessions: number;
  revenue_today: number;
  revenue_this_month: number;
  unpaid_violations: number;
  active_subscriptions: number;
  revenue_last_30_days: { date: string; revenue: number }[];
  occupancy_by_lot: { name: string; total_spots: number; occupied: number; pct: number }[];
  peak_hours: { hour: number; sessions: number }[];
  violations_by_type: { violation_type: string; count: number; total_fines: number }[];
  revenue_by_lot_type: { lot_type: string; revenue: number }[];
}

export interface AIQueryResult {
  sql: string;
  data: Record<string, unknown>[];
  explanation: string;
  columns: string[];
  row_count: number;
  error?: string;
}
