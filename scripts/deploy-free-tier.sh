#!/usr/bin/env bash
# SnapForge free-tier deploy helper.
# Prerequisites: vercel login, railway login (or tokens), supabase login (for db push).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> 1) Cloud storage / optional admin user"
pnpm exec tsx scripts/setup-cloud-storage-and-admin.ts

echo "==> 2) Verify cloud schema"
pnpm exec tsx scripts/verify-cloud-schema.ts

if ! command -v vercel >/dev/null 2>&1; then
  echo "Install Vercel CLI: npm i -g vercel"
  exit 1
fi

echo "==> 3) Deploy admin (apps/admin)"
(
  cd apps/admin
  vercel pull --yes --environment=production || true
  vercel --prod --yes
)

echo "==> 4) Deploy sites (apps/sites)"
(
  cd apps/sites
  vercel pull --yes --environment=production || true
  vercel --prod --yes
)

echo "==> Done. Next:"
echo "  - Deploy worker: Import GitHub repo as a Blueprint in Render (render.yaml)"
echo "  - DEPLOY_SITE_DOMAIN=<sites-hostname> pnpm exec tsx scripts/upsert-production-site-domain.ts"
echo "  - Smoke test: login admin → translate → view sites URL"
