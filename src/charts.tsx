import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { compactCount } from './analysis';
import { byYear, pct, years, regionalTrend, type DataSet, type Row, type FlowRow, type ModelRow } from './data';

export const palette = ['#075b42','#38bd86','#87d7ac','#c4ecd6','#ffe2e3'];
const esc = (v: unknown) => String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const base = {animationDuration:350,textStyle:{fontFamily:'Inter, Arial, sans-serif',fontSize:12,color:'#233b32'},tooltip:{trigger:'item',appendToBody:true,backgroundColor:'#fff',borderColor:'#d8e8df',extraCssText:'max-width:370px;white-space:normal;line-height:1.65;box-shadow:0 8px 28px #12352420;border-radius:10px;font-size:12px;z-index:1000',textStyle:{color:'#213c31',fontSize:12}},aria:{enabled:true}};

export function Chart({option,label,onClick}:{option:any;label:string;onClick?:(p:any)=>void}) {
  const ref=useRef<HTMLDivElement>(null); const instance=useRef<echarts.ECharts | undefined>(undefined); const click=useRef(onClick); click.current=onClick;
  const index=useRef(0);const latest=useRef(option);latest.current=option;
  const fit=(o:any)=>({...o,series:o.series?.map((series:any)=>{
   if(series.type==='map')return {...series,left:undefined,right:undefined,top:undefined,layoutCenter:['50%','48%'],layoutSize:Math.min((ref.current?.clientWidth||440)*.98,(ref.current?.clientHeight||170)*2.65*.92)};
   if(series.type==='sankey'){const width=(ref.current?.clientWidth||570)<470?96:126;return {...series,nodeWidth:width,label:{...series.label,width:width-14}};}
   return series;
  })});
  useEffect(()=>{ const chart=echarts.init(ref.current!,undefined,{renderer:'svg'}); instance.current=chart;
    const observer=new ResizeObserver(()=>{chart.resize();if(latest.current.series?.some((s:any)=>['map','sankey'].includes(s.type)))chart.setOption(fit(latest.current));}); observer.observe(ref.current!);
    chart.on('click',(p:any)=>{ chart.dispatchAction({type:'showTip',seriesIndex:p.seriesIndex,dataIndex:p.dataIndex});click.current?.(p); });
    return ()=>{observer.disconnect();chart.dispose();instance.current=undefined;}; },[]);
  useEffect(()=>{instance.current?.setOption({...base,...fit(option),aria:{enabled:true,label:{description:label}}},true);},[option,label]);
  return <div ref={ref} className="chart" role="img" aria-label={label} tabIndex={0} onFocus={()=>instance.current?.dispatchAction({type:'showTip',seriesIndex:0,dataIndex:0})} onBlur={()=>instance.current?.dispatchAction({type:'hideTip'})} onKeyDown={e=>{ if(e.key==='Escape')instance.current?.dispatchAction({type:'hideTip'});if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();index.current=Math.max(0,index.current+(e.key==='ArrowRight'?1:-1));const n=option.series?.[0]?.data?.length||5;index.current%=n;instance.current?.dispatchAction({type:'showTip',seriesIndex:0,dataIndex:index.current});} }}/>
}

interface Line {name:string;values:(number|null)[];color:string;labelColor?:string;dim?:boolean}
function pointLabelPosition(series:Line[],index:number,point:number) {
 const value=series[index].values[point];
 if(value===null)return 'top';
 const higher=series.some((other,i)=>{const comparison=other.values[point];return i!==index&&comparison!==null&&(comparison>value||comparison===value&&i<index);});
 return higher?'bottom':'top';
}
function lineOptions(series:Line[],year:number,{compact=false,area=false,direct=false}:{compact?:boolean;area?:boolean;direct?:boolean}={}) {
  const vals=series.flatMap(s=>s.values).filter((v):v is number=>v!==null);
  const min=Math.max(0,Math.floor((Math.min(...vals)-2)/2)*2),max=Math.ceil((Math.max(...vals)+2)/2)*2;
  return {grid:{left:compact?43:48,right:compact?35:40,top:25,bottom:29},tooltip:{...base.tooltip,trigger:'axis',formatter:(items:any[])=>{const valid=items.filter(p=>p.value!==null&&p.value!=='-');return `<b>${items[0]?.axisValue}</b><br/>${valid.map(p=>`${p.marker} ${esc(p.seriesName)}: <b>${pct(Number(p.value))}</b>`).join('<br/>')}${valid.length===2?`<br/>Gap: ${(Number(valid[1].value)-Number(valid[0].value)).toFixed(2)} points`:''}`;}},
    legend:{show:false},
    xAxis:{type:'category',data:years,boundaryGap:false,axisLine:{lineStyle:{color:'#dce6e0'}},axisTick:{show:false},axisLabel:{fontSize:12,color:'#576b60',margin:10}},
    yAxis:{type:'value',min,max,interval:compact?4:(max-min)>18?5:2,axisLabel:{fontSize:12,color:'#687b70',formatter:'{value}%'},splitLine:{lineStyle:{color:'#edf2ef'}},axisLine:{show:false}},
    series:series.map((s,i)=>({name:s.name,type:'line',connectNulls:false,data:s.values.map((v,j)=>({value:v,symbolSize:years[j]===year?9:5,label:{show:v!==null&&(years[j]===year),position:pointLabelPosition(series,i,j),distance:5,align:j===0?'left':j===4?'right':'center',color:s.labelColor||s.color,fontWeight:650,fontSize:compact?10.5:11,backgroundColor:i===0?'#e8f5ee':'#f0fbf5',borderRadius:3,padding:[1,3],formatter:v===null?'':`${direct?s.name+' ':''}${pct(v)}`}})),smooth:false,symbol:'circle',lineStyle:{color:s.color,type:'solid',width:2.5,opacity:s.dim?.22:1},itemStyle:{color:'#fff',borderWidth:2,borderColor:s.color,opacity:s.dim?.28:1},label:{opacity:s.dim?.25:1},areaStyle:area?{opacity:.17,color:new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:s.color},{offset:1,color:'#ffffff'}])}:undefined,z:i===0?3:2}))};
}
export function NationalTrend({data,year}:{data:DataSet;year:number}) {
  const option=lineOptions([{name:'Indonesia',values:years.map(y=>data.national.find(r=>r.year===y)!.neet_rate_pct),color:palette[0]}],year,{area:true});
  return <Chart label="Official BPS national NEET trend, 2021–2025" option={{...option,legend:{show:false},grid:{left:48,right:36,top:24,bottom:29}}}/>;
}
export function SubgroupTrend({rows,groups,colors,selected,year}:{rows:Row[];groups:string[];colors:string[];selected:string;year:number}) {
  return <Chart label={`National ${groups.join(' versus ')} NEET rates, 2021–2025. ${selected==='All'?'All series shown':selected+' highlighted'}.`} option={lineOptions(groups.map((group,i)=>({name:group,values:years.map(y=>rows.find(r=>r.year===y&&r.subgroup===group)!.neet_rate_pct),color:colors[i],labelColor:group==='Rural'?'#28664b':colors[i],dim:selected!=='All'&&selected!==group})),year,{compact:true,direct:true})}/>;
}
export function RegionTrend({data,year,province}:{data:DataSet;year:number;province:string}) {
  const series:Line[]=[{name:'Indonesia',values:regionalTrend(data,'IDN'),color:palette[0]}];
  if(province!=='IDN') {
    const rows=data.regional.filter(r=>r.province_key===province);const name=rows[0]?.province_name||'Province';
    series.push({name,values:regionalTrend(data,province),color:'#53c18b',labelColor:'#24754d'});
  }
  const option=lineOptions(series,year,{compact:true,area:province==='IDN',direct:true});
  return <Chart label="Official regional NEET trend; Papua has a break at the change in province boundaries" option={{...option,grid:{left:43,right:36,top:22,bottom:29},yAxis:{...option.yAxis,interval:4}}}/>;
}
export function ProvinceMap({data,year,selected,onSelect}:{data:DataSet;year:number;selected:string;onSelect:(v:string)=>void}) {
  const mapName=year<2024?'indonesia34':'indonesia38';
  if(!echarts.getMap(mapName))echarts.registerMap(mapName,(year<2024?data.geo34:data.geo38) as any);
  const rows=byYear(data.provinces,year); const values=rows.map(r=>({name:String(r.map_feature_key),value:r.neet_rate_pct,selected:r.province_key===selected,province:r.province_name,key:r.province_key}));
  return <><Chart label={`Geographic choropleth of ${year} BPS NEET rates in ${rows.length} provinces. Choose a province to highlight it.`} onClick={p=>{if(p.data?.key)onSelect(p.data.key);}} option={{tooltip:{...base.tooltip,formatter:(p:any)=>p.data?`<b>${esc(p.data.province)}</b> · ${year}<br/>NEET rate: <b>${pct(p.value)}</b>`:'No matching province'},visualMap:{min:Math.floor(Math.min(...rows.map(r=>r.neet_rate_pct))),max:Math.ceil(Math.max(...rows.map(r=>r.neet_rate_pct))),show:false,inRange:{color:['#d6f4e3','#80d2a5','#2db374','#00603f']}},series:[{type:'map',map:mapName,nameProperty:'code',roam:false,selectedMode:'single',left:8,right:8,top:'15%',aspectScale:1.0,label:{show:false},itemStyle:{borderColor:'#fff',borderWidth:.65},emphasis:{label:{show:false},itemStyle:{borderColor:'#075b42',borderWidth:1.4}},select:{label:{show:false},itemStyle:{borderColor:'#153d2c',borderWidth:2.6,areaColor:undefined}},data:values}]}}/><div className="map-footer"><span>{year} · {rows.length} provinces</span><div><span>Lower NEET</span><i/><span>Higher NEET</span></div></div></>;
}
export function EducationBars({data,year,selected}:{data:DataSet;year:number;selected:string}) {
  const rows=byYear(data.education,year).filter(r=>r.subgroup!=='Total'&&r.subgroup!=='All').sort((a,b)=>b.neet_rate_pct-a.neet_rate_pct);
  return <Chart label={`NEET rates by last completed education, ${year}. Subgroup rates, not shares of all NEET youth.`} option={{grid:{left:125,right:57,top:10,bottom:10},tooltip:{...base.tooltip,formatter:(p:any)=>`<b>${esc(p.name)}</b> · ${year}<br/>NEET rate: <b>${pct(p.value)}</b>`},xAxis:{type:'value',show:false,max:Math.ceil((Math.max(...rows.map(r=>r.neet_rate_pct))+2)/5)*5},yAxis:{type:'category',data:rows.map(r=>r.subgroup),inverse:true,axisLine:{show:false},axisTick:{show:false},axisLabel:{fontSize:12,color:'#35483f',width:119,overflow:'truncate'}},series:[{type:'bar',barMaxWidth:20,data:rows.map((r,i)=>({value:r.neet_rate_pct,itemStyle:{color:selected!=='All'?(r.subgroup===selected?palette[0]:'#d9eee3'):(i===0?palette[0]:['#48bf87','#75cd9b','#93d8b0','#a5dfbc','#bce8ce','#ccefd9','#ddf4e6'][i-1])}})),label:{show:true,position:'right',fontSize:12,fontWeight:700,color:'#21382c',formatter:(p:any)=>pct(p.value)},itemStyle:{borderRadius:[0,3,3,0]}}]}}/>;
}
export function Sankey({rows,population}:{rows:FlowRow[];population:number}) {
  const nodeNames=['Youth population','Employed','In education/training (not employed)','NEET','NEET — Unemployed','NEET — Inactive'];
  const fills=['#0b6045','#d9f1e2','#edf8f0','#f8ccd3','#fce6ea','#ffeef1'];
  const borders=['#0b6045','#a5d0b2','#b6d8c4','#dfa2ac','#e5b3bd','#ecc5cd'];
  const inks=['#ffffff','#245e3c','#316b4e','#843746','#934b5a','#934b5a'];
  const titles=['Youth population','Employed','Education / training\n(not employed)','NEET','Unemployed','Inactive'];
  return <Chart label="Exclusive youth status Sankey: employed, not employed in education/training, and NEET; NEET splits into unemployed and inactive. " option={{tooltip:{...base.tooltip,formatter:(p:any)=>p.dataType==='edge'?`${esc(p.data.source)} → ${esc(p.data.target)}<br/><b>${Number(p.value).toLocaleString('en-US')} people</b><br/>${pct(Number(p.value)/population*100)} of youth`:`<b>${esc(p.name)}</b><br/>${Number(p.value).toLocaleString('en-US')} people<br/>${pct(Number(p.value)/population*100)} of youth`},series:[{type:'sankey',left:5,right:5,top:18,bottom:18,nodeWidth:126,nodeGap:44,draggable:false,layoutIterations:32,nodeAlign:'left',label:{position:'inside',fontSize:10.5,color:'#1a3f2b',fontWeight:500,lineHeight:12,width:112,backgroundColor:'#f3faf5',borderColor:'#b6d8c4',borderWidth:1,borderRadius:5,padding:[5,6],rich:{name:{fontSize:10,fontWeight:500,lineHeight:12},value:{fontSize:10.5,fontWeight:650,lineHeight:13}},formatter:(p:any)=>{const i=nodeNames.indexOf(p.name);const value=i===0?population:rows.find(r=>r.target_node===p.name)?.value_persons||0;return titles[i].split('\n').map(line=>`{name|${line}}`).join('\n')+`\n{value|${compactCount(value)} (${pct(value/population*100,i===3?2:1)})}`;}},data:nodeNames.map((name,i)=>({name,value:i===0?population:(rows.find(r=>r.target_node===name)?.value_persons||0),depth:i===0?0:i<4?1:2,itemStyle:{color:i>2?'#ffe0e1':'#def4e8',borderWidth:0},label:{color:inks[i],backgroundColor:fills[i],borderColor:borders[i]}})),links:rows.map(r=>({source:r.source_node,target:r.target_node,value:r.value_persons,lineStyle:{color:['NEET — Inactive','NEET — Unemployed'].includes(r.target_node)?(r.target_node.includes('Inactive')?'#f2b8c5':'#f8d2db'):r.target_node==='NEET'?'#f4b8c0':r.target_node.startsWith('In education')?'#c3e8d2':'#9ed4b0',opacity:.65,curveness:.5}})),emphasis:{focus:'adjacency'},lineStyle:{opacity:.6}}]}}/>;
}
export function Forest({rows,residence,education}:{rows:ModelRow[];residence:string;education:string}) {
 const ordered=[...rows].sort((a,b)=>a.display_order-b.display_order);
 const focused=(r:ModelRow)=>(residence==='All'&&education==='All')||(residence!=='All'&&r.factor==='Rural residence')||(education!=='All'&&r.factor==='Low education');
 return <Chart label="Adjusted odds ratios and intervals for the national 2025 reference." option={{grid:{left:138,right:16,top:8,bottom:30},tooltip:{...base.tooltip,formatter:(p:any)=>{const r=ordered[p.dataIndex];return `<b>${esc(r.factor)}</b><br/>AOR: ${r.adjusted_odds_ratio.toFixed(2)}<br/>95% interval: ${r.ci_lower_95}–${r.ci_upper_95}<br/>Reference: ${esc(r.reference_group)}<br/>National · 2025`;}},xAxis:{type:'value',min:.8,max:2.4,interval:.4,axisLabel:{fontSize:12,color:'#66796e'},axisLine:{show:false},axisTick:{show:false},splitLine:{show:false}},yAxis:{type:'category',inverse:true,data:ordered.map(r=>r.factor),axisTick:{show:false},axisLine:{show:false},axisLabel:{fontSize:12,color:'#344b3e',interval:0}},series:[{type:'custom',renderItem:(_:any,api:any)=>{const i=api.value(1);const r=ordered[i];const p=api.coord([api.value(0),i]);const lo=api.coord([r.ci_lower_95,i]);const hi=api.coord([r.ci_upper_95,i]);const color=r.factor==='Low education'?palette[0]:'#36af7e';const opacity=focused(r)?1:.2;return {type:'group',children:[{type:'line',shape:{x1:lo[0],y1:p[1],x2:hi[0],y2:p[1]},style:{stroke:color,lineWidth:1.5,opacity}},{type:'circle',shape:{cx:p[0],cy:p[1],r:4},style:{fill:color,opacity}}]};},data:ordered.map((r,i)=>[r.adjusted_odds_ratio,i]),markLine:{silent:true,symbol:'none',label:{show:false},lineStyle:{type:'dashed',color:'#aabbb0'},data:[{xAxis:1}]}}]}}/>;
}
export const reasonNames=['Care responsibilities','Discouraged / no suitable jobs','Waiting / considering options','Health / disability','Other'];
export function Reasons({rows,gender}:{rows:Row[];gender:string}) {
  const groups=gender==='All'?['Male','Female']:[gender];
  return <><Chart label="Reasons among inactive NEET youth by gender" option={{grid:{left:55,right:6,top:12,bottom:10},tooltip:{...base.tooltip,formatter:(p:any)=>`<b>${esc(p.name)} · ${esc(p.seriesName)}</b><br/>${pct(p.value)}`},xAxis:{type:'value',max:100,show:false},yAxis:{type:'category',inverse:true,data:groups,axisLine:{show:false},axisTick:{show:false},axisLabel:{fontSize:12,fontWeight:600,color:'#354b3e'}},series:reasonNames.map((name,i)=>({type:'bar',name,stack:'reasons',barMaxWidth:29,itemStyle:{color:palette[i]},data:groups.map(g=>Number(rows.find(r=>r.gender===g&&r.reason_group===name)?.share_within_gender_inactive_neet_pct??0)),label:{show:true,position:'inside',fontSize:12,color:i<2?'#fff':'#254334',formatter:(p:any)=>p.value>=8?pct(p.value,1):''}}))}}/><div className="reason-legend">{reasonNames.map((name,i)=><span key={name}><i style={{background:palette[i]}}/>{name}</span>)}</div></>;
}
export function SectorTreemap({rows,geo,year}:{rows:Row[];geo:string;year:number}) {
 return <Chart label={`Employment by sector, ${geo}, ${year}. `} option={{tooltip:{...base.tooltip,formatter:(p:any)=>`<b>${esc(p.name)}</b><br/>${esc(geo)} · ${year}<br/>${Number(p.value).toLocaleString('en-US')} employed youth<br/>Share: ${pct(p.data.share)}`},series:[{type:'treemap',roam:false,nodeClick:false,breadcrumb:{show:false},left:0,right:0,top:5,bottom:0,sort:'desc',squareRatio:1.3,label:{show:true,fontSize:12,lineHeight:16,overflow:'break',formatter:(p:any)=>p.name==='Construction'?`Constr.\n${pct(p.data.share,1)}`:`${p.name==='Accommodation & food'?'Accom.\n& food':p.name==='Manufacturing'?'Manufact.':p.name}\n${pct(p.data.share,1)}`},itemStyle:{borderColor:'#fff',borderWidth:1,gapWidth:1},data:[...rows].sort((a,b)=>Number(b.share_of_employed_youth_pct)-Number(a.share_of_employed_youth_pct)).map((r,i)=>({name:r.sector,value:Number(r.employed_youth_count),share:Number(r.share_of_employed_youth_pct),itemStyle:{color:['#0a8056','#39bd85','#64c995','#91d8b0','#b1e5c8','#d6f1e1'][i]},label:{color:i<3?'#fff':'#224532'}}))}]}}/>;
}
