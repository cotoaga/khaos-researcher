/**
 * SSR entry point — serves public/index.html with live stats injected.
 * Replaces hardcoded stale constants; cached 6h on Vercel CDN.
 *
 * Single source of truth:
 *   BASELINE = { count: 121_000, date: '2023-01' }
 *   liveCount  → last ecosystem_snapshots row
 *   growthFactor = liveCount / BASELINE.count
 *   monthsSpan   = BASELINE.date → scrape date
 *
 * Error path: Supabase unreachable → serve '—' placeholders.
 * Never falls back to old literal constants (1.9M, 1890000, 1800000).
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';

export const config = { maxDuration: 10 };

const BASELINE = { count: 121_000, date: new Date('2023-01-01') };

function fmtCount(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(0) + 'K';
  return String(n);
}

function fmtMonthly(n) {
  if (!n || n <= 0) return '—';
  return '+' + (n >= 1_000 ? Math.round(n / 1_000) + 'K' : n);
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

export default async function handler(req, res) {
  // Only handle GET / and /index.html
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.status(405).end(); return;
  }

  // Template lives outside public/ to avoid Vercel static-file collision with rewrite
  const template = readFileSync(join(process.cwd(), 'src', 'templates', 'index.html'), 'utf-8');

  let liveCount = null, curatedCount = null, monthlyGrowth = null, scrapeDate = null;

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    const { data: snaps } = await supabase
      .from('ecosystem_snapshots')
      .select('total_models, curated_models, growth_rate_per_day, captured_at')
      .order('captured_at', { ascending: false })
      .limit(2);

    if (snaps && snaps.length > 0) {
      const latest = snaps[0];
      liveCount    = latest.total_models;
      curatedCount = latest.curated_models;
      scrapeDate   = new Date(latest.captured_at);

      if (snaps.length >= 2) {
        const prev = snaps[1];
        const daysDiff = (scrapeDate - new Date(prev.captured_at)) / 86_400_000;
        if (daysDiff > 0)
          monthlyGrowth = Math.round((liveCount - prev.total_models) / daysDiff * 30);
      }
    }
  } catch (err) {
    console.error('[render] Supabase unavailable:', err.message);
  }

  // Derived values — no constants as fallback
  const growthFactor = liveCount
    ? (liveCount / BASELINE.count).toFixed(1) : '—';
  const monthsSpan = liveCount
    ? Math.round((scrapeDate - BASELINE.date) / 86_400_000 / 30) : '—';
  const displayCount   = liveCount   ? fmtCount(liveCount)   : '—';
  const displayGrowth  = fmtMonthly(monthlyGrowth);
  const displayCurated = curatedCount ? String(curatedCount) : '—';

  // OG / social meta
  const ogTitle = liveCount
    ? `KHAOS AI — ${esc(displayCount)} models · ${esc(growthFactor)}x growth`
    : 'KHAOS AI Model Intelligence Dashboard';
  const ogDesc = liveCount
    ? `${liveCount.toLocaleString('en')} AI models tracked on HuggingFace. ${esc(growthFactor)}x growth in ${esc(monthsSpan)} months. ${esc(displayCurated)}+ curated enterprise models. ${esc(displayGrowth)}/month.`
    : 'Real-time AI model intelligence: tracking the global AI ecosystem.';

  const OG_TAGS = `
    <meta property="og:title" content="${ogTitle}" />
    <meta property="og:description" content="${ogDesc}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://khaos-researcher.cotoaga.ai/" />
    <meta name="description" content="${ogDesc}" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="${ogTitle}" />
    <meta name="twitter:description" content="${ogDesc}" />`;

  const html = template
    .replace('{{OG_TAGS}}',          OG_TAGS)
    .replace(/\{\{ECOSYSTEM_TOTAL\}\}/g, displayCount)
    .replace(/\{\{MONTHLY_GROWTH\}\}/g,  displayGrowth)
    .replace(/\{\{CURATED_COUNT\}\}/g,   displayCurated)
    .replace(/\{\{GROWTH_FACTOR\}\}/g,   String(growthFactor))
    .replace(/\{\{MONTHS_SPAN\}\}/g,     String(monthsSpan));

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  // 6h CDN cache aligned to research cycle; client JS refreshes without full reload
  res.setHeader('Cache-Control', 'public, s-maxage=21600, stale-while-revalidate=3600');
  res.status(200).send(html);
}
