import {
  type JobThemeDefinition,
  type JobThemeSlots,
  escapeHtml,
  listToUl,
  splitLines,
} from './types'

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@600;700&family=IBM+Plex+Sans:wght@400;500;600&display=swap');

.job-corporate {
  --ink: #0f172a;
  --muted: #475569;
  --line: #e2e8f0;
  --accent: #0f766e;
  --paper: #ffffff;
  --soft: #f8fafc;
  max-width: 820px;
  margin: 0 auto;
  padding: 48px 28px 64px;
  font-family: 'IBM Plex Sans', system-ui, sans-serif;
  color: var(--ink);
  background: var(--paper);
  line-height: 1.6;
}
.job-corporate * { box-sizing: border-box; }
.job-corporate .jc-kicker {
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--accent);
  font-weight: 600;
  margin: 0 0 12px;
}
.job-corporate h1 {
  font-family: 'Source Serif 4', Georgia, serif;
  font-size: clamp(1.85rem, 3vw, 2.5rem);
  line-height: 1.15;
  margin: 0 0 16px;
  font-weight: 700;
}
.job-corporate .jc-meta {
  display: grid;
  gap: 8px;
  margin: 0 0 28px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--line);
  color: var(--muted);
  font-size: 0.95rem;
}
.job-corporate .jc-meta strong { color: var(--ink); font-weight: 600; }
.job-corporate .jc-hero {
  width: 100%;
  max-height: 320px;
  object-fit: cover;
  border-radius: 4px;
  margin: 0 0 28px;
  display: block;
}
.job-corporate h2 {
  font-size: 1.05rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  margin: 32px 0 12px;
  color: var(--ink);
}
.job-corporate .jc-summary {
  font-size: 1.05rem;
  color: var(--muted);
  margin: 0 0 8px;
}
.job-corporate ul {
  margin: 0;
  padding-left: 1.2rem;
}
.job-corporate li { margin: 0 0 8px; }
.job-corporate .jc-cta {
  display: inline-block;
  margin-top: 36px;
  padding: 14px 28px;
  background: var(--accent);
  color: #fff !important;
  text-decoration: none;
  font-weight: 600;
  border-radius: 4px;
}
.job-corporate .jc-cta:hover { filter: brightness(0.95); }
@media (max-width: 640px) {
  .job-corporate { padding: 28px 18px 48px; }
}
`.trim()

function renderHtml(slots: JobThemeSlots): string {
  const tags = splitLines(slots.tags)
  const req = splitLines(slots.requirements)
  const benefits = splitLines(slots.benefits)
  const hero = slots.heroImageUrl.trim()
    ? `<img class="jc-hero" src="${escapeHtml(slots.heroImageUrl.trim())}" alt="" />`
    : ''
  const apply =
    slots.applyUrl.trim() &&
    `<a class="jc-cta" href="${escapeHtml(slots.applyUrl.trim())}">${escapeHtml(
      slots.applyLabel || 'Apply Now'
    )}</a>`

  const metaRows = [
    slots.company && `<div><strong>Company:</strong> ${escapeHtml(slots.company)}</div>`,
    slots.location && `<div><strong>Location:</strong> ${escapeHtml(slots.location)}</div>`,
    slots.employmentType &&
      `<div><strong>Type:</strong> ${escapeHtml(slots.employmentType)}</div>`,
    slots.salary && `<div><strong>Compensation:</strong> ${escapeHtml(slots.salary)}</div>`,
    tags.length > 0 &&
      `<div><strong>Focus:</strong> ${escapeHtml(tags.join(' · '))}</div>`,
  ]
    .filter(Boolean)
    .join('')

  return `
<article class="job-corporate">
  <p class="jc-kicker">Open role</p>
  <h1>${escapeHtml(slots.headline || 'Untitled role')}</h1>
  <div class="jc-meta">${metaRows}</div>
  ${hero}
  ${slots.summary ? `<p class="jc-summary">${escapeHtml(slots.summary)}</p>` : ''}
  ${req.length ? `<h2>Requirements</h2>${listToUl(req, 'jc-list')}` : ''}
  ${benefits.length ? `<h2>Benefits</h2>${listToUl(benefits, 'jc-list')}` : ''}
  ${apply || ''}
</article>
`.trim()
}

export const jobCorporateTheme: JobThemeDefinition = {
  slug: 'job-corporate',
  name: 'Corporate',
  description: 'Text-heavy, structured layout for classic job SEO pages.',
  css: CSS,
  renderHtml,
}
