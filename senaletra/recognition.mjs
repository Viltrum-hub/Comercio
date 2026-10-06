export const BASIC=['A','B','I','L','V','W','Y'];
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,(a.z||0)-(b.z||0));
export function features(p){
 if(!Array.isArray(p)||p.length!==21)return null;
 const scale=distance(p[0],p[9]);if(scale<.02)return null;
 const sign=p[5].x<p[17].x?1:-1;
 return p.slice(1).flatMap(q=>[(q.x-p[0].x)*sign/scale,(q.y-p[0].y)/scale,((q.z||0)-(p[0].z||0))/scale]);
}
const rms=(a,b)=>Math.sqrt(a.reduce((s,x,i)=>s+(x-b[i])**2,0)/a.length);
export function classify(p,samples={}){
 const f=features(p);if(!f)return {label:null,source:'Acerca la mano'};
 const ranks=Object.entries(samples).filter(([,v])=>v.length>=12).map(([k,v])=>[k,v.map(a=>rms(a,f)).sort((a,b)=>a-b).slice(0,5).reduce((a,b)=>a+b,0)/5]).sort((a,b)=>a[1]-b[1]);
 if(ranks.length){if(ranks[0][1]<.14&&(!ranks[1]||ranks[1][1]-ranks[0][1]>.03))return {label:ranks[0][0],source:'Tu calibración · posición',distance:ranks[0][1]};return {label:null,source:'Posición ambigua · añade ejemplos'};}
 const scale=distance(p[0],p[9]);
 const ext=[8,12,16,20].map(t=>distance(p[t],p[0])>distance(p[t-2],p[0])*1.2&&distance(p[t],p[t-3])>scale*.55);
 const folded=[8,12,16,20].map(t=>distance(p[t],p[0])<distance(p[t-2],p[0])*1.1);
 const out=distance(p[4],p[5])>scale*.65;const [i,m,r,l]=ext;let label=null;
 if(i&&m&&r&&l&&!out)label='B';else if(i&&!m&&!r&&!l&&folded.slice(1).every(Boolean)&&out)label='L';else if(!i&&!m&&!r&&l&&folded.slice(0,3).every(Boolean))label=out?'Y':'I';else if(i&&m&&r&&!l&&folded[3]&&!out)label='W';else if(i&&m&&!r&&!l&&folded[2]&&folded[3]&&distance(p[8],p[12])>scale*.35&&!out)label='V';else if(folded.every(Boolean)&&p[4].y<p[6].y&&distance(p[4],p[5])<scale*.65&&distance(p[4],p[17])>scale*.8)label='A';
 return {label,source:label?'Reglas iniciales · referencia por validar':'Sin coincidencia · calibra una seña'};
}
export function resample(seq,count=24){
 if(seq.length<2)return null;
 return Array.from({length:count},(_,i)=>{const pos=i*(seq.length-1)/(count-1),lo=Math.floor(pos),hi=Math.min(seq.length-1,lo+1),t=pos-lo;return seq[lo].map((x,j)=>x*(1-t)+seq[hi][j]*t);});
}
export function sequenceFeatures(frames){
 if(frames.length<8)return null;
 const p=frames[0],scale=distance(p[0],p[9]),origin=p[0],sign=p[5].x<p[17].x?1:-1;
 if(scale<.02)return null;
 return resample(frames.map(p=>[...features(p),(p[0].x-origin.x)*sign/scale,(p[0].y-origin.y)/scale]));
}
export function dtw(a,b){
 let prev=Array(b.length+1).fill(Infinity);prev[0]=0;
 for(let i=1;i<=a.length;i++){const row=Array(b.length+1).fill(Infinity);for(let j=1;j<=b.length;j++)row[j]=rms(a[i-1],b[j-1])+Math.min(prev[j],row[j-1],prev[j-1]);prev=row;}
 return prev[b.length]/Math.max(a.length,b.length);
}
export function classifySequence(seq,examples){
 const ranks=Object.entries(examples).filter(([,v])=>v.length>=2).map(([label,v])=>({label,score:Math.min(...v.map(x=>dtw(seq,x)))})).sort((a,b)=>a.score-b.score);
 if(!ranks.length)return {label:null,source:'Guarda al menos 2 ejemplos de movimiento por seña'};
 if(ranks[0].score>.22||(ranks[1]&&ranks[1].score-ranks[0].score<.035))return {label:null,source:'Movimiento sin coincidencia clara · añade ejemplos'};
 return {label:ranks[0].label,source:'Tus ejemplos · movimiento',distance:ranks[0].score};
}
export function validSequence(s){return Array.isArray(s)&&s.length===24&&s.every(v=>Array.isArray(v)&&v.length===62&&v.every(x=>Number.isFinite(x)&&Math.abs(x)<100));}
