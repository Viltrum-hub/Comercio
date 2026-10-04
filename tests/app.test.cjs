const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');

// A narrow DOM fixture checks page startup and local state, not visual layout.
function boot(file,storage=new Map(),search=''){
  const html=fs.readFileSync(path.join(root,file),'utf8');
  const page=html.match(/<body data-page="([^"]+)"/)[1];
  const events=new Map();
  const nodes=new Map([...html.matchAll(/id="([^"]+)"/g)].map(m=>[m[1],{
    id:m[1],dataset:{},value:'',innerHTML:'',textContent:'',hidden:false,open:false,
    listeners:new Map(),classList:{add(){},remove(){}},
    addEventListener(name,fn){this.listeners.set(name,fn)},
    focus(){},append(){},contains(){return false},
    showModal(){this.open=true},close(){this.open=false},
    scrollIntoView(){},getBoundingClientRect(){return {left:0,right:100,top:0,bottom:100}},
  }]));
  const dialogs=[nodes.get('cartDialog'),nodes.get('modal')];
  const document={
    body:{dataset:{page},append(){}},activeElement:{tagName:'BODY',dataset:{}},
    querySelector(s){if(s==='dialog[open]')return dialogs.find(d=>d.open)||null;if(/^#[\w-]+$/.test(s))return nodes.get(s.slice(1))||null;return null},
    querySelectorAll(s){if(s==='dialog')return dialogs;if(s==='dialog[open]')return dialogs.filter(d=>d.open);return []},
    addEventListener(name,fn){events.set(name,fn)},
  };
  const context={document,location:{search,pathname:'/'+file,href:''},URLSearchParams,
    localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},
    navigator:{},crypto:require('node:crypto').webcrypto,history:{replaceState(){}},
    matchMedia:()=>({matches:true}),setTimeout:()=>0,clearTimeout(){},
    FormData:class{constructor(form){this.data=form.data}get(k){return this.data[k]}[Symbol.iterator](){return Object.entries(this.data)[Symbol.iterator]()}},
    addEventListener(name,fn){events.set('window:'+name,fn)},
  };
  context.window=context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(root,'core.js'),'utf8'),context);
  vm.runInContext(fs.readFileSync(path.join(root,'app.js'),'utf8'),context);
  return {context,nodes,events,storage,run:code=>vm.runInContext(code,context)};
}

test('las seis páginas arrancan con sus propios elementos',()=>{
  for(const file of ['index.html','productos.html','ofertas.html','favoritos.html','contacto.html','pedidos.html']){
    const app=boot(file);assert.equal(app.nodes.get('cartCount').textContent,0);
    if(file==='productos.html')assert.equal((app.nodes.get('products').innerHTML.match(/class="product-card"/g)||[]).length,40);
    if(file==='index.html')assert.equal((app.nodes.get('products').innerHTML.match(/class="product-card"/g)||[]).length,8);
  }
});
test('el carrito anterior se conserva y las modificaciones aparecen en otra página',()=>{
  const storage=new Map([['comercio-cart','{"tomate":2}'],['comercio-favorites','["pollo"]']]);
  const app=boot('productos.html',storage);assert.equal(app.nodes.get('cartCount').textContent,2);
  const button={dataset:{change:'pollo',delta:'1'},hasAttribute:()=>false};
  app.events.get('click')({target:{closest:()=>button}});
  assert.equal(app.nodes.get('cartCount').textContent,3);
  assert.equal(JSON.parse(storage.get('novamarket-cart')).pollo,1);
  const next=boot('favoritos.html',storage);assert.equal(next.nodes.get('cartCount').textContent,3);
  assert.match(next.nodes.get('products').innerHTML,/Pechuga de pollo/);
  assert.equal((next.nodes.get('products').innerHTML.match(/class="product-card"/g)||[]).length,1);
  storage.set('novamarket-cart','{}');app.events.get('window:pageshow')();assert.equal(app.nodes.get('cartCount').textContent,0);
});
test('buscar en ofertas y limpiar filtros mantiene solo productos con descuento',()=>{
  const app=boot('ofertas.html',new Map(),'?categoria=Carnes%20y%20pescados');
  assert.match(app.nodes.get('products').innerHTML,/Carne de res/);
  assert.doesNotMatch(app.nodes.get('products').innerHTML,/Pechuga de pollo/);
  app.run('browse()');
  assert.equal((app.nodes.get('products').innerHTML.match(/class="product-card"/g)||[]).length,app.run('products.filter(p=>p.old).length'));
});
test('el cupón aplicado persiste entre páginas y el formulario de contacto guarda solo una copia local',()=>{
  const storage=new Map([['novamarket-cart','{"tomate":2}']]);const app=boot('productos.html',storage);
  app.events.get('submit')({target:{id:'couponForm',data:{coupon:'bienvenido10'}},preventDefault(){}});
  const contact=boot('contacto.html',storage);assert.equal(contact.run('coupon'),'BIENVENIDO10');
  contact.events.get('submit')({target:{id:'contactForm',data:{name:'Estudiante',email:'demo@example.com',message:'Quiero conocer los productos.',subject:'Consulta de productos',consent:'on'},reset(){}},preventDefault(){}});
  assert.equal(JSON.parse(storage.get('novamarket-messages')).length,1);
  assert.match(contact.nodes.get('contactStatus').textContent,/No se ha enviado/);
});
