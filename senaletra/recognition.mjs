// Clasificación experimental propia; MediaPipe solo proporciona los puntos de la mano.
export const BASIC = ['A','B','I','L','V','W','Y'];
export const STATIC = 'ABCDEFGHIKLMNOPQRSTUVWXY'.split('');
const d=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,(a.z||0)-(b.z||0));
export function features(p){
 const scale=d(p[0],p[9]);if(scale<.02)return null;
 const sign=p[5].x<p[17].x?1:-1;
 return p.slice(1).flatMap(q=>[(q.x-p[0].x)*sign/scale,(q.y-p[0].y)/scale,((q.z||0)-(p[0].z||0))/scale]);
}
export function classify(p,samples={}){
 const f=features(p);if(!f)return {letter:null,source:'Mano demasiado lejos'};
 const ranks=Object.entries(samples).filter(([k,v])=>STATIC.includes(k)&&v.length>=12).map(([k,v])=>{
 const ds=v.map(a=>Math.sqrt(a.reduce((s,x,i)=>s+(x-f[i])**2,0)/f.length)).sort((a,b)=>a-b);
 return [k,ds.slice(0,5).reduce((a,b)=>a+b,0)/5];}).sort((a,b)=>a[1]-b[1]);
 if(ranks.length&&ranks[0][1]<.12&&(!ranks[1]||ranks[1][1]-ranks[0][1]>.035))return {letter:ranks[0][0],source:'Calibración personal'};
 // Reglas conservadoras para un subconjunto de poses frontales. No confundir con un modelo del alfabeto completo.
 const scale=d(p[0],p[9]);
 const ext=[8,12,16,20].map(t=>d(p[t],p[0])>d(p[t-2],p[0])*1.2&&d(p[t],p[t-3])>scale*.55);
 const folded=[8,12,16,20].map(t=>d(p[t],p[0])<d(p[t-2],p[0])*1.1);
 const thumbOut=d(p[4],p[5])>scale*.65;
 const [i,m,r,l]=ext;let letter=null;
 if(i&&m&&r&&l&&!thumbOut)letter='B';
 else if(i&&!m&&!r&&!l&&folded.slice(1).every(Boolean)&&thumbOut)letter='L';
 else if(!i&&!m&&!r&&l&&folded.slice(0,3).every(Boolean))letter=thumbOut?'Y':'I';
 else if(i&&m&&r&&!l&&folded[3]&&!thumbOut)letter='W';
 else if(i&&m&&!r&&!l&&folded[2]&&folded[3]&&d(p[8],p[12])>scale*.35&&!thumbOut)letter='V';
 else if(folded.every(Boolean)&&p[4].y<p[6].y&&d(p[4],p[5])<scale*.65&&d(p[4],p[17])>scale*.8)letter='A';
 return {letter,source:letter?'Detección inicial · experimental':'Seña no reconocida · prueba calibrar'};
}
