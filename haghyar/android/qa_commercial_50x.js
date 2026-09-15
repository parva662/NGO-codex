const fs=require('fs'),vm=require('vm');
const store={}; const localStorage={getItem:k=>store[k]??null,setItem:(k,v)=>store[k]=String(v),removeItem:k=>delete store[k]};
const sandbox={console,localStorage,Date,JSON,Math,Number,String,Array,Object,RegExp,Intl};sandbox.window=sandbox;sandbox.globalThis=sandbox;vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('app/src/main/assets/v2_commercial_core.js','utf8'),sandbox,{filename:'v2_commercial_core.js'});
vm.runInContext(fs.readFileSync('app/src/main/assets/v2_lawyer_brief.js','utf8'),sandbox,{filename:'v2_lawyer_brief.js'});
const H=sandbox.HaghyarCommercial,B=sandbox.HaghyarLawyerBrief;if(!H||H.version!=='2.0.0')throw Error('Commercial core missing');if(!B||B.version!=='2.0.0')throw Error('Lawyer brief missing');
const domains=['property','family','debt','work','contract','criminal','business','other'];
const labels={property:'ملکی',family:'خانواده',debt:'چک و مطالبات',work:'کار و کارگر',contract:'قراردادها',criminal:'کیفری',business:'کسب‌وکار',other:'سایر'};
let total=0,fail=[];function ok(x,m){total++;if(!x)fail.push(m)}
for(const domain of domains){for(let i=0;i<50;i++){
 const c=H.cases.create(domain,[labels[domain],'QA']);ok(c.domain===domain,domain+' create');ok(/^HY-/.test(c.id),domain+' id');
 H.cases.answer(c,'province','تهران');H.cases.answer(c,'city','تهران');H.cases.answer(c,'goal','بررسی حقوقی');H.cases.event(c,{date:'1405/06/24',title:'رویداد تست',source:'کاربر'});H.cases.evidence(c,{title:'مدرک تست',status:'available'});
 const rules=[{id:'province',level:H.level.BLOCKER,weight:5,message:'استان'},{id:'city',level:H.level.WARNING,weight:3,message:'شهر'},{id:'goal',level:H.level.WARNING,weight:3,message:'هدف'}];H.readiness.assess(c,rules);ok(c.readiness.score===100,domain+' readiness');ok(c.status===H.status.READY,domain+' ready');
 const loaded=H.cases.load(c.id);ok(loaded&&loaded.answers.city.value==='تهران',domain+' resume');ok(loaded.timeline.length===1,domain+' timeline');ok(loaded.evidence.length===1,domain+' evidence');
 const b=B.build(loaded),m=B.messenger(loaded);ok(b.text.includes(c.id),domain+' brief id');ok(b.text.includes(labels[domain]),domain+' brief domain');ok(b.text.includes('مشاوره حقوقی محسوب نمی‌شود'),domain+' disclaimer');ok(!b.text.includes('undefined'),domain+' no undefined');ok(m.includes('این خلاصه بر اساس اطلاعات واردشده توسط کاربر در حق‌یار تهیه شده است.'),domain+' messenger');if(domain==='criminal')ok(b.text.includes('وقوع جرم را تأیید نمی‌کند'),domain+' neutral');
 H.cases.answer(loaded,'province','');H.readiness.assess(loaded,rules);ok(loaded.status===H.status.INCOMPLETE,domain+' blocker');ok(loaded.readiness.blockers.some(x=>x.id==='province'),domain+' blocker target');H.cases.answer(loaded,'province','تهران');H.readiness.assess(loaded,rules);ok(loaded.status===H.status.READY,domain+' recovery');H.cases.remove(c.id);ok(H.cases.load(c.id)===null,domain+' delete');
}}
ok(domains.every(d=>H.domains.includes(d)),'all domains');ok(H.features.autosave&&H.features.resume&&H.features.offlineLawyerBrief&&H.features.weightedReadiness,'features');const runs=domains.length*50;console.log(JSON.stringify({suite:'Haghyar Commercial MVP regression',domains:8,loops_per_domain:50,scenario_runs:runs,assertions:total,failed:fail.length,failures:fail.slice(0,30)},null,2));if(fail.length)process.exit(2);if(runs!==400)process.exit(3);
