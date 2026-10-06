// Interfaz clásica: también muestra ayuda si se abre por doble clic.
// Clasificación experimental propia; MediaPipe solo proporciona los puntos de la mano.
const BASIC = ['A','B','I','L','V','W','Y'];
const STATIC = 'ABCDEFGHIKLMNOPQRSTUVWXY'.split('');
const d=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,(a.z||0)-(b.z||0));
function features(p){
 const scale=d(p[0],p[9]);if(scale<.02)return null;
 const sign=p[5].x<p[17].x?1:-1;
 return p.slice(1).flatMap(q=>[(q.x-p[0].x)*sign/scale,(q.y-p[0].y)/scale,((q.z||0)-(p[0].z||0))/scale]);
}
function classify(p,samples={}){
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

const $=id=>document.getElementById(id), video=$('video'),canvas=$('overlay'),ctx=canvas.getContext('2d');
let model,stream,running=false,loading=false,raf,lastTime=-1,lastInfer=0,points=null,candidate=null,since=0,ready=false,latched=null,text='',practice=false,target='A',capture=null;
let samples={};try{const raw=JSON.parse(localStorage.getItem('senaletra.samples.v1')||'{}');for(const k of STATIC)if(Array.isArray(raw[k]))samples[k]=raw[k].filter(v=>Array.isArray(v)&&v.length===60&&v.every(Number.isFinite)).slice(-240);}catch{}
const connections=[[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[0,17],[17,18],[18,19],[19,20]];
const say=s=>$('message').textContent=s;
function counts(){$('sampleCounts').textContent=Object.entries(samples).filter(([,v])=>v.length).map(([k,v])=>`${k}: ${v.length} ejemplos`).join(' · ')||'Todavía no hay ejemplos guardados.';}
function resetDetection(){points=null;candidate=null;since=0;ready=false;$('letter').textContent='—';$('confirm').disabled=true;$('progress').style.width='0';}
function stop(){running=false;detectorActive=false;$('empty').hidden=false;cancelAnimationFrame(raf);if(stream)stream.getTracks().forEach(t=>t.stop());stream=null;video.srcObject=null;resetDetection();ctx.clearRect(0,0,canvas.width,canvas.height);setButton('pause','play','Reanudar cámara');$('switch').disabled=true;$('status').textContent='Cámara apagada';$('stable').textContent='Cámara apagada';if(capture){capture=null;$('capture').disabled=false;$('trainingStatus').textContent='Captura cancelada. No se guardaron ejemplos.';}}
function alertCamera(message){$('cameraAlert').hidden=false;$('cameraErrorText').textContent=message;}
function clearCameraAlert(){$('cameraAlert').hidden=true;}
function timeout(promise,ms,message){let t;return Promise.race([promise,new Promise((_,reject)=>{t=setTimeout(()=>reject(Error(message)),ms);})]).finally(()=>clearTimeout(t));}
let modelLoading=null,detectorActive=false;
async function loadDetector(){
 if(model)return model;
 if(modelLoading)return modelLoading;
 modelLoading=(async()=>{const {FilesetResolver,HandLandmarker}=await import('./vendor/vision_bundle.mjs');const files=await FilesetResolver.forVisionTasks('./vendor/wasm');return HandLandmarker.createFromOptions(files,{baseOptions:{modelAssetPath:'./vendor/hand_landmarker.task',delegate:'CPU'},runningMode:'VIDEO',numHands:1,minHandDetectionConfidence:.65,minHandPresenceConfidence:.65,minTrackingConfidence:.6});})();
 try{model=await modelLoading;return model;}finally{modelLoading=null;}
}
async function enableDetector(){
 $('retryDetector').disabled=true;
 try{await timeout(loadDetector(),30000,'El detector tarda demasiado en cargar. Comprueba que extrajiste toda la carpeta vendor.');if(!running)return;detectorActive=true;clearCameraAlert();$('status').textContent='Buscando mano';$('stable').textContent='Muestra tu mano';lastTime=-1;lastInfer=0;cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);}
 catch(e){if(running){detectorActive=false;resetDetection();$('status').textContent='Cámara activa · detector pendiente';$('stable').textContent='Detector no disponible';alertCamera('La cámara está encendida, pero el detector no pudo cargar. Abre desde localhost y conserva la carpeta vendor completa. '+e.message);}}
 finally{$('retryDetector').disabled=false;}
}
async function start(deviceId){
 if(loading)return;loading=true;clearCameraAlert();$('start').disabled=true;$('pause').disabled=true;setButton('start','camera','Solicitando cámara…');$('status').textContent='Esperando permiso';
 try{
 if(location.protocol==='file:')throw Error('Abriste index.html con doble clic. Extrae el ZIP, copia senaletra en C:\\xampp\\htdocs, inicia Apache y abre http://localhost/senaletra/. También puedes usar INICIAR_WINDOWS.bat si tienes Python.');
 if(!window.isSecureContext||!navigator.mediaDevices?.getUserMedia)throw Error('La cámara requiere localhost o HTTPS. Abre http://localhost/senaletra/ en este mismo equipo.');
 stream=await navigator.mediaDevices.getUserMedia({video:deviceId?{deviceId:{exact:deviceId}}:{width:{ideal:960},height:{ideal:600},facingMode:'user'},audio:false});
 video.srcObject=stream;await video.play();running=true;latched=null;$('empty').hidden=true;setButton('pause','pause','Pausar cámara');$('pause').disabled=false;$('switch').disabled=false;$('status').textContent='Cámara activa · cargando detector';$('stable').textContent='Preparando reconocimiento';
 // El video ya es visible antes de cargar la IA.
 enableDetector();
 }catch(e){stop();$('empty').hidden=false;const msg=e.name==='NotAllowedError'?'El navegador o Windows bloqueó la cámara. Abre los permisos del sitio (junto a la dirección), permite Cámara y vuelve a intentar.':e.name==='NotFoundError'?'No se encontró una cámara. Conéctala y vuelve a intentar.':e.name==='NotReadableError'?'No se puede usar la cámara. Cierra Teams, Zoom u otras aplicaciones y revisa los permisos de cámara de Windows.':e.message;$('status').textContent='No se pudo iniciar';say(msg);alertCamera(msg);}
 finally{loading=false;$('start').disabled=false;setButton('start','camera','Activar cámara');}
}
// Alias para la explicación de error dentro del panel.
const emptyP=$('empty').querySelector('p');
function draw(p){canvas.width=video.videoWidth;canvas.height=video.videoHeight;ctx.clearRect(0,0,canvas.width,canvas.height);if(!p)return;ctx.strokeStyle='#55deca';ctx.fillStyle='#80ffea';ctx.lineWidth=2;for(const [a,b] of connections){ctx.beginPath();ctx.moveTo(p[a].x*canvas.width,p[a].y*canvas.height);ctx.lineTo(p[b].x*canvas.width,p[b].y*canvas.height);ctx.stroke();}for(const q of p){ctx.beginPath();ctx.arc(q.x*canvas.width,q.y*canvas.height,4,0,Math.PI*2);ctx.fill();}}
function loop(now){if(!running||!detectorActive)return;try{if(video.readyState>=2&&video.currentTime!==lastTime&&now-lastInfer>70){lastTime=video.currentTime;lastInfer=now;const result=model.detectForVideo(video,now);points=result.landmarks[0]||null;draw(points);
 if(!points){resetDetection();latched=null;$('status').textContent='Buscando mano';$('stable').textContent='Muestra tu mano';}
 else{$('status').textContent='Mano detectada';const r=classify(points,samples);if(r.letter!==candidate){candidate=r.letter;since=now;ready=false;}const elapsed=now-since;ready=!!candidate&&elapsed>=650;$('letter').textContent=candidate||'—';$('stable').textContent=candidate?(ready?'Seña estable · '+r.source:'Mantén la posición'):r.source;$('confirm').disabled=!ready||!!capture;$('progress').style.width=(candidate?Math.min(100,elapsed/15):0)+'%';if(candidate&&latched&&candidate!==latched&&ready)latched=null;if($('auto').checked&&elapsed>=1500&&ready&&latched!==candidate&&!capture)confirm();}
 if(capture){if(points){const f=features(points);if(f)capture.values.push(f);}const remaining=Math.max(0,Math.ceil((capture.end-now)/1000));$('trainingStatus').textContent=`Mantén la seña ${capture.letter}… ${remaining} s`;if(now>=capture.end){const c=capture;capture=null;$('capture').disabled=false;if(c.values.length<12){$('trainingStatus').textContent='Faltan muestras. Mantén la mano visible e inténtalo otra vez.';}else{samples[c.letter]=[...(samples[c.letter]||[]),...c.values].slice(-240);try{localStorage.setItem('senaletra.samples.v1',JSON.stringify(samples));$('trainingStatus').textContent=`Letra ${c.letter} guardada. Repite con pequeñas variaciones.`;}catch{$('trainingStatus').textContent='Ejemplos disponibles en esta sesión; el navegador no permitió guardarlos.';}counts();resetDetection();}}}
 }}catch(e){console.error('Error de detección',e);detectorActive=false;resetDetection();ctx.clearRect(0,0,canvas.width,canvas.height);$('status').textContent='Cámara activa · detector detenido';$('stable').textContent='Detector no disponible';alertCamera('El video sigue activo, pero falló el reconocimiento. Prueba Reintentar detector. Si persiste, habilita la aceleración gráfica del navegador y vuelve a abrirlo.');}raf=running&&detectorActive?requestAnimationFrame(loop):null;}
function render(){const w=$('word');w.replaceChildren();if(!text){const e=document.createElement('span');e.className='placeholder';e.textContent='Tu palabra aparecerá aquí';w.append(e);}for(const c of text){const e=document.createElement('span');e.className='tile'+(c===' '?' space':'');e.textContent=c===' '?'·':c;w.append(e);}w.scrollTop=w.scrollHeight;}
function confirm(){if(!ready||!candidate||capture)return;if(practice){$('practiceFeedback').textContent=candidate===target?'¡Correcto! Puedes probar otra letra.':`Se detectó ${candidate}. Intenta formar ${target}.`;latched=candidate;return;}if(text.length>=100){say('Límite de 100 caracteres. Borra el mensaje para empezar otro.');return;}text+=candidate;latched=candidate;render();say(`Letra ${candidate} añadida. Retira la mano para repetirla en modo automático.`);}
$('retryDetector').onclick=()=>{if(running)enableDetector();else start();};$('start').onclick=()=>start();$('pause').onclick=()=>running?stop():start();$('confirm').onclick=confirm;
$('switch').onclick=async()=>{try{const devices=(await navigator.mediaDevices.enumerateDevices()).filter(d=>d.kind==='videoinput');if(devices.length<2){say('Solo hay una cámara disponible.');return;}const current=stream?.getVideoTracks()[0].getSettings().deviceId;const next=devices[(devices.findIndex(d=>d.deviceId===current)+1)%devices.length];stop();await start(next.deviceId);}catch{say('No fue posible cambiar de cámara.');}};
function mirror(){video.classList.toggle('mirror',$('mirror').checked);canvas.classList.toggle('mirror',$('mirror').checked);} $('mirror').onchange=mirror;mirror();
$('erase').onclick=()=>{text=text.slice(0,-1);render();};$('space').onclick=()=>{if(text.length<100&&text&&!text.endsWith(' ')){text+=' ';render();}};$('clear').onclick=()=>{if(!text||window.confirm('¿Borrar toda la palabra o mensaje?')){text='';render();}};
$('speak').onclick=()=>{if(!text.trim()){say('Primero forma una palabra.');return;}if(!('speechSynthesis'in window)){say('Este navegador no admite lectura en voz alta.');return;}speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='es-ES';u.rate=.85;u.onerror=()=>say('No se pudo reproducir la voz. Comprueba las voces instaladas.');speechSynthesis.speak(u);};
for(const btn of document.querySelectorAll('[data-close]'))btn.onclick=()=>$(btn.dataset.close).close();
$('guideButton').onclick=()=>$('guide').showModal();$('settingsButton').onclick=()=>{counts();$('settings').showModal();};
function detail(c){$('detailTitle').textContent='Letra '+c;$('detailImage').src=`assets/${c}.png`;$('detailImage').alt=`Seña de la letra ${c}, según la referencia proporcionada`;$('detailText').textContent=['J','Z'].includes(c)?'Esta letra requiere movimiento. Su reconocimiento aún no está implementado.':BASIC.includes(c)?'Disponible en detección inicial. Si se confunde, calibra esta letra con tu mano.':'Para reconocer esta letra, guarda ejemplos en Calibración y ajustes.';$('detail').showModal();}
for(const c of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'){const b=document.createElement('button'),img=document.createElement('img'),label=document.createElement('strong');img.src=`assets/${c}.png`;img.alt='Seña '+c;label.textContent=c;b.append(img,label);if('JZ'.includes(c)){const s=document.createElement('small');s.textContent='Movimiento';b.append(s);}b.onclick=()=>detail(c);$('alphabet').append(b);}
for(const c of STATIC){const o=document.createElement('option');o.value=o.textContent=c;$('trainLetter').append(o);}
$('trainGuide').onclick=()=>detail($('trainLetter').value);$('targetGuide').onclick=()=>detail(target);
$('capture').onclick=()=>{if(!running||!points){$('trainingStatus').textContent='Activa la cámara y muestra tu mano antes de capturar.';return;}capture={letter:$('trainLetter').value,end:performance.now()+2200,values:[]};$('capture').disabled=true;};
$('resetSamples').onclick=()=>{if(window.confirm('¿Borrar todos tus ejemplos de calibración?')){samples={};try{localStorage.removeItem('senaletra.samples.v1');}catch{}counts();resetDetection();}};
$('settings').addEventListener('close',()=>{if(capture){capture=null;$('capture').disabled=false;$('trainingStatus').textContent='Captura cancelada.';}});
function mode(on){practice=on;$('practiceBar').hidden=!on;$('practice').classList.toggle('active',on);$('translator').classList.toggle('active',!on);$('practiceFeedback').textContent='';latched=null;}
$('practice').onclick=()=>mode(true);$('translator').onclick=()=>mode(false);$('nextTarget').onclick=()=>{const available=[...new Set([...BASIC,...Object.keys(samples).filter(k=>samples[k].length>=12)])].filter(k=>k!==target);target=available[Math.floor(Math.random()*available.length)];$('target').textContent=target;$('practiceFeedback').textContent='';latched=null;};
$('printGuide').onclick=()=>window.open('guia.html','_blank','noopener');
window.addEventListener('pagehide',stop);document.addEventListener('visibilitychange',()=>{if(document.hidden&&running){stop();say('Cámara pausada al cambiar de pestaña.');}});
if(location.protocol==='file:'){say('Usa INICIAR_WINDOWS.bat o abre http://localhost/senaletra con XAMPP.');emptyP.textContent='Para activar la cámara abre este proyecto desde localhost. Consulta LEEME.html.';}
counts();

if(location.protocol==='file:')alertCamera('Para usar la cámara, abre el proyecto desde localhost. Pulsa Activar cámara para ver las instrucciones.');
