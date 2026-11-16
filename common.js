/* shared helpers: layout, formatting, metrics, charts, CSV */
(function(root){
const COLORS=['#0b6e6e','#d1495b','#edae49','#3d5a80','#7b9e3a','#8e5ea2','#e07a5f','#2a9d8f','#6c757d','#b5179e','#118ab2','#9c6644'];
const KEYM=[['revenue','Revenue (total income for banks / insurers)','₹ crore'],['profit','Net profit','₹ crore'],['pbt','Profit before tax','₹ crore'],['assets','Total assets','₹ crore'],['equity','Total equity','₹ crore'],['cfo','Cash flow from operations','₹ crore'],['eps','EPS (basic, as printed)','₹ / share']];
const RATIOS=[['margin','Net profit margin','%'],['roa','Return on assets (profit / assets)','%'],['roe','Return on equity (profit / equity)','%'],['eqr','Equity / assets','%'],['rgrow','Revenue growth, year on year','%'],['agrow','Asset growth, year on year','%']];
const KIND={core:'Non-financial',bank:'Bank',nbfc:'NBFC',insurer:'Insurer'};
const fyLabel=y=>'FY'+(y-1)+'-'+String(y).slice(2);
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function fmt(v,unit){ if(v==null||isNaN(v))return '–'; const a=Math.abs(v);
  if(unit==='%')return v.toFixed(1)+'%';
  if(unit==='₹ / share')return v.toLocaleString('en-IN',{maximumFractionDigits:2});
  return v.toLocaleString('en-IN',{maximumFractionDigits:a>=100?0:a>=1?1:3}); }
function pickBasis(d,pref,metric){ // returns basis key with data
  const order=pref==='standalone'?['standalone','consolidated']:pref==='consolidated'?['consolidated','standalone']:['consolidated','standalone'];
  for(const b of order){const B=d.b[b]; if(B && B.k && B.k[metric] && B.k[metric].some(v=>v!=null))return b;}
  return null; }
function series(d,metric,basis,hideFlagged,field){ // -> {byYear:{y:value}, basis, flagged:Set}
  const yrs=d.years; const out={}; const fl=new Set();
  const bm={margin:'profit',roa:'profit',roe:'profit',eqr:'equity',rgrow:'revenue',agrow:'assets'}[metric]||metric; const b=pickBasis(d,basis,field?null:bm); 
  let B=null,arr=null;
  if(field){ for(const bs of (basis==='standalone'?['standalone','consolidated']:['consolidated','standalone'])){const X=d.b[bs]; if(X&&X.x&&X.x[metric]&&X.x[metric].some(v=>v!=null)){B=X;arr=X.x[metric];break;}} if(!B)return {byYear:out,basis:null,flagged:fl};
    const bk=Object.keys(d.b).find(k=>d.b[k]===B); return mk(yrs,arr,B,bk,hideFlagged); }
  if(!b)return {byYear:out,basis:null,flagged:fl};
  B=d.b[b];
  const K=B.k;
  const g=m=>K[m]||yrs.map(()=>null);
  if(RATIOS.some(r=>r[0]===metric)){
    const rev=g('revenue'),pr=g('profit'),as=g('assets'),eq=g('equity');
    arr=yrs.map((y,i)=>{const sk=hideFlagged&&B.o.includes(y); if(sk)return null; const di=(a,c)=>(a!=null&&c!=null&&c!==0)?a/c*100:null;
      if(metric==='margin')return di(pr[i],rev[i]); if(metric==='roa')return di(pr[i],as[i]); if(metric==='roe')return di(pr[i],eq[i]); if(metric==='eqr')return di(eq[i],as[i]);
      const src=metric==='rgrow'?rev:as; const j=yrs.indexOf(y-1); if(j<0||hideFlagged&&B.o.includes(y-1))return null; const a=src[i],p=src[j]; return(a!=null&&p!=null&&p>0)?(a/p-1)*100:null;});
    return mk(yrs,arr,B,b,hideFlagged,true);
  }
  return mk(yrs,g(metric),B,b,hideFlagged);
}
function mk(yrs,arr,B,bk,hide,derived){const out={},fl=new Set();yrs.forEach((y,i)=>{const v=arr[i]; if(v==null)return; const f=B.o.includes(y); if(f&&hide&&!derived)return; if(f)fl.add(y); out[y]=v;}); return {byYear:out,basis:bk,flagged:fl};}
function toCSV(rows){return rows.map(r=>r.map(c=>{c=c==null?'':String(c);return /[",\n]/.test(c)?'"'+c.replace(/"/g,'""')+'"':c}).join(',')).join('\n');}
function download(name,text){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:'text/csv;charset=utf-8'}));a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500);}
function niceTicks(min,max,n){ if(min===max){max=min+1;min=min-1} const span=max-min, step0=span/n, mag=Math.pow(10,Math.floor(Math.log10(step0))), r=step0/mag, step=(r<1.5?1:r<3?2:r<7?5:10)*mag; const a=Math.floor(min/step)*step,b=Math.ceil(max/step)*step; const t=[];for(let v=a;v<=b+step/2;v+=step)t.push(+v.toFixed(10));return t;}
function lineChart(el,labels,ser,unit){ // ser:[{name,color,vals:[...]}]
  const W=el.clientWidth||800,H=el.clientHeight||340,m={l:74,r:18,t:14,b:34};
  const vs=ser.flatMap(s=>s.vals).filter(v=>v!=null&&isFinite(v)); 
  if(!vs.length){el.innerHTML='<p class="mut" style="padding:40px;text-align:center">No data to chart for this selection.</p>';return;}
  let mn=Math.min(...vs),mx=Math.max(...vs); if(mn>0&&mn<mx*0.3&&unit!=='%')mn=0; const T=niceTicks(mn,mx,5); mn=T[0];mx=T[T.length-1];
  const X=i=>m.l+(labels.length<2?(W-m.l-m.r)/2:i*(W-m.l-m.r)/(labels.length-1)), Y=v=>m.t+(1-(v-mn)/(mx-mn))*(H-m.t-m.b);
  let s=`<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img">`;
  T.forEach(t=>{s+=`<line x1="${m.l}" x2="${W-m.r}" y1="${Y(t)}" y2="${Y(t)}" stroke="var(--line)"/><text x="${m.l-8}" y="${Y(t)+4}" text-anchor="end" font-size="11" fill="var(--mut)">${esc(fmtAxis(t,unit))}</text>`});
  const step=Math.ceil(labels.length/Math.max(2,Math.floor((W-m.l-m.r)/78))); labels.forEach((l,i)=>{if(i%step===0||i===labels.length-1)s+=`<text x="${X(i)}" y="${H-10}" text-anchor="middle" font-size="11" fill="var(--mut)">${esc(l)}</text>`});
  if(mn<0&&mx>0)s+=`<line x1="${m.l}" x2="${W-m.r}" y1="${Y(0)}" y2="${Y(0)}" stroke="var(--mut)" stroke-dasharray="3 3"/>`;
  ser.forEach(se=>{let d='',pen=false,pts='';se.vals.forEach((v,i)=>{if(v==null||!isFinite(v)){pen=false;return}d+=(pen?'L':'M')+X(i).toFixed(1)+' '+Y(v).toFixed(1)+' ';pen=true;pts+=`<circle cx="${X(i).toFixed(1)}" cy="${Y(v).toFixed(1)}" r="3" fill="${se.color}"/>`});s+=`<path d="${d}" fill="none" stroke="${se.color}" stroke-width="2.2" stroke-linejoin="round"/>${pts}`});
  s+=`<line id="hv" x1="0" x2="0" y1="${m.t}" y2="${H-m.b}" stroke="var(--mut)" opacity="0"/><rect id="hr" x="${m.l}" y="${m.t}" width="${W-m.l-m.r}" height="${H-m.t-m.b}" fill="transparent"/></svg><div class="tip" style="display:none"></div>`;
  el.style.position='relative'; el.innerHTML=s; const tip=el.querySelector('.tip'),hv=el.querySelector('#hv'),hr=el.querySelector('#hr');
  hr.addEventListener('mousemove',e=>{const r=el.getBoundingClientRect(),x=(e.clientX-r.left)*(W/r.width);const i=Math.max(0,Math.min(labels.length-1,Math.round((x-m.l)/((W-m.l-m.r)/Math.max(1,labels.length-1)))));hv.setAttribute('x1',X(i));hv.setAttribute('x2',X(i));hv.setAttribute('opacity',.5);
    tip.style.display='block';tip.innerHTML='<b>'+esc(labels[i])+'</b><br>'+ser.map(se=>`<span style="color:${se.color}">●</span> ${esc(se.name)}: ${esc(fmt(se.vals[i],unit))}`).join('<br>');
    const tx=Math.min(r.width-tip.offsetWidth-6,Math.max(6,(X(i)*(r.width/W))+12));tip.style.left=tx+'px';tip.style.top='10px';});
  hr.addEventListener('mouseleave',()=>{tip.style.display='none';hv.setAttribute('opacity',0)});
}
function fmtAxis(v,unit){if(unit==='%')return v+'%';const a=Math.abs(v);if(a>=1e5)return +(v/1e5).toFixed(a>=1e6?0:1)+' lakh cr';if(a>=1e3)return v.toLocaleString('en-IN');return String(+v.toFixed(2));}
function layout(active){
  const nav=[['index.html','Companies','home'],['compare.html','Compare','compare'],['downloads.html','Downloads','dl'],['about.html','About &amp; data quality','about']];
  document.body.insertAdjacentHTML('afterbegin',`<header class="top"><div class="wrap"><a class="brand" href="index.html"><svg viewBox="0 0 28 28"><rect width="28" height="28" rx="7" fill="var(--acc)"/><path d="M6 20l5-6 4 3 7-9" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg><span>NSE Annual Report Data</span></a><nav>${nav.map(n=>`<a href="${n[0]}" class="${n[2]===active?'on':''}">${n[1]}</a>`).join('')}</nav><a class="cmpchip" id="cmpchip" href="compare.html"></a></div></header>`);
  document.body.insertAdjacentHTML('beforeend','<div class="wrap"><footer>Data derived from publicly filed annual reports of NSE-listed companies. Extraction is automatic and can contain errors: check anything important against the original report. Data CC BY 4.0, code MIT.</footer></div>');
  updChip();
}
function getCmp(){try{return JSON.parse(localStorage.getItem('cmp')||'[]')}catch(e){return window.__cmp||[]}}
function setCmp(a){window.__cmp=a;try{localStorage.setItem('cmp',JSON.stringify(a))}catch(e){}updChip()}
function updChip(){const c=document.getElementById('cmpchip');if(!c)return;const a=getCmp();c.classList.toggle('show',a.length>0);c.textContent='Compare ('+a.length+')';c.href='compare.html?c='+a.map(encodeURIComponent).join(',')}
const api={COLORS,KEYM,RATIOS,KIND,fyLabel,esc,fmt,pickBasis,series,toCSV,download,niceTicks,lineChart,layout,getCmp,setCmp,updChip};
if(typeof module!=='undefined')module.exports=api; else root.CM=api;
})(typeof window!=='undefined'?window:globalThis);
