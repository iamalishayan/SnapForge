#!/usr/bin/env tsx
/**
 * Configure a Vercel project's monorepo rootDirectory + build commands.
 * Usage: pnpm exec tsx scripts/configure-vercel-monorepo.ts snapforge-admin apps/admin
 */
import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'

async function main() {
  const project = process.argv[2]
  const rootDirectory = process.argv[3]
  if (!project || !rootDirectory) {
    console.error(
      'Usage: tsx scripts/configure-vercel-monorepo.ts <project-name> <rootDirectory>'
    )
    process.exit(1)
  }

  const authPath = path.join(
    process.env.HOME || '',
    'Library/Application Support/com.vercel.cli/auth.json'
  )
  const auth = JSON.parse(fs.readFileSync(authPath, 'utf8'))
  const token = auth.token as string
  if (!token) {
    console.error('No Vercel token found — run vercel login')
    process.exit(1)
  }

  const who = await fetch('https://api.vercel.com/v2/user', {
    headers: { Authorization: `Bearer ${token}` },
  }).then((r) => r.json())

  const teamId =
    (who?.user && null) ||
    (() => {
      try {
        const conf = JSON.parse(
          fs.readFileSync(path.join(process.cwd(), '.vercel/project.json'), 'utf8')
        )
        return conf.orgId as string | undefined
      } catch {
        return undefined
      }
    })()

  // Resolve project + team from linked .vercel if present under apps/*
  let orgId = teamId
  const candidates = [
    path.join(process.cwd(), '.vercel/project.json'),
    path.join(process.cwd(), 'apps/admin/.vercel/project.json'),
    path.join(process.cwd(), 'apps/sites/.vercel/project.json'),
  ]
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      const j = JSON.parse(fs.readFileSync(p, 'utf8'))
      if (j.projectName === project || j.projectId) {
        orgId = j.orgId || orgId
      }
    }
  }

  // Prefer org from apps/admin link (just created)
  const adminLink = path.join(process.cwd(), 'apps/admin/.vercel/project.json')
  if (fs.existsSync(adminLink)) {
    const j = JSON.parse(fs.readFileSync(adminLink, 'utf8'))
    orgId = j.orgId
  }

  const qs = orgId ? `?teamId=${orgId}` : ''
  const filterApp = rootDirectory.endsWith('admin') ? 'admin' : 'sites'

  const body = {
    framework: 'nextjs',
    rootDirectory,
    installCommand: 'pnpm install',
    buildCommand: `pnpm --filter ${filterApp} build`,
  }

  const res = await fetch(`https://api.vercel.com/v9/projects/${project}${qs}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const data = await res.json()
  if (!res.ok) {
    console.error(JSON.stringify(data, null, 2))
    process.exit(1)
  }

  console.log(
    `Configured ${project}: rootDirectory=${rootDirectory} build=pnpm --filter ${filterApp} build`
  )
  void execSync
}

main()
