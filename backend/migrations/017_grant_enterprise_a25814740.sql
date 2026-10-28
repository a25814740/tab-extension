-- Migration: grant enterprise plan to a25814740@gmail.com for testing

do $$
declare
  target_id uuid;
  starts_at timestamptz := now();
  ends_at timestamptz := now() + interval '10 years';
begin
  select id into target_id from auth.users where email = 'a25814740@gmail.com' limit 1;
  if target_id is null then
    raise notice 'User not found for enterprise grant';
    return;
  end if;

  insert into public.memberships (
    user_id,
    plan_type,
    status,
    paid_starts_at,
    paid_ends_at,
    payment_provider,
    provider_order_id
  ) values (
    target_id,
    'enterprise',
    'paid_active',
    starts_at,
    ends_at,
    'manual',
    'manual_enterprise_grant'
  )
  on conflict (user_id) do update
  set
    plan_type = excluded.plan_type,
    status = excluded.status,
    paid_starts_at = excluded.paid_starts_at,
    paid_ends_at = excluded.paid_ends_at,
    payment_provider = excluded.payment_provider,
    provider_order_id = excluded.provider_order_id,
    updated_at = now();

  insert into public.entitlements (user_id, feature_key, is_enabled, source)
  values
    (target_id, 'can_use_byo_ai', true, 'manual'),
    (target_id, 'can_use_share_links', true, 'manual'),
    (target_id, 'can_use_team_workspace', true, 'manual'),
    (target_id, 'PRO_FUTURE', true, 'manual'),
    (target_id, 'TEAM_FUTURE', true, 'manual')
  on conflict (user_id, feature_key) do update
  set
    is_enabled = excluded.is_enabled,
    source = excluded.source,
    updated_at = now();
end $$;
