const fs=require('fs'),vm=require('vm');
function node(){return {innerHTML:'',textContent:'',value:'',style:{},dataset:{},children:[],className:'',classList:{add(){},remove(){},toggle(){}},appendChild(x){this.children.push(x);return x},querySelector(){return null},querySelectorAll(){return[]},addEventListener(){},setAttribute(){},insertAdjacentHTML(){},closest(){return null}}}
const nodes=new Map();
const document={
  head:node(),body:node(),
  getElementById(id){if(!nodes.has(id))nodes.set(id,node());return nodes.get(id)},
  querySelector(){return null},querySelectorAll(){return[]},
  createElement(){return node()},addEventListener(){}
};
const storage={};
const sandbox={console,document,localStorage:{getItem:k=>storage[k]||null,setItem:(k,v)=>storage[k]=String(v),removeItem:k=>delete storage[k]},setTimeout:(fn)=>{if(typeof fn==='function')fn();return 1},clearTimeout(){},Date,JSON,Math,Number,String,Array,Object,RegExp,Intl,Blob:function(){},URL:{createObjectURL(){return''}},alert(){}};
sandbox.window=sandbox;sandbox.window.scrollTo=()=>{};sandbox.globalThis=sandbox;
vm.createContext(sandbox);
let html=fs.readFileSync('app/src/main/assets/v1_1.html','utf8');
let m=html.match(/<script>([\s\S]*)<\/script>/);if(!m)throw new Error('base script not found');
let base=m[1].replace(/\binit\(\);\s*$/,'');
vm.runInContext(base,sandbox,{filename:'v1_1.html'});
vm.runInContext(fs.readFileSync('app/src/main/assets/v1_2_patch.js','utf8'),sandbox,{filename:'v1_2_patch.js'});
vm.runInContext(fs.readFileSync('app/src/main/assets/v1_3_patch.js','utf8'),sandbox,{filename:'v1_3_patch.js'});
if(!sandbox.HaghyarQA||typeof sandbox.HaghyarQA.runAll!=='function')throw new Error('HaghyarQA runner missing');
const r=sandbox.HaghyarQA.runAll();
console.log(JSON.stringify({version:r.version,total:r.total,passed:r.passed,failed:r.failed,failures:r.failures.slice(0,10)},null,2));
if(r.total<40)throw new Error('Scenario coverage too low: '+r.total);
if(r.failed)process.exit(2);
