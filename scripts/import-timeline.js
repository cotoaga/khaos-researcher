#!/usr/bin/env node
/**
 * COT-71 Task 2: One-time import of timeline-data.js → Supabase
 *
 * Reads the gem's timeline-data.js (14 quarters), extracts entities,
 * valuations, and edges, then upserts into Supabase.
 *
 * Usage:
 *   node scripts/import-timeline.js [--timeline-file <path>] [--dry-run]
 *
 * Default timeline file: ../cotoaga-ai-gems/industrial-ai-complex/timeline-data.js
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import vm from 'vm';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── CLI args ─────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const timelineFileIdx = args.indexOf('--timeline-file');
const timelineFile = timelineFileIdx >= 0
  ? resolve(args[timelineFileIdx + 1])
  : resolve(__dirname, '../../cotoaga-ai-gems/industrial-ai-complex/timeline-data.js');

// ── Supabase ─────────────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ── Classification tables ─────────────────────────────────────────────────────
const PUBLIC_MARKET_CAP = new Set([
  'microsoft','google','meta','nvidia','amazon','apple',
  'oracle','adobe','salesforce','uber','tesla','softbank'
]);
const AUM = new Set(['sequoia']);
const STATE = new Set(['usgov','eugov']);
// everything else defaults to PRIVATE_POST_MONEY

function valueType(id) {
  if (STATE.has(id))          return 'NONE';
  if (AUM.has(id))            return 'AUM';
  if (PUBLIC_MARKET_CAP.has(id)) return 'PUBLIC_MARKET_CAP';
  return 'PRIVATE_POST_MONEY';
}

function actorType(id) {
  return STATE.has(id) ? 'state' : 'commercial';
}

// ── Quarter → end date ────────────────────────────────────────────────────────
function quarterEndDate(q) {
  const [year, qt] = [q.slice(0, 4), q.slice(4)];
  const monthEnd = { Q1: '03-31', Q2: '06-30', Q3: '09-30', Q4: '12-31' };
  return `${year}-${monthEnd[qt]}`;
}

// ── Load timeline data ────────────────────────────────────────────────────────
function loadTimeline(filePath) {
  const code = readFileSync(filePath, 'utf-8');
  const ctx = {};
  vm.runInNewContext(code, ctx);
  if (!ctx.timelineData) throw new Error('timelineData not found in ' + filePath);
  return ctx.timelineData;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`Loading timeline from: ${timelineFile}`);
  const timelineData = loadTimeline(timelineFile);
  const quarters = Object.keys(timelineData).sort();
  console.log(`Found ${quarters.length} quarters: ${quarters[0]} → ${quarters[quarters.length - 1]}`);

  // Collect unique entities across all quarters
  const entityMap = new Map(); // id → {id, label, actor_type}
  for (const quarter of quarters) {
    for (const node of timelineData[quarter].nodes) {
      if (!entityMap.has(node.id)) {
        entityMap.set(node.id, {
          id: node.id,
          label: node.label,
          actor_type: actorType(node.id)
        });
      }
    }
    // Also collect entity IDs that only appear as edge endpoints
    for (const link of timelineData[quarter].links) {
      for (const endpointId of [link.source, link.target]) {
        if (!entityMap.has(endpointId)) {
          entityMap.set(endpointId, {
            id: endpointId,
            label: endpointId,   // label unknown, use ID
            actor_type: actorType(endpointId)
          });
        }
      }
    }
  }

  const entities = Array.from(entityMap.values());
  console.log(`\n${entities.length} unique entities`);
  if (dryRun) {
    console.log('  [dry-run] entities:', entities.map(e => e.id).join(', '));
  }

  // Collect valuations (one per entity per quarter)
  const valuations = [];
  for (const quarter of quarters) {
    const asOfDate = quarterEndDate(quarter);
    for (const node of timelineData[quarter].nodes) {
      valuations.push({
        entity_id:   node.id,
        value:       node.value,
        value_type:  valueType(node.id),
        as_of_date:  asOfDate,
        quarter,
        quality:     node.dataQuality || 'C'
      });
    }
  }
  console.log(`${valuations.length} valuations`);

  // Collect edges (deduplicated per source/target/type/quarter by UNIQUE constraint)
  const edgeList = [];
  for (const quarter of quarters) {
    for (const link of timelineData[quarter].links) {
      edgeList.push({
        source:    link.source,
        target:    link.target,
        edge_type: link.type,
        value:     link.value ?? null,
        quarter
      });
    }
  }
  console.log(`${edgeList.length} edges across all quarters`);

  if (dryRun) {
    console.log('\n[dry-run] No data written to Supabase.');
    return;
  }

  // ── Insert entities ──────────────────────────────────────────────────────
  console.log('\nUpserting entities...');
  const { error: entErr } = await supabase
    .from('entities')
    .upsert(entities, { onConflict: 'id', ignoreDuplicates: false });
  if (entErr) throw new Error('entities upsert failed: ' + entErr.message);
  console.log(`✅ ${entities.length} entities upserted`);

  // ── Insert valuations ────────────────────────────────────────────────────
  console.log('Upserting valuations...');
  const CHUNK = 200;
  for (let i = 0; i < valuations.length; i += CHUNK) {
    const chunk = valuations.slice(i, i + CHUNK);
    const { error: valErr } = await supabase
      .from('valuations')
      .upsert(chunk, { onConflict: 'entity_id,quarter', ignoreDuplicates: false });
    if (valErr) throw new Error(`valuations upsert failed (chunk ${i}): ` + valErr.message);
  }
  console.log(`✅ ${valuations.length} valuations upserted`);

  // ── Insert capital_edges ─────────────────────────────────────────────────
  console.log('Upserting capital_edges...');
  for (let i = 0; i < edgeList.length; i += CHUNK) {
    const chunk = edgeList.slice(i, i + CHUNK);
    const { error: edgeErr } = await supabase
      .from('capital_edges')
      .upsert(chunk, { onConflict: 'source,target,edge_type,quarter', ignoreDuplicates: false });
    if (edgeErr) throw new Error(`capital_edges upsert failed (chunk ${i}): ` + edgeErr.message);
  }
  console.log(`✅ ${edgeList.length} capital_edges upserted`);

  console.log('\n🎉 Import complete.');
}

main().catch(err => { console.error('Import failed:', err); process.exit(1); });
