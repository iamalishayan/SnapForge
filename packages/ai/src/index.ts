// Barrel export — translate, qa-checks, keywords, fingerprint, image localization
export * from './translate'
export * from './llm-providers'
export * from './qa-checks'
export * from './keyword-suggester'
export * from './structure-fingerprint'
export * from './extract-image-urls'
export * from './fetch-image'
export * from './image-classify'
export * from './image-templates/manifest'
export * from './image-templates/render'
export * from './rewrite-image-src'

// ─── Scholarship Pipeline (Phase 0) ──────────────────────────────────────────
// Canonical hash utilities — import from '@snapforge/ai' for both extraction
// (Phase 3.4) and staleness worker (Phase 7.1) consumers.
export * from './utils/hashUtils'
// Zod schemas + inferred TypeScript types for all scholarship domain entities
export * from './schemas/scholarship'
