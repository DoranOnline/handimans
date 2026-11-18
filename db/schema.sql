-- ============================================================
-- HANDIMANS — סכימת בסיס נתונים v1
-- Postgres 15 + PostGIS (Supabase)
-- הרצה: pnpm supabase db reset
-- ============================================================

create extension if not exists postgis;
create extension if not exists pgcrypto;

-- ---------- Enums ----------
create type user_role      as enum ('customer', 'pro', 'contractor', 'admin');
create type pro_status     as enum ('draft', 'pending', 'active', 'paused', 'suspended');
create type doc_kind       as enum ('id_card', 'business', 'insurance', 'certificate', 'other');
create type doc_status     as enum ('pending', 'approved', 'rejected', 'expired');
create type urgency_level  as enum ('emergency', 'today', 'this_week', 'flexible');
create type request_status as enum ('open', 'matched', 'scheduled', 'in_progress', 'completed', 'cancelled', 'expired');
create type offer_status   as enum ('sent', 'accepted', 'declined', 'expired', 'withdrawn');
create type job_status     as enum ('scheduled', 'in_progress', 'completed', 'disputed', 'cancelled');
create type area_kind      as enum ('radius', 'polygon');
create type ledger_reason  as enum ('purchase', 'lead_charge', 'refund', 'bonus', 'adjustment');
create type appointment_status as enum ('pending', 'confirmed', 'in_progress', 'done', 'no_show', 'cancelled');

-- ---------- Identity ----------
create table public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  phone       text unique not null,
  role        user_role not null default 'customer',
  full_name   text,
  avatar_url  text,
  locale      text not null default 'he',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

-- ---------- Catalog ----------
create table public.trades (
  id         uuid primary key default gen_random_uuid(),
  slug       text unique not null,
  name_he    text not null,
  name_en    text,
  icon       text,
  parent_id  uuid references public.trades(id) on delete set null,
  sort_order int not null default 0,
  is_active  boolean not null default true
);

-- ---------- Pro side ----------
create table public.pro_profiles (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid unique not null references public.users(id) on delete cascade,
  business_name    text,
  bio              text,
  years_experience int check (years_experience between 0 and 70),
  base_location    geography(Point, 4326) not null,
  service_radius_m int not null default 10000 check (service_radius_m between 500 and 60000),
  callout_fee      numeric(10,2) check (callout_fee >= 0),
  price_min        numeric(10,2) check (price_min >= 0),
  price_max        numeric(10,2) check (price_max >= 0),
  currency         text not null default 'ILS',
  status           pro_status not null default 'draft',
  is_insured       boolean not null default false,
  rating_avg       numeric(3,2) not null default 0,
  rating_count     int not null default 0,
  jobs_completed   int not null default 0,
  acceptance_rate  numeric(5,4) not null default 0,
  response_minutes int,
  balance_nis      numeric(10,2) not null default 0 check (balance_nis >= 0),
  verified_at      timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz,
  constraint price_range_valid check (price_max is null or price_min is null or price_max >= price_min)
);

create index pro_profiles_base_location_gix on public.pro_profiles using gist (base_location);
create index pro_profiles_status_idx on public.pro_profiles (status) where deleted_at is null;

create table public.pro_trades (
  pro_id   uuid not null references public.pro_profiles(id) on delete cascade,
  trade_id uuid not null references public.trades(id) on delete cascade,
  level    text not null default 'standard' check (level in ('apprentice','standard','expert','master')),
  primary key (pro_id, trade_id)
);

create table public.service_areas (
  id         uuid primary key default gen_random_uuid(),
  pro_id     uuid not null references public.pro_profiles(id) on delete cascade,
  kind       area_kind not null,
  center     geography(Point, 4326),
  radius_m   int check (radius_m between 500 and 60000),
  polygon    geography(Polygon, 4326),
  label      text,
  created_at timestamptz not null default now(),
  constraint area_shape_valid check (
    (kind = 'radius'  and center is not null and radius_m is not null) or
    (kind = 'polygon' and polygon is not null)
  )
);

create index service_areas_center_gix  on public.service_areas using gist (center);
create index service_areas_polygon_gix on public.service_areas using gist (polygon);

create table public.documents (
  id          uuid primary key default gen_random_uuid(),
  pro_id      uuid not null references public.pro_profiles(id) on delete cascade,
  kind        doc_kind not null,
  file_url    text not null,
  expires_at  date,
  status      doc_status not null default 'pending',
  reviewed_by uuid references public.users(id),
  reviewed_at timestamptz,
  note        text,
  created_at  timestamptz not null default now()
);

create index documents_pro_idx on public.documents (pro_id, status);

-- ---------- Demand side ----------
create table public.requests (
  id            uuid primary key default gen_random_uuid(),
  customer_id   uuid not null references public.users(id) on delete cascade,
  trade_id      uuid not null references public.trades(id),
  location      geography(Point, 4326) not null,
  address_text  text,
  neighborhood  text,
  city          text,
  urgency       urgency_level not null default 'flexible',
  description   text not null check (char_length(description) between 10 and 2000),
  budget_hint   numeric(10,2),
  status        request_status not null default 'open',
  window_start  timestamptz,
  window_end    timestamptz,
  offers_count  int not null default 0,
  expires_at    timestamptz not null default now() + interval '48 hours',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index requests_location_gix on public.requests using gist (location);
create index requests_open_idx on public.requests (trade_id, status, created_at desc);

create table public.request_media (
  id         uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests(id) on delete cascade,
  url        text not null,
  kind       text not null default 'photo' check (kind in ('photo','video','voice')),
  sort_order int not null default 0
);

create table public.offers (
  id              uuid primary key default gen_random_uuid(),
  request_id      uuid not null references public.requests(id) on delete cascade,
  pro_id          uuid not null references public.pro_profiles(id) on delete cascade,
  price           numeric(10,2) not null check (price >= 0),
  eta_minutes     int check (eta_minutes >= 0),
  warranty_months int not null default 0 check (warranty_months between 0 and 60),
  message         text check (char_length(message) <= 1000),
  status          offer_status not null default 'sent',
  lead_fee_nis    numeric(10,2) not null default 100 check (lead_fee_nis >= 0),
  expires_at      timestamptz not null default now() + interval '24 hours',
  created_at      timestamptz not null default now(),
  unique (request_id, pro_id)
);

create index offers_request_idx on public.offers (request_id, status);

create table public.jobs (
  id            uuid primary key default gen_random_uuid(),
  request_id    uuid unique not null references public.requests(id),
  offer_id      uuid unique not null references public.offers(id),
  pro_id        uuid not null references public.pro_profiles(id),
  customer_id   uuid not null references public.users(id),
  scheduled_at  timestamptz,
  started_at    timestamptz,
  completed_at  timestamptz,
  final_price   numeric(10,2),
  status        job_status not null default 'scheduled',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ---------- Contractor (business with a team) ----------
create table public.businesses (
  id               uuid primary key default gen_random_uuid(),
  owner_id         uuid not null references public.users(id) on delete cascade,
  name             text not null,
  slug             text unique not null,
  tagline          text,
  about            text,
  phone            text,
  email            text,
  area_label       text,
  radius_m         int not null default 12000 check (radius_m between 1000 and 60000),
  location         geography(point, 4326),
  rating           numeric(2,1) not null default 0,
  reviews_count    int not null default 0,
  verified         boolean not null default false,
  insurance_expires date,
  hours            jsonb not null default '{}'::jsonb,
  slot_minutes     int not null default 60 check (slot_minutes in (30,45,60,90)),
  capacity_per_slot int not null default 2 check (capacity_per_slot between 1 and 10),
  auto_confirm     boolean not null default true,
  deposit_nis      numeric(10,2) not null default 0,
  balance_nis      numeric(10,2) not null default 0 check (balance_nis >= 0),
  created_at       timestamptz not null default now()
);

create index businesses_geo_idx on public.businesses using gist (location);

create table public.team_members (
  id             uuid primary key default gen_random_uuid(),
  business_id    uuid not null references public.businesses(id) on delete cascade,
  user_id        uuid references public.users(id) on delete set null,
  full_name      text not null,
  role_title     text,
  trade          text,
  phone          text,
  active         boolean not null default true,
  daily_capacity int not null default 5 check (daily_capacity between 1 and 20),
  rating         numeric(2,1) not null default 0,
  jobs_count     int not null default 0,
  created_at     timestamptz not null default now()
);

create index team_members_business_idx on public.team_members (business_id, active);

create table public.appointments (
  id              uuid primary key default gen_random_uuid(),
  business_id     uuid not null references public.businesses(id) on delete cascade,
  team_member_id  uuid references public.team_members(id) on delete set null,
  customer_id     uuid references public.users(id) on delete set null,
  customer_name   text not null,
  customer_phone  text,
  address         text,
  location        geography(point, 4326),
  category_id     uuid references public.trades(id),
  service_name    text,
  starts_at       timestamptz not null,
  duration_min    int not null default 60 check (duration_min between 15 and 480),
  price_nis       numeric(10,2) not null default 0 check (price_nis >= 0),
  status          appointment_status not null default 'pending',
  source          text not null default 'page' check (source in ('page', 'lead', 'phone', 'admin')),
  request_id      uuid references public.requests(id) on delete set null,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index appointments_business_time_idx on public.appointments (business_id, starts_at);
create index appointments_team_time_idx on public.appointments (team_member_id, starts_at);

create table public.reviews (
  id         uuid primary key default gen_random_uuid(),
  job_id     uuid unique not null references public.jobs(id) on delete cascade,
  author_id  uuid not null references public.users(id),
  target_id  uuid not null references public.users(id),
  rating     int not null check (rating between 1 and 5),
  text       text check (char_length(text) <= 2000),
  photos     text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index reviews_target_idx on public.reviews (target_id, created_at desc);

-- ---------- Messaging ----------
create table public.threads (
  id         uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests(id) on delete cascade,
  customer_id uuid not null references public.users(id),
  pro_id     uuid not null references public.pro_profiles(id),
  created_at timestamptz not null default now(),
  unique (request_id, pro_id)
);

create table public.messages (
  id         uuid primary key default gen_random_uuid(),
  thread_id  uuid not null references public.threads(id) on delete cascade,
  sender_id  uuid not null references public.users(id),
  body       text not null check (char_length(body) between 1 and 4000),
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

create index messages_thread_idx on public.messages (thread_id, created_at);

-- ---------- Money ----------
-- יתרה בשקלים. חיוב פנייה = 100 ₪, נגבה ברגע שליחת ההצעה.
-- פרסום אינו נגבה כאן: קמפיינים של בעלי מקצוע הם הוצאה שלהם.
create table public.lead_ledger (
  id                uuid primary key default gen_random_uuid(),
  pro_id            uuid not null references public.pro_profiles(id) on delete cascade,
  delta_nis         numeric(10,2) not null,
  reason            ledger_reason not null,
  ref_id            uuid,
  balance_after_nis numeric(10,2) not null check (balance_after_nis >= 0),
  note              text,
  created_at        timestamptz not null default now()
);

create index lead_ledger_pro_idx on public.lead_ledger (pro_id, created_at desc);

-- ---------- Notifications ----------
create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  channel    text not null check (channel in ('push','sms','whatsapp','email','in_app')),
  template   text not null,
  payload    jsonb not null default '{}',
  sent_at    timestamptz,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on public.notifications (user_id, created_at desc);

-- ============================================================
-- פונקציות
-- ============================================================

-- בעלי מקצוע שמגיעים לנקודה, ממוינים לפי ניקוד
create or replace function public.nearby_pros(
  p_trade_id uuid,
  p_lat      double precision,
  p_lng      double precision,
  p_radius_m int default 15000,
  p_limit    int default 30
)
returns table (
  pro_id        uuid,
  business_name text,
  distance_m    double precision,
  rating_avg    numeric,
  rating_count  int,
  price_min     numeric,
  price_max     numeric,
  callout_fee   numeric,
  response_minutes int,
  score         numeric
)
language sql stable as $$
  with point as (
    select st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography as g
  )
  select
    p.id,
    p.business_name,
    st_distance(p.base_location, point.g) as distance_m,
    p.rating_avg,
    p.rating_count,
    p.price_min,
    p.price_max,
    p.callout_fee,
    p.response_minutes,
    round((
      0.35 * (1 - least(st_distance(p.base_location, point.g) / greatest(p.service_radius_m, 1), 1))
      + 0.25 * (greatest(p.rating_avg - 3, 0) / 2)
      + 0.15 * least(p.acceptance_rate, 1)
      + 0.15 * least(p.jobs_completed::numeric / 50, 1)
      + 0.10 * (1 - least(coalesce(p.response_minutes, 120)::numeric / 120, 1))
    )::numeric, 4) as score
  from public.pro_profiles p
  join public.pro_trades pt on pt.pro_id = p.id
  cross join point
  where pt.trade_id = p_trade_id
    and p.status = 'active'
    and p.deleted_at is null
    and st_dwithin(p.base_location, point.g, least(p.service_radius_m, p_radius_m))
  order by score desc, distance_m asc
  limit p_limit;
$$;

-- עדכון דירוג ממוצע אחרי ביקורת
create or replace function public.refresh_pro_rating()
returns trigger
language plpgsql security definer as $$
declare
  v_pro_id uuid;
begin
  select j.pro_id into v_pro_id from public.jobs j where j.id = new.job_id;

  update public.pro_profiles p
  set rating_avg = coalesce((
        select round(avg(r.rating)::numeric, 2)
        from public.reviews r
        join public.jobs j on j.id = r.job_id
        where j.pro_id = v_pro_id
      ), 0),
      rating_count = (
        select count(*) from public.reviews r
        join public.jobs j on j.id = r.job_id
        where j.pro_id = v_pro_id
      ),
      updated_at = now()
  where p.id = v_pro_id;

  return new;
end;
$$;

create trigger trg_refresh_pro_rating
after insert or update on public.reviews
for each row execute function public.refresh_pro_rating();

-- ============================================================
-- Row Level Security
-- ============================================================
-- פונקציית עזר: עוקפת RLS כדי למנוע רקורסיה בפוליסי של users
create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (select 1 from public.users where id = auth.uid() and role = 'admin');
$$;

alter table public.users            enable row level security;
alter table public.pro_profiles     enable row level security;
alter table public.pro_trades       enable row level security;
alter table public.service_areas    enable row level security;
alter table public.documents        enable row level security;
alter table public.requests         enable row level security;
alter table public.request_media    enable row level security;
alter table public.offers           enable row level security;
alter table public.jobs             enable row level security;
alter table public.reviews          enable row level security;
alter table public.threads          enable row level security;
alter table public.messages         enable row level security;
alter table public.lead_ledger      enable row level security;
alter table public.businesses       enable row level security;
alter table public.team_members     enable row level security;
alter table public.appointments     enable row level security;
alter table public.notifications    enable row level security;

-- users: כל אחד רואה את עצמו; אדמין רואה הכול
create policy users_self_read on public.users
  for select using (id = auth.uid() or public.is_admin());

create policy users_self_update on public.users
  for update using (id = auth.uid()) with check (id = auth.uid());

-- pro_profiles: ציבורי לקריאה לפרופילים פעילים; הבעלים עורך
create policy pro_public_read on public.pro_profiles
  for select using (status = 'active' and deleted_at is null);

create policy pro_owner_all on public.pro_profiles
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- pro_trades / service_areas: קריאה ציבורית, כתיבה לבעלים
create policy pro_trades_public_read on public.pro_trades for select using (true);
create policy pro_trades_owner_write on public.pro_trades for all using (
  exists (select 1 from public.pro_profiles p where p.id = pro_id and p.user_id = auth.uid())
) with check (
  exists (select 1 from public.pro_profiles p where p.id = pro_id and p.user_id = auth.uid())
);

create policy service_areas_public_read on public.service_areas for select using (true);
create policy service_areas_owner_write on public.service_areas for all using (
  exists (select 1 from public.pro_profiles p where p.id = pro_id and p.user_id = auth.uid())
) with check (
  exists (select 1 from public.pro_profiles p where p.id = pro_id and p.user_id = auth.uid())
);

-- documents: רק הבעלים והאדמין
create policy documents_owner_read on public.documents for select using (
  exists (select 1 from public.pro_profiles p where p.id = pro_id and p.user_id = auth.uid())
  or public.is_admin()
);
create policy documents_owner_insert on public.documents for insert with check (
  exists (select 1 from public.pro_profiles p where p.id = pro_id and p.user_id = auth.uid())
);

-- requests: הלקוח רואה את שלו; בעלי מקצוע רואים בקשות פתוחות בתחומם
create policy requests_customer_read on public.requests for select using (
  customer_id = auth.uid()
  or public.is_admin()
  or (
    status = 'open'
    and exists (
      select 1
      from public.pro_profiles p
      join public.pro_trades pt on pt.pro_id = p.id
      where p.user_id = auth.uid()
        and p.status = 'active'
        and pt.trade_id = requests.trade_id
        and st_dwithin(p.base_location, requests.location, p.service_radius_m)
    )
  )
);

create policy requests_customer_insert on public.requests for insert with check (customer_id = auth.uid());
create policy requests_customer_update on public.requests for update using (customer_id = auth.uid());

-- offers: הלקוח של הבקשה, בעל המקצוע המציע, ואדמין
create policy offers_read on public.offers for select using (
  exists (select 1 from public.requests r where r.id = request_id and r.customer_id = auth.uid())
  or exists (select 1 from public.pro_profiles p where p.id = pro_id and p.user_id = auth.uid())
  or public.is_admin()
);

create policy offers_pro_insert on public.offers for insert with check (
  exists (select 1 from public.pro_profiles p where p.id = pro_id and p.user_id = auth.uid())
  and exists (
    select 1 from public.requests r
    where r.id = request_id and r.status = 'open'
  )
);

create policy offers_pro_update on public.offers for update using (
  exists (select 1 from public.pro_profiles p where p.id = pro_id and p.user_id = auth.uid())
);

-- jobs: הצדדים בלבד
create policy jobs_parties_read on public.jobs for select using (
  customer_id = auth.uid()
  or exists (select 1 from public.pro_profiles p where p.id = pro_id and p.user_id = auth.uid())
  or public.is_admin()
);

-- reviews: קריאה ציבורית, כתיבה רק לצדדים בעבודה שהושלמה
create policy reviews_public_read on public.reviews for select using (true);
create policy reviews_party_insert on public.reviews for insert with check (
  author_id = auth.uid()
  and exists (
    select 1 from public.jobs j
    where j.id = job_id
      and j.status = 'completed'
      and (j.customer_id = auth.uid() or exists (
        select 1 from public.pro_profiles p where p.id = j.pro_id and p.user_id = auth.uid()
      ))
  )
);

-- threads / messages: משתתפים בלבד
create policy threads_party_read on public.threads for select using (
  customer_id = auth.uid()
  or exists (select 1 from public.pro_profiles p where p.id = pro_id and p.user_id = auth.uid())
);

create policy messages_party_read on public.messages for select using (
  exists (
    select 1 from public.threads t
    where t.id = thread_id
      and (t.customer_id = auth.uid()
        or exists (select 1 from public.pro_profiles p where p.id = t.pro_id and p.user_id = auth.uid()))
  )
);

create policy messages_party_insert on public.messages for insert with check (
  sender_id = auth.uid()
  and exists (
    select 1 from public.threads t
    where t.id = thread_id
      and (t.customer_id = auth.uid()
        or exists (select 1 from public.pro_profiles p where p.id = t.pro_id and p.user_id = auth.uid()))
  )
);

-- lead_ledger: בעל המקצוע רואה; כתיבה רק דרך service role
create policy lead_ledger_owner_read on public.lead_ledger for select using (
  exists (select 1 from public.pro_profiles p where p.id = pro_id and p.user_id = auth.uid())
);

-- notifications: המשתמש שלו בלבד
create policy notifications_owner_read on public.notifications for select using (user_id = auth.uid());
create policy notifications_owner_update on public.notifications for update using (user_id = auth.uid());

-- businesses: ציבורי לקריאה (העמוד הציבורי); כתיבה לבעלים
create policy businesses_public_read on public.businesses for select using (true);
create policy businesses_owner_write on public.businesses for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- team_members: חברי העסק והמנהל
create policy team_members_read on public.team_members for select using (
  public.is_admin()
  or exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid())
  or user_id = auth.uid()
);
create policy team_members_owner_write on public.team_members for all using (
  exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid())
) with check (
  exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid())
);

-- appointments: העסק, איש הצוות, הלקוח והמנהל
create policy appointments_read on public.appointments for select using (
  public.is_admin()
  or customer_id = auth.uid()
  or exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid())
  or exists (select 1 from public.team_members t where t.id = team_member_id and t.user_id = auth.uid())
);
create policy appointments_business_write on public.appointments for all using (
  exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid())
) with check (
  exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid())
);
create policy appointments_customer_insert on public.appointments for insert with check (customer_id = auth.uid());

-- ============================================================
-- Seed — קטגוריות פתיחה
-- ============================================================
insert into public.trades (slug, name_he, name_en, icon, sort_order) values
  ('plumbing',    'אינסטלציה',   'Plumbing',    'wrench',   10),
  ('electrical',  'חשמל',        'Electrical',  'zap',      20),
  ('hvac',        'מיזוג אוויר', 'HVAC',        'wind',     30),
  ('carpentry',   'נגרות',       'Carpentry',   'hammer',   40),
  ('painting',    'צביעה',       'Painting',    'brush',    50),
  ('tiling',      'ריצוף',       'Tiling',      'grid',     60),
  ('drywall',     'גבס',         'Drywall',     'layers',   70),
  ('locksmith',   'מנעולנות',    'Locksmith',   'key',      80),
  ('aluminum',    'אלומיניום',   'Aluminum',    'frame',    90),
  ('cleaning',    'ניקיון',      'Cleaning',    'sparkles', 100),
  ('gardening',   'גינון',       'Gardening',   'leaf',     110),
  ('moving',      'הובלות',      'Moving',      'truck',    120),
  ('handyman',    'תיקוני בית',  'Handyman',    'tool',     130)
on conflict (slug) do nothing;
