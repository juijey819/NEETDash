import { byYear, byGeo, selectKpi, selectMap, selectRegional, scenario, type DataSet, type KpiRow } from './data';

export const officialCount = (v: string | number | undefined): number | undefined => typeof v === 'number' && Number.isFinite(v) ? v : undefined;
export const compactCount = (v: number, digits = 1) => v >= 1e6 ? `${(v/1e6).toFixed(digits)}M` : v >= 1e3 ? `${(v/1e3).toFixed(digits)}K` : Math.round(v).toLocaleString('en-US');
export const signed = (v: number, digits=2) => `${v<0?'−':v>0?'+':''}${Math.abs(v).toFixed(digits)}`;
export interface Change { text: string; tone: 'good'|'bad'|'neutral' }
export function nationalSummary(data:DataSet,year:number) {
  const current=selectKpi(data,year),previous=data.kpis.find(r=>r.year===year-1);
  const provinces=selectMap(data,year),above=provinces.filter(r=>r.neet_rate_pct>current.national_neet_rate_pct).length;
  const population=officialCount(current.youth_population_15_24),count=officialCount(current.neet_count);
  const prevPop=officialCount(previous?.youth_population_15_24),prevCount=officialCount(previous?.neet_count);
  const delta=(a:number|undefined,b:number|undefined,unit:'pp'|'count',lowerBetter:boolean):Change=>{
    if(a===undefined)return{text:'Official count unavailable',tone:'neutral'};
    if(b===undefined)return{text:previous?'No comparable previous count':'First year in this series',tone:'neutral'};
    const d=a-b;return{text:`${unit==='pp'?signed(d)+' pp':(d<0?'−':d>0?'+':'')+compactCount(Math.abs(d))} vs ${year-1}`,tone:d===0||!lowerBetter?'neutral':d<0?'good':'bad'};
  };
  let aboveChange:Change={text:`${provinces.length}-province geography`,tone:'neutral'};
  if(previous&&previous.geography_version===current.geography_version){const prevAbove=selectMap(data,year-1).filter(r=>r.neet_rate_pct>previous.national_neet_rate_pct).length;aboveChange={text:`${signed(above-prevAbove,0)} provinces vs ${year-1}`,tone:'neutral'};}
  if(previous&&previous.geography_version!==current.geography_version)aboveChange={text:'Geography changed from 34 to 38',tone:'neutral'};
  return {current,previous,population,count,above,total:provinces.length,changes:{rate:delta(current.national_neet_rate_pct,previous?.national_neet_rate_pct,'pp',true),count:delta(count,prevCount,'count',true),population:delta(population,prevPop,'count',false),above:aboveChange}};
}

export const MATERIAL_CHANGE = 0.5;
export const isMaterialChange=(value:number)=>Math.abs(value)>=MATERIAL_CHANGE-1e-9;
const n=(value:number)=>value.toFixed(2);
const people=(value:number)=>Math.round(value).toLocaleString('en-US');
const changeNumber=(value:number)=>`${value<0?'−':value>0?'+':''}${!isMaterialChange(value)&&Number(n(Math.abs(value)))>=MATERIAL_CHANGE?String(Math.abs(value)):n(Math.abs(value))}`;
export type InsightKind='trend'|'gender'|'residence'|'education'|'geography'|'reason'|'labour'|'scenario';
export interface EvidenceValue {table:keyof DataSet;match:Record<string,string|number>;field:string;value:number}
export interface Insight {id:string;kind:InsightKind;title:string;text:string;baselineYear:number;score:number;evidence:EvidenceValue[];detail?:string}
export interface Recommendation {id:string;insightIds:string[];title:string;text:string;count:number;reason:string;year:number;province:string;evidence:EvidenceValue[]}
export interface ScenarioInputs {coverage:number;success:number}
export function scenarioDefaults(data:DataSet,year:number,province:string):ScenarioInputs {
 const row=byGeo(data.scenarios,year,province)[0];
 return {coverage:Number(row.coverage_pct_default),success:Number(row.assumed_success_pct_default)};
}
const proof=(table:keyof DataSet,match:Record<string,string|number>,field:string,value:number):EvidenceValue=>({table,match,field,value});
export const comparableGeography=(a:{province_key:string;[key:string]:unknown},b:{province_key:string;[key:string]:unknown})=>a.province_key===b.province_key&&(!['ID-91','ID-92','ID-93','ID-94','ID-95','ID-96','PAPUA_HIST'].includes(a.province_key)||a.geography_version===b.geography_version);
function baselineYear(rows:{year:number}[],year:number){
 const previous=rows.filter(r=>r.year<year).sort((a,b)=>b.year-a.year);
 return previous[0]?.year??year;
}
export function regionalSummary(data:DataSet,year:number,province:string) {
 const current=selectRegional(data,year,province);
 const previous=data.regional.filter(row=>row.year<year&&comparableGeography(current,row)).sort((a,b)=>b.year-a.year)[0];
 const delta=(field:'neet_rate_pct'|'neet_count'|'inactive_neet_share_pct'|'youth_employment_rate_pct',direction:'lower'|'higher'|'neutral'):Change=>{
  if(!previous)return {text:year===Math.min(...data.regional.map(row=>row.year))?'First year in this series':'No comparable previous year',tone:'neutral'};
  const count=field==='neet_count',raw=Number(current[field])-Number(previous[field]);
  const difference=count?raw:Math.abs(raw)<.005?0:raw;
  const amount=count?`${difference<0?'−':difference>0?'+':''}${compactCount(Math.abs(difference))}`:`${signed(difference)} points`;
  const neutral=direction==='neutral'||difference===0||!count&&!isMaterialChange(difference);
  return {text:`${amount} vs ${previous.year}`,tone:neutral?'neutral':(direction==='lower'?difference<0:difference>0)?'good':'bad'};
 };
 return {current,previous,changes:{rate:delta('neet_rate_pct','lower'),count:delta('neet_count','lower'),inactive:delta('inactive_neet_share_pct','neutral'),employment:delta('youth_employment_rate_pct','higher')}};
}
export function changeSentence(delta:number,baseline:number,year:number,subject='The rate') {
 if(baseline===year)return `${year} is the comparison baseline.`;
 if(!isMaterialChange(delta))return `${subject} was little changed from ${baseline} (${changeNumber(delta)} points).`;
 return `${subject} ${delta<0?'fell':'rose'} ${n(Math.abs(delta))} percentage points from ${baseline}.`;
}
export function gapSentence(delta:number,baseline:number,year:number,subject='The gap') {
 if(baseline===year)return `${year} is the comparison baseline.`;
 if(!isMaterialChange(delta))return `${subject} was little changed from ${baseline} (${changeNumber(delta)} points).`;
 return `${subject} ${delta<0?'narrowed':'widened'} ${n(Math.abs(delta))} percentage points from ${baseline}.`;
}
function changeContext(delta:number,baseline:number,year:number,gap=false) {
 if(baseline===year)return `baseline ${year}`;
 if(!isMaterialChange(delta))return `little changed from ${baseline} (${changeNumber(delta)} points)`;
 return gap?`${delta<0?'narrower':'wider'} by ${n(Math.abs(delta))} points than ${baseline}`:`${delta<0?'down':'up'} ${n(Math.abs(delta))} points from ${baseline}`;
}
export function rankInsights(insights:Insight[],limit=4){return [...insights].sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id)).slice(0,limit);}
export const educationNames:Record<string,string>={'Tidak Sekolah':'no schooling','Tidak Tamat SD/MI':'incomplete primary education','SD':'primary education','SMP':'junior secondary education','SMA Umum':'general secondary education','SMA Kejuruan':'vocational secondary education','Diploma I/II/III':'a diploma','Universitas':'university education'};
export function nationalInsightCandidates(data:DataSet,year:number,province:string):Insight[] {
 const current=selectKpi(data,year),baseline=baselineYear(data.kpis,year),previous=selectKpi(data,baseline);
 const history=data.kpis.filter(r=>r.year<=year).sort((a,b)=>a.year-b.year),rates=history.map(r=>r.national_neet_rate_pct);
 const low=Math.min(...rates),high=Math.max(...rates),delta=current.national_neet_rate_pct-previous.national_neet_rate_pct;
 let streak=0;for(let i=history.length-1;i>0;i--){if(history[i].national_neet_rate_pct<history[i-1].national_neet_rate_pct)streak++;else break;}
 const record=history.length>1&&(current.national_neet_rate_pct===low||current.national_neet_rate_pct===high);
 const candidates:Insight[]=[{id:'national-trajectory',kind:'trend',baselineYear:baseline,score:(record?15:6)+Math.abs(delta)*2+streak*2,
  title:record?`${current.national_neet_rate_pct===low?'Lowest':'Highest'} rate since ${history[0].year}`:streak>1?`${streak} consecutive annual declines`:'National rate in context',
  text:`Indonesia’s ${year} NEET rate is ${n(current.national_neet_rate_pct)}%, ${changeContext(delta,baseline,year)}; the ${history[0].year}–${year} range is ${n(low)}%–${n(high)}%${streak>1?`, with ${streak} consecutive annual declines`:''}.`,
  evidence:history.map(r=>proof('kpis',{year:r.year},'national_neet_rate_pct',r.national_neet_rate_pct))}];
 for(const group of [{id:'gender',kind:'gender',a:'female_neet_rate_pct',b:'male_neet_rate_pct',an:'Female',bn:'male',name:'Gender'},{id:'residence',kind:'residence',a:'rural_neet_rate_pct',b:'urban_neet_rate_pct',an:'Rural',bn:'urban',name:'Rural–urban'}] as const){
  const a=Number(current[group.a]),b=Number(current[group.b]),gap=Math.abs(a-b),oldGap=Math.abs(Number(previous[group.a])-Number(previous[group.b])),gapDelta=gap-oldGap;
  candidates.push({id:`${group.id}-gap`,kind:group.kind,baselineYear:baseline,score:gap+Math.abs(gapDelta)*2,
   title:baseline===year?`${group.name} rate gap`:!isMaterialChange(gapDelta)?`${group.name} gap little changed`:`${group.name} gap ${gapDelta<0?'narrows':'widens'}`,
   text:`${year} NEET rates: ${group.an.toLowerCase()} ${n(a)}%, ${group.bn} ${n(b)}% (${n(gap)}-point gap); the gap is ${changeContext(gapDelta,baseline,year,true)}.`,
   evidence:[current,previous].flatMap(r=>[proof('kpis',{year:r.year},group.a,Number(r[group.a])),proof('kpis',{year:r.year},group.b,Number(r[group.b]))])});
 }
 const education=byYear(data.education,year).filter(r=>educationNames[String(r.subgroup)]).sort((a,b)=>b.neet_rate_pct-a.neet_rate_pct),top=education[0],bottom=education.at(-1)!;
 const oldTop=data.education.find(r=>r.year===baseline&&r.subgroup===top.subgroup)!;
 const eduGap=top.neet_rate_pct-bottom.neet_rate_pct,eduDelta=top.neet_rate_pct-oldTop.neet_rate_pct;
 candidates.push({id:'education-range',kind:'education',baselineYear:baseline,score:eduGap+Math.abs(eduDelta)*2,
  title:`Highest rate: ${educationNames[String(top.subgroup)]}`,
  text:`The ${year} NEET rate for youth with ${educationNames[String(top.subgroup)]} is ${n(top.neet_rate_pct)}% (${changeContext(eduDelta,baseline,year)}), versus ${n(bottom.neet_rate_pct)}% for ${educationNames[String(bottom.subgroup)]} — a ${n(eduGap)}-point gap.`,
  evidence:[top,bottom,oldTop].map(r=>proof('education',{year:r.year,subgroup:String(r.subgroup)},'neet_rate_pct',r.neet_rate_pct))});
 const uni=education.find(r=>r.subgroup==='Universitas')!,secondary=education.find(r=>r.subgroup==='SMA Umum')!,oldUni=data.education.find(r=>r.year===baseline&&r.subgroup===uni.subgroup)!;
 candidates.push({id:'graduate-comparison',kind:'education',baselineYear:baseline,score:Math.abs(uni.neet_rate_pct-secondary.neet_rate_pct)+Math.abs(uni.neet_rate_pct-oldUni.neet_rate_pct)*2,
  title:'Graduate and secondary rates differ',text:`The ${year} university-graduate NEET rate is ${n(uni.neet_rate_pct)}% (${changeContext(uni.neet_rate_pct-oldUni.neet_rate_pct,baseline,year)}), ${n(Math.abs(uni.neet_rate_pct-secondary.neet_rate_pct))} points ${uni.neet_rate_pct>=secondary.neet_rate_pct?'above':'below'} general-secondary graduates (${n(secondary.neet_rate_pct)}%).`,
  evidence:[uni,secondary,oldUni].map(r=>proof('education',{year:r.year,subgroup:String(r.subgroup)},'neet_rate_pct',r.neet_rate_pct))});
 const provinces=selectMap(data,year),oldProvinces=selectMap(data,baseline);
 if(current.geography_version===previous.geography_version){
  const sorted=[...provinces].sort((a,b)=>b.neet_rate_pct-a.neet_rate_pct),max=sorted[0],min=sorted.at(-1)!,spread=max.neet_rate_pct-min.neet_rate_pct,oldSpread=Math.max(...oldProvinces.map(r=>r.neet_rate_pct))-Math.min(...oldProvinces.map(r=>r.neet_rate_pct));
  candidates.push({id:'province-range',kind:'geography',baselineYear:baseline,score:spread+Math.abs(spread-oldSpread),title:'Highest and lowest provincial rates',
   text:`${year} provincial NEET rates span ${n(min.neet_rate_pct)}% in ${min.province_name} to ${n(max.neet_rate_pct)}% in ${max.province_name} (${n(spread)}-point spread); the spread is ${changeContext(spread-oldSpread,baseline,year,true)}.`,
   evidence:[...provinces,...oldProvinces].map(r=>proof('provinces',{year:r.year,province_key:r.province_key},'neet_rate_pct',r.neet_rate_pct))});
 }
 const selected=provinces.find(r=>r.province_key===province),oldSelected=oldProvinces.find(r=>r.province_key===province);
 if(selected&&oldSelected&&comparableGeography(selected,oldSelected)){
  const d=selected.neet_rate_pct-oldSelected.neet_rate_pct,gap=selected.neet_rate_pct-current.national_neet_rate_pct;
  candidates.push({id:'selected-province',kind:'geography',baselineYear:baseline,score:45+Math.abs(gap)+Math.abs(d)*2,title:`${selected.province_name}: rate and national gap`,
   text:`${selected.province_name}’s ${year} NEET rate is ${n(selected.neet_rate_pct)}% (${changeContext(d,baseline,year)}), ${n(Math.abs(gap))} points ${gap>=0?'above':'below'} Indonesia (${n(current.national_neet_rate_pct)}%).`,
   evidence:[selected,oldSelected].map(r=>proof('provinces',{year:r.year,province_key:r.province_key},'neet_rate_pct',r.neet_rate_pct)).concat(proof('kpis',{year},'national_neet_rate_pct',current.national_neet_rate_pct))});
 }
 return candidates;
}
export function nationalInsights(data:DataSet,year:number,province:string){return rankInsights(nationalInsightCandidates(data,year,province));}
export function genderGapSummary(data:DataSet,year:number){
 const row=selectKpi(data,year),baseline=baselineYear(data.kpis,year),old=selectKpi(data,baseline),gap=row.female_neet_rate_pct-row.male_neet_rate_pct,delta=gap-(old.female_neet_rate_pct-old.male_neet_rate_pct);
 const change:Change={text:baseline===year?'First year in this series':isMaterialChange(delta)?`${delta<0?'−':'+'}${n(Math.abs(delta))} points vs ${baseline}`:`Little changed vs ${baseline}`,tone:baseline===year||!isMaterialChange(delta)?'neutral':Math.abs(gap)<Math.abs(old.female_neet_rate_pct-old.male_neet_rate_pct)?'good':'bad'};
 return {gap,delta,baseline,change};
}
export function rateChange(current:KpiRow,previous:KpiRow|undefined){return previous?current.national_neet_rate_pct-previous.national_neet_rate_pct:undefined;}
export function modelCoverage(data:DataSet,year:number,province:string){const scope=String(data.model[0]?.scope||''),referenceYear=Number(scope.match(/\d{4}/)?.[0]);return {available:province==='IDN'&&year===referenceYear,scope,referenceYear};}
export function inactiveNeetSummary(data:DataSet,year:number,province:string){const row=selectRegional(data,year,province),shares=new Set(byYear(data.regional,year).map(r=>r.inactive_neet_share_pct.toFixed(1)));return {scope:`${row.province_name} · ${year}`,share:row.inactive_neet_share_pct,sharedAcrossRegions:shares.size===1&&byYear(data.regional,year).length>1};}

export const barrierResponses:Record<string,{title:string;target:string;action:string}>={
 'Care responsibilities':{title:'Arrange care support',target:'with care responsibilities',action:'offer childcare or dependent-care assessments alongside work/learning appointments.'},
 'Discouraged / no suitable jobs':{title:'Review reachable vacancies',target:'discouraged or without suitable jobs',action:'audit reachable vacancies and recruitment requirements before referrals.'},
 'Waiting / considering options':{title:'Follow up waiting cases',target:'waiting or considering options',action:'schedule follow-ups to distinguish pending offers from undecided next steps.'},
 'Health / disability':{title:'Assess access and support needs',target:'with health/disability barriers',action:'assess accessibility needs with health or disability services.'},
 'Other':{title:'Identify the specific barrier',target:'citing other reasons',action:'use individual interviews to identify barriers before assigning services.'}
};
export function regionalInsights(data:DataSet,year:number,province:string,parameters?:ScenarioInputs){
 const {current,previous}=regionalSummary(data,year,province),baseline=previous?.year??year;
 const match={year,province_key:province};
 const regionalProof=(field:string,row=current)=>proof('regional',{year:row.year,province_key:province},field,Number(row[field]));
 const reasons=byGeo(data.reasons,year,province),oldReasons=byGeo(data.reasons,baseline,province);
 const aggregate=(rows:typeof reasons)=>{
  const counts=new Map<string,number>();for(const row of rows)counts.set(String(row.reason_group),(counts.get(String(row.reason_group))??0)+Number(row.reason_count));
  const total=[...counts.values()].reduce((a,b)=>a+b,0);
  return [...counts].map(([name,count])=>({name,count,share:count/total*100})).sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name));
 };
 const combinedReasons=aggregate(reasons),oldCombined=aggregate(oldReasons),leading=combinedReasons[0];
 const reasonProofs=reasons.map(row=>proof('reasons',{...match,gender:String(row.gender),reason_group:String(row.reason_group)},'reason_count',Number(row.reason_count)));
 const modelAvailable=modelCoverage(data,year,province).available;
 const strongest=modelAvailable?[...data.model].sort((a,b)=>Math.abs(Math.log(b.adjusted_odds_ratio))-Math.abs(Math.log(a.adjusted_odds_ratio))||a.factor.localeCompare(b.factor))[0]:undefined;
 const quality=byGeo(data.quality,year,province)[0],oldQuality=byGeo(data.quality,baseline,province)[0];
 const sectors=byGeo(data.sectors,year,province).sort((a,b)=>Number(b.employed_youth_count)-Number(a.employed_youth_count));
 const topSectors=sectors.slice(0,2),sectorShare=topSectors.reduce((sum,row)=>sum+Number(row.share_of_employed_youth_pct),0);
 const scenarioInputs=parameters??scenarioDefaults(data,year,province);
 const result=scenario(current.neet_count,current.youth_population_15_24,scenarioInputs.coverage,scenarioInputs.success,current.neet_rate_pct);
 const status:Insight={id:'regional-status',kind:'trend',title:'NEET & transitions',baselineYear:baseline,score:current.neet_count,
  text:`NEET rate is ${n(current.neet_rate_pct)}% (${changeContext(current.neet_rate_pct-(previous?.neet_rate_pct??current.neet_rate_pct),baseline,year)}); ${current.inactive_neet_share_pct.toFixed(1)}% of NEET youth are inactive (${compactCount(current.inactive_neet_count)} people).`,
  detail:`${current.province_name}, ${year}: ${people(current.neet_count)} NEET youth, including ${people(current.inactive_neet_count)} inactive and ${people(current.neet_unemployed_count)} unemployed youth; ${people(current.employed_count)} employed and ${people(current.education_training_nonemployed_count)} in education/training without employment.`,
  evidence:[regionalProof('neet_rate_pct'),regionalProof('neet_count'),regionalProof('inactive_neet_share_pct'),regionalProof('inactive_neet_count'),regionalProof('neet_unemployed_count'),regionalProof('employed_count'),regionalProof('education_training_nonemployed_count'),...(previous?[regionalProof('neet_rate_pct',previous)]:[])]};
 const barrier:Insight={id:'regional-barriers',kind:'reason',title:'Risks & barriers',baselineYear:baseline,score:leading.count,
  text:strongest?`Strongest model association: ${strongest.factor.toLowerCase()}; largest inactive-NEET category: ${leading.name.toLowerCase()} (${leading.share.toFixed(1)}%, ${compactCount(leading.count)} people).`:`${leading.name} is the largest inactive-NEET category (${leading.share.toFixed(1)}%, ${compactCount(leading.count)} people), ${changeContext(leading.share-oldCombined.find(row=>row.name===leading.name)!.share,baseline,year)}.`,
  detail:combinedReasons.map(row=>`${row.name}: ${people(row.count)} people, ${row.share.toFixed(1)}% of inactive NEET.`).join(' ')+(strongest?` National ${year} model: ${strongest.factor}, adjusted odds ratio ${strongest.adjusted_odds_ratio.toFixed(2)}, 95% interval ${strongest.ci_lower_95}–${strongest.ci_upper_95}.`:''),
  evidence:[...reasonProofs,...oldReasons.map(row=>proof('reasons',{year:baseline,province_key:province,gender:String(row.gender),reason_group:String(row.reason_group)},'reason_count',Number(row.reason_count))),...(strongest?['adjusted_odds_ratio','ci_lower_95','ci_upper_95'].map(field=>proof('model',{factor:strongest.factor},field,Number(strongest[field]))):[])]};
 const labour:Insight={id:'regional-labour',kind:'labour',title:'Jobs & job quality',baselineYear:baseline,score:current.employed_count,
  text:`${topSectors.map(row=>row.sector).join(' and ')} account for ${sectorShare.toFixed(1)}% of youth jobs; informal employment is ${Number(quality.informal_share_pct).toFixed(1)}% (${changeContext(Number(quality.informal_share_pct)-Number(oldQuality.informal_share_pct),baseline,year)}).`,
  detail:`${current.province_name}, ${year}: the two largest sectors employ ${people(topSectors.reduce((sum,row)=>sum+Number(row.employed_youth_count),0))} youth; short-hours share is ${Number(quality.short_hours_share_pct).toFixed(1)}% of employed youth, and median monthly earnings are Rp ${people(Number(quality.median_monthly_earnings_idr))} among wage employees.`,
  evidence:[...topSectors.flatMap(row=>['employed_youth_count','share_of_employed_youth_pct'].map(field=>proof('sectors',{...match,sector:String(row.sector)},field,Number(row[field])))),...['informal_share_pct','short_hours_share_pct','median_monthly_earnings_idr'].map(field=>proof('quality',match,field,Number(quality[field]))),proof('quality',{...match,year:baseline},'informal_share_pct',Number(oldQuality.informal_share_pct))]};
 const simulation:Insight={id:'regional-scenario',kind:'scenario',title:'What-if scenario',baselineYear:baseline,score:result.transitions,
  text:`${scenarioInputs.coverage}% coverage and ${scenarioInputs.success}% success give ${compactCount(result.transitions,2)} transitions and a ${n(result.rateAfter)}% NEET rate, from ${n(current.neet_rate_pct)}%.`,
  detail:`The selected inputs reach ${people(current.neet_count*scenarioInputs.coverage/100)} of ${people(current.neet_count)} NEET youth; the reduction is ${result.reductionPct.toFixed(1)}% of the initial NEET count.`,
  evidence:[regionalProof('neet_count'),regionalProof('youth_population_15_24'),regionalProof('neet_rate_pct'),...(!parameters?['coverage_pct_default','assumed_success_pct_default'].map(field=>proof('scenarios',match,field,Number(byGeo(data.scenarios,year,province)[0][field]))):[])]};
 const insights=[status,barrier,labour,simulation];
 const recommendations:Recommendation[]=combinedReasons.filter(row=>row.count>0&&barrierResponses[row.name]).slice(0,2).map(row=>{
  const response=barrierResponses[row.name];
  return {id:`action-${province}-${year}-${row.name}`,insightIds:[barrier.id,status.id],title:response.title,count:row.count,reason:row.name,year,province,
   text:`For ${people(row.count)} inactive NEET youth ${response.target}, ${response.action}`,
   evidence:reasonProofs.filter(item=>item.match.reason_group===row.name)};
 });
 return {baselineYear:baseline,combinedReasons,insights,recommendations,scenarioInputs,scenarioResult:result};
}

/** Compact source summaries retained for the section information. */
export function sidebarInsights(data:DataSet,page:'national'|'regional',year:number,province:string,parameters?:ScenarioInputs):Insight[] {
 if(page==='regional'){
  const analysis=regionalInsights(data,year,province,parameters),current=selectRegional(data,year,province),quality=byGeo(data.quality,year,province)[0];
  const action=analysis.recommendations[0];
  const copy:Record<string,{condition:string;action:string}>={
   'Care responsibilities':{condition:'have care responsibilities',action:'assess childcare or dependent-care support needs'},
   'Discouraged / no suitable jobs':{condition:'are discouraged or lack suitable jobs',action:'review reachable vacancies and hiring requirements before referrals'},
   'Waiting / considering options':{condition:'are waiting or considering options',action:'schedule follow-ups to clarify their next step'},
   'Health / disability':{condition:'face health/disability barriers',action:'arrange accessibility assessments with relevant services'},
   'Other':{condition:'cite other reasons',action:'identify their barriers through individual interviews before assigning support'}
  };
  const response=copy[action.reason];
  return [
   {id:'regional-overview',kind:'trend',title:'NEET & work',baselineYear:analysis.baselineYear,score:current.neet_count,
    text:`Inactive youth account for ${current.inactive_neet_share_pct.toFixed(1)}% of NEET; ${Number(quality.informal_share_pct).toFixed(1)}% of employed youth work informally.`,
    evidence:[...analysis.insights[0].evidence,...analysis.insights[2].evidence],detail:analysis.insights.map(f=>`${f.title}: ${f.text}`).join(' ')},
   {id:'regional-recommendation',kind:'reason',title:'Recommendation',baselineYear:analysis.baselineYear,score:action.count,
    text:`Since ${compactCount(action.count,2)} inactive NEET youth ${response.condition}, ${response.action}.`,
    evidence:action.evidence,detail:`${current.province_name} · ${year}: ${people(action.count)} inactive NEET youth in ${action.reason.toLowerCase()}, summed across genders; linked to NEET & transitions and Risks & barriers.`}
  ];
 }
 const current=selectKpi(data,year),education=byYear(data.education,year).filter(row=>educationNames[String(row.subgroup)]).sort((a,b)=>b.neet_rate_pct-a.neet_rate_pct);
 const provinces=[...selectMap(data,year)].sort((a,b)=>b.neet_rate_pct-a.neet_rate_pct);
 return nationalInsights(data,year,province).slice(0,2).map(finding=>{
  let text=finding.text,title=finding.title;
  if(finding.id==='national-trajectory'){
   const previous=selectKpi(data,finding.baselineYear);title='NEET trend';
   text=`NEET rate is ${n(current.national_neet_rate_pct)}%, ${changeContext(current.national_neet_rate_pct-previous.national_neet_rate_pct,finding.baselineYear,year)}.`;
  } else if(finding.id==='gender-gap'){
   title='Gender gap';text=`Female NEET rate is ${n(current.female_neet_rate_pct)}%, versus ${n(current.male_neet_rate_pct)}% for males.`;
  } else if(finding.id==='residence-gap'){
   title='Urban–rural gap';text=`Rural NEET rate is ${n(current.rural_neet_rate_pct)}%, versus ${n(current.urban_neet_rate_pct)}% in urban areas.`;
  } else if(finding.id==='education-range'){
   const top=education[0],bottom=education.at(-1)!;title='Education';
   text=`Youth with ${educationNames[String(top.subgroup)]} have the highest NEET rate (${n(top.neet_rate_pct)}%), versus ${n(bottom.neet_rate_pct)}% for ${educationNames[String(bottom.subgroup)]}.`;
  } else if(finding.id==='graduate-comparison'){
   title='Graduate transitions';text=`University-graduate NEET rate is ${n(education.find(row=>row.subgroup==='Universitas')!.neet_rate_pct)}%, versus ${n(education.find(row=>row.subgroup==='SMA Umum')!.neet_rate_pct)}% for general-secondary graduates.`;
  } else if(finding.id==='province-range'){
   title='Provincial gap';text=`Provincial NEET rates range from ${n(provinces.at(-1)!.neet_rate_pct)}% in ${provinces.at(-1)!.province_name} to ${n(provinces[0].neet_rate_pct)}% in ${provinces[0].province_name}.`;
  } else if(finding.id==='selected-province'){
   const selected=provinces.find(row=>row.province_key===province)!,gap=selected.neet_rate_pct-current.national_neet_rate_pct;title='Local context';
   text=`${selected.province_name}’s NEET rate is ${n(selected.neet_rate_pct)}%, ${n(Math.abs(gap))} points ${gap>=0?'above':'below'} Indonesia (${n(current.national_neet_rate_pct)}%).`;
  }
  return {...finding,title,text,detail:finding.text};
 });
}

/** One connected paragraph, grounded in the current snapshot and ranked evidence. */
export function sidebarNarrative(data:DataSet,page:'national'|'regional',year:number,province:string,parameters?:ScenarioInputs):Insight {
 const summaries=sidebarInsights(data,page,year,province,parameters);
 if(page==='regional'){
  const current=selectRegional(data,year,province),quality=byGeo(data.quality,year,province)[0];
  const first=`${current.inactive_neet_share_pct>50?'Most NEET youth are':'NEET youth include those'} outside the labour force (${current.inactive_neet_share_pct.toFixed(1)}%), while ${Number(quality.informal_share_pct).toFixed(1)}% of employed youth work informally.`;
  return {id:'regional-narrative',kind:'reason',title:'Key Insights',baselineYear:summaries[0].baselineYear,score:summaries[1].score,
   text:`${first} ${summaries[1].text}`,
   evidence:summaries.flatMap(f=>f.evidence),detail:summaries.map(f=>f.detail).join(' ')};
 }
 const current=selectKpi(data,year),candidates=nationalInsightCandidates(data,year,province);
 const trajectory=candidates.find(f=>f.id==='national-trajectory')!,previous=selectKpi(data,trajectory.baselineYear);
 const context=rankInsights(candidates.filter(f=>f.id!=='national-trajectory'),1)[0];
 const lead=`Indonesia’s NEET rate is ${n(current.national_neet_rate_pct)}%, ${changeContext(current.national_neet_rate_pct-previous.national_neet_rate_pct,trajectory.baselineYear,year)}.`;
 let comparison='';
 if(context.id==='education-range'){
  const rows=byYear(data.education,year).filter(r=>educationNames[String(r.subgroup)]).sort((a,b)=>b.neet_rate_pct-a.neet_rate_pct),top=rows[0],bottom=rows.at(-1)!;
  comparison=`That national picture includes an education gap: rates range from ${n(bottom.neet_rate_pct)}% for ${educationNames[String(bottom.subgroup)]} to ${n(top.neet_rate_pct)}% for ${educationNames[String(top.subgroup)]}.`;
 } else if(context.id==='gender-gap'){
  comparison=`Within that national picture, female and male youth have different NEET rates: ${n(current.female_neet_rate_pct)}% and ${n(current.male_neet_rate_pct)}%, respectively.`;
 } else if(context.id==='residence-gap'){
  comparison=`Within that national picture, rural and urban youth have different NEET rates: ${n(current.rural_neet_rate_pct)}% and ${n(current.urban_neet_rate_pct)}%, respectively.`;
 } else if(context.id==='graduate-comparison'){
  const rows=byYear(data.education,year);
  comparison=`Within that national picture, university graduates have a ${n(rows.find(r=>r.subgroup==='Universitas')!.neet_rate_pct)}% NEET rate, compared with ${n(rows.find(r=>r.subgroup==='SMA Umum')!.neet_rate_pct)}% for general-secondary graduates.`;
 } else if(context.id==='province-range'){
  const rows=[...selectMap(data,year)].sort((a,b)=>b.neet_rate_pct-a.neet_rate_pct),top=rows[0],bottom=rows.at(-1)!;
  comparison=`Behind the national figure, provincial NEET rates range from ${n(bottom.neet_rate_pct)}% in ${bottom.province_name} to ${n(top.neet_rate_pct)}% in ${top.province_name}.`;
 } else if(context.id==='selected-province'){
  const selected=selectMap(data,year).find(r=>r.province_key===province)!,gap=selected.neet_rate_pct-current.national_neet_rate_pct;
  comparison=`Against this national picture, ${selected.province_name} has a ${n(selected.neet_rate_pct)}% NEET rate, ${n(Math.abs(gap))} points ${gap>=0?'above':'below'} Indonesia.`;
 }
 return {id:'national-narrative',kind:'trend',title:'Key Insights',baselineYear:trajectory.baselineYear,score:context.score,
  text:`${lead} ${comparison}`,evidence:[...trajectory.evidence,...context.evidence],detail:`${trajectory.text} ${context.text}`};
}
