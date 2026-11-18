import { byGeo, selectKpi, selectMap, selectRegional, scenario, type DataSet } from './data';
import { comparableGeography, compactCount, isMaterialChange, scenarioDefaults, signed, type EvidenceValue, type ScenarioInputs } from './analysis';

export interface PanelNumber { value:number; display:string }
export interface PanelFact {
 kind:'reason_gap'|'reason'|'risk'|'informal'|'sector'|'scenario';
 text:string;
 compact:string;
 province:string;
 year:number;
 evidence:EvidenceValue[];
 next_step:string|null;
}
export interface InsightPanelInput {
 filters:{year:number;province:string};
 rate:PanelNumber|null;
 change:{points:number;text:string;magnitude:string}|null;
 national_gap:{points:number;display:string}|null;
 inactive_share:PanelNumber|null;
 facts:PanelFact[];
}
export interface InsightPanelContent {
 context:string;
 tone:'positive'|'neutral'|'warning';
 highlight:string;
 highlight_label:string;
 highlight_change:string|null;
 paragraph:string;
 next_step:string|null;
}
const number=(v:unknown):number|null=>typeof v==='number'&&Number.isFinite(v)?v:null;
const percent=(v:unknown,digits=1):PanelNumber|null=>{const value=number(v);return value===null?null:{value,display:`${value.toFixed(digits)}%`};};
const proof=(table:keyof DataSet,match:Record<string,string|number>,field:string,value:number):EvidenceValue=>({table,match,field,value});
const steps:Record<string,string>={
 'Care responsibilities':'Assess care-support needs among inactive NEET youth with caregiving responsibilities.',
 'Discouraged / no suitable jobs':'Review reachable vacancies with discouraged inactive NEET youth before referrals.',
 'Waiting / considering options':'Schedule follow-ups with inactive NEET youth who are considering their options.',
 'Health / disability':'Assess accessibility needs with inactive NEET youth reporting health barriers.',
 'Other':'Interview inactive NEET youth to identify their specific support needs.'
};
const reasonNames:Record<string,string>={
 'Care responsibilities':'care responsibilities',
 'Discouraged / no suitable jobs':'discouragement or lack of suitable jobs',
 'Waiting / considering options':'waiting or considering options',
 'Health / disability':'health or disability',
 'Other':'other reasons'
};

/** Compute source facts once; the text selector never computes new numeric facts. */
export function buildInsightPanelInput(data:DataSet,page:'national'|'regional',year:number,province:string,parameters?:ScenarioInputs):InsightPanelInput {
 const national=selectKpi(data,year),local=selectMap(data,year).find(row=>row.province_key===province);
 const current=page==='regional'?selectRegional(data,year,province):province==='IDN'?national:local!;
 const geo=province==='IDN'?'Indonesia':current.province_name;
 const rate=page==='national'&&province==='IDN'?national.national_neet_rate_pct:current.neet_rate_pct;
 const previous=page==='regional'?data.regional.find(row=>row.year===year-1&&comparableGeography(current,row)):province==='IDN'?data.kpis.find(row=>row.year===year-1):data.provinces.find(row=>row.year===year-1&&comparableGeography(current,row));
 const previousRate=previous?(page==='national'&&province==='IDN'?number(previous.national_neet_rate_pct):number(previous.neet_rate_pct)):null;
 const raw=previousRate===null?null:rate-previousRate,delta=raw!==null&&Math.abs(raw)<1e-9?0:raw;
 const gap=province==='IDN'?null:rate-national.national_neet_rate_pct;
 const facts:PanelFact[]=[];
 const reasons=byGeo(data.reasons,year,province),counts=new Map<string,number>();
 for(const row of reasons){const count=number(row.reason_count);if(count!==null&&count>0&&reasonNames[String(row.reason_group)])counts.set(String(row.reason_group),(counts.get(String(row.reason_group))??0)+count);}
 const genderGaps=[...counts.keys()].flatMap(category=>{
  const male=reasons.find(row=>row.reason_group===category&&row.gender==='Male'),female=reasons.find(row=>row.reason_group===category&&row.gender==='Female');
  const a=number(male?.share_within_gender_inactive_neet_pct),b=number(female?.share_within_gender_inactive_neet_pct);
  return male&&female&&a!==null&&b!==null&&Math.abs(a-b)>10?[{category,male,female,gap:Math.abs(a-b),higher:b>a?'female':'male',lower:b>a?'male':'female'}]:[];
 }).sort((a,b)=>b.gap-a.gap||a.category.localeCompare(b.category));
 const largestGap=genderGaps[0];
 if(largestGap){
  const reason=reasonNames[largestGap.category],amount=largestGap.gap.toFixed(1);
  facts.push({kind:'reason_gap',province:geo,year,
   text:`Among inactive NEET youth in ${geo}, ${largestGap.higher==='female'?'young women':'young men'} report ${reason} ${amount} points more often than ${largestGap.lower==='female'?'young women':'young men'}.`,
   compact:`Among inactive NEET youth, ${reason} shows a ${amount}-point gap between ${largestGap.higher} and ${largestGap.lower} youth.`,
   evidence:[largestGap.male,largestGap.female].map(row=>proof('reasons',{year,province_key:province,gender:String(row.gender),reason_group:largestGap.category},'share_within_gender_inactive_neet_pct',Number(row.share_within_gender_inactive_neet_pct))),
   next_step:largestGap.category==='Care responsibilities'?`Assess care-support needs among ${largestGap.higher} inactive NEET youth.`:steps[largestGap.category]??null});
 }
 const leading=[...counts].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))[0];
 if(leading){
  const [category,count]=leading,reason=reasonNames[category],amount=compactCount(count,2);
  facts.push({kind:'reason',province:geo,year,
   text:`Among inactive NEET youth, ${reason} is the largest recorded reason category, accounting for ${amount} young people.`,
   compact:`${reason[0].toUpperCase()+reason.slice(1)} is the leading inactive NEET reason, accounting for ${amount} young people.`,
   evidence:reasons.filter(row=>row.reason_group===category).map(row=>proof('reasons',{year,province_key:province,gender:String(row.gender),reason_group:category},'reason_count',Number(row.reason_count))),next_step:steps[category]??null});
 }
 // Placeholder model intervals are not fitted estimates; never infer significance from them.
 if(province==='IDN'){
  const model=data.model.filter(row=>row.scope===`National · ${year}`&&!String(row.data_status).includes('SYNTHETIC')&&(row.ci_lower_95>1||row.ci_upper_95<1)).sort((a,b)=>Math.abs(Math.log(b.adjusted_odds_ratio))-Math.abs(Math.log(a.adjusted_odds_ratio)));
  const strongest=model[0];
  if(strongest)facts.push({kind:'risk',province:geo,year,
   text:`${strongest.factor} has the strongest recorded association with NEET status among the factors in the national risk profile.`,
   compact:`${strongest.factor} has the strongest recorded association with NEET in the national risk profile.`,
   evidence:['adjusted_odds_ratio','ci_lower_95','ci_upper_95'].map(field=>proof('model',{factor:strongest.factor},field,Number(strongest[field]))),next_step:null});
 }
 const quality=byGeo(data.quality,year,province)[0],informal=percent(quality?.informal_share_pct);
 if(informal&&informal.value>50)facts.push({kind:'informal',province:geo,year,
  text:`Informal work accounts for ${informal.display} of youth employment in ${geo}, measured among employed young people across all recorded sectors.`,
  compact:`Informal work accounts for ${informal.display} of employed youth in ${geo}.`,
  evidence:[proof('quality',{year,province_key:province},'informal_share_pct',informal.value)],next_step:null});
 const sector=byGeo(data.sectors,year,province).filter(row=>number(row.share_of_employed_youth_pct)!==null).sort((a,b)=>Number(b.share_of_employed_youth_pct)-Number(a.share_of_employed_youth_pct))[0];
 if(sector&&Number(sector.share_of_employed_youth_pct)>25){const share=Number(sector.share_of_employed_youth_pct).toFixed(1);facts.push({kind:'sector',province:geo,year,
  text:`${sector.sector} is the largest youth employment sector in ${geo}, accounting for ${share}% of all employed young people.`,
  compact:`${sector.sector} is the largest youth employment sector at ${share}% of employed youth.`,
  evidence:[proof('sectors',{year,province_key:province,sector:String(sector.sector)},'share_of_employed_youth_pct',Number(sector.share_of_employed_youth_pct))],next_step:null});}
 const regional=byGeo(data.regional,year,province)[0],scenarioRow=byGeo(data.scenarios,year,province)[0];
 if(page==='regional'&&regional&&(parameters||scenarioRow)){
  const inputs=parameters??scenarioDefaults(data,year,province);
  if(inputs.coverage>0){const result=scenario(regional.neet_count,regional.youth_population_15_24,inputs.coverage,inputs.success,regional.neet_rate_pct),amount=compactCount(result.transitions,2);facts.push({kind:'scenario',province:geo,year,
   text:`The selected programme scenario corresponds to ${amount} potential transitions into work or learning among NEET youth in ${geo}.`,
   compact:`The selected programme scenario corresponds to ${amount} potential transitions into work or learning.`,
   evidence:[proof('regional',{year,province_key:province},'neet_count',regional.neet_count),proof('regional',{year,province_key:province},'youth_population_15_24',regional.youth_population_15_24)],next_step:null});}
 }
 return {filters:{year,province:geo},rate:percent(rate,2),
  change:delta===null?null:{points:delta,text:`${signed(delta)} points vs ${year-1}`,magnitude:Math.abs(delta).toFixed(2)},
  national_gap:gap===null?null:{points:gap,display:Math.abs(gap).toFixed(2)},
  inactive_share:percent(regional?.inactive_neet_share_pct),facts};
}

const wordCount=(text:string)=>text.trim().split(/\s+/).length;
const numbers=(text:string)=>text.match(/\d+(?:\.\d+)?/g)??[];
/** Grammar joins supplied facts; there are no generic implication or advice sentences. */
export function generateInsightPanel(input:InsightPanelInput):InsightPanelContent {
 const {filters,change,rate,national_gap:gap,inactive_share:inactive}=input;
 const tone:InsightPanelContent['tone']=!change||!isMaterialChange(change.points)?'neutral':change.points<0?'positive':'warning';
 const movement=change?`${change.points<0?'fell':change.points>0?'rose':'changed by'} ${change.magnitude} points`:null;
 let first='';
 if(filters.province!=='Indonesia'&&gap){
  const position=gap.points===0?'matches the national figure':`is ${gap.display} points ${gap.points>0?'above':'below'} Indonesia`;
  const contrast=change&&(change.points<=-.5&&gap.points>0||change.points>=.5&&gap.points<0);
  first=movement?`${filters.province}'s NEET rate ${movement}${contrast?', but':' and'} ${position}.`:`${filters.province}'s NEET rate ${position} among young people outside employment, education or training during the selected annual survey.`;
 } else if(movement){
  const majority=inactive&&inactive.value>50&&Number.parseFloat(inactive.display)!==Number.parseFloat(rate?.display??'');
  first=majority?`${filters.province}'s NEET rate ${movement}, ${tone==='positive'?'but':'and'} ${inactive.display} of NEET youth were outside the labour force.`:`${filters.province}'s NEET rate ${movement} from the preceding comparable annual observation for young people outside employment, education and training.`;
 } else if(inactive){
  first=`In ${filters.province}, inactive youth account for ${inactive.display} of the NEET population, measured among young people outside employment, education and training.`;
 }
 const valid=(text:string)=>numbers(text).length<=3&&!numbers(text).some(value=>Number(value)===Number.parseFloat(rate?.display??''));
 const candidates=input.facts.filter(f=>f.province===filters.province&&f.year===filters.year);
 let selected:PanelFact|undefined,paragraph='';
 for(const fact of candidates){
  for(const text of [fact.text,fact.compact]){
   const joined=first?`${first} ${text}`:text;
   if(valid(joined)&&wordCount(joined)>=30&&wordCount(joined)<=45){selected=fact;paragraph=joined;break;}
  }
  if(paragraph)break;
 }
 if(!paragraph&&first){
  const expanded=first.slice(0,-1)+', measured among young people outside employment, education or training within the same region and annual survey scope.';
  paragraph=valid(expanded)&&wordCount(expanded)<=45?expanded:valid(first)?first:'';
 }
 return {context:`${filters.province} · ${filters.year}`,tone,highlight:rate?.display??'',highlight_label:'NEET rate',highlight_change:change?.text??null,
  paragraph,next_step:selected?.next_step??null};
}

export function insightPanel(data:DataSet,page:'national'|'regional',year:number,province:string,parameters?:ScenarioInputs){return generateInsightPanel(buildInsightPanelInput(data,page,year,province,parameters));}
