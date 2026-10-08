create index if not exists idx_theme_purchase_provider_order
on public.theme_asset_purchases(provider_order_id);

create index if not exists idx_theme_purchase_asset_status
on public.theme_asset_purchases(asset_id, status);
