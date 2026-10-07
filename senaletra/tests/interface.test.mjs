import fs from 'node:fs';import assert from 'node:assert/strict';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const nodes=new Map();
function element(id=''){return {id,hidden:false,disabled:false,value:'',checked:false,textContent:'',options:[],children:[],style:{},dataset:{},classList:{add(){},remove(){},toggle(){}},append(...xs){this.children.push(...xs);if(id==='trainLetter'){this.options.push(...xs);if(!this.value)this.value=xs[0].value;}},replaceChildren(){this.children=[];},querySelector(){return element();},addEventListener(){},showModal(){this.open=true;},close(){this.open=false;},click(){},getContext(){return {clearRect(){}};}};}
const ids=[...html.matchAll(/id="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);for(const id of ids)nodes.set(id,element(id));
const tabs=['translate','practice','train','learn'].map(name=>Object.assign(element(),{dataset:{tab:name}})),results=element(),workspace=element();
globalThis.document={getElementById:id=>nodes.get(id),createElement:()=>element(),querySelector:s=>s==='.results'?results:workspace,querySelectorAll:s=>s==='[data-tab]'?tabs:[],addEventListener(){},hidden:false};
globalThis.window={addEventListener(){},confirm:()=>true,open(){}};globalThis.localStorage={getItem(){return null;},setItem(){},removeItem(){}};
const app=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8').replace("'./recognition.mjs'",JSON.stringify(new URL('../recognition.mjs',import.meta.url).href));
await import('data:text/javascript;base64,'+Buffer.from(app).toString('base64'));
tabs.find(x=>x.dataset.tab==='train').onclick();assert.equal(nodes.get('trainView').hidden,false);assert.equal(results.hidden,true);
nodes.get('trainLetter').value='J';nodes.get('trainLetter').onchange();assert.equal(nodes.get('captureMode').value,'motion');assert.ok(nodes.get('availabilityBadge').textContent.includes('entrenamiento'));
nodes.get('trainLetter').value='C';nodes.get('trainLetter').onchange();assert.equal(nodes.get('captureMode').value,'static');assert.ok(nodes.get('availabilityBadge').textContent.includes('experimental'));
nodes.get('guideButton').onclick();assert.equal(nodes.get('guide').open,true);assert.equal(nodes.get('alphabet').children.length,30);
tabs.find(x=>x.dataset.tab==='translate').onclick();assert.equal(nodes.get('trainView').hidden,true);assert.equal(results.hidden,false);
console.log('Interface integration passed: app initialization, training navigation, J/C mode selection, availability badges, 30 alphabet references.');
// Exercise a reviewed capture and reload it through actual serialization.
const persisted=new Map();globalThis.localStorage={getItem:k=>persisted.get(k)||null,setItem:(k,v)=>persisted.set(k,v)};
const captureApp=app+"\npendingExample={label:'C',mode:'static',values:Array.from({length:12},()=>Array(60).fill(.1))};await $('saveCapture').onclick();globalThis.savedSamples=samples;";
await import('data:text/javascript;base64,'+Buffer.from(captureApp).toString('base64'));
assert.equal(JSON.parse(persisted.get('senaletra.learning.v2')).samples.C.length,12);
assert.ok(nodes.get('storageStatus').textContent.includes('Datos guardados'));
const reloadApp=app+'\nglobalThis.reloadedSamples=samples;';await import('data:text/javascript;base64,'+Buffer.from(reloadApp).toString('base64'));
assert.equal(globalThis.reloadedSamples.C.length,12);
console.log('Persistence passed: capture save, serialized data and reload restoration.');
const multiApp=app+`\nfor(let i=0;i<3;i++){pendingExample={label:'C',mode:'static',values:Array.from({length:16},()=>Array(60).fill(.2+i*.1))};await $('saveCapture').onclick();if($('capture').disabled)throw Error('Cannot capture another example');}
for(let i=0;i<3;i++){pendingExample={label:'J',mode:'motion',values:Array.from({length:24},()=>Array(62).fill(i*.1))};await $('saveCapture').onclick();}
globalThis.multiSizes=captureSizes;`;
await import('data:text/javascript;base64,'+Buffer.from(multiApp).toString('base64'));
const multiple=JSON.parse(persisted.get('senaletra.learning.v2'));assert.equal(multiple.captureSizes.C.length,4);assert.equal(multiple.samples.C.length,60);assert.equal(multiple.motion.J.length,3);
const multiReload=app+'\nglobalThis.multiReload={samples,motion,captureSizes};';await import('data:text/javascript;base64,'+Buffer.from(multiReload).toString('base64'));
assert.equal(globalThis.multiReload.captureSizes.C.length,4);assert.equal(globalThis.multiReload.motion.J.length,3);
console.log('Multiple captures passed: repeated C/J saves accumulate, next capture is enabled, counts and data survive reload.');
