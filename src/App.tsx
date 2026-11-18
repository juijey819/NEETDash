import { useEffect, useState, type ReactNode } from 'react';
import { Users, MapPin, Scale, createLucideIcon, GraduationCap, TrendingUp, Filter, Lightbulb, RotateCcw, BriefcaseBusiness, Armchair, Percent, FlaskConical, Layers3, Network, CircleHelp, type LucideIcon } from 'lucide-react';
import { loadData, million, pct, scenario, selectFlows, selectMap, selectQuality, selectReasons, selectRegional, selectSectors, years, type DataSet } from './data';
import { compactCount, inactiveNeetSummary, modelCoverage, nationalSummary, regionalInsights, regionalSummary, genderGapSummary, scenarioDefaults, type ScenarioInputs, type Change } from './analysis';
import { EducationBars, Forest, NationalTrend, ProvinceMap, Reasons, RegionTrend, Sankey, SectorTreemap, SubgroupTrend } from './charts';
import { chartInfo } from './chart-info';
import { kpiInfo } from './kpi-info';
import { LoadingDashboard } from './loading';
import { Info } from './Info';
import { buildInsightPanelInput, generateInsightPanel } from './insight-panel';

const Venus=createLucideIcon('Venus',[['circle',{cx:'12',cy:'8',r:'5',key:'head'}],['path',{d:'M12 13v9m-4-4h8',key:'cross'}]]);
const official='Official BPS SDGs Indicator 8.6.1* · Sakernas August · youth aged 15–24. NEET means not in education, employment or training. It includes unemployed and inactive youth. National subgroup rates are not additive.';
type Page='national'|'regional';
interface Filters {year:number;province:string;gender:string;residence:string;education:string}
const defaults:Filters={year:2025,province:'IDN',gender:'All',residence:'All',education:'All'};

function Strip({icon:Icon,title,children,infoLabel='About this view'}:{icon:LucideIcon;title:string;children?:ReactNode;infoLabel?:string}){return <div className="strip"><Icon size={20}/><h2>{title}</h2>{children&&<Info label={infoLabel}>{children}</Info>}</div>;}
function Panel({title,subtitle,icon:Icon,info,children,className=''}:{title:string;subtitle?:string;icon?:LucideIcon;info?:ReactNode;children:ReactNode;className?:string}){
 return <section className={`card panel ${className}`} aria-label={title}><div className="panel-title">{Icon&&<Icon size={22}/>}<div><h2>{title}</h2>{subtitle&&<p>{subtitle}</p>}</div>{info&&<Info label={`${title}: how to read this chart`}>{info}</Info>}</div><div className="panel-content">{children}</div></section>;
}
function KPI({icon:Icon,title,value,context,change,info}:{icon:LucideIcon;title:string;value:string;context:string;change?:Change;info:ReactNode}) {
 return <div className="card kpi"><Icon className="kpi-icon"/><div className="kpi-text"><h3>{title}</h3><span>{context}</span><strong>{value}</strong>{change&&<p className={`kpi-change ${change.tone}`}>{change.text}</p>}</div><Info label={`${title}: definition`}>{info}</Info></div>;
}
function Select({label,value,options,onChange,scope}:{label:string;value:string|number;options:{value:string;label:string}[];onChange:(s:string)=>void;scope:string}){
 return <div className="filter-row"><label htmlFor={`filter-${label}`}>{label}</label><select id={`filter-${label}`} value={value} onChange={e=>onChange(e.target.value)} title={options.find(o=>o.value===String(value))?.label}>{options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select><Info label={`About the ${label.toLowerCase()} filter`}>{scope}</Info></div>;
}
function Sidebar({data,page,filters,setFilters,scenarioInputs}:{data:DataSet;page:Page;filters:Filters;setFilters:(f:Filters)=>void;scenarioInputs:ScenarioInputs}) {
 const {year,province}=filters;
 const options=selectMap(data,year).map(r=>({value:r.province_key,label:r.province_name}));
 function set(key:keyof Filters,value:string){let next={...filters,[key]:key==='year'?Number(value):value};if(key==='year'&&!selectMap(data,Number(value)).some(r=>r.province_key===province)&&province!=='IDN')next={...next,province:'IDN'};setFilters(next);}
 const regional=page==='regional'?regionalInsights(data,year,province,scenarioInputs):undefined;
 const input=buildInsightPanelInput(data,page,year,province,scenarioInputs),brief=generateInsightPanel(input);
 const heading='Key Insights';
 return <aside className="sidebar"><section className="card filters"><Strip icon={Filter} title="Filters"/><div className="filter-fields">
  <Select label="Year" value={year} options={[...years].reverse().map(y=>({value:String(y),label:String(y)}))} onChange={v=>set('year',v)} scope="Updates the selected-year data. Trend charts retain all five years. Insight comparisons use the preceding available comparable year, or the selected year when it is the first observation."/>
  <Select label="Province" value={province} options={[{value:'IDN',label:page==='national'?'All Provinces':'Indonesia'},...options]} onChange={v=>set('province',v)} scope={page==='national'?'Highlights the map and includes a comparable selected-province finding among the insight candidates. Other charts and KPI cards remain national.':'Updates regional metrics, barriers and scenario inputs. Risk Factors retain their national 2025 reference scope.'}/>
  <button className="reset" onClick={()=>setFilters({...defaults})}><RotateCcw size={12}/> Reset filters</button>
 </div></section><section className={`card insights tone-${brief.tone} ${page==='regional'?'regional-summary':''}`}><Strip icon={Lightbulb} title={heading} infoLabel={`${heading}: data sources and limitations`}>
  <p>{official}</p><p>The paragraph uses the selected region and year, exact changes against the preceding comparable calendar year and the national gap where relevant. Its second sentence is one source fact: a reason/gender gap, a valid scoped model factor, informality, sector share or scenario outcome, in that order. Missing local diagnostics are not replaced with national observations. National charts and KPI cards remain national when a province is selected.</p>
  {page==='regional'&&<><p>Population and NEET counts for Indonesia in 2023–2025 are BPS extracts. Provincial counts, status splits, reasons, sector values, quality values and model factors are synthetic illustrations. The AOR reference is not fitted from microdata. The scenario is arithmetic rather than a forecast or causal effect.</p><p>The recommendation links the largest combined barrier count across genders to a concrete response. This ranks affected people, not intervention effects. Sector size never selects a placement sector. Full segment findings and the live scenario are retained below.</p><p>The 2025 inactive split is shared across regions. No job placement recommendation is derived from sector size. No synthetic result is presented as an estimated causal effect.</p></>}
  <a href="/data/meta/source_lineage.csv" download>Source lineage</a> · <a href="/data/meta/data_dictionary.csv" download>Data dictionary</a>
  <b>Details behind the summary</b>{input.facts.map(fact=><p key={fact.kind}>{fact.text}</p>)}{regional&&<><b>Dashboard segments</b>{regional.insights.map(finding=><div key={finding.id}><b>{finding.title}</b><p>{finding.text}</p>{finding.detail&&<p>{finding.detail}</p>}</div>)}</>}
 </Strip><p className="insight-scope">{brief.context}</p><div className="insight-brief" aria-live="polite" aria-atomic="true"><p className="insight-paragraph">{brief.paragraph}</p></div></section></aside>;
}

function National({data,filters,setFilters}:{data:DataSet;filters:Filters;setFilters:(f:Filters)=>void}) {
 const {year,province,gender,residence,education}=filters;const summary=nationalSummary(data,year),genderGap=genderGapSummary(data,year);
 return <main className="canvas national"><div className="kpi-grid four">
  <KPI icon={Percent} title="National NEET Rate" context={`Indonesia · ${year}`} value={pct(summary.current.national_neet_rate_pct)} change={summary.changes.rate} info={kpiInfo.nationalNeetRate}/>
  <KPI icon={Users} title="Young People NEET" context={`Indonesia · ${year}`} value={summary.count===undefined?'—':compactCount(summary.count,2)} change={summary.changes.count} info={kpiInfo.neetPopulation}/>
  <KPI icon={GraduationCap} title="Youth Population" context={`Indonesia · ${year}`} value={summary.population===undefined?'—':million(summary.population)} change={summary.changes.population} info={kpiInfo.youthPopulation}/>
  <KPI icon={Venus} title="Gender NEET Gap" context={`Indonesia · ${year}`} value={`${genderGap.gap.toFixed(2)} points`} change={genderGap.change} info={kpiInfo.genderGap}/>
 </div><div className="national-top">
  <Panel title="Young People Outside Learning & Work" subtitle="National NEET rate, 2021–2025" icon={TrendingUp} info={chartInfo.nationalTrend}><NationalTrend data={data} year={year}/></Panel>
  <Panel title={`Provincial NEET Rate ${year}`} icon={MapPin} info={chartInfo.provinceMap}><ProvinceMap data={data} year={year} selected={province} onSelect={v=>setFilters({...filters,province:v})}/></Panel>
 </div><div className="national-bottom">
  <Panel title="Gender Gap in NEET" subtitle="Who is more vulnerable?" icon={Venus} info={chartInfo.gender}><SubgroupTrend rows={data.gender} groups={['Male','Female']} colors={['#596b63','#c44268']} selected={gender} year={year}/></Panel>
  <Panel title="Urban vs Rural NEET" subtitle="Does place of residence matter?" icon={Network} info={chartInfo.residence}><SubgroupTrend rows={data.residence} groups={['Urban','Rural']} colors={['#086d47','#71bb94']} selected={residence} year={year}/></Panel>
  <Panel title={`NEET by Last Completed Education ${year}`} icon={GraduationCap} info={chartInfo.education}><EducationBars data={data} year={year} selected={education}/></Panel>
 </div></main>;
}
function Quality({data,year,province}:{data:DataSet;year:number;province:string}) {
 const q=selectQuality(data,year,province);return <div className="quality quality-compact">
  <div className="quality-stat"><span>Informal share</span><strong>{pct(Number(q.informal_share_pct),1)}</strong></div>
  <div className="quality-stat"><span>Short-hours share</span><strong>{pct(Number(q.short_hours_share_pct),1)}</strong></div>
  <div className="quality-stat"><span>Median earnings</span><strong>Rp {(Number(q.median_monthly_earnings_idr)/1e6).toFixed(2)}M</strong></div>
 </div>;

}
function ExclusionModel({data,year,province,residence,education}:{data:DataSet;year:number;province:string;residence:string;education:string}) {
 const coverage=modelCoverage(data,year,province);const [showReference,setShowReference]=useState(false);
 useEffect(()=>setShowReference(false),[year,province]);
 const showChart=coverage.available||showReference;
 return <div className="model-content">{showChart?<><div className="model-scope"><span>National reference · {coverage.referenceYear}</span>{!coverage.available&&<button onClick={()=>setShowReference(false)}>Hide reference</button>}</div><Forest rows={data.model} residence={residence} education={education}/></>:<div className="model-unavailable"><Scale size={25}/><h4>{province==='IDN'?`Estimates for ${year} unavailable`:'Provincial estimates unavailable'}</h4><p>No estimate is available for this selection. A national reference is available for {coverage.referenceYear}.</p><button onClick={()=>setShowReference(true)}>View national reference ({coverage.referenceYear})</button></div>}</div>;
}
function Simulator({data,year,province,inputs,onInputsChange}:{data:DataSet;year:number;province:string;inputs:ScenarioInputs;onInputsChange:(inputs:ScenarioInputs)=>void}) {
 const row=selectRegional(data,year,province);
 const {coverage,success}=inputs;
 const result=scenario(row.neet_count,row.youth_population_15_24,coverage,success,row.neet_rate_pct);
 return <div className="simulator aligned-simulator"><div className="scenario-controls"><p className="scenario-scope">{row.province_name} · {year}</p>
  <div className="slider-field"><label htmlFor="coverage">Programme coverage<span>Share of NEET youth reached</span></label><output htmlFor="coverage">{coverage}%</output><input id="coverage" aria-label="Programme coverage, percent of NEET youth reached" type="range" min={0} max={100} value={coverage} style={{'--range':`${coverage}%`} as React.CSSProperties} onChange={e=>onInputsChange({...inputs,coverage:Number(e.target.value)})}/><p className="coverage-explanation">Reaches <b>{compactCount(row.neet_count*coverage/100,2)}</b> of {compactCount(row.neet_count,2)} NEET youth.</p></div>
  <div className="slider-field"><label htmlFor="success">Transition success rate<span>Share of reached youth entering work or learning</span></label><output htmlFor="success">{success}%</output><input id="success" aria-label="Transition success rate, percent of reached youth exiting NEET" type="range" min={0} max={100} value={success} style={{'--range':`${success}%`} as React.CSSProperties} onChange={e=>onInputsChange({...inputs,success:Number(e.target.value)})}/></div>
 </div><div className="metric-footer" aria-live="polite"><h3>Scenario Outcome</h3><div className="quality quality-compact scenario-metrics"><div className="quality-stat"><span>NEET reduction</span><strong>{result.transitions>0?'−':''}{compactCount(result.transitions,2)}</strong></div><div className="quality-stat"><span>Share of NEET</span><strong>{result.reductionPct.toFixed(1)}%</strong></div><div className="quality-stat"><span>Rate after transition</span><strong>{pct(result.rateAfter)}</strong><small>from {pct(row.neet_rate_pct)}</small></div></div></div></div>;
}
function Regional({data,filters,inputs,onInputsChange}:{data:DataSet;filters:Filters;inputs:ScenarioInputs;onInputsChange:(inputs:ScenarioInputs)=>void}) {
 const {year,province,gender,residence,education}=filters;const summary=regionalSummary(data,year,province),r=summary.current;
 const inactivity=inactiveNeetSummary(data,year,province),scope=inactivity.scope;
 return <main className="canvas regional"><div className="kpi-grid four">
  <KPI icon={Percent} title="NEET Rate" context={scope} value={pct(r.neet_rate_pct)} change={summary.changes.rate} info={kpiInfo.neetRate}/>
  <KPI icon={Users} title="NEET Population" context={scope} value={compactCount(r.neet_count)} change={summary.changes.count} info={kpiInfo.neetPopulation}/>
  <KPI icon={Armchair} title="Inactive NEET Share" context={scope} value={pct(r.inactive_neet_share_pct,1)} change={summary.changes.inactive} info={kpiInfo.inactiveNeetShare}/>
  <KPI icon={BriefcaseBusiness} title="Youth Employment Rate" context={scope} value={pct(r.youth_employment_rate_pct,1)} change={summary.changes.employment} info={kpiInfo.youthEmploymentRate}/>
 </div>
 <div className="regional-row diagnostic-row">
  <Panel title="NEET Trend 2021–2025" icon={TrendingUp} info={chartInfo.regionalTrend} className="trend-card"><RegionTrend data={data} year={year} province={province}/></Panel>
  <Panel title={`NEET Status Decomposition ${year}`} icon={Layers3} info={chartInfo.decomposition} className="decomposition-card"><Sankey rows={selectFlows(data,year,province)} population={r.youth_population_15_24}/></Panel>
 </div><div className="regional-row diagnostic-row">
  <Panel title="Risk Factors" icon={Scale} info={chartInfo.exclusion} className="risk-card"><ExclusionModel data={data} year={year} province={province} residence={residence} education={education}/></Panel>
  <Panel title="Reasons Behind Inactive NEET" icon={Users} info={chartInfo.reasons} className="reasons-card"><Reasons rows={selectReasons(data,year,province,gender)} gender={gender}/></Panel>
 </div><div className="regional-row work-row">
  <Panel title="Employment by Sector" icon={BriefcaseBusiness} info={chartInfo.sectors} className="labour-panel"><div className="labour-body"><SectorTreemap rows={selectSectors(data,year,province)} geo={r.province_name} year={year}/><div className="metric-footer"><h3>Employment Quality<Info label="Employment quality: definitions and scope">{chartInfo.quality}</Info></h3><Quality data={data} year={year} province={province}/></div></div></Panel>
  <Panel title="What-if Scenario" icon={FlaskConical} info={chartInfo.scenario} className="policy-panel"><Simulator data={data} year={year} province={province} inputs={inputs} onInputsChange={onInputsChange}/></Panel>
 </div>
 </main>;
}
export default function App(){
 const [data,setData]=useState<DataSet>();const [error,setError]=useState('');const [page,setPage]=useState<Page>(window.location.hash==='#regional'?'regional':'national');const [national,setNational]=useState<Filters>({...defaults});const [regional,setRegional]=useState<Filters>({...defaults});const [scenarioInputs,setScenarioInputs]=useState<ScenarioInputs>();
 useEffect(()=>{loadData().then(setData).catch(e=>setError(e.message));const hash=()=>setPage(window.location.hash==='#regional'?'regional':'national');window.addEventListener('hashchange',hash);return()=>window.removeEventListener('hashchange',hash);},[]);
 function navigate(next:Page){window.location.hash=next;setPage(next);}
 if(!data&&!error)return <LoadingDashboard/>;
 const activeScenario=data?(scenarioInputs??scenarioDefaults(data,regional.year,regional.province)):undefined;
 return <div className="app"><header className="app-header"><div className="brand"><div className="logo" aria-hidden="true"><GraduationCap className="logo-education"/><BriefcaseBusiness className="logo-work"/><i/></div><div><h1>Indonesia’s NEET Youth</h1><p>Indonesia’s NEET Conditions</p></div></div><nav aria-label="Dashboard pages"><button aria-current={page==='national'?'page':undefined} onClick={()=>navigate('national')}><img className="indonesia-icon" src="/icons/indonesia.svg" alt=""/><span>National Overview</span></button><button aria-current={page==='regional'?'page':undefined} onClick={()=>navigate('regional')}><MapPin size={17}/><span>Regional Intelligence</span></button></nav></header>
  {error?<div className="load-state" role="alert"><CircleHelp size={32}/><h2>Dashboard data could not be loaded</h2><p>{error}</p><button onClick={()=>window.location.reload()}>Retry</button></div>:!data?<LoadingDashboard/>:<div className={`workspace page-${page}`}><Sidebar data={data} page={page} filters={page==='national'?national:regional} setFilters={page==='national'?setNational:setRegional} scenarioInputs={activeScenario!}/>{page==='national'?<National data={data} filters={national} setFilters={setNational}/>:<Regional data={data} filters={regional} inputs={activeScenario!} onInputsChange={setScenarioInputs}/>}</div>}

 </div>;
}
