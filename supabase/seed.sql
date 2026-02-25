-- ============================================================
-- PARKING MANAGEMENT SYSTEM — SEED DATA
-- Run AFTER schema.sql in Supabase SQL Editor
-- Generates: 15 lots, ~350 spots, 500 vehicles, 5000+ sessions
-- ============================================================

-- ─── PARKING LOTS ─────────────────────────────────────────
INSERT INTO parking_lots (id, name, location, city, lot_type, total_spots, hourly_rate, daily_rate, monthly_rate, opening_time, closing_time, latitude, longitude) VALUES
  ('11111111-1111-1111-1111-000000000001','City Center Garage','12 Dizengoff St','Tel Aviv','city',250,8.50,55.00,650.00,'00:00','23:59',32.0804,34.7805),
  ('11111111-1111-1111-1111-000000000002','Ben Gurion Airport P1','Airport Rd, Terminal 3','Lod','airport',800,12.00,85.00,1200.00,'00:00','23:59',32.0055,34.8854),
  ('11111111-1111-1111-1111-000000000003','Azrieli Mall Parking','132 Menachem Begin Rd','Tel Aviv','mall',600,7.00,50.00,580.00,'08:00','23:00',32.0741,34.7916),
  ('11111111-1111-1111-1111-000000000004','Rothschild Corporate Hub','28 Rothschild Blvd','Tel Aviv','corporate',150,15.00,90.00,1500.00,'06:00','22:00',32.0653,34.7748),
  ('11111111-1111-1111-1111-000000000005','Neve Tzedek Residential','5 Shabazi St','Tel Aviv','residential',120,4.00,20.00,280.00,'00:00','23:59',32.0566,34.7561),
  ('11111111-1111-1111-1111-000000000006','Haifa Port District','1 Allenby St','Haifa','city',300,6.50,42.00,520.00,'06:00','22:00',32.8176,34.9885),
  ('11111111-1111-1111-1111-000000000007','Jerusalem Old City Gate','Sultan Suleiman St','Jerusalem','city',200,9.00,60.00,720.00,'06:00','22:00',31.7832,35.2353),
  ('11111111-1111-1111-1111-000000000008','Soroka Medical Center','151 Reger Blvd','Be''er Sheva','hospital',180,5.00,30.00,350.00,'00:00','23:59',31.2583,34.8012),
  ('11111111-1111-1111-1111-000000000009','Ramat Gan Diamond Exchange','50 Jabotinsky St','Ramat Gan','corporate',220,12.00,70.00,1100.00,'07:00','21:00',32.0822,34.8178),
  ('11111111-1111-1111-1111-000000000010','Eilat Mall Parking','North Beach Promenade','Eilat','mall',350,5.50,35.00,400.00,'08:00','23:00',29.5577,34.9519),
  ('11111111-1111-1111-1111-000000000011','Netanya City Square','1 Independence Square','Netanya','city',160,5.00,32.00,380.00,'06:00','22:00',32.3293,34.8588),
  ('11111111-1111-1111-1111-000000000012','Teddy Stadium Jerusalem','Katamon','Jerusalem','stadium',400,10.00,40.00,0.00,'10:00','23:59',31.7478,35.2020),
  ('11111111-1111-1111-1111-000000000013','Modi''in Tech Park','7 Alon Rd','Modi''in','corporate',280,11.00,65.00,950.00,'07:00','20:00',31.9079,35.0076),
  ('11111111-1111-1111-1111-000000000014','Herzliya Marina','Marina Blvd','Herzliya','residential',200,8.00,48.00,600.00,'00:00','23:59',32.1659,34.7985),
  ('11111111-1111-1111-1111-000000000015','Rishon Tech Campus','30 HaMasger St','Rishon LeZion','corporate',320,10.00,60.00,880.00,'06:30','21:00',31.9633,34.8042);

-- ─── PARKING SPOTS (generated per lot) ───────────────────
-- We'll use a helper to insert spots for each lot
DO $$
DECLARE
  lot RECORD;
  i   INTEGER;
  stype VARCHAR(20);
  floor_num SMALLINT;
  total INTEGER;
BEGIN
  FOR lot IN SELECT id, total_spots FROM parking_lots LOOP
    total := LEAST(lot.total_spots, 40); -- 40 spots per lot for seed
    FOR i IN 1..total LOOP
      -- Determine spot type distribution
      stype := CASE
        WHEN i <= 2                        THEN 'disabled'
        WHEN i <= 4                        THEN 'ev'
        WHEN i <= 5                        THEN 'motorcycle'
        WHEN i <= 7 AND total >= 30       THEN 'vip'
        WHEN i <= 10 AND total >= 50      THEN 'reserved'
        ELSE 'regular'
      END;
      floor_num := CASE WHEN i <= 20 THEN 1 WHEN i <= 35 THEN 2 ELSE 3 END;

      INSERT INTO parking_spots (lot_id, spot_number, floor_level, spot_type, is_occupied, sensor_status)
      VALUES (
        lot.id,
        CASE WHEN floor_num=1 THEN 'A' WHEN floor_num=2 THEN 'B' ELSE 'C' END || LPAD(((i-1) % 20 + 1)::TEXT, 3, '0'),
        floor_num,
        stype,
        (random() < 0.45),  -- ~45% occupied
        CASE WHEN random() < 0.95 THEN 'active' WHEN random() < 0.5 THEN 'faulty' ELSE 'offline' END
      );
    END LOOP;
  END LOOP;
END;
$$;

-- ─── EMPLOYEES ────────────────────────────────────────────
INSERT INTO employees (id, name, email, role, lot_id, shift_start, shift_end, hourly_wage) VALUES
  ('22222222-2222-2222-2222-000000000001','David Cohen','david.cohen@parkingms.co.il','admin',NULL,'08:00','17:00',85.00),
  ('22222222-2222-2222-2222-000000000002','Sarah Levy','sarah.levy@parkingms.co.il','manager','11111111-1111-1111-1111-000000000001','08:00','16:00',65.00),
  ('22222222-2222-2222-2222-000000000003','Avi Mizrahi','avi.mizrahi@parkingms.co.il','operator','11111111-1111-1111-1111-000000000002','06:00','14:00',45.00),
  ('22222222-2222-2222-2222-000000000004','Noa Katz','noa.katz@parkingms.co.il','cashier','11111111-1111-1111-1111-000000000003','10:00','18:00',40.00),
  ('22222222-2222-2222-2222-000000000005','Yossi Ben-David','yossi.bendavid@parkingms.co.il','security','11111111-1111-1111-1111-000000000002','22:00','06:00',48.00),
  ('22222222-2222-2222-2222-000000000006','Michal Shapiro','michal.shapiro@parkingms.co.il','operator','11111111-1111-1111-1111-000000000004','07:00','15:00',45.00),
  ('22222222-2222-2222-2222-000000000007','Ronen Tal','ronen.tal@parkingms.co.il','security','11111111-1111-1111-1111-000000000001','14:00','22:00',48.00),
  ('22222222-2222-2222-2222-000000000008','Hila Friedman','hila.friedman@parkingms.co.il','cashier','11111111-1111-1111-1111-000000000006','09:00','17:00',40.00),
  ('22222222-2222-2222-2222-000000000009','Gal Peretz','gal.peretz@parkingms.co.il','maintenance',NULL,'07:00','15:00',52.00),
  ('22222222-2222-2222-2222-000000000010','Tamar Gold','tamar.gold@parkingms.co.il','manager','11111111-1111-1111-1111-000000000009','08:00','16:00',65.00);

-- ─── VEHICLES (500 vehicles) ──────────────────────────────
DO $$
DECLARE
  first_names TEXT[] := ARRAY['Avi','Sarah','Moshe','Noa','Yossi','Tamar','Roni','Liav','Gal','Hila','Daniel','Maya','Eyal','Shira','Uri','Dana','Amir','Tali','Ben','Yael','Omer','Lior','Itay','Michal','Nadav'];
  last_names  TEXT[] := ARRAY['Cohen','Levi','Mizrahi','Katz','Ben-David','Shapiro','Friedman','Peretz','Goldberg','Amir','Stern','Blum','Rosen','Weiss','Barak','Carmel','Dayan','Elias','Falk','Green'];
  makes       TEXT[] := ARRAY['Toyota','Hyundai','Kia','Mazda','Honda','Volkswagen','Skoda','BMW','Mercedes','Audi','Tesla','Renault','Peugeot','Ford','Mitsubishi'];
  models      TEXT[] := ARRAY['Corolla','Elantra','Sportage','3','Civic','Golf','Octavia','3 Series','C-Class','A4','Model 3','Clio','208','Focus','Outlander'];
  colors      TEXT[] := ARRAY['White','Silver','Black','Gray','Blue','Red','Green','Brown','Orange','Yellow'];
  vtypes      TEXT[] := ARRAY['car','car','car','car','car','car','suv','suv','ev','van','motorcycle','truck'];
  companies   TEXT[] := ARRAY['TechVision Ltd','Global Finance','StartUp Nation','IDF Logistics','MedCore','LegalPro','ArchDesign','BuildIt Construction','FoodChain','RetailMax'];
  i           INTEGER;
  fname       TEXT;
  lname       TEXT;
  vtype       TEXT;
  is_corp     BOOLEAN;
  comp        TEXT;
  plt         TEXT;
BEGIN
  FOR i IN 1..500 LOOP
    fname    := first_names[1 + (random()*24)::int];
    lname    := last_names[1 + (random()*19)::int];
    vtype    := vtypes[1 + (random()*11)::int];
    is_corp  := random() < 0.18;
    comp     := CASE WHEN is_corp THEN companies[1+(random()*9)::int] ELSE NULL END;
    plt      := chr(65+(random()*25)::int)||chr(65+(random()*25)::int)||'-'||LPAD((random()*9999)::int::text,4,'0');

    INSERT INTO vehicles (license_plate, owner_name, owner_email, owner_phone, vehicle_type, make, model, color, year, is_corporate, company_name)
    VALUES (
      plt,
      fname || ' ' || lname,
      lower(fname||'.'||lname||i::text||'@email.co.il'),
      '05'||(random()*9)::int::text||'-'||LPAD((random()*9999999)::int::text,7,'0'),
      vtype,
      makes[1+(random()*14)::int],
      models[1+(random()*14)::int],
      colors[1+(random()*9)::int],
      2010 + (random()*14)::int,
      is_corp,
      comp
    );
  END LOOP;
END;
$$;

-- ─── SUBSCRIPTIONS ────────────────────────────────────────
DO $$
DECLARE
  veh  RECORD;
  lot_ids UUID[] := ARRAY[
    '11111111-1111-1111-1111-000000000001'::uuid,
    '11111111-1111-1111-1111-000000000002'::uuid,
    '11111111-1111-1111-1111-000000000003'::uuid,
    '11111111-1111-1111-1111-000000000004'::uuid,
    '11111111-1111-1111-1111-000000000009'::uuid,
    '11111111-1111-1111-1111-000000000013'::uuid
  ];
  stypes TEXT[] := ARRAY['monthly','monthly','yearly','corporate','student'];
  prices DECIMAL[] := ARRAY[580.00,650.00,6500.00,1200.00,290.00];
  stype  TEXT;
  price  DECIMAL;
  sdate  DATE;
  edate  DATE;
  lid    UUID;
  idx    INTEGER;
BEGIN
  FOR veh IN SELECT id, is_corporate FROM vehicles ORDER BY random() LIMIT 200 LOOP
    idx   := 1 + (random()*4)::int;
    stype := stypes[idx];
    price := prices[idx];
    lid   := lot_ids[1 + (random()*5)::int];
    sdate := CURRENT_DATE - (random()*400)::int;
    edate := sdate + CASE WHEN stype='monthly' THEN 30 WHEN stype='yearly' THEN 365 WHEN stype='corporate' THEN 365 ELSE 30 END;

    INSERT INTO subscriptions (vehicle_id, lot_id, subscription_type, start_date, end_date, price, is_active, auto_renew)
    VALUES (veh.id, lid, stype, sdate, edate, price, edate >= CURRENT_DATE, random() < 0.6);
  END LOOP;
END;
$$;

-- ─── PARKING SESSIONS (5000+) ─────────────────────────────
DO $$
DECLARE
  veh_ids   UUID[];
  spot_ids  UUID[];
  lot_uuid  UUID;
  vid       UUID;
  sid       UUID;
  spot_id   UUID;
  entry     TIMESTAMPTZ;
  xit       TIMESTAMPTZ;
  dur       INTEGER;
  charge    DECIMAL;
  pstatus   TEXT;
  stype     TEXT;
  rate      DECIMAL;
  i         INTEGER;
  hour_bias INTEGER;
  lot_rec   RECORD;
  -- lot → spot mapping
  lot_arr   UUID[] := ARRAY[
    '11111111-1111-1111-1111-000000000001'::uuid,
    '11111111-1111-1111-1111-000000000002'::uuid,
    '11111111-1111-1111-1111-000000000003'::uuid,
    '11111111-1111-1111-1111-000000000004'::uuid,
    '11111111-1111-1111-1111-000000000005'::uuid,
    '11111111-1111-1111-1111-000000000006'::uuid,
    '11111111-1111-1111-1111-000000000007'::uuid,
    '11111111-1111-1111-1111-000000000008'::uuid,
    '11111111-1111-1111-1111-000000000009'::uuid,
    '11111111-1111-1111-1111-000000000010'::uuid,
    '11111111-1111-1111-1111-000000000011'::uuid,
    '11111111-1111-1111-1111-000000000013'::uuid,
    '11111111-1111-1111-1111-000000000014'::uuid,
    '11111111-1111-1111-1111-000000000015'::uuid
  ];
BEGIN
  -- Cache vehicle IDs
  SELECT ARRAY(SELECT id FROM vehicles) INTO veh_ids;

  FOR i IN 1..5500 LOOP
    lot_uuid := lot_arr[1 + (random()*13)::int];

    -- Pick a random spot in that lot
    SELECT id INTO spot_id FROM parking_spots WHERE lot_id = lot_uuid ORDER BY random() LIMIT 1;

    -- Pick a random vehicle
    vid := veh_ids[1 + (random()*(array_length(veh_ids,1)-1))::int];

    -- Realistic hour distribution: peaks 8-10, 12-14, 17-20
    hour_bias := CASE
      WHEN random() < 0.25 THEN 8  + (random()*2)::int
      WHEN random() < 0.5  THEN 12 + (random()*2)::int
      WHEN random() < 0.75 THEN 17 + (random()*3)::int
      ELSE (random()*23)::int
    END;

    entry := NOW() - ((random()*365)::int || ' days')::interval
              + (hour_bias || ' hours')::interval
              + ((random()*59)::int || ' minutes')::interval;

    -- Duration varies by lot type
    dur := CASE
      WHEN lot_uuid = '11111111-1111-1111-1111-000000000002' THEN 60  + (random()*720)::int  -- airport: 1-12h
      WHEN lot_uuid = '11111111-1111-1111-1111-000000000003' THEN 60  + (random()*240)::int  -- mall: 1-4h
      WHEN lot_uuid = '11111111-1111-1111-1111-000000000004' THEN 480 + (random()*120)::int  -- corporate: 8-10h
      WHEN lot_uuid IN ('11111111-1111-1111-1111-000000000005','11111111-1111-1111-1111-000000000014') THEN 300+(random()*900)::int -- residential
      ELSE 30 + (random()*180)::int  -- general: 30min-3h
    END;

    xit    := entry + (dur || ' minutes')::interval;
    -- 8% still active (no exit)
    IF random() < 0.08 THEN xit := NULL; dur := NULL; END IF;

    -- Charge calculation
    SELECT hourly_rate INTO rate FROM parking_lots WHERE id = lot_uuid;
    charge := CASE WHEN dur IS NOT NULL THEN ROUND((dur / 60.0) * rate, 2) ELSE NULL END;

    pstatus := CASE
      WHEN xit IS NULL        THEN 'pending'
      WHEN random() < 0.78   THEN 'paid'
      WHEN random() < 0.85   THEN 'subscription'
      ELSE 'unpaid'
    END;
    stype := CASE WHEN pstatus='subscription' THEN 'subscription' ELSE 'regular' END;

    sid := uuid_generate_v4();
    INSERT INTO parking_sessions (id, vehicle_id, lot_id, spot_id, entry_time, exit_time, duration_minutes, total_charge, payment_status, session_type)
    VALUES (sid, vid, lot_uuid, spot_id, entry, xit, dur, charge, pstatus, stype);

    -- Insert payment for paid sessions
    IF pstatus = 'paid' AND charge IS NOT NULL THEN
      INSERT INTO payments (session_id, payment_method, amount, payment_date, status, transaction_id)
      VALUES (
        sid,
        CASE (random()*5)::int
          WHEN 0 THEN 'credit_card' WHEN 1 THEN 'mobile_pay'
          WHEN 2 THEN 'debit_card'  WHEN 3 THEN 'cash'
          WHEN 4 THEN 'online'      ELSE 'corporate_account'
        END,
        charge,
        xit,
        'completed',
        'TXN-' || UPPER(SUBSTRING(uuid_generate_v4()::text,1,8))
      );
    END IF;
  END LOOP;
END;
$$;

-- ─── VIOLATIONS (~350) ────────────────────────────────────
DO $$
DECLARE
  veh_ids UUID[];
  lot_arr UUID[] := ARRAY[
    '11111111-1111-1111-1111-000000000001'::uuid,
    '11111111-1111-1111-1111-000000000002'::uuid,
    '11111111-1111-1111-1111-000000000003'::uuid,
    '11111111-1111-1111-1111-000000000007'::uuid,
    '11111111-1111-1111-1111-000000000009'::uuid
  ];
  vtypes  TEXT[] := ARRAY['overtime','no_permit','disabled_zone','fire_lane','wrong_spot','expired_meter','double_parked','unpaid_session'];
  fines   DECIMAL[] := ARRAY[100,250,500,750,150,180,300,200];
  i       INTEGER;
  vid     UUID;
  lid     UUID;
  sidspot UUID;
  vtype   TEXT;
  fine    DECIMAL;
  issued  TIMESTAMPTZ;
  idx     INTEGER;
BEGIN
  SELECT ARRAY(SELECT id FROM vehicles ORDER BY random() LIMIT 350) INTO veh_ids;
  FOR i IN 1..350 LOOP
    vid    := veh_ids[i];
    lid    := lot_arr[1+(random()*4)::int];
    SELECT id INTO sidspot FROM parking_spots WHERE lot_id=lid ORDER BY random() LIMIT 1;
    idx    := 1+(random()*7)::int;
    vtype  := vtypes[idx];
    fine   := fines[idx];
    issued := NOW() - ((random()*300)::int||' days')::interval;

    INSERT INTO violations (vehicle_id, lot_id, spot_id, violation_type, fine_amount, issued_at, due_date, paid, paid_at, issued_by)
    VALUES (
      vid, lid, sidspot, vtype, fine, issued,
      (issued + INTERVAL '30 days')::date,
      random() < 0.55,
      CASE WHEN random() < 0.55 THEN issued + ((random()*20)::int||' days')::interval ELSE NULL END,
      '22222222-2222-2222-2222-000000000007'::uuid
    );
  END LOOP;
END;
$$;

-- ─── UPDATE SPOT OCCUPANCY (sync with sessions) ───────────
UPDATE parking_spots ps
SET is_occupied = TRUE
WHERE EXISTS (
  SELECT 1 FROM parking_sessions s
  WHERE s.spot_id = ps.id AND s.exit_time IS NULL
);

-- ─── SUBSCRIPTION PAYMENTS ────────────────────────────────
INSERT INTO payments (subscription_id, payment_method, amount, payment_date, status, transaction_id)
SELECT
  s.id,
  CASE (random()*3)::int WHEN 0 THEN 'credit_card' WHEN 1 THEN 'corporate_account' WHEN 2 THEN 'online' ELSE 'debit_card' END,
  s.price,
  s.start_date::timestamptz + ((random()*2)::int||' hours')::interval,
  'completed',
  'SUB-' || UPPER(SUBSTRING(uuid_generate_v4()::text,1,8))
FROM subscriptions s;

-- Done!
SELECT 'Seed complete' AS status,
  (SELECT COUNT(*) FROM parking_lots) AS lots,
  (SELECT COUNT(*) FROM parking_spots) AS spots,
  (SELECT COUNT(*) FROM vehicles) AS vehicles,
  (SELECT COUNT(*) FROM parking_sessions) AS sessions,
  (SELECT COUNT(*) FROM payments) AS payments,
  (SELECT COUNT(*) FROM violations) AS violations,
  (SELECT COUNT(*) FROM subscriptions) AS subscriptions;
