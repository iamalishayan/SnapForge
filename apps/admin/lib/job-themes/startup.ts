import {
  type JobThemeDefinition,
  type JobThemeSlots,
  escapeHtml,
  listToUl,
  splitLines,
} from './types'

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=DM+Sans:wght@400;500;600&display=swap');

.job-startup {
  --ink: #111827;
  --muted: #6b7280;
  --chip: #eef2ff;
  --chip-text: #3730a3;
  --accent: #ea580c;
  --panel: #fff7ed;
  --paper: #ffffff;
  max-width: 900px;
  margin: 0 auto;
  padding: 40px 24px 56px;
  font-family: 'DM Sans', system-ui, sans-serif;
  color: var(--ink);
  background: var(--paper);
  line-height: 1.55;
}
.job-startup * { box-sizing: border-box; }
.job-startup .js-hero {
  display: grid;
  gap: 24px;
  grid-template-columns: 1.2fr 0.8fr;
  align-items: stretch;
  margin-bottom: 28px;
}
.job-startup .js-panel {
  background: linear-gradient(160deg, var(--panel), #ffffff 70%);
  border: 1px solid #fed7aa;
  border-radius: 20px;
  padding: 28px;
}
.job-startup .js-eyebrow {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--accent);
  margin: 0 0 10px;
}
.job-startup h1 {
  font-family: 'Space Grotesk', system-ui, sans-serif;
  font-size: clamp(1.9rem, 3.4vw, 2.75rem);
  line-height: 1.05;
  margin: 0 0 14px;
  letter-spacing: -0.03em;
}
.job-startup .js-company {
  font-size: 1rem;
  color: var(--muted);
  margin: 0 0 18px;
}
.job-startup .js-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0 0 8px;
}
.job-startup .js-chip {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 999px;
  background: var(--chip);
  color: var(--chip-text);
  font-size: 0.82rem;
  font-weight: 600;
}
.job-startup .js-media {
  width: 100%;
  height: 100%;
  min-height: 220px;
  object-fit: cover;
  border-radius: 20px;
  display: block;
}
.job-startup .js-media-fallback {
  min-height: 220px;
  border-radius: 20px;
  background: #111827;
}
.job-startup h2 {
  font-family: 'Space Grotesk', system-ui, sans-serif;
  font-size: 1.15rem;
  margin: 28px 0 12px;
}
.job-startup .js-summary { color: var(--muted); margin: 0; }
.job-startup ul { margin: 0; padding-left: 1.15rem; }
.job-startup li { margin: 0 0 8px; }
.job-startup .js-cta {
  display: inline-flex;
  margin-top: 28px;
  padding: 14px 26px;
  background: var(--accent);
  color: #fff !important;
  text-decoration: none;
  font-weight: 700;
  border-radius: 999px;
}
@media (max-width: 760px) {
  .job-startup .js-hero { grid-template-columns: 1fr; }
}
`.trim()

function renderHtml(slots: JobThemeSlots): string {
  const tags = splitLines(slots.tags)
  const req = splitLines(slots.requirements)
  const benefits = splitLines(slots.benefits)
  const chips = [
    slots.location,
    slots.employmentType,
    slots.salary,
    ...tags,
  ]
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => `<span class="js-chip">${escapeHtml(t)}</span>`)
    .join('')

  const media = slots.heroImageUrl.trim()
    ? `<img class="js-media" src="${escapeHtml(slots.heroImageUrl.trim())}" alt="" />`
    : `<div class="js-media-fallback" aria-hidden="true"></div>`

  const apply =
    slots.applyUrl.trim() &&
    `<a class="js-cta" href="${escapeHtml(slots.applyUrl.trim())}">${escapeHtml(
      slots.applyLabel || 'Apply Now'
    )}</a>`

  return `
<article class="job-startup">
  <div class="js-hero">
    <div class="js-panel">
      <p class="js-eyebrow">We're hiring</p>
      <h1>${escapeHtml(slots.headline || 'Untitled role')}</h1>
      ${
        slots.company
          ? `<p class="js-company">${escapeHtml(slots.company)}</p>`
          : ''
      }
      ${chips ? `<div class="js-chips">${chips}</div>` : ''}
      ${apply || ''}
    </div>
    ${media}
  </div>
  ${slots.summary ? `<p class="js-summary">${escapeHtml(slots.summary)}</p>` : ''}
  ${req.length ? `<h2>What you'll bring</h2>${listToUl(req, 'js-list')}` : ''}
  ${benefits.length ? `<h2>What you'll get</h2>${listToUl(benefits, 'js-list')}` : ''}
</article>
`.trim()
}

export const jobStartupTheme: JobThemeDefinition = {
  slug: 'job-startup',
  name: 'Startup',
  description: 'Visual-first layout with chips, hero, and punchy CTA.',
  css: CSS,
  renderHtml,
}
