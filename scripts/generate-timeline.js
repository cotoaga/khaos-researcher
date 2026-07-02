#!/usr/bin/env node
/**
 * COT-71 Task 3: Generator — Supabase → timeline-data.json
 *
 * Reads entities, valuations, and edges from Supabase and reconstructs
 * the timelineData object compatible with the gem's rendering engine.
 * Writes a static JSON file as a build-time export (gem stays embeddable).
 *
 * Usage:
 *   node scripts/generate-timeline.js [--output <path>]
 *
 * Default output: ../cotoaga-ai-gems/industrial-ai-complex/timeline-data.json
 */

import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: new URL('../.env.local', import.meta.url).pathname });
config(); // fallback to .env

const __dirname = dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const outputIdx = args.indexOf('--output');
const outputPath = outputIdx >= 0
  ? resolve(args[outputIdx + 1])
  : resolve(__dirname, '../../cotoaga-ai-gems/industrial-ai-complex/timeline-data.json');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export async function buildTimelineData() {
  const [{ data: entities }, { data: valuations }, { data: capitalEdges }] = await Promise.all([
    supabase.from('entities').select('*'),
    supabase.from('valuations').select('*').order('quarter'),
    supabase.from('capital_edges').select('*').order('quarter')
  ]);

  if (!entities || !valuations || !capitalEdges) {
    throw new Error('Failed to fetch data from Supabase');
  }

  const entityMap = new Map(entities.map(e => [e.id, e]));

  // Group valuations and edges by quarter
  const quarters = [...new Set(valuations.map(v => v.quarter))].sort();
  const edgesByQuarter = {};
  for (const e of capitalEdges) {
    (edgesByQuarter[e.quarter] ||= []).push(e);
  }

  const timelineData = {};

  for (const quarter of quarters) {
    const qValuations = valuations.filter(v => v.quarter === quarter);
    const qEdges = edgesByQuarter[quarter] || [];

    const nodes = qValuations.map(v => {
      const entity = entityMap.get(v.entity_id);
      const node = {
        id:    v.entity_id,
        label: entity?.label || v.entity_id,
        value: parseFloat(v.value)
      };
      if (v.quality && v.quality !== 'C') node.dataQuality = v.quality;
      return node;
    });

    const links = qEdges.map(e => {
      const link = {
        source:    e.source,
        target:    e.target,
        type:      e.edge_type,
        value:     e.value != null ? parseFloat(e.value) : undefined
      };
      if (link.value == null) delete link.value;
      return link;
    });

    timelineData[quarter] = { nodes, links, events: [] };
  }

  return timelineData;
}

async function main() {
  console.log('Fetching timeline data from Supabase...');
  const timelineData = await buildTimelineData();
  const quarters = Object.keys(timelineData);
  console.log(`Built ${quarters.length} quarters: ${quarters[0]} → ${quarters[quarters.length - 1]}`);

  const output = JSON.stringify({ success: true, data: timelineData, generatedAt: new Date().toISOString() }, null, 2);
  writeFileSync(outputPath, output, 'utf-8');
  console.log(`✅ Written to: ${outputPath}`);
}

main().catch(err => { console.error('Generate failed:', err); process.exit(1); });
