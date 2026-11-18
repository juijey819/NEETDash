import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseCsv, scenario, regionalTrend, type DataSet, type Row } from './data';
import { sidebarNarrative, sidebarInsights, nationalInsights, nationalInsightCandidates, nationalSummary, regionalSummary, modelCoverage, regionalInsights, inactiveNeetSummary, genderGapSummary, scenarioDefaults, isMaterialChange, changeSentence, gapSentence, type EvidenceValue } from './analysis';
import { buildInsightPanelInput, generateInsightPanel, insightPanel } from './insight-panel';
const read=(path:string)=>parseCsv(readFileSync(new URL(`../public/data/${path}.csv`,import.meta.url),'utf8'));
const data={national:read('page1/p1_national_trend'),kpis:read('page1/p1_kpi_by_year'),provinces:read('page1/p1_provincial_neet'),education:read('page1/p1_education_trend'),regional:read('page2/p2_province_year'),reasons:read('page2/p2_neet_reasons'),quality:read('page2/p2_labour_quality'),sectors:read('page2/p2_labour_sector'),model:read('page2/p2_exclusion_model'),scenarios:read('page2/p2_policy_scenarios')} as DataSet;
const whole=(n:number)=>Math.round(n).toLocaleString('en-US');
function verifyEvidence(values:EvidenceValue[]){for(const e of values){const rows=data[e.table] as Row[];const row=rows.find(r=>Object.entries(e.match).every(([key,value])=>r[key]===value));assert.ok(row,JSON.stringify(e));assert.equal(Number(row[e.field]),e.value,JSON.stringify(e));}}
const sentenceCount=(text:string)=>(text.match(/[.!?](?=\s|$)/g)??[]).length;
test('CSV parsing preserves quoted labels, keys and missing counts',()=>{
 const [r]=parseCsv('year,province_key,province_code,neet_rate_pct,province_name,neet_count\n2025,ID-11,11,19.44,"Name, with comma",\n');
 assert.equal(r.year,2025);assert.equal(r.province_code,'11');assert.equal(r.province_key,'ID-11');assert.equal(r.neet_rate_pct,19.44);assert.equal(r.province_name,'Name, with comma');assert.equal(r.neet_count,'');
});
test('supplied official anchors and full national history remain unchanged',()=>{
 const k=data.kpis.find(r=>r.year===2025)!;assert.equal(k.national_neet_rate_pct,19.44);assert.equal(k.female_neet_rate_pct,23.43);
 assert.equal(data.education.find(r=>r.year===2025&&r.subgroup==='Tidak Tamat SD/MI')!.neet_rate_pct,37.3);
 assert.deepEqual(data.national.map(r=>r.neet_rate_pct),[22.4,23.22,22.25,20.31,19.44]);
});
test('scenario endpoints cover all 183 snapshots and zero coverage preserves the published rate',()=>{
 for(const r of data.regional){
  assert.equal(scenario(r.neet_count,r.youth_population_15_24,0,60,r.neet_rate_pct).rateAfter,r.neet_rate_pct);
  assert.equal(scenario(r.neet_count,r.youth_population_15_24,100,100,r.neet_rate_pct).rateAfter,0);
  assert.equal(scenario(r.neet_count,r.youth_population_15_24,100,100).remaining,0);
  assert.ok(Math.abs(scenario(r.neet_count,r.youth_population_15_24,30,60).transitions-r.neet_count*.18)<1e-6);
 }
 assert.equal(scenario(8602824,44259960,30,60,19.44).transitions.toFixed(2),'1548508.32');
 assert.equal(scenario(8602824,44259960,30,60,19.44).rateAfter.toFixed(2),'15.94');
});
test('historical Papua and current Papua remain separate',()=>{
 assert.equal(regionalTrend(data,'ID-91')[2],null);
 const hist=data.regional.find(r=>r.province_key==='PAPUA_HIST')!;assert.ok(hist);assert.equal(regionalTrend(data,hist.province_key)[3],null);
});
test('national counts stay missing before 2023 and annual changes use source values',()=>{
 assert.equal(nationalSummary(data,2021).count,undefined);assert.equal(nationalSummary(data,2022).population,undefined);
 const s=nationalSummary(data,2025);assert.equal(s.count,8602824);assert.equal(s.population,44259960);assert.equal(s.changes.count.text,'−400.1K vs 2024');
});
test('0.5-point materiality applies symmetrically, including exact boundaries',()=>{
 for(const x of [-.4999,-.49,0,.35,.49,.4999]){assert.equal(isMaterialChange(x),false);assert.match(gapSentence(x,2024,2025),/little changed/);assert.doesNotMatch(gapSentence(x,2024,2025),/widened|narrowed/);}
 for(const x of [-.5,.5,-1,1])assert.equal(isMaterialChange(x),true);
 assert.match(gapSentence(.5,2024,2025),/widened 0.50 percentage points/);assert.match(gapSentence(-.5,2024,2025),/narrowed 0.50 percentage points/);
 assert.match(changeSentence(.35,2024,2025),/little changed/);
 assert.match(changeSentence(.4999,2024,2025),/0\.4999 points/);assert.doesNotMatch(changeSentence(.4999,2024,2025),/0\.50 points/);
});
test('replacement gender-gap KPI is computed from rates and does not overstate a 0.35-point change',()=>{
 const g=genderGapSummary(data,2025);assert.ok(Math.abs(g.gap-7.75)<1e-10);assert.ok(Math.abs(g.delta-.35)<1e-10);assert.equal(g.change.tone,'neutral');assert.equal(g.change.text,'Little changed vs 2024');
 const changed={...data,kpis:data.kpis.map(r=>r.year===2025?{...r,female_neet_rate_pct:r.female_neet_rate_pct+2}:r)};
 assert.ok(Math.abs(genderGapSummary(changed,2025).gap-9.75)<1e-10);assert.equal(genderGapSummary(changed,2025).change.tone,'bad');
});
test('all national insight candidates use one preceding-year baseline, with no future comparison',()=>{
 for(const year of [2021,2022,2023,2024,2025]){
  const facts=nationalInsightCandidates(data,year,'IDN');assert.equal(new Set(facts.map(f=>f.baselineYear)).size,1);assert.equal(facts[0].baselineYear,year===2021?2021:year-1);
  for(const f of facts){assert.ok(f.baselineYear<=year);verifyEvidence(f.evidence);}
 }
 const gender=nationalInsightCandidates(data,2025,'IDN').find(f=>f.id==='gender-gap')!;assert.match(gender.title,/little changed/);assert.match(gender.text,/23.43%/);assert.match(gender.text,/15.68%/);assert.match(gender.text,/7.75/);assert.match(gender.text,/2024/);
});
test('candidate selection responds to record, gap and streak importance rather than fixed category slots',()=>{
 const standard=nationalInsights(data,2025,'IDN');assert.equal(standard.length,4);assert.equal(standard[0].id,'education-range');assert.ok(standard.some(f=>f.id==='national-trajectory'));
 const changed={...data,education:data.education.map(r=>r.year===2025&&r.subgroup==='Universitas'?{...r,neet_rate_pct:95}:r)};
 const first=nationalInsights(changed,2025,'IDN')[0];assert.match(first.title,/university/);assert.match(first.text,/95.00%/);
 assert.notDeepEqual(nationalInsights(data,2024,'IDN').map(f=>f.id),standard.map(f=>f.id));
 const trend=nationalInsightCandidates(data,2025,'IDN').find(f=>f.id==='national-trajectory')!;assert.match(trend.title,/Lowest rate/);assert.match(trend.text,/3 consecutive annual declines/);
});
test('selected-province findings carry exact numbers and skip invalid boundary-change comparisons',()=>{
 const jambi=nationalInsights(data,2025,'ID-15').find(f=>f.id==='selected-province')!;assert.ok(jambi);verifyEvidence(jambi.evidence);assert.match(jambi.text,/Jambi/);
 assert.ok(!nationalInsightCandidates(data,2024,'ID-92').some(f=>f.id==='selected-province'));
 assert.ok(nationalInsightCandidates(data,2025,'ID-92').some(f=>f.id==='selected-province'));
});
test('national descriptions are numerical, contextual and free of advice, jargon and status labels',()=>{
 for(const year of [2021,2022,2023,2024,2025])for(const province of ['IDN',...data.provinces.filter(r=>r.year===year).map(r=>r.province_key)]){
  const facts=nationalInsights(data,year,province);assert.equal(facts.length,4);
  for(const f of facts){assert.match(f.text,/\d/);assert.match(f.text,/rate/i);assert.match(f.text,new RegExp(String(year)));assert.doesNotMatch(f.text,/\b(pp|still|expand|prioritise|should|suggests|cause|synthetic|illustrative|caveat)\b/i);assert.ok(sentenceCount(f.text)<=3);verifyEvidence(f.evidence);}
 }
});
test('reason totals combine people rather than unweighted gender percentages',()=>{
 const a=regionalInsights(data,2025,'IDN');assert.equal(a.combinedReasons[0].name,'Waiting / considering options');assert.equal(a.combinedReasons[0].count,2084021);
 assert.ok(Math.abs(a.combinedReasons.reduce((sum,r)=>sum+r.share,0)-100)<1e-8);
 const rows=data.reasons.filter(r=>r.year===2025&&r.province_key==='IDN'),total=rows.reduce((sum,r)=>sum+Number(r.reason_count),0);
 assert.equal(a.combinedReasons[0].share,2084021/total*100);
});
test('regional brief covers every dashboard segment with exact CSV evidence',()=>{
 for(const row of data.regional){
  const result=regionalInsights(data,row.year,row.province_key);
  assert.deepEqual(result.insights.map(f=>f.id),['regional-status','regional-barriers','regional-labour','regional-scenario']);
  assert.equal(new Set(result.insights.map(f=>f.baselineYear)).size,1);
  for(const fact of result.insights){verifyEvidence(fact.evidence);assert.ok(sentenceCount(fact.text)<=1);assert.doesNotMatch(fact.title,/male|female/i);}
  assert.match(result.insights[0].text,/NEET rate/);assert.match(result.insights[2].text,/youth jobs|informal employment/);assert.match(result.insights[3].text,/coverage.*success/);
 }
});
test('policy actions rank two combined barrier populations, without gender-only selection',()=>{
 for(const row of data.regional){
  const result=regionalInsights(data,row.year,row.province_key),totals=new Map<string,number>();
  for(const reason of data.reasons.filter(r=>r.year===row.year&&r.province_key===row.province_key))totals.set(String(reason.reason_group),(totals.get(String(reason.reason_group))??0)+Number(reason.reason_count));
  const expected=[...totals.values()].sort((a,b)=>b-a).slice(0,2);
  assert.deepEqual(result.recommendations.map(r=>r.count),expected);
  for(const action of result.recommendations){
   assert.ok(action.text.includes(whole(action.count)));assert.equal(action.year,row.year);assert.equal(action.province,row.province_key);
   assert.doesNotMatch(action.text,/male|female|Monitor:/i);assert.ok(!('gender' in action));
   assert.ok(action.insightIds.includes('regional-barriers'));assert.ok(action.insightIds.every(id=>result.insights.some(f=>f.id===id)));
   verifyEvidence(action.evidence);assert.equal(action.evidence.reduce((sum,e)=>sum+e.value,0),action.count);
  }
 }
 const result=regionalInsights(data,2025,'IDN');assert.equal(result.recommendations[0].reason,'Waiting / considering options');assert.equal(result.recommendations[0].count,2084021);
});
test('policy priority responds to combined counts rather than a small high-share group',()=>{
 const changed={...data,reasons:data.reasons.map(row=>row.year===2025&&row.province_key==='IDN'&&row.reason_group==='Health / disability'?{...row,reason_count:20000000,share_within_gender_inactive_neet_pct:.1}:row)};
 const result=regionalInsights(changed,2025,'IDN');assert.equal(result.recommendations[0].reason,'Health / disability');assert.equal(result.recommendations[0].count,40000000);
});
test('each recorded barrier routes to its own specific policy action',()=>{
 const checks=[['Care responsibilities',/childcare|dependent-care/],['Discouraged / no suitable jobs',/vacancies and recruitment requirements/],['Waiting / considering options',/follow-ups/],['Health / disability',/health or disability services/],['Other',/individual interviews/]] as const;
 for(const [reason,action] of checks){
  const changed={...data,reasons:data.reasons.map(r=>r.year===2025&&r.province_key==='IDN'&&r.reason_group===reason?{...r,reason_count:100000000}:r)};
  const top=regionalInsights(changed,2025,'IDN').recommendations[0];assert.equal(top.reason,reason);assert.match(top.text,action);
 }
});
test('sector and quality changes update the employment finding without prescribing a placement sector',()=>{
 const original=regionalInsights(data,2025,'IDN');
 const changed={...data,sectors:data.sectors.map(r=>r.year===2025&&r.province_key==='IDN'?{...r,sector:String(r.sector)==='Manufacturing'?'New sector':r.sector,employed_youth_count:String(r.sector)==='Manufacturing'?100000000:r.employed_youth_count}:r),quality:data.quality.map(r=>r.year===2025&&r.province_key==='IDN'?{...r,informal_share_pct:99}:r)};
 const result=regionalInsights(changed,2025,'IDN');assert.match(result.insights.find(f=>f.kind==='labour')!.text,/New sector.*99.0%/);
 assert.deepEqual(result.recommendations,original.recommendations);for(const action of result.recommendations)assert.doesNotMatch(action.text,/Agriculture|Trade|Manufacturing/);
});
test('risk summary uses the reference model only in its available scope',()=>{
 assert.match(regionalInsights(data,2025,'IDN').insights[1].text,/model association/);
 for(const [year,province] of [[2024,'IDN'],[2025,'ID-14']] as const){const fact=regionalInsights(data,year,province).insights[1];assert.doesNotMatch(fact.text,/model association/);assert.ok(fact.evidence.every(e=>e.table!=='model'));}
});
test('live scenario finding and outcome share inputs and preserve zero/full endpoints',()=>{
 for(const row of data.regional){
  const defaults=scenarioDefaults(data,row.year,row.province_key),config=data.scenarios.find(r=>r.year===row.year&&r.province_key===row.province_key)!;
  assert.equal(defaults.coverage,config.coverage_pct_default);assert.equal(defaults.success,config.assumed_success_pct_default);
  const original=regionalInsights(data,row.year,row.province_key);
  for(const inputs of [{coverage:0,success:60},{coverage:100,success:100},{coverage:45,success:35}]){
   const result=regionalInsights(data,row.year,row.province_key,inputs),expected=scenario(row.neet_count,row.youth_population_15_24,inputs.coverage,inputs.success,row.neet_rate_pct);
   assert.deepEqual(result.scenarioResult,expected);assert.match(result.insights[3].text,new RegExp(`${inputs.coverage}% coverage and ${inputs.success}% success`));assert.ok(result.insights[3].text.includes(expected.rateAfter.toFixed(2)+'%'));
   assert.deepEqual(result.recommendations,original.recommendations);
  }
 }
});
test('regional comparison baseline respects current Papua Barat geography',()=>{
 assert.equal(regionalInsights(data,2024,'ID-92').baselineYear,2024);assert.equal(regionalInsights(data,2025,'ID-92').baselineYear,2024);
 assert.equal(regionalInsights(data,2025,'ID-14').baselineYear,2024);
});
test('risk-factor reference retains national 2025 availability instead of inventing provincial models',()=>{
 assert.equal(modelCoverage(data,2025,'IDN').available,true);assert.equal(modelCoverage(data,2025,'ID-14').available,false);assert.equal(modelCoverage(data,2024,'IDN').available,false);
});
test('shared inactive split remains accurately scoped in the underlying data',()=>{
 const s=inactiveNeetSummary(data,2025,'ID-13');assert.equal(s.scope,'Sumatera Barat · 2025');assert.equal(s.sharedAcrossRegions,true);assert.equal(s.share.toFixed(1),'73.8');
});


test('regional KPI changes reconcile with comparable source snapshots',()=>{
 for(const row of data.regional){
  const summary=regionalSummary(data,row.year,row.province_key);
  assert.equal(summary.current,row);
  if(!summary.previous){for(const change of Object.values(summary.changes))assert.equal(change.tone,'neutral');continue;}
  const previous=summary.previous;
  assert.equal(previous.province_key,row.province_key);assert.ok(previous.year<row.year);
  const pairs=[['rate','neet_rate_pct'],['inactive','inactive_neet_share_pct'],['employment','youth_employment_rate_pct']] as const;
  for(const [metric,field] of pairs){
   const raw=Number(row[field])-Number(previous[field]),difference=Math.abs(raw)<.005?0:raw;
   const amount=`${difference<0?'−':difference>0?'+':''}${Math.abs(difference).toFixed(2)} points`;
   assert.equal(summary.changes[metric].text,`${amount} vs ${previous.year}`);
  }
  assert.equal(summary.changes.inactive.tone,'neutral');
  assert.equal(summary.changes.count.tone,row.neet_count===previous.neet_count?'neutral':row.neet_count<previous.neet_count?'good':'bad');
 }
 const latest=regionalSummary(data,2025,'IDN');assert.equal(latest.changes.rate.text,'−0.87 points vs 2024');assert.equal(latest.changes.rate.tone,'good');assert.equal(latest.changes.count.text,'−400.1K vs 2024');
});
test('regional progression handles direction, small changes and boundary changes',()=>{
 const current=data.regional.find(row=>row.year===2025&&row.province_key==='IDN')!;
 const previous=data.regional.find(row=>row.year===2024&&row.province_key==='IDN')!;
 const modified={...data,regional:data.regional.map(row=>row===current?{...row,neet_rate_pct:previous.neet_rate_pct+1,neet_count:previous.neet_count+1000,youth_employment_rate_pct:previous.youth_employment_rate_pct+1,inactive_neet_share_pct:previous.inactive_neet_share_pct+5}:row)};
 const changes=regionalSummary(modified,2025,'IDN').changes;
 assert.equal(changes.rate.tone,'bad');assert.equal(changes.count.tone,'bad');assert.equal(changes.employment.tone,'good');assert.equal(changes.inactive.tone,'neutral');
 const small={...modified,regional:modified.regional.map(row=>row.year===2025&&row.province_key==='IDN'?{...row,youth_employment_rate_pct:previous.youth_employment_rate_pct-.1}:row)};
 assert.equal(regionalSummary(small,2025,'IDN').changes.employment.tone,'neutral');
 assert.equal(regionalSummary(data,2021,'IDN').changes.rate.text,'First year in this series');
 for(const province of ['ID-91','ID-92','ID-93']){assert.equal(regionalSummary(data,2024,province).previous,undefined);assert.equal(regionalSummary(data,2024,province).changes.rate.text,'No comparable previous year');}
 assert.equal(regionalSummary(data,2025,'ID-92').previous?.year,2024);
});
test('briefs and policy actions remain short, distinct and free of monitor rows',()=>{
 const words=(text:string)=>text.trim().split(/\s+/).length;
 for(const row of data.regional){
  for(const fact of nationalInsights(data,row.year,row.province_key)){assert.equal(sentenceCount(fact.text),1);assert.ok(words(fact.text)<=60);}
  const result=regionalInsights(data,row.year,row.province_key);
  for(const fact of result.insights){assert.equal(sentenceCount(fact.text),1,fact.text);assert.ok(words(fact.text)<=45,fact.text);assert.doesNotMatch(fact.text,/prioritise|should|recommend|Monitor:/i);}
  for(const action of result.recommendations){assert.equal(sentenceCount(action.text),1,action.text);assert.ok(words(action.text)<=35,action.text);assert.doesNotMatch(action.text,/illustrative|synthetic|assumption|Monitor:|expand career guidance|strengthen programmes/i);}
 }
});


test('compact source summaries retain two short sentences with matching CSV evidence',()=>{
 for(const row of data.regional)for(const page of ['national','regional'] as const){
  const findings=sidebarInsights(data,page,row.year,row.province_key);
  assert.equal(findings.length,2);assert.equal(findings.reduce((sum,f)=>sum+sentenceCount(f.text),0),2);
  for(const finding of findings){assert.ok(finding.text.trim().split(/\s+/).length<=30,finding.text);verifyEvidence(finding.evidence);assert.ok(finding.detail);}
  if(page==='regional'){assert.equal(findings[1].title,'Recommendation');assert.match(findings[1].text,/^Since /);assert.doesNotMatch(findings.map(f=>f.text).join(' '),/Policy actions|Monitor:/);}
 }
});
test('compact recommendation follows the largest combined barrier and remains tied to its data',()=>{
 const baseline=sidebarInsights(data,'regional',2025,'IDN');assert.match(baseline[1].text,/2.08M.*waiting/);assert.match(baseline[0].text,/73.8%.*56.1%/);
 const changed={...data,reasons:data.reasons.map(row=>row.year===2025&&row.province_key==='IDN'&&row.reason_group==='Care responsibilities'?{...row,reason_count:20000000}:row),quality:data.quality.map(row=>row.year===2025&&row.province_key==='IDN'?{...row,informal_share_pct:80}:row)};
 const revised=sidebarInsights(changed,'regional',2025,'IDN');assert.match(revised[1].text,/40.00M.*care responsibilities.*childcare/);assert.match(revised[0].text,/80.0%/);
});

test('connected sidebar narratives have two sentences and verified evidence for every selection',()=>{
 for(const row of data.regional)for(const page of ['national','regional'] as const){
  const narrative=sidebarNarrative(data,page,row.year,row.province_key);
  assert.equal(sentenceCount(narrative.text),2,narrative.text);
  assert.ok(narrative.text.trim().split(/\s+/).length<=60,narrative.text);
  assert.doesNotMatch(narrative.text,/Policy actions|Monitor:|illustrative|synthetic|assumption/i);
  verifyEvidence(narrative.evidence);assert.ok(narrative.detail);
  assert.equal(narrative.baselineYear,page==='regional'?regionalInsights(data,row.year,row.province_key).baselineYear:nationalInsights(data,row.year,row.province_key)[0].baselineYear);
 }
});

test('national narrative connects the trend with ranked context and respects small changes',()=>{
 const initial=sidebarNarrative(data,'national',2025,'IDN');
 assert.match(initial.text,/19.44%.*down 0.87 points from 2024.*education gap.*9.57%.*47.71%/);
 const previous=data.kpis.find(row=>row.year===2024)!;
 const changed={...data,kpis:data.kpis.map(row=>row.year===2025?{...row,national_neet_rate_pct:previous.national_neet_rate_pct+0.2,female_neet_rate_pct:90,male_neet_rate_pct:5}:row)};
 const revised=sidebarNarrative(changed,'national',2025,'IDN');
 assert.match(revised.text,/little changed from 2024/);assert.match(revised.text,/female and male.*90.00% and 5.00%/);
 assert.match(sidebarNarrative(data,'national',2025,'ID-33').text,/Jawa Tengah/);
});

test('regional narrative links distinct populations to a barrier-matched action',()=>{
 const initial=sidebarNarrative(data,'regional',2025,'IDN');
 assert.match(initial.text,/73.8%.*56.1%.*Since 2.08M.*waiting.*follow-ups/);
 const changed={...data,regional:data.regional.map(row=>row.year===2025&&row.province_key==='IDN'?{...row,inactive_neet_share_pct:40}:row),reasons:data.reasons.map(row=>row.year===2025&&row.province_key==='IDN'&&row.reason_group==='Care responsibilities'?{...row,reason_count:20000000}:row),quality:data.quality.map(row=>row.year===2025&&row.province_key==='IDN'?{...row,informal_share_pct:80}:row)};
 const revised=sidebarNarrative(changed,'regional',2025,'IDN');
 assert.doesNotMatch(revised.text,/Most NEET/);assert.match(revised.text,/40.0%.*80.0%.*40.00M.*care responsibilities.*childcare/);
});

const forbiddenInsight=/this suggests|this comparison suggests|highlights the need|use local evidence|decide which groups need support|targeted interventions|further analysis is needed|stakeholders|barriers and service reach|policymakers should consider|remains a challenge|little changed|relatively|somewhat/i;

test('specific insight contract holds for all region-year combinations on both pages',()=>{
 for(const page of ['national','regional'] as const){
  const unique=new Set<string>();
  for(const row of data.regional){
   const input=buildInsightPanelInput(data,page,row.year,row.province_key),panel=generateInsightPanel(input);
   assert.deepEqual(Object.keys(panel),['context','tone','highlight','highlight_label','highlight_change','paragraph','next_step']);
   assert.equal(panel.context,`${row.province_name} · ${row.year}`);assert.equal(panel.highlight,input.rate?.display);assert.equal(panel.highlight_change,input.change?.text??null);
   assert.equal(sentenceCount(panel.paragraph),2,panel.paragraph);
   const words=panel.paragraph.split(/\s+/).length;assert.ok(words>=30&&words<=45,`${words}: ${panel.paragraph}`);
   const numbers=panel.paragraph.match(/\d+(?:\.\d+)?/g)??[];assert.ok(numbers.length<=3,panel.paragraph);assert.ok(!numbers.some(value=>Number(value)===Number.parseFloat(panel.highlight)),panel.paragraph);
   assert.doesNotMatch(panel.paragraph,forbiddenInsight);assert.doesNotMatch(panel.paragraph,/[()\n*•]|odds ratio|confidence interval|decomposition|caused by|Monitor:/i);
   const sentences=panel.paragraph.split(/(?<=[.!?])\s+/);for(const sentence of sentences)assert.match(sentence,/\d/);assert.doesNotMatch(sentences[1],/should|suggest|assess|schedule|review|support/i);
   if(panel.next_step){assert.equal(sentenceCount(panel.next_step),1);assert.ok(panel.next_step.split(/\s+/).length<=12,panel.next_step);}
   unique.add(panel.paragraph);
  }
  assert.equal(unique.size,data.regional.length,'Each province/year must retain its own concrete facts');
 }
});

test('insight adapter aligns rate and exact calendar-year delta with each chart source',()=>{
 for(const row of data.regional)for(const page of ['national','regional'] as const){
  const input=buildInsightPanelInput(data,page,row.year,row.province_key);
  const official=row.province_key==='IDN'?data.kpis.find(r=>r.year===row.year)!.national_neet_rate_pct:data.provinces.find(r=>r.year===row.year&&r.province_key===row.province_key)!.neet_rate_pct;
  assert.equal(input.rate?.value,page==='regional'?row.neet_rate_pct:official);
  if(input.change){
   const prev=page==='regional'?data.regional.find(r=>r.year===row.year-1&&r.province_key===row.province_key):row.province_key==='IDN'?data.kpis.find(r=>r.year===row.year-1):data.provinces.find(r=>r.year===row.year-1&&r.province_key===row.province_key);
   assert.ok(prev);const prior=page==='national'&&row.province_key==='IDN'?Number(prev.national_neet_rate_pct):prev.neet_rate_pct;
   assert.ok(Math.abs(input.change.points-((input.rate?.value??0)-prior))<1e-8);
  }
  if(input.national_gap)assert.ok(Math.abs(input.national_gap.points-((input.rate?.value??0)-data.kpis.find(r=>r.year===row.year)!.national_neet_rate_pct))<1e-8);
  for(const fact of input.facts){assert.equal(fact.province,row.province_name);assert.equal(fact.year,row.year);verifyEvidence(fact.evidence);}
 }
 for(const page of ['national','regional'] as const){assert.equal(insightPanel(data,page,2021,'IDN').highlight_change,null);assert.equal(insightPanel(data,page,2024,'ID-92').highlight_change,null);}
});

test('small changes stay numerical and tone boundaries remain exact',()=>{
 const input=buildInsightPanelInput(data,'regional',2025,'IDN');
 for(const [points,tone] of [[-.5,'positive'],[.5,'warning'],[-.49,'neutral'],[.49,'neutral'],[0,'neutral']] as const){const panel=generateInsightPanel({...input,change:{points,text:`${points} points vs 2024`,magnitude:Math.abs(points).toFixed(2)}});assert.equal(panel.tone,tone);assert.match(panel.paragraph,new RegExp(Math.abs(points).toFixed(2).replace('.','\\.')+' points'));}
 const first=generateInsightPanel({...input,change:null});assert.equal(first.tone,'neutral');assert.equal(first.highlight_change,null);assert.doesNotMatch(first.paragraph,/fell|rose|changed/);
 const eastJava=insightPanel(data,'regional',2025,'ID-35');assert.match(eastJava.paragraph,/fell 0.26 points/);assert.match(eastJava.paragraph,/2.68 points below Indonesia/);assert.equal(eastJava.tone,'neutral');
});

test('gender reason differences use the selected province and year percentages',()=>{
 const input=buildInsightPanelInput(data,'regional',2025,'ID-35'),fact=input.facts.find(f=>f.kind==='reason_gap')!;
 const rows=data.reasons.filter(r=>r.year===2025&&r.province_key==='ID-35'&&r.reason_group==='Care responsibilities');
 const gap=Math.abs(Number(rows[0].share_within_gender_inactive_neet_pct)-Number(rows[1].share_within_gender_inactive_neet_pct));
 assert.match(fact.text,new RegExp(gap.toFixed(1).replace('.','\\.')));assert.match(fact.text,/care responsibilities/);
 assert.ok(fact.evidence.every(e=>e.match.province_key==='ID-35'&&e.match.year===2025));
 assert.notEqual(fact.text,buildInsightPanelInput(data,'regional',2024,'ID-35').facts.find(f=>f.kind==='reason_gap')?.text);
});

test('missing provincial diagnostics produce one sentence without importing national facts',()=>{
 const key='ID-35',withoutLocal={...data,reasons:data.reasons.filter(r=>r.province_key!==key),quality:data.quality.filter(r=>r.province_key!==key),sectors:data.sectors.filter(r=>r.province_key!==key),scenarios:data.scenarios.filter(r=>r.province_key!==key)};
 const input=buildInsightPanelInput(withoutLocal,'regional',2025,key),panel=generateInsightPanel(input);
 assert.equal(input.facts.length,0);assert.equal(sentenceCount(panel.paragraph),1);assert.equal(panel.next_step,null);assert.doesNotMatch(panel.paragraph,/care responsibilities|73.8|low education|national reference/i);assert.match(panel.paragraph,/Jawa Timur/);
 const sparse=generateInsightPanel({filters:{year:2025,province:'Example'},rate:null,change:null,national_gap:null,inactive_share:null,facts:[]});assert.equal(sparse.paragraph,'');assert.equal(sparse.highlight_change,null);assert.equal(sparse.next_step,null);
});

test('fact priority responds to source values and respects missing or invalid model estimates',()=>{
 const input=buildInsightPanelInput(data,'regional',2025,'ID-35');
 assert.equal(input.facts[0].kind,'reason_gap');assert.match(generateInsightPanel(input).paragraph,/care responsibilities/);
 const flatReasons={...data,reasons:data.reasons.map(r=>r.year===2025&&r.province_key==='ID-35'?{...r,share_within_gender_inactive_neet_pct:20}:r)};
 assert.equal(buildInsightPanelInput(flatReasons,'regional',2025,'ID-35').facts[0].kind,'reason');
 const noReasons={...data,reasons:[]};assert.equal(buildInsightPanelInput(noReasons,'regional',2025,'ID-35').facts[0].kind,'informal');
 const noQuality={...noReasons,quality:[]};assert.equal(buildInsightPanelInput(noQuality,'regional',2025,'ID-35').facts[0].kind,'sector');
 const fitted={...noReasons,model:data.model.map(r=>({...r,data_status:'ESTIMATED'}))};assert.equal(buildInsightPanelInput(fitted,'regional',2025,'IDN').facts[0].kind,'risk');assert.ok(!buildInsightPanelInput(fitted,'regional',2025,'ID-35').facts.some(f=>f.kind==='risk'));
 assert.ok(!buildInsightPanelInput(noReasons,'regional',2025,'IDN').facts.some(f=>f.kind==='risk'),'Synthetic placeholder intervals cannot establish significance');
 const crossing={...fitted,model:fitted.model.map(r=>({...r,ci_lower_95:.5,ci_upper_95:2}))};assert.ok(!buildInsightPanelInput(crossing,'regional',2025,'IDN').facts.some(f=>f.kind==='risk'));
});

test('scenario is a scoped fallback and uses the shared live result',()=>{
 const fallback={...data,reasons:[],quality:[],sectors:[]};
 const input=buildInsightPanelInput(fallback,'regional',2025,'ID-35',{coverage:60,success:60});
 assert.equal(input.facts[0].kind,'scenario');assert.match(generateInsightPanel(input).paragraph,/potential transitions/);
 const national=buildInsightPanelInput(fallback,'regional',2025,'IDN',{coverage:60,success:60});assert.match(generateInsightPanel(national).paragraph,/3.10M/);
 assert.ok(!buildInsightPanelInput(fallback,'regional',2025,'IDN',{coverage:0,success:60}).facts.some(f=>f.kind==='scenario'));
 assert.doesNotMatch(insightPanel(data,'regional',2025,'IDN',{coverage:60,success:60}).paragraph,/potential transitions/,'Higher-priority reason facts stay selected');
});
