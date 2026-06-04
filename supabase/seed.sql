-- seed.sql
-- Development seed: 1 superadmin, 2 Indian client orgs, sample metrics +
-- activities + deliverables + content + public influencer marketplace data.
-- Run AFTER all migrations, including 007_influencer_marketplace.sql.
-- Default password for all seeded users: "password123" (dev only — rotate in prod).

create extension if not exists "pgcrypto";

do $$
declare
  -- auth users
  admin_uid uuid := '00000000-0000-0000-0000-000000000001';
  spice_uid uuid := '00000000-0000-0000-0000-000000000002';
  byte_uid  uuid := '00000000-0000-0000-0000-000000000003';

  -- orgs
  spice_org uuid := '11111111-1111-1111-1111-111111111111';
  byte_org  uuid := '22222222-2222-2222-2222-222222222222';

  -- influencers
  inf1 uuid := '33333333-3333-3333-3333-333333333301';
  inf2 uuid := '33333333-3333-3333-3333-333333333302';
  inf3 uuid := '33333333-3333-3333-3333-333333333303';
  inf4 uuid := '33333333-3333-3333-3333-333333333304';
  inf5 uuid := '33333333-3333-3333-3333-333333333305';
  inf6 uuid := '33333333-3333-3333-3333-333333333306';
  inf7 uuid := '33333333-3333-3333-3333-333333333307';
  inf8 uuid := '33333333-3333-3333-3333-333333333308';
begin

-- ────────────────────────────────────────────────────────────────────
-- auth.users (Supabase seed pattern)
-- ────────────────────────────────────────────────────────────────────
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data
) values
  (admin_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'admin@linchpinstudio.in', crypt('password123', gen_salt('bf')),
   now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Linchpin Admin"}'),
  (spice_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'priya@spicebowl.in', crypt('password123', gen_salt('bf')),
   now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Priya Sharma"}'),
  (byte_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'rahul@bytebrew.in', crypt('password123', gen_salt('bf')),
   now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Rahul Verma"}')
on conflict (id) do nothing;

-- ────────────────────────────────────────────────────────────────────
-- organisations (2 Indian clients)
-- ────────────────────────────────────────────────────────────────────
insert into organisations (
  id, name, slug, plan, status, active_modules,
  zap_enabled, zap_org_id, web_enabled,
  account_manager_name, account_manager_email, account_manager_phone,
  brand_category, brand_description, target_audience, brand_tone,
  billing_cycle_start
) values
  (spice_org, 'Spice Bowl Bistro', 'spice-bowl', 'growth', 'active',
    array['social','leads','campaigns','content'],
    true, 'zap_spicebowl_001', true,
    'Aarav Mehta', 'aarav@linchpinstudio.in', '+91-9810012345',
    'Food & Beverage',
    'Modern North-Indian thali restaurant chain across Bengaluru with a focus on regional plating and fast lunch service.',
    'Working professionals 25-40, families on weekends, food bloggers',
    'Warm, appetising, regional pride — never preachy',
    '2026-01-01'),
  (byte_org, 'ByteBrew Coffee', 'bytebrew', 'starter', 'active',
    array['social','content','influencers'],
    false, null, true,
    'Neha Iyer', 'neha@linchpinstudio.in', '+91-9820098765',
    'Specialty Coffee',
    'D2C specialty coffee roaster sourcing from Chikmagalur and shipping pan-India direct from farm.',
    'Urban millennials, remote workers, third-wave coffee enthusiasts',
    'Crafty, witty, indie — feels like a friend who knows their beans',
    '2026-02-01')
on conflict (id) do nothing;

-- ────────────────────────────────────────────────────────────────────
-- users (profiles)
-- ────────────────────────────────────────────────────────────────────
insert into users (
  id, email, full_name, role, org_id, phone, password_hash, password_set_at
) values
  (
    admin_uid,
    'admin@linchpinstudio.in',
    'Linchpin Admin',
    'superadmin',
    null,
    '+91-9000000001',
    'pbkdf2$210000$dev-admin$j5DQ4YBZEl-8df7Ljgx3wC-55D_3ASrSjK29asp8iso',
    now()
  ),
  (
    spice_uid,
    'priya@spicebowl.in',
    'Priya Sharma',
    'client',
    spice_org,
    '+91-9810012345',
    'pbkdf2$210000$dev-priya$63pjyeJrTnVTLuQvZzRYrr-Dy6AjsAuIjjXZRPeJwgs',
    now()
  ),
  (
    byte_uid,
    'rahul@bytebrew.in',
    'Rahul Verma',
    'client',
    byte_org,
    '+91-9820098765',
    'pbkdf2$210000$dev-rahul$9x6C_5fARl970lNk8CJmhWHsDLfHvTPo2w0_QOOE6Vw',
    now()
  )
on conflict (id) do nothing;

-- ────────────────────────────────────────────────────────────────────
-- metrics
-- ────────────────────────────────────────────────────────────────────
insert into metrics (org_id, metric_key, metric_value, metric_change, period, source) values
  (spice_org, 'instagram_followers', 24580, 4.2,  '30d', 'instagram'),
  (spice_org, 'leads_total',           184, 12.5, '30d', 'website'),
  (spice_org, 'reels_views',        312000, 18.7, '30d', 'instagram'),
  (spice_org, 'website_visits',      48200,  6.3, '30d', 'ga4'),
  (byte_org,  'instagram_followers',  8920,  9.1, '30d', 'instagram'),
  (byte_org,  'orders_total',          412, 22.4, '30d', 'shopify'),
  (byte_org,  'reels_views',         95400, 11.8, '30d', 'instagram'),
  (byte_org,  'aov_inr',              1240,  3.1, '30d', 'shopify')
on conflict (org_id, metric_key, period) do nothing;

-- ────────────────────────────────────────────────────────────────────
-- activities
-- ────────────────────────────────────────────────────────────────────
insert into activities (org_id, type, title, description, link) values
  (spice_org, 'content_published', 'Reel went live',
    '"Sunday Thali Hack" reel published on Instagram', '/dashboard/content'),
  (spice_org, 'lead_received',     'New lead from Justdial',
    'Vikram Singh — catering enquiry for 60 pax',     '/dashboard/leads'),
  (spice_org, 'deliverable_due',   'May reels batch due in 5 days',
    '8 reels for May calendar pending approval',       '/dashboard/deliverables'),
  (byte_org,  'campaign_started',  'New campaign launched',
    '"Monsoon Mocha" influencer push started',         '/dashboard/campaigns'),
  (byte_org,  'content_approved',  'Caption approved',
    '"Cold brew, hot takes" caption approved by client','/dashboard/content'),
  (byte_org,  'lead_received',     'Bulk order enquiry',
    'Cafe in Pune asking about wholesale rates',       '/dashboard/leads');

-- ────────────────────────────────────────────────────────────────────
-- deliverables
-- ────────────────────────────────────────────────────────────────────
insert into deliverables (org_id, title, description, module, status, due_date) values
  (spice_org, 'May reels batch',         '8 reels for May calendar',                  'content',  'in_progress', '2026-05-20'),
  (spice_org, 'Lead funnel audit',       'Q2 funnel review and recommendations',      'leads',    'pending',     '2026-05-15'),
  (spice_org, 'Festive campaign brief',  'Diwali pre-bookings creative brief',        'campaigns','pending',     '2026-06-30'),
  (byte_org,  'Brand tone doc v2',       'Updated brand tone guidelines',             'strategy', 'delivered',   '2026-04-30'),
  (byte_org,  'Monsoon influencer push', '5 influencers, mocha launch',               'influencers','in_progress','2026-06-10'),
  (byte_org,  'Origin story reel set',   '4 reels — Chikmagalur farm story',          'content',  'review',      '2026-05-25');

-- ────────────────────────────────────────────────────────────────────
-- content_items
-- ────────────────────────────────────────────────────────────────────
insert into content_items (org_id, title, type, status, caption, hashtags, platform) values
  (spice_org, 'Sunday Thali Hack',       'reel', 'published',
    'Thali done right. Sunday sorted.',
    array['#SundayThali','#Bengaluru','#NorthIndianFood'], 'instagram'),
  (spice_org, 'Behind the kitchen',      'reel', 'scheduled',
    'Meet the chefs who plate your weekend.',
    array['#BTS','#FoodieBengaluru'], 'instagram'),
  (spice_org, 'Catering enquiry CTA',    'post', 'draft',
    'Hosting 50+? We plate it. Ping us on WhatsApp.',
    array['#Catering','#BengaluruEvents'], 'instagram'),
  (byte_org,  'Cold brew, hot takes',    'post', 'review',
    '12 hours of patience in every sip.',
    array['#ColdBrew','#SpecialtyCoffee'], 'instagram'),
  (byte_org,  'Origin story: Chikmagalur','reel','review',
    'From the hills to your home press.',
    array['#Chikmagalur','#IndianCoffee','#FarmToCup'], 'instagram'),
  (byte_org,  'Monsoon Mocha launch',    'reel', 'draft',
    'Rains called for richer brews. We answered.',
    array['#MonsoonMocha','#NewLaunch'], 'instagram');

-- ────────────────────────────────────────────────────────────────────
-- influencers (5 across cities + niches)
-- ────────────────────────────────────────────────────────────────────
insert into influencers (
  id, name, handle, platform, profile_url, avatar_url, city,
  audience_regions, languages, niches, content_styles,
  follower_count, engagement_rate, rate_per_reel, rate_per_story,
  availability, linchpin_rating, past_brand_categories,
  public_visible, public_bio, price_range_min_inr, price_range_max_inr,
  sample_content_urls, average_reel_views, audience_age_range,
  audience_gender_skew, active
) values
  (inf1, 'Ananya Reddy', 'ananyaeats', 'Instagram',
    'https://instagram.com/ananyaeats',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
    'Bengaluru',
    array['Karnataka','Tamil Nadu'], array['English','Kannada'],
    array['food','restaurants','local discovery'], array['POV','Tasting','Reviews'],
    184000, 5.4, 35000, 8000, 'active', 5,
    array['Food & Beverage','QSR'],
    true, 'Bengaluru food creator known for fast-paced tasting reels and honest restaurant discovery.',
    30000, 45000,
    array['https://instagram.com/reel/sample-ananya-thali','https://instagram.com/reel/sample-ananya-cafe'],
    86000, '22-34', '58% women, 42% men', true),
  (inf2, 'Kabir Malhotra', 'kabirgrinds', 'Instagram',
    'https://instagram.com/kabirgrinds',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
    'Mumbai',
    array['Maharashtra','Pan-India'], array['English','Hindi'],
    array['coffee','lifestyle','D2C'], array['Educational','Aesthetic','Talking head'],
    92000, 6.1, 22000, 5000, 'busy', 4,
    array['Specialty Coffee','D2C'],
    true, 'Specialty coffee and slow-living creator with a strong urban millennial audience.',
    18000, 28000,
    array['https://instagram.com/reel/sample-kabir-grinder','https://instagram.com/reel/sample-kabir-coldbrew'],
    52000, '24-38', '54% men, 46% women', true),
  (inf3, 'Tara Iyer', 'tarainframe', 'Instagram',
    'https://instagram.com/tarainframe',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    'Chennai',
    array['Tamil Nadu','Andhra Pradesh'], array['English','Tamil'],
    array['fashion','food','beauty'], array['Cinematic','Vlog','Aesthetic'],
    240000, 4.2, 45000, 10000, 'active', 4,
    array['Fashion','Food & Beverage'],
    true, 'Premium lifestyle creator for polished launches, fashion-led food, and aspirational reels.',
    40000, 60000,
    array['https://instagram.com/reel/sample-tara-launch','https://instagram.com/reel/sample-tara-style'],
    118000, '20-32', '64% women, 36% men', true),
  (inf4, 'Dev Shah', 'devbytes', 'YouTube',
    'https://youtube.com/@devbytes',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=256&q=80',
    'Ahmedabad',
    array['Gujarat','Pan-India'], array['Hindi','Gujarati','English'],
    array['tech','gadgets','SaaS'], array['Unboxing','Review','Educational'],
    410000, 3.8, 80000, null, 'active', 5,
    array['Tech','D2C'],
    true, 'Explainer-led tech creator for product demos, app walkthroughs, and practical review formats.',
    65000, 95000,
    array['https://youtube.com/shorts/sample-dev-app','https://youtube.com/shorts/sample-dev-review'],
    142000, '18-34', '72% men, 28% women', true),
  (inf5, 'Meera Nair', 'meeracooks', 'Instagram',
    'https://instagram.com/meeracooks',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=256&q=80',
    'Kochi',
    array['Kerala','Tamil Nadu'], array['English','Malayalam'],
    array['food','wellness','home cooking'], array['Recipes','POV','Raw & Real'],
    76000, 7.2, 18000, 4500, 'active', 4,
    array['Food & Beverage','Wellness'],
    true, 'Warm recipe creator with high-save cooking content and strong trust in Kerala food communities.',
    14000, 24000,
    array['https://instagram.com/reel/sample-meera-recipe','https://instagram.com/reel/sample-meera-breakfast'],
    39000, '25-44', '69% women, 31% men', true),
  (inf6, 'Rhea Kapoor', 'rheaglowup', 'Instagram',
    'https://instagram.com/rheaglowup',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=256&q=80',
    'Delhi NCR',
    array['Delhi NCR','Punjab','Pan-India'], array['English','Hindi'],
    array['beauty','skincare','salons'], array['Tutorial','Talking head','Before after'],
    156000, 6.8, 32000, 7500, 'active', 5,
    array['Beauty','Skincare','Salon'],
    true, 'Beauty and salon creator with practical skincare routines, makeover reels, and strong comment quality.',
    26000, 42000,
    array['https://instagram.com/reel/sample-rhea-skincare','https://instagram.com/reel/sample-rhea-salon'],
    74000, '18-30', '81% women, 19% men', true),
  (inf7, 'Arjun Menon', 'arjunfits', 'Instagram',
    'https://instagram.com/arjunfits',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
    'Hyderabad',
    array['Telangana','Andhra Pradesh','Karnataka'], array['English','Telugu','Hindi'],
    array['fitness','nutrition','wellness'], array['Educational','POV','Challenge'],
    128000, 5.9, 26000, 6500, 'active', 4,
    array['Fitness','Wellness','Food & Beverage'],
    true, 'Fitness creator suited for health foods, gyms, wellness offers, and habit-led reel campaigns.',
    22000, 36000,
    array['https://instagram.com/reel/sample-arjun-fitness','https://instagram.com/reel/sample-arjun-nutrition'],
    67000, '20-36', '61% men, 39% women', true),
  (inf8, 'Nisha Jain', 'nishahomestyle', 'Instagram',
    'https://instagram.com/nishahomestyle',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&q=80',
    'Pune',
    array['Maharashtra','Gujarat','Pan-India'], array['English','Hindi','Marathi'],
    array['home decor','parenting','lifestyle'], array['Aesthetic','Vlog','Product demo'],
    112000, 5.1, 24000, 6000, 'active', 4,
    array['Home Decor','Parenting','D2C'],
    true, 'Home and family lifestyle creator for warm product demos, gifting campaigns, and decor stories.',
    20000, 34000,
    array['https://instagram.com/reel/sample-nisha-home','https://instagram.com/reel/sample-nisha-demo'],
    58000, '26-42', '76% women, 24% men', true)
on conflict (id) do update set
  name = excluded.name,
  handle = excluded.handle,
  platform = excluded.platform,
  profile_url = excluded.profile_url,
  avatar_url = excluded.avatar_url,
  city = excluded.city,
  audience_regions = excluded.audience_regions,
  languages = excluded.languages,
  niches = excluded.niches,
  content_styles = excluded.content_styles,
  follower_count = excluded.follower_count,
  engagement_rate = excluded.engagement_rate,
  rate_per_reel = excluded.rate_per_reel,
  rate_per_story = excluded.rate_per_story,
  availability = excluded.availability,
  linchpin_rating = excluded.linchpin_rating,
  past_brand_categories = excluded.past_brand_categories,
  public_visible = excluded.public_visible,
  public_bio = excluded.public_bio,
  price_range_min_inr = excluded.price_range_min_inr,
  price_range_max_inr = excluded.price_range_max_inr,
  sample_content_urls = excluded.sample_content_urls,
  average_reel_views = excluded.average_reel_views,
  audience_age_range = excluded.audience_age_range,
  audience_gender_skew = excluded.audience_gender_skew,
  active = excluded.active;

end $$;
