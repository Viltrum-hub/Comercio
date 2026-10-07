export const BASIC=['A','B','C','I','L','V','W','Y'];
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,(a.z||0)-(b.z||0));
export function features(p){
 if(!Array.isArray(p)||p.length!==21)return null;
 const scale=distance(p[0],p[9]);if(scale<.02)return null;
 const sign=p[5].x<p[17].x?1:-1;
 return p.slice(1).flatMap(q=>[(q.x-p[0].x)*sign/scale,(q.y-p[0].y)/scale,((q.z||0)-(p[0].z||0))/scale]);
}
export function rms(a,b){let sum=0;for(let i=0;i<a.length;i++){const d=a[i]-b[i];sum+=d*d;}return Math.sqrt(sum/a.length);}
const bendCache=new WeakMap(),frameCache=new WeakMap();
function bends(f){
 const cached=bendCache.get(f);if(cached)return cached;
 const cosine=(a,b,c)=>{const ia=(a-1)*3,ib=(b-1)*3,ic=(c-1)*3;let dot=0,nu=0,nv=0;for(let j=0;j<3;j++){const u=f[ia+j]-f[ib+j],v=f[ic+j]-f[ib+j];dot+=u*v;nu+=u*u;nv+=v*v;}return nu&&nv?dot/Math.sqrt(nu*nv):0;};
 const values=[];for(const base of [5,9,13,17])values.push(cosine(base,base+1,base+2),cosine(base+1,base+2,base+3));bendCache.set(f,values);return values;
}
export function shapeDistance(a,b){return .75*rms(a,b)+.25*rms(bends(a),bends(b));}
function preparedFrame(f){let out=frameCache.get(f);if(!out){out={shape:f.slice(0,60),path:f.slice(60)};frameCache.set(f,out);}return out;}
function sequenceCost(a,b){if(a.length!==62||b.length!==62)return rms(a,b);const x=preparedFrame(a),y=preparedFrame(b);return .7*shapeDistance(x.shape,y.shape)+.3*rms(x.path,y.path);}
function nearestFive(v,f){const best=[Infinity,Infinity,Infinity,Infinity,Infinity];for(const a of v){const d=shapeDistance(a,f);if(d>=best[4])continue;let i=4;while(i>0&&d<best[i-1]){best[i]=best[i-1];i--;}best[i]=d;}return best.reduce((a,b)=>a+b,0)/5;}
export function isCPose(p){
 const scale=distance(p[0],p[9]);if(scale<.02)return false;
 const curved=bends(features(p)).filter((_,i)=>i%2===0).filter(c=>c>-.94&&c<.1).length;
 const gap=distance(p[4],p[8])/scale;
 const fingers=[8,12,16,20].filter(t=>{const reach=distance(p[t],p[t-3])/scale;return reach>.48&&reach<1.55;}).length;
 return curved>=3&&fingers>=3&&gap>.5&&gap<1.65;
}
export function classify(p,samples={}){
 const f=features(p);if(!f)return {label:null,source:'Acerca la mano'};
 const ranks=Object.entries(samples).filter(([,v])=>v.length>=12).map(([k,v])=>[k,nearestFive(v,f)]).sort((a,b)=>a[1]-b[1]);
 if(ranks.length){if(ranks[0][1]<.14&&(!ranks[1]||ranks[1][1]-ranks[0][1]>.03))return {label:ranks[0][0],source:'Tu calibración · posición',distance:ranks[0][1]};if(ranks.length>1&&ranks[0][1]<.18&&ranks[1][1]-ranks[0][1]<=.03)return {label:null,source:'Posición ambigua · añade ejemplos'};}
 const scale=distance(p[0],p[9]);
 const ext=[8,12,16,20].map(t=>distance(p[t],p[0])>distance(p[t-2],p[0])*1.2&&distance(p[t],p[t-3])>scale*.55);
 const folded=[8,12,16,20].map(t=>distance(p[t],p[0])<distance(p[t-2],p[0])*1.1);
 const out=distance(p[4],p[5])>scale*.65;const [i,m,r,l]=ext;let label=null;
 if(isCPose(p))label='C';else if(i&&m&&r&&l&&!out)label='B';else if(i&&!m&&!r&&!l&&folded.slice(1).every(Boolean)&&out)label='L';else if(!i&&!m&&!r&&l&&folded.slice(0,3).every(Boolean))label=out?'Y':'I';else if(i&&m&&r&&!l&&folded[3]&&!out)label='W';else if(i&&m&&!r&&!l&&folded[2]&&folded[3]&&distance(p[8],p[12])>scale*.35&&!out)label='V';else if(folded.every(Boolean)&&p[4].y<p[6].y&&distance(p[4],p[5])<scale*.65&&distance(p[4],p[17])>scale*.8)label='A';
 if(label&&samples[label]?.length>=12)return {label:null,source:'Sin coincidencia con tu calibración · añade ejemplos'};
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
 for(let i=1;i<=a.length;i++){const row=Array(b.length+1).fill(Infinity);for(let j=1;j<=b.length;j++)row[j]=sequenceCost(a[i-1],b[j-1])+Math.min(prev[j],row[j-1],prev[j-1]);prev=row;}
 return prev[b.length]/Math.max(a.length,b.length);
}
function tipTrack(seq,tip){const offset=(tip-1)*3;const origin=[seq[0][offset]+seq[0][60],seq[0][offset+1]+seq[0][61]];return seq.map(f=>[f[offset]+f[60]-origin[0],f[offset+1]+f[61]-origin[1]]);}
function motionDistance(a,b,label){const tip=label==='J'?20:8;return .65*dtw(a,b)+.35*dtw(tipTrack(a,tip),tipTrack(b,tip));}
export function classifySequence(seq,examples){
 if(!validSequence(seq))return {label:null,source:'Captura de movimiento incompleta'};
 const ranks=Object.entries(examples).filter(([,v])=>v.length>=2).map(([label,v])=>({label,score:v.map(x=>motionDistance(seq,x,label)).sort((a,b)=>a-b).slice(0,2).reduce((sum,x)=>sum+x,0)/2})).sort((a,b)=>a.score-b.score);
 if(!ranks.length)return {label:null,source:'Guarda al menos 2 ejemplos de movimiento por seña'};
 if(ranks[0].score>.22||(ranks[1]&&ranks[1].score-ranks[0].score<.035))return {label:null,source:'Movimiento sin coincidencia clara · añade ejemplos'};
 return {label:ranks[0].label,source:'Tus ejemplos · movimiento',distance:ranks[0].score};
}
export function validSequence(s){return Array.isArray(s)&&s.length===24&&s.every(v=>Array.isArray(v)&&v.length===62&&v.every(x=>Number.isFinite(x)&&Math.abs(x)<100));}

export function qualityOfStatic(frames){
 const fs=frames.map(features).filter(Boolean);if(fs.length<12)return {ok:false,reason:'Faltan fotogramas con la mano completa.'};
 const mean=fs[0].map((_,j)=>fs.reduce((sum,f)=>sum+f[j],0)/fs.length);
 const variation=fs.reduce((sum,f)=>sum+shapeDistance(f,mean),0)/fs.length;
 return {ok:variation<.1,reason:variation<.1?'Posición estable':'La posición cambió demasiado. Repite manteniendo la seña.',variation};
}
export class MotionSegmenter{
 constructor(){this.reset();}
 reset(){this.previous=null;this.buffer=[];this.active=null;this.high=0;this.quietSince=null;}
 push(p,now){
 if(!p){this.reset();return null;}
 let speed=0;
 if(this.previous){const dt=Math.max(.04,(now-this.previous.now)/1000),scale=distance(p[0],p[9]);speed=[0,4,8,12,16,20].reduce((sum,i)=>sum+distance(p[i],this.previous.p[i])/Math.max(.02,scale),0)/6/dt;}
 this.previous={p,now};this.buffer.push({p,now});this.buffer=this.buffer.filter(f=>now-f.now<400);
 if(!this.active){this.high=speed>.22?this.high+1:0;if(this.high>=3){this.active={start:now,frames:this.buffer.map(x=>x.p)};this.quietSince=null;}return null;}
 this.active.frames.push(p);
 if(speed<.14)this.quietSince??=now;else this.quietSince=null;
 const duration=now-this.active.start;
 if(duration>12000){this.reset();return {error:'Movimiento demasiado largo. Realiza una sola seña.'};}
 if(duration>900&&this.quietSince!==null&&now-this.quietSince>850){const result={frames:this.active.frames.slice(0,-7)};this.reset();return result.frames.length>=8?result:null;}
 return null;
 }
}
