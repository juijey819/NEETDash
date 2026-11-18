import Papa from 'papaparse';

export interface Row { [key: string]: string | number; year: number; province_key: string; province_name: string; neet_rate_pct: number }
export interface KpiRow extends Row { national_neet_rate_pct: number; jawa_tengah_neet_rate_pct: number; jawa_tengah_gap_vs_national_pp: number; female_neet_rate_pct: number; male_neet_rate_pct: number; rural_neet_rate_pct: number; urban_neet_rate_pct: number }
export interface RegionalRow extends Row { youth_population_15_24: number; neet_count: number; employed_count: number; inactive_neet_count: number; neet_unemployed_count: number; inactive_neet_share_pct: number; youth_employment_rate_pct: number; education_training_nonemployed_count: number; education_training_nonemployed_share_pct: number }
export interface FlowRow extends Row { source_node: string; target_node: string; value_persons: number; share_of_youth_pct: number }
export interface ModelRow extends Row { factor: string; adjusted_odds_ratio: number; ci_lower_95: number; ci_upper_95: number; reference_group: string; display_order: number }
export interface GeoFeature { type: 'Feature'; properties: { name: string; code: string; [key: string]: unknown }; geometry: { type: string; coordinates: unknown } }
export interface GeoCollection { type: 'FeatureCollection'; features: GeoFeature[] }
export interface DataSet { national: Row[]; provinces: Row[]; gender: Row[]; residence: Row[]; education: Row[]; kpis: KpiRow[]; regional: RegionalRow[]; regionalKpis: RegionalRow[]; flows: FlowRow[]; model: ModelRow[]; reasons: Row[]; sectors: Row[]; quality: Row[]; actions: Row[]; scenarios: Row[]; geo34: GeoCollection; geo38: GeoCollection }
const files = {national:'page1/p1_national_trend',provinces:'page1/p1_provincial_neet',gender:'page1/p1_gender_trend',residence:'page1/p1_residence_trend',education:'page1/p1_education_trend',kpis:'page1/p1_kpi_by_year',regional:'page2/p2_province_year',regionalKpis:'page2/p2_kpi_by_year',flows:'page2/p2_neet_decomposition',model:'page2/p2_exclusion_model',reasons:'page2/p2_neet_reasons',sectors:'page2/p2_labour_sector',quality:'page2/p2_labour_quality',actions:'page2/p2_policy_actions',scenarios:'page2/p2_policy_scenarios'};
const numeric = /^(?:year|.*_pct|.*_pct_default|.*_pp|.*_count|.*_persons|youth_population_15_24|value_persons|adjusted_odds_ratio|ci_lower_95|ci_upper_95|display_order|action_order|median_monthly_earnings_idr)$/;
export function parseCsv(text: string): Row[] {
  const result = Papa.parse<Record<string,string>>(text,{header:true,skipEmptyLines:true});
  if(result.errors.length) throw new Error(`Invalid CSV: ${result.errors[0].message}`);
  return result.data.map(row=>Object.fromEntries(Object.entries(row).map(([k,v])=>[k,numeric.test(k)&&v!==''?Number(v):v])) as unknown as Row);
}
async function asset(path: string) { const r=await fetch(path); if(!r.ok) throw new Error(`Cannot load ${path} (${r.status})`); return r; }
let cached: Promise<DataSet> | undefined;
export function loadData(): Promise<DataSet> {
  return cached ??= Promise.all([Promise.all(Object.entries(files).map(async([key,path])=>[key,parseCsv(await (await asset(`/data/${path}.csv`)).text())])),asset('/geo/indonesia-provinces-34.geojson').then(r=>r.json()),asset('/geo/indonesia-provinces-38.geojson').then(r=>r.json())]).then(([tables,geo34,geo38])=>({...Object.fromEntries(tables),geo34,geo38}) as DataSet);
}
export const years = [2021,2022,2023,2024,2025];
export const pct = (value: number, digits=2) => `${value.toFixed(digits)}%`;
export const million = (value: number, digits=1) => `${(value/1e6).toFixed(digits)}M`;
export const byYear = <T extends Row>(rows: T[], year: number) => rows.filter(r=>r.year===year);
export const byGeo = <T extends Row>(rows:T[], year:number,key:string) => rows.filter(r=>r.year===year&&r.province_key===key);
export function selectKpi(data:DataSet,year:number) { const row=data.kpis.find(r=>r.year===year); if(!row) throw new Error('KPI unavailable'); return row; }
export function selectRegional(data:DataSet,year:number,key:string) { const row=byGeo(data.regional,year,key)[0]; if(!row) throw new Error('Geography unavailable for this year'); return row; }
export const selectMap = (data:DataSet,year:number)=>byYear(data.provinces,year);
export const selectFlows = (data:DataSet,year:number,key:string)=>byGeo(data.flows,year,key);
export const selectReasons = (data:DataSet,year:number,key:string,gender:string)=>byGeo(data.reasons,year,key).filter(r=>gender==='All'||r.gender===gender);
export const selectSectors = (data:DataSet,year:number,key:string)=>byGeo(data.sectors,year,key);
export const selectQuality = (data:DataSet,year:number,key:string)=>byGeo(data.quality,year,key)[0];
export function scenario(baseline:number,population:number,coverage:number,success:number,baselineRate?:number) {
  const transitions=baseline*coverage/100*success/100;
  return {transitions,remaining:baseline-transitions,rateAfter:(baselineRate??baseline/population*100)*(1-coverage*success/10000),reductionPct:coverage*success/100};
}
export function regionalTrend(data:DataSet,key:string) {
  return years.map(year=>{ const r=byGeo(data.regional,year,key)[0]; return r ? r.neet_rate_pct : null; });
}
