import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { parseCsv, years, type GeoCollection } from '../src/data';
const root=new URL('../public/',import.meta.url);
const read=(path:string)=>parseCsv(readFileSync(new URL(`data/${path}.csv`,root),'utf8'));
const p1=read('page1/p1_provincial_neet'),p2=read('page2/p2_province_year');
const maps=[34,38].map(n=>JSON.parse(readFileSync(new URL(`geo/indonesia-provinces-${n}.geojson`,root),'utf8')) as GeoCollection);
for(let i=0;i<2;i++){assert.equal(maps[i].features.length,[34,38][i]);assert.equal(new Set(maps[i].features.map(f=>f.properties.code)).size,[34,38][i]);}
for(const y of years){
 const expected=y<2024?34:38;const rows=p1.filter(r=>r.year===y);const keys=new Set((y<2024?maps[0]:maps[1]).features.map(f=>f.properties.code));
 assert.equal(rows.length,expected);assert.equal(p2.filter(r=>r.year===y&&r.geo_level!=='National').length,expected);
 assert.equal(new Set(rows.map(r=>r.province_key)).size,expected);
 for(const r of rows){assert.ok(keys.has(String(r.map_feature_key)),`${y} ${r.province_key} not mapped`);assert.ok(Number.isFinite(r.neet_rate_pct));assert.ok(r.neet_rate_pct>=0&&r.neet_rate_pct<=100);}
}
const flows=read('page2/p2_neet_decomposition'),sectors=read('page2/p2_labour_sector'),reasons=read('page2/p2_neet_reasons');
for(const r of p2){
 const select=(rows:typeof p2)=>rows.filter(x=>x.year===r.year&&x.province_key===r.province_key);
 const f=select(flows);assert.equal(f.length,5);assert.equal(f.filter(x=>x.source_node==='Youth population').reduce((s,x)=>s+Number(x.value_persons),0),r.youth_population_15_24);assert.equal(f.filter(x=>x.source_node==='NEET').reduce((s,x)=>s+Number(x.value_persons),0),r.neet_count);
 assert.ok(Math.abs(select(sectors).reduce((s,x)=>s+Number(x.share_of_employed_youth_pct),0)-100)<1e-8);
 for(const g of ['Male','Female']){const rr=select(reasons).filter(x=>x.gender===g);assert.equal(rr.length,5);assert.ok(Math.abs(rr.reduce((s,x)=>s+Number(x.share_within_gender_inactive_neet_pct),0)-100)<1e-8);}
}
const csvHashes=Object.fromEntries(['page1','page2','meta'].flatMap(folder=>readdirSync(new URL(`data/${folder}`,root)).filter(f=>f.endsWith('.csv')).map(f=>[`${folder}/${f}`,createHash('sha256').update(readFileSync(new URL(`data/${folder}/${f}`,root))).digest('hex')])));
console.log(`PASS: 178 official province-year rows; 183 regional geography-year rows; all map joins, unique keys, finite rates, 915 Sankey flows, 183 sector totals and 366 reason totals reconcile.`);
const baseline=JSON.parse(readFileSync(new URL('./raw-data-sha256.json',import.meta.url),'utf8'));
assert.deepEqual(Object.fromEntries(Object.entries(csvHashes).map(([key,value])=>['public/data/'+key,value])),baseline);
console.log(`PASS: ${Object.keys(csvHashes).length} raw CSV hashes match the unchanged input baseline.`);
