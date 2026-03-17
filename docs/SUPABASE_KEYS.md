# Supabase Keys — Where to Get Them

**Never commit keys to the repository.** Production and staging keys live in the team password manager or vault.

## Local development

- Run `npx supabase start` from the repo root. The CLI prints the local **API URL**, **anon key**, and **service role key** for that session.
- Copy those values into each app's `.env.local` (e.g. `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
- See [TOOLCHAIN.md](../../TOOLCHAIN.md) and [SUPABASE_LOCAL.md](../operations/SUPABASE_LOCAL.md) for setup.

## Production / staging

- **Anon key** and **service role key**: Supabase Dashboard → Project Settings → API. Use the project reference and dashboard URL from your team's vault or env docs.
- **Service role key** must only be used server-side; never expose it in client code or `NEXT_PUBLIC_*` variables. See [SECURITY.md](../../SECURITY.md) and [MULTI_TENANT_SECURITY.md](./MULTI_TENANT_SECURITY.md).
- Rotate keys immediately if they are ever committed or exposed.

## CI (e.g. GitHub Actions)

- Store production or local Supabase keys as repository or environment secrets. Use the same variable names as in `.env.local.example`. Never log or echo secrets.
