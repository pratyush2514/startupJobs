# Playwright scrapers — remaining companies

These companies have **no public JSON feed** (verified by probing, 2026-11-01).
Their jobs only render inside JavaScript apps, so they need a real browser
(Playwright) to extract. Rule stays: **official career pages only** — every
apply link must be the company's own posting, never an aggregator.

## Why not BeautifulSoup
Swiggy / PhonePe / Zerodha serve near-empty HTML shells; jobs load via JS.
Static HTML parsing returns zero roles for them. Playwright executes the JS.

## Companies + blockers found

| Company | Blocker |
|---|---|
| Zomato | eternal.com rebrand; Astro static page, no job data; careers.zomato.com dead |
| Zepto | AWS WAF JS challenge blocks non-browser clients |
| PhonePe | Gatsby SPA; jobs API only discoverable at runtime via network capture |
| Nykaa | Skima platform (`careers.nykaa.com`); no public API contract |
| Delhivery | DarwinBox (`delhivery.darwinbox.in`); closed HR system |
| Dream11 | Left Lever (board 404s); new system unknown |
| OYO | DarwinBox shell; legacy Trakstar board has 1 stale job |
| Postman | Bot-walled Next.js; chunks return HTML shell to non-browsers |

## Defensive pattern (required)

Every scraper MUST fail loudly, never silently:

1. If a run yields **0 roles** for a company that had >0 before → do NOT
   commit the empty result; open an alert (Actions log + commit message flag).
2. If a company's page structure changes → the scraper errors; the last
   known-good `roles.ts` stays live until fixed.
3. Each scraper logs the count per company; the workflow summary shows
   before/after counts so regressions are visible at a glance.

## Where they run

`scripts/scrape-playwright/` (one file per company) executed by a third
workflow (`refresh-roles-playwright.yml`, weekly, after the JSON feeds).
Its output merges into `roles.ts` the same way. Playwright + Chromium
install in ~2 min on `ubuntu-latest` runners — no extra infra.

## Build order (highest user interest first)

1. Zepto, 2. PhonePe, 3. Zomato, 4. Nykaa, 5. Postman, 6. Dream11,
7. Delhivery, 8. OYO
