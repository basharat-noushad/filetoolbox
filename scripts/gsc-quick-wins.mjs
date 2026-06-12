#!/usr/bin/env node
/**
 * GSC Quick Wins Report — finds pages/queries ranking at positions 6–20
 * with meaningful impressions. These are the highest-ROI optimization targets:
 * a title/meta/FAQ improvement can push them to page 1.
 *
 * Zero npm dependencies — signs the Google service-account JWT with node:crypto.
 *
 * Required env:
 *   GSC_SERVICE_ACCOUNT_JSON  — full JSON key of a Google Cloud service account
 *                               that has been added as a (restricted) user on the
 *                               Search Console property.
 * Optional env:
 *   GSC_SITE_URL        — default "sc-domain:pdfandimage.com"
 *   MIN_IMPRESSIONS     — default 30
 *   POSITION_MIN/MAX    — default 6 / 20
 *   LOOKBACK_DAYS       — default 28
 *   REPORT_WEBHOOK_URL  — Zapier catch-hook; if set, the report is POSTed there
 *
 * Outputs:
 *   seo/reports/quick-wins-YYYY-MM-DD.md
 *   seo/reports/latest.json
 */

import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const SITE_URL = process.env.GSC_SITE_URL || 'sc-domain:pdfandimage.com'
const MIN_IMPRESSIONS = Number(process.env.MIN_IMPRESSIONS || 30)
const POSITION_MIN = Number(process.env.POSITION_MIN || 6)
const POSITION_MAX = Number(process.env.POSITION_MAX || 20)
const LOOKBACK_DAYS = Number(process.env.LOOKBACK_DAYS || 28)
const REPORTS_DIR = path.join(process.cwd(), 'seo', 'reports')

function b64url(buf) {
  return Buffer.from(buf).toString('base64url')
}

async function getAccessToken(sa) {
  const now = Math.floor(Date.now() / 1000)
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claims = b64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/webmasters.readonly',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    })
  )
  const unsigned = `${header}.${claims}`
  const signature = crypto
    .createSign('RSA-SHA256')
    .update(unsigned)
    .sign(sa.private_key)
    .toString('base64url')
  const jwt = `${unsigned}.${signature}`

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })
  if (!res.ok) {
    throw new Error(`Token exchange failed: ${res.status} ${await res.text()}`)
  }
  const data = await res.json()
  return data.access_token
}

async function queryGsc(token, body) {
  const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE_URL)}/searchAnalytics/query`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw new Error(`GSC query failed: ${res.status} ${await res.text()}`)
  }
  return res.json()
}

function isoDate(d) {
  return d.toISOString().slice(0, 10)
}

async function main() {
  const saJson = process.env.GSC_SERVICE_ACCOUNT_JSON
  if (!saJson) {
    console.error('Missing GSC_SERVICE_ACCOUNT_JSON env var.')
    process.exit(1)
  }
  const sa = JSON.parse(saJson)

  const end = new Date()
  end.setDate(end.getDate() - 2) // GSC data lags ~2 days
  const start = new Date(end)
  start.setDate(start.getDate() - LOOKBACK_DAYS)
  const startDate = isoDate(start)
  const endDate = isoDate(end)

  console.log(`Querying GSC for ${SITE_URL}: ${startDate} → ${endDate}`)
  const token = await getAccessToken(sa)

  // Page + query level — find quick wins
  const data = await queryGsc(token, {
    startDate,
    endDate,
    dimensions: ['page', 'query'],
    rowLimit: 5000,
  })

  const rows = data.rows || []
  console.log(`Fetched ${rows.length} page+query rows.`)

  const quickWins = rows
    .filter(
      r =>
        r.position >= POSITION_MIN &&
        r.position <= POSITION_MAX &&
        r.impressions >= MIN_IMPRESSIONS
    )
    .sort((a, b) => b.impressions - a.impressions)

  // Group by page
  const byPage = new Map()
  for (const r of quickWins) {
    const [page, query] = r.keys
    if (!byPage.has(page)) {
      byPage.set(page, { page, totalImpressions: 0, totalClicks: 0, queries: [] })
    }
    const entry = byPage.get(page)
    entry.totalImpressions += r.impressions
    entry.totalClicks += r.clicks
    entry.queries.push({
      query,
      impressions: r.impressions,
      clicks: r.clicks,
      ctr: +(r.ctr * 100).toFixed(2),
      position: +r.position.toFixed(1),
    })
  }

  const pages = [...byPage.values()]
    .sort((a, b) => b.totalImpressions - a.totalImpressions)
    .slice(0, 25)
    .map(p => ({ ...p, queries: p.queries.slice(0, 8) }))

  // ── Markdown report ──────────────────────────────────────────────────
  const today = isoDate(new Date())
  let md = `# SEO Quick Wins Report — ${today}\n\n`
  md += `**Property:** ${SITE_URL}  \n`
  md += `**Window:** ${startDate} → ${endDate} (${LOOKBACK_DAYS} days)  \n`
  md += `**Filter:** position ${POSITION_MIN}–${POSITION_MAX}, impressions ≥ ${MIN_IMPRESSIONS}\n\n`
  md += `Found **${pages.length} pages** with quick-win potential `
  md += `(${quickWins.length} page+query combinations).\n\n`
  md += `These pages already get impressions but sit just below page 1 (or low on it). `
  md += `Improving the title tag, meta description, and adding FAQ content targeting `
  md += `the listed queries is the fastest way to gain clicks.\n\n---\n\n`

  if (pages.length === 0) {
    md += `No quick wins matched the filter this week. If the site is new, lower MIN_IMPRESSIONS or wait for more impression data.\n`
  }

  for (const p of pages) {
    md += `## ${p.page}\n\n`
    md += `Impressions: **${p.totalImpressions}** · Clicks: **${p.totalClicks}**\n\n`
    md += `| Query | Position | Impressions | Clicks | CTR |\n`
    md += `|---|---|---|---|---|\n`
    for (const q of p.queries) {
      md += `| ${q.query} | ${q.position} | ${q.impressions} | ${q.clicks} | ${q.ctr}% |\n`
    }
    md += `\n`
  }

  fs.mkdirSync(REPORTS_DIR, { recursive: true })
  const mdPath = path.join(REPORTS_DIR, `quick-wins-${today}.md`)
  fs.writeFileSync(mdPath, md)
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'latest.json'),
    JSON.stringify({ generated: today, startDate, endDate, siteUrl: SITE_URL, pages }, null, 2)
  )
  console.log(`Report written: ${mdPath}`)

  // Optional: push the report to a Zapier catch hook (emails it to you)
  const webhook = process.env.REPORT_WEBHOOK_URL
  if (webhook) {
    try {
      const res = await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: `SEO Quick Wins — ${today} — ${pages.length} pages`,
          report_markdown: md,
          page_count: pages.length,
          top_page: pages[0]?.page || 'none',
        }),
      })
      console.log(`Webhook POST: ${res.status}`)
    } catch (e) {
      console.warn(`Webhook POST failed (non-fatal): ${e.message}`)
    }
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
