# Security

- No secrets are stored in the extension bundle.
- Auth tokens are retrieved via Chrome Identity API and exchanged server-side.
- Role-based access control enforced in Supabase policies.
- Share links are tokenized and revocable.