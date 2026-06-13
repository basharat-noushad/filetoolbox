# AUTOMATIONS.md — SEO Automation Setup Guide

Three automations are now in this repo. This file explains every secret, Zapier Zap,
and one-time setting needed to switch them on.

| # | Automation | Trigger | Files |
|---|-----------|---------|-------|
| 1 | Auto blog post pipeline | Zapier schedule → `repository_dispatch` | `.github/workflows/blog-post.yml`, `seo/content-calendar.json` |
| 2 | IndexNow ping on deploy | Vercel production deploy (GitHub `deployment_status`) | `.github/workflows/indexnow-ping.yml` |
| 3 | Weekly GSC quick-wins | Cron (Mon 08:00 PKT) or Zapier | `.github/workflows/seo-quick-wins.yml`, `scripts/gsc-quick-wins.mjs` |

---

## Step 0 — One-time GitHub repo settings

1. **Settings → Actions → General → Workflow permissions**
   - Select **"Read and write permissions"**
   - Check **"Allow GitHub Actions to create and approve pull requests"** ← required, PRs fail silently without it
2. Create a label named `seo-content` (Issues → Labels) — optional, the workflow falls back if missing.
3. Confirm the Vercel↔GitHub integration is active (it is if pushes to `main` already deploy). Automation 2 depends on the `deployment_status` events Vercel sends.

## Step 1 — GitHub Secrets (Settings → Secrets and variables → Actions)

| Secret | Used by | How to get it |
|---|---|---|
| `CLAUDE_CODE_OAUTH_TOKEN` | #1, #3 | You already have this from your existing pipeline. Reuse it. |
| `INDEXNOW_SECRET` | #2 | Generate any random string (e.g. `openssl rand -hex 24`). Set the SAME value as `INDEXNOW_SECRET` in **Vercel → Project → Settings → Environment Variables** so `/api/indexnow` is protected. Optional but recommended. |
| `GSC_SERVICE_ACCOUNT_JSON` | #3 | See Step 2 below. Paste the entire JSON key file content. |
| `REPORT_WEBHOOK_URL` | #3 (optional) | Zapier catch-hook URL from Zap C below. If unset, the report still lands in the PR + artifact, just no email. |

Optional repo **variable** (not secret): `GSC_SITE_URL` — defaults to `sc-domain:pdfandimage.com`. Only set it if your GSC property is a URL-prefix property (then use e.g. `https://pdfandimage.com/`).

## Step 2 — Google Search Console service account (for #3)

1. Go to https://console.cloud.google.com → create/select a project.
2. **APIs & Services → Enable APIs** → enable **"Google Search Console API"**.
3. **IAM & Admin → Service Accounts → Create service account** (name: `gsc-reader`). No roles needed.
4. Open the service account → **Keys → Add key → JSON**. Download the file.
5. Copy the `client_email` from the JSON (looks like `gsc-reader@project.iam.gserviceaccount.com`).
6. In **Search Console → Settings → Users and permissions → Add user** → paste that email → permission: **Restricted** (read-only is enough).
7. Paste the FULL JSON file content into the `GSC_SERVICE_ACCOUNT_JSON` GitHub secret.

Test locally (PowerShell):
```powershell
$env:GSC_SERVICE_ACCOUNT_JSON = Get-Content path\to\key.json -Raw
node scripts/gsc-quick-wins.mjs
```

## Step 3 — Zapier personal access token for GitHub dispatch

Zapier triggers workflows by POSTing to GitHub's `repository_dispatch` API. That needs a token:

1. GitHub → Settings → Developer settings → **Fine-grained personal access tokens** → Generate.
2. Repository access: only this repo. Permissions: **Contents: Read and write** (this covers repository dispatch).
3. Copy the token — you'll paste it into the Zapier webhook headers below. Treat it like a password; it lives only inside your Zapier account.

---

## Zap A — Blog Post Pipeline (Automation 1)

**Zap A1 — trigger the workflow on a schedule:**

1. **Trigger:** Schedule by Zapier → Every Week → Monday and Thursday, 9:00 AM (your timezone).
2. **Action:** Webhooks by Zapier → **Custom Request**
   - Method: `POST`
   - URL: `https://api.github.com/repos/<OWNER>/<REPO>/dispatches`  ← fill in your GitHub username/org and repo name
   - Data:
     ```json
     {"event_type": "generate-blog-post"}
     ```
   - Headers:
     | Key | Value |
     |---|---|
     | `Authorization` | `Bearer <your fine-grained PAT from Step 3>` |
     | `Accept` | `application/vnd.github+json` |
     | `Content-Type` | `application/json` |
3. Test: GitHub returns `204 No Content` on success, and a run appears under Actions → "Generate Blog Post".

**Zap A2 — get notified when the draft PR is ready:**

1. **Trigger:** GitHub → New Pull Request → select this repo.
2. **Filter by Zapier:** only continue if `Title` contains `Blog:` (so other PRs don't notify).
3. **Action:** Gmail → Send Email (to yourself)
   - Subject: `📝 New blog post ready for review: {{Title}}`
   - Body: include `{{Html Url}}` (the PR link) and `{{Body}}` (the post summary Claude wrote).

You review the PR → merge → Vercel deploys → Automation 2 pings IndexNow automatically. The full loop closes itself.

**Manual run anytime:** Actions tab → "Generate Blog Post" → Run workflow (optionally type a custom keyword).

---

## Zap B — IndexNow on Deploy (Automation 2)

**No Zapier needed.** The workflow listens to Vercel's GitHub `deployment_status` events and fires on every successful production deploy: waits 30s for the CDN, then POSTs to `https://pdfandimage.com/api/indexnow` with the bearer secret. Check runs under Actions → "IndexNow Ping After Deploy".

Optional belt-and-braces Zap (covers deploys made outside GitHub, e.g. `vercel --prod` from your machine):

1. **Trigger:** Schedule by Zapier → Every Day → 11:00 PM.
2. **Action:** Webhooks by Zapier → Custom Request
   - Method: `POST`
   - URL: `https://pdfandimage.com/api/indexnow`
   - Headers: `Authorization: Bearer <INDEXNOW_SECRET>` (only if you set the secret in Vercel)

IndexNow tolerates re-submission of unchanged URLs, so a daily ping is safe.

---

## Zap C — Weekly Quick-Wins Report Email (Automation 3)

The workflow already runs every Monday 08:00 PKT by cron — no Zapier required to trigger it.
This Zap just delivers the report to your inbox:

1. **Trigger:** Webhooks by Zapier → **Catch Hook**. Copy the hook URL.
2. Paste that URL into the `REPORT_WEBHOOK_URL` GitHub secret.
3. **Action:** Gmail → Send Email (to yourself)
   - Subject: `{{subject}}`  (the script sends e.g. "SEO Quick Wins — 2026-06-15 — 7 pages")
   - Body: `{{report_markdown}}`

What happens every Monday:
1. Script queries GSC for the last 28 days, finds pages at positions 6–20 with ≥30 impressions.
2. Report saved to `seo/reports/`, uploaded as an artifact, and emailed via this Zap.
3. Claude Code reads the report, improves titles/metas/FAQs of the top 5 pages, opens a PR.
4. You review the before/after in the PR description and merge.

**Manual run anytime:** Actions tab → "SEO Quick Wins (Weekly)" → Run workflow. Or trigger from Zapier with `{"event_type": "seo-quick-wins"}` to the same dispatches URL as Zap A1.

---

## Quick test checklist (do these in order)

- [ ] Step 0 repo settings done (especially "allow Actions to create PRs")
- [ ] All secrets added
- [ ] Push these new files to `main` (workflows only activate once they exist on the default branch)
- [ ] Manually run "Generate Blog Post" from the Actions tab → expect a PR in ~5–10 min
- [ ] Push any commit to `main` → after Vercel deploys, expect an "IndexNow Ping After Deploy" run
- [ ] Manually run "SEO Quick Wins" → expect a report artifact (a new site may have 0 quick wins yet — that's normal, the report will say so)
- [ ] Build Zaps A1, A2, C in Zapier and turn them on

## Tuning

- Blog cadence: change the Zap A1 schedule. 2 posts/week is a good start; the calendar has 10 topics seeded — top it up in `seo/content-calendar.json`.
- Quick-wins sensitivity: in `seo-quick-wins.yml` add env vars `MIN_IMPRESSIONS`, `POSITION_MIN`, `POSITION_MAX` to the report step. For a young site, `MIN_IMPRESSIONS=10` finds wins sooner.
- Cost note: each Claude Code run draws from your existing OAuth-token plan, same as your current pipeline.
