# Environment Variables

This project uses environment variables for credentials and business metadata. Do not hardcode secrets in source.

## Supabase (Business Metadata Only)

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Google OAuth (Drive Sync)

- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`
- `GOOGLE_OAUTH_REDIRECT_URI`
- `GOOGLE_OAUTH_SCOPES` (expected: `https://www.googleapis.com/auth/drive.appdata`)

## PAYUNi (Payment)

- `PAYUNI_MERCHANT_ID`
- `PAYUNI_HASH_KEY`
- `PAYUNI_HASH_IV`
- `PAYUNI_CHECKOUT_URL`
- `PAYUNI_VERSION` (default: `1.5`)
- `PAYUNI_RETURN_URL`
- `PAYUNI_NOTIFY_URL`

## App Settings

- `APP_ENV` (local/staging/production)
- `APP_BASE_URL`
- `SUPPORT_EMAIL`
