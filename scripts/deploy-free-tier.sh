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
ADMIN_ORG_ID=$(node -p "require('./apps/admin/.vercel/project.json').orgId" 2>/dev/null || true)
ADMIN_PROJ_ID=$(node -p "require('./apps/admin/.vercel/project.json').projectId" 2>/dev/null || true)
if [ -n "$ADMIN_ORG_ID" ]; then
  VERCEL_ORG_ID=$ADMIN_ORG_ID VERCEL_PROJECT_ID=$ADMIN_PROJ_ID vercel pull --yes --environment=production || true
  VERCEL_ORG_ID=$ADMIN_ORG_ID VERCEL_PROJECT_ID=$ADMIN_PROJ_ID vercel --prod --yes
else
  echo "Error: Run 'vercel link' inside apps/admin first."
fi

echo "==> 4) Deploy sites (apps/sites)"
SITES_ORG_ID=$(node -p "require('./apps/sites/.vercel/project.json').orgId" 2>/dev/null || true)
SITES_PROJ_ID=$(node -p "require('./apps/sites/.vercel/project.json').projectId" 2>/dev/null || true)
if [ -n "$SITES_ORG_ID" ]; then
  VERCEL_ORG_ID=$SITES_ORG_ID VERCEL_PROJECT_ID=$SITES_PROJ_ID vercel pull --yes --environment=production || true
  VERCEL_ORG_ID=$SITES_ORG_ID VERCEL_PROJECT_ID=$SITES_PROJ_ID vercel --prod --yes
else
  echo "Error: Run 'vercel link' inside apps/sites first."
fi

echo "==> Done. Next:"
echo "  - Deploy worker: Import GitHub repo as a Blueprint in Render (render.yaml)"
echo "  - DEPLOY_SITE_DOMAIN=<sites-hostname> pnpm exec tsx scripts/upsert-production-site-domain.ts"
echo "  - Smoke test: login admin → translate → view sites URL"
