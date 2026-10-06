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
