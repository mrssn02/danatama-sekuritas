-- =========================
-- 0.1 Kolom tambahan transaksi
-- =========================
alter table transactions
add column if not exists admin_note text;

alter table transactions
add column if not exists created_at timestamptz default now();

-- pastikan ada kolom status
-- (kalau sudah ada, aman)
alter table transactions
add column if not exists status text default 'pending';

-- =========================
-- 0.2 Profiles: tambahkan email bila belum ada
-- =========================
alter table profiles
add column if not exists email text;

-- =========================
-- 0.3 Wallet policies: user boleh buat wallet sendiri
-- =========================
drop policy if exists wallet_user_insert on wallets;
create policy wallet_user_insert
on wallets for insert
with check (auth.uid() = user_id);

-- =========================
-- 0.4 Admin boleh read profiles (untuk cari user)
-- =========================
drop policy if exists profiles_admin_read on profiles;
create policy profiles_admin_read
on profiles for select
using ((auth.jwt() ->> 'email') = 'sonandra111@gmail.com');

-- =========================
-- 0.5 Buat investment_products
-- =========================
create table if not exists investment_products (
  id bigserial primary key,
  name text not null,
  description text default '',
  min_amount numeric not null default 50000,
  roi_daily_percent numeric not null default 0.5, -- contoh 0.5% per hari
  is_active boolean not null default true,
  created_at timestamptz default now()
);

-- =========================
-- 0.6 User investments
-- =========================
create table if not exists user_investments (
  id bigserial primary key,
  user_id uuid not null,
  product_id bigint not null references investment_products(id) on delete cascade,
  amount numeric not null,
  profit_accum numeric not null default 0,
  last_roi_date date,
  status text not null default 'active', -- active / closed
  created_at timestamptz default now()
);

create index if not exists idx_user_investments_user on user_investments(user_id);

-- =========================
-- 0.7 Ledger (untuk grafik & histori ROI)
-- =========================
create table if not exists wallet_ledger (
  id bigserial primary key,
  user_id uuid not null,
  type text not null, -- roi / invest / deposit / withdraw
  amount numeric not null,
  note text default '',
  created_at timestamptz default now()
);

create index if not exists idx_wallet_ledger_user on wallet_ledger(user_id);

-- =========================
-- 0.8 Function adjust_balance (kalau sudah ada, replace aman)
-- =========================
create or replace function adjust_balance(uid uuid, amt numeric)
returns void
language plpgsql
security definer
as $$
begin
  insert into wallets (user_id, balance)
  values (uid, amt)
  on conflict (user_id)
  do update set
    balance = wallets.balance + amt,
    updated_at = now();
end;
$$;

-- =========================
-- 0.9 Function request_withdraw (VALIDASI: min, max harian, saldo)
-- =========================
create or replace function request_withdraw(req_amount numeric, req_note text)
returns void
language plpgsql
security definer
as $$
declare
  uid uuid := auth.uid();
  bal numeric;
  daily_sum numeric;
  today date := current_date;
  min_withdraw numeric := 100000;
  max_daily numeric := 5000000; -- 5 juta per hari (ubah sesuka kamu)
begin
  if uid is null then
    raise exception 'Not logged in';
  end if;

  if req_amount < min_withdraw then
    raise exception 'Minimal withdraw %', min_withdraw;
  end if;

  select balance into bal from wallets where user_id = uid;
  if bal is null then
    raise exception 'Wallet not found';
  end if;

  if req_amount > bal then
    raise exception 'Saldo tidak mencukupi';
  end if;

  select coalesce(sum(amount),0) into daily_sum
  from transactions
  where user_id = uid
    and type = 'withdraw'
    and status in ('pending','approved')
    and created_at::date = today;

  if daily_sum + req_amount > max_daily then
    raise exception 'Limit withdraw harian %', max_daily;
  end if;

  insert into transactions(user_id, type, amount, status, note)
  values (uid, 'withdraw', req_amount, 'pending', req_note);
end;
$$;

-- =========================
-- 0.10 Function request_deposit (validasi minimal deposit)
-- =========================
create or replace function request_deposit(req_amount numeric, req_note text)
returns void
language plpgsql
security definer
as $$
declare
  uid uuid := auth.uid();
  min_deposit numeric := 50000;
begin
  if uid is null then
    raise exception 'Not logged in';
  end if;

  if req_amount < min_deposit then
    raise exception 'Minimal deposit %', min_deposit;
  end if;

  insert into transactions(user_id, type, amount, status, note)
  values (uid, 'deposit', req_amount, 'pending', req_note);
end;
$$;

-- =========================
-- 0.11 Function invest_buy (potong saldo + buat investasi + ledger)
-- =========================
create or replace function invest_buy(pid bigint, amt numeric)
returns void
language plpgsql
security definer
as $$
declare
  uid uuid := auth.uid();
  bal numeric;
  min_amt numeric;
begin
  if uid is null then
    raise exception 'Not logged in';
  end if;

  select min_amount into min_amt from investment_products where id = pid and is_active = true;
  if min_amt is null then
    raise exception 'Produk tidak tersedia';
  end if;

  if amt < min_amt then
    raise exception 'Minimal investasi %', min_amt;
  end if;

  select balance into bal from wallets where user_id = uid;
  if bal is null then
    raise exception 'Wallet not found';
  end if;

  if amt > bal then
    raise exception 'Saldo tidak cukup';
  end if;

  -- potong saldo
  perform adjust_balance(uid, -amt);

  -- simpan investasi
  insert into user_investments(user_id, product_id, amount, status, last_roi_date)
  values (uid, pid, amt, 'active', current_date);

  -- ledger
  insert into wallet_ledger(user_id, type, amount, note)
  values (uid, 'invest', -amt, 'Pembelian investasi');
end;
$$;

-- =========================
-- 0.12 Function run_daily_roi (admin jalankan) -> kredit saldo + ledger
-- =========================
create or replace function run_daily_roi()
returns void
language plpgsql
security definer
as $$
declare
  admin_email text := (auth.jwt() ->> 'email');
  r record;
  roi_amt numeric;
  roi_percent numeric;
begin
  if admin_email <> 'sonandra111@gmail.com' then
    raise exception 'Not authorized';
  end if;

  for r in
    select ui.id as inv_id, ui.user_id, ui.amount, ui.last_roi_date, ip.roi_daily_percent
    from user_investments ui
    join investment_products ip on ip.id = ui.product_id
    where ui.status = 'active'
  loop
    -- hanya 1x per hari
    if r.last_roi_date = current_date then
      continue;
    end if;

    roi_percent := coalesce(r.roi_daily_percent, 0);
    roi_amt := (r.amount * roi_percent) / 100;

    if roi_amt > 0 then
      perform adjust_balance(r.user_id, roi_amt);

      update user_investments
      set profit_accum = profit_accum + roi_amt,
          last_roi_date = current_date
      where id = r.inv_id;

      insert into wallet_ledger(user_id, type, amount, note)
      values (r.user_id, 'roi', roi_amt, 'ROI harian');
    end if;
  end loop;
end;
$$;

-- =========================
-- 0.13 Seed contoh produk (opsional)
-- =========================
insert into investment_products(name, description, min_amount, roi_daily_percent, is_active)
values
  ('Danatama Growth', 'Produk investasi harian dengan ROI stabil.', 100000, 0.5, true),
  ('Danatama Prime', 'Produk premium, ROI lebih tinggi.', 250000, 0.8, true)
on conflict do nothing;
