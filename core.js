(function(root){
  'use strict';
  const products=[
    {id:'tomate',name:'Tomates frescos',category:'Frutas y verduras',unit:'Bandeja · 500 g',price:175,old:220,art:'tomato',bg:'#f3f5e9',tag:'−20%',stock:25},
    {id:'aguacate',name:'Aguacate Hass',category:'Frutas y verduras',unit:'2 unidades',price:250,art:'avocado',bg:'#f1f4e7',tag:'Fresco',stock:20},
    {id:'leche',name:'Leche entera',category:'Lácteos y huevos',unit:'1 litro',price:160,art:'milk',bg:'#edf2f2',tag:'Esencial',stock:30},
    {id:'pan',name:'Pan artesanal',category:'Panadería',unit:'1 pieza · 400 g',price:295,old:350,art:'bread',bg:'#f8f1e7',tag:'−16%',stock:15},
    {id:'banano',name:'Bananos de temporada',category:'Frutas y verduras',unit:'Manojo · 1 kg',price:145,art:'banana',bg:'#f8f4e4',tag:'Fresco',stock:25},
    {id:'huevos',name:'Huevos frescos',category:'Lácteos y huevos',unit:'Cartón · 12 unidades',price:325,old:375,art:'eggs',bg:'#f4f1e8',tag:'−13%',stock:20},
    {id:'cafe',name:'Café molido',category:'Despensa',unit:'Bolsa · 340 g',price:495,art:'coffee',bg:'#f0eee8',tag:'Selección',stock:18},
    {id:'naranja',name:'Jugo de naranja',category:'Bebidas',unit:'1 litro',price:225,old:275,art:'juice',bg:'#f9f1de',tag:'−18%',stock:24},
    {id:'manzana',name:'Manzanas rojas',category:'Frutas y verduras',unit:'Bolsa · 4 unidades',price:280,art:'apple',bg:'#f4efe8',tag:'Fresco',stock:22},
    {id:'queso',name:'Queso fresco',category:'Lácteos y huevos',unit:'Empaque · 250 g',price:310,art:'cheese',bg:'#f6f3e7',tag:'Selección',stock:16},
    {id:'arroz',name:'Arroz blanco',category:'Despensa',unit:'Bolsa · 1 kg',price:185,art:'rice',bg:'#f0f3e8',tag:'Esencial',stock:35},
    {id:'agua',name:'Agua purificada',category:'Bebidas',unit:'Botella · 1.5 litros',price:85,art:'water',bg:'#edf3f4',tag:'Esencial',stock:40},
    {id:'croissant',name:'Croissants de mantequilla',category:'Panadería',unit:'2 unidades',price:240,art:'croissant',bg:'#f6f0e5',tag:'Selección',stock:15},
    {id:'yogur',name:'Yogur natural',category:'Lácteos y huevos',unit:'Envase · 500 g',price:215,art:'yogurt',bg:'#edf3ef',tag:'Esencial',stock:20},
    {id:'pasta',name:'Pasta penne',category:'Despensa',unit:'Bolsa · 400 g',price:135,old:165,art:'pasta',bg:'#f7f1e5',tag:'−18%',stock:30},
    {id:'jabon',name:'Jabón líquido para manos',category:'Hogar y limpieza',unit:'Botella · 300 ml',price:260,art:'soap',bg:'#eef1f5',tag:'Esencial',stock:22},
    {id:'detergente',name:'Detergente líquido',category:'Hogar y limpieza',unit:'Botella · 1 litro',price:390,old:450,art:'detergent',bg:'#edf2ee',tag:'−13%',stock:24},
    {id:'zanahoria',name:'Zanahorias frescas',category:'Frutas y verduras',unit:'Bolsa · 500 g',price:110,art:'carrot',bg:'#f3f3e6',tag:'Fresco',stock:28}
  ];
  const categories=[{name:'Frutas y verduras',art:'avocado'},{name:'Lácteos y huevos',art:'milk'},{name:'Panadería',art:'bread'},{name:'Despensa',art:'coffee'},{name:'Bebidas',art:'juice'},{name:'Hogar y limpieza',art:'soap'}];
  function cleanCart(cart){const result={};for(const p of products){const n=Math.floor(Number(cart?.[p.id]));if(Number.isFinite(n)&&n>0)result[p.id]=Math.min(p.stock,n);}return result;}
  function totals(cart,coupon='',delivery='delivery'){const valid=cleanCart(cart);const subtotal=products.reduce((s,p)=>s+p.price*(valid[p.id]||0),0);const discount=coupon==='BIENVENIDO10'?Math.round(subtotal*.1):0;const shipping=subtotal===0||delivery==='pickup'||subtotal>=3500?0:250;return {subtotal,discount,shipping,total:subtotal-discount+shipping};}
  function normalize(s){return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();}
  function filterProducts({query='',category='Todos',offers=false,favoritesOnly=false,favorites=[],sort='featured'}={}){let list=products.filter(p=>(category==='Todos'||p.category===category)&&(!offers||p.old)&&(!favoritesOnly||favorites.includes(p.id))&&normalize(p.name+' '+p.category).includes(normalize(query.trim())));if(sort==='price-asc')list.sort((a,b)=>a.price-b.price);if(sort==='price-desc')list.sort((a,b)=>b.price-a.price);if(sort==='name')list.sort((a,b)=>a.name.localeCompare(b.name,'es'));return list;}
  const api={products,categories,cleanCart,totals,normalize,filterProducts};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Comercio=api;
})(typeof window!=='undefined'?window:globalThis);
