-- ============================================================
-- PARKING MANAGEMENT SYSTEM — DATABASE SCHEMA
-- Run this in Supabase SQL Editor (Schema tab)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── PARKING LOTS ─────────────────────────────────────────
CREATE TABLE parking_lots (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(100) NOT NULL,
  location      VARCHAR(200) NOT NULL,
  city          VARCHAR(50)  NOT NULL DEFAULT 'Tel Aviv',
  lot_type      VARCHAR(30)  NOT NULL CHECK (lot_type IN ('city','airport','mall','residential','corporate','hospital','stadium')),
  total_spots   INTEGER      NOT NULL,
  hourly_rate   DECIMAL(8,2) NOT NULL,
  daily_rate    DECIMAL(8,2) NOT NULL,
  monthly_rate  DECIMAL(8,2) NOT NULL,
  is_active     BOOLEAN      DEFAULT TRUE,
  opening_time  TIME         DEFAULT '06:00',
  closing_time  TIME         DEFAULT '23:00',
  latitude      DECIMAL(10,7),
  longitude     DECIMAL(10,7),
  created_at    TIMESTAMPTZ  DEFAULT NOW()
);

-- ─── PARKING SPOTS ────────────────────────────────────────
CREATE TABLE parking_spots (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lot_id         UUID         REFERENCES parking_lots(id) ON DELETE CASCADE,
  spot_number    VARCHAR(10)  NOT NULL,
  floor_level    SMALLINT     DEFAULT 1,
  spot_type      VARCHAR(20)  NOT NULL CHECK (spot_type IN ('regular','disabled','ev','vip','reserved','motorcycle')),
  is_occupied    BOOLEAN      DEFAULT FALSE,
  sensor_status  VARCHAR(20)  DEFAULT 'active' CHECK (sensor_status IN ('active','faulty','offline')),
  last_updated   TIMESTAMPTZ  DEFAULT NOW(),
  created_at     TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE (lot_id, spot_number)
);

-- ─── VEHICLES ─────────────────────────────────────────────
CREATE TABLE vehicles (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  license_plate  VARCHAR(20)  UNIQUE NOT NULL,
  owner_name     VARCHAR(100) NOT NULL,
  owner_email    VARCHAR(100),
  owner_phone    VARCHAR(20),
  vehicle_type   VARCHAR(20)  NOT NULL CHECK (vehicle_type IN ('car','motorcycle','truck','ev','van','suv')),
  make           VARCHAR(50),
  model          VARCHAR(50),
  color          VARCHAR(30),
  year           SMALLINT,
  is_corporate   BOOLEAN      DEFAULT FALSE,
  company_name   VARCHAR(100),
  created_at     TIMESTAMPTZ  DEFAULT NOW()
);

-- ─── EMPLOYEES ────────────────────────────────────────────
CREATE TABLE employees (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         VARCHAR(100) NOT NULL,
  email        VARCHAR(100) UNIQUE NOT NULL,
  role         VARCHAR(30)  NOT NULL CHECK (role IN ('admin','operator','security','maintenance','cashier','manager')),
  lot_id       UUID         REFERENCES parking_lots(id),
  shift_start  TIME,
  shift_end    TIME,
  hourly_wage  DECIMAL(8,2),
  is_active    BOOLEAN      DEFAULT TRUE,
  created_at   TIMESTAMPTZ  DEFAULT NOW()
);

-- ─── PARKING SESSIONS ─────────────────────────────────────
CREATE TABLE parking_sessions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id       UUID         REFERENCES vehicles(id),
  lot_id           UUID         REFERENCES parking_lots(id),
  spot_id          UUID         REFERENCES parking_spots(id),
  entry_time       TIMESTAMPTZ  NOT NULL,
  exit_time        TIMESTAMPTZ,
  duration_minutes INTEGER,
  total_charge     DECIMAL(8,2),
  payment_status   VARCHAR(20)  DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','unpaid','waived','subscription')),
  session_type     VARCHAR(20)  DEFAULT 'regular' CHECK (session_type IN ('regular','subscription','guest','vip')),
  created_at       TIMESTAMPTZ  DEFAULT NOW()
);

-- ─── SUBSCRIPTIONS ────────────────────────────────────────
CREATE TABLE subscriptions (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id         UUID         REFERENCES vehicles(id),
  lot_id             UUID         REFERENCES parking_lots(id),
  subscription_type  VARCHAR(20)  NOT NULL CHECK (subscription_type IN ('monthly','yearly','corporate','daily_pass','student')),
  start_date         DATE         NOT NULL,
  end_date           DATE         NOT NULL,
  price              DECIMAL(8,2) NOT NULL,
  is_active          BOOLEAN      DEFAULT TRUE,
  auto_renew         BOOLEAN      DEFAULT FALSE,
  created_at         TIMESTAMPTZ  DEFAULT NOW()
);

-- ─── PAYMENTS ─────────────────────────────────────────────
CREATE TABLE payments (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id       UUID         REFERENCES parking_sessions(id),
  subscription_id  UUID         REFERENCES subscriptions(id),
  payment_method   VARCHAR(30)  NOT NULL CHECK (payment_method IN ('cash','credit_card','debit_card','mobile_pay','corporate_account','online')),
  amount           DECIMAL(8,2) NOT NULL,
  payment_date     TIMESTAMPTZ  DEFAULT NOW(),
  status           VARCHAR(20)  DEFAULT 'completed' CHECK (status IN ('completed','pending','failed','refunded')),
  transaction_id   VARCHAR(100),
  created_at       TIMESTAMPTZ  DEFAULT NOW()
);

-- ─── VIOLATIONS ───────────────────────────────────────────
CREATE TABLE violations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id      UUID         REFERENCES vehicles(id),
  lot_id          UUID         REFERENCES parking_lots(id),
  spot_id         UUID         REFERENCES parking_spots(id),
  violation_type  VARCHAR(50)  NOT NULL CHECK (violation_type IN ('overtime','no_permit','disabled_zone','fire_lane','wrong_spot','expired_meter','double_parked','unpaid_session')),
  fine_amount     DECIMAL(8,2) NOT NULL,
  issued_at       TIMESTAMPTZ  DEFAULT NOW(),
  due_date        DATE,
  paid            BOOLEAN      DEFAULT FALSE,
  paid_at         TIMESTAMPTZ,
  notes           TEXT,
  issued_by       UUID         REFERENCES employees(id),
  created_at      TIMESTAMPTZ  DEFAULT NOW()
);

-- ─── INDEXES ──────────────────────────────────────────────
CREATE INDEX idx_spots_lot        ON parking_spots(lot_id);
CREATE INDEX idx_spots_occupied   ON parking_spots(is_occupied);
CREATE INDEX idx_sessions_vehicle ON parking_sessions(vehicle_id);
CREATE INDEX idx_sessions_lot     ON parking_sessions(lot_id);
CREATE INDEX idx_sessions_entry   ON parking_sessions(entry_time);
CREATE INDEX idx_sessions_status  ON parking_sessions(payment_status);
CREATE INDEX idx_payments_date    ON payments(payment_date);
CREATE INDEX idx_violations_paid  ON violations(paid);
CREATE INDEX idx_violations_veh   ON violations(vehicle_id);
CREATE INDEX idx_subs_active      ON subscriptions(is_active);

-- ─── AI QUERY FUNCTION ────────────────────────────────────
-- Allows safe SELECT-only execution via RPC
CREATE OR REPLACE FUNCTION execute_ai_query(query_text TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result       JSONB;
  clean_query  TEXT;
BEGIN
  -- Strip leading whitespace and normalize
  clean_query := TRIM(query_text);

  -- SAFETY: Only allow SELECT statements
  IF clean_query !~* '^\s*SELECT\b' THEN
    RAISE EXCEPTION 'Security violation: Only SELECT queries are permitted. Query: %', LEFT(clean_query, 100);
  END IF;

  -- SAFETY: Block any destructive keywords embedded in query
  IF clean_query ~* '\b(DROP|DELETE|UPDATE|INSERT|ALTER|TRUNCATE|GRANT|REVOKE|CREATE|EXEC|EXECUTE)\b' THEN
    RAISE EXCEPTION 'Security violation: Destructive keyword detected in query';
  END IF;

  -- Execute and return as JSON array
  EXECUTE format(
    'SELECT COALESCE(jsonb_agg(row_to_json(t)), ''[]''::jsonb) FROM (%s) t',
    clean_query
  ) INTO result;

  RETURN COALESCE(result, '[]'::jsonb);
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('error', SQLERRM, 'query', LEFT(clean_query, 200));
END;
$$;

-- ─── DASHBOARD STATS FUNCTION ─────────────────────────────
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_lots',            (SELECT COUNT(*) FROM parking_lots WHERE is_active),
    'total_spots',           (SELECT COUNT(*) FROM parking_spots),
    'occupied_spots',        (SELECT COUNT(*) FROM parking_spots WHERE is_occupied),
    'total_vehicles',        (SELECT COUNT(*) FROM vehicles),
    'active_sessions',       (SELECT COUNT(*) FROM parking_sessions WHERE exit_time IS NULL),
    'revenue_today',         (SELECT COALESCE(SUM(amount),0) FROM payments WHERE payment_date::date = CURRENT_DATE AND status='completed'),
    'revenue_this_month',    (SELECT COALESCE(SUM(amount),0) FROM payments WHERE DATE_TRUNC('month',payment_date)=DATE_TRUNC('month',NOW()) AND status='completed'),
    'unpaid_violations',     (SELECT COUNT(*) FROM violations WHERE paid=false),
    'active_subscriptions',  (SELECT COUNT(*) FROM subscriptions WHERE is_active AND end_date >= CURRENT_DATE),
    'revenue_last_30_days',  (
      SELECT jsonb_agg(row_to_json(d)) FROM (
        SELECT DATE(payment_date) AS date, SUM(amount) AS revenue
        FROM payments WHERE payment_date >= NOW()-INTERVAL '30 days' AND status='completed'
        GROUP BY DATE(payment_date) ORDER BY date
      ) d
    ),
    'occupancy_by_lot',      (
      SELECT jsonb_agg(row_to_json(l)) FROM (
        SELECT pl.name, pl.total_spots,
          COUNT(ps.id) FILTER (WHERE ps.is_occupied) AS occupied,
          ROUND(100.0 * COUNT(ps.id) FILTER (WHERE ps.is_occupied) / NULLIF(pl.total_spots,0), 1) AS pct
        FROM parking_lots pl
        LEFT JOIN parking_spots ps ON ps.lot_id = pl.id
        WHERE pl.is_active
        GROUP BY pl.id, pl.name, pl.total_spots
        ORDER BY pct DESC LIMIT 10
      ) l
    ),
    'peak_hours',            (
      SELECT jsonb_agg(row_to_json(h)) FROM (
        SELECT EXTRACT(HOUR FROM entry_time)::int AS hour, COUNT(*) AS sessions
        FROM parking_sessions WHERE entry_time >= NOW()-INTERVAL '30 days'
        GROUP BY hour ORDER BY hour
      ) h
    ),
    'violations_by_type',    (
      SELECT jsonb_agg(row_to_json(v)) FROM (
        SELECT violation_type, COUNT(*) AS count, SUM(fine_amount) AS total_fines
        FROM violations GROUP BY violation_type ORDER BY count DESC
      ) v
    ),
    'revenue_by_lot_type',   (
      SELECT jsonb_agg(row_to_json(lt)) FROM (
        SELECT pl.lot_type, COALESCE(SUM(p.amount),0) AS revenue
        FROM parking_lots pl
        LEFT JOIN parking_sessions ps ON ps.lot_id = pl.id
        LEFT JOIN payments p ON p.session_id = ps.id AND p.status='completed'
        WHERE p.payment_date >= NOW()-INTERVAL '30 days'
        GROUP BY pl.lot_type ORDER BY revenue DESC
      ) lt
    )
  ) INTO result;
  RETURN result;
END;
$$;
