const fs=require('fs'),vm=require('vm');
const store={}; const localStorage={getItem:k=>store[k]??null,setItem:(k,v)=>store[k]=String(v),removeItem:k=>delete store[k]};
const sandbox={console,localStorage,Date,JSON,Math,Number,String,Array,Object,RegExp,Intl};sandbox.window=sandbox;sandbox.globalThis=sandbox;vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('app/src/main/assets/v2_commercial_core.js','utf8'),sandbox,{filename:'v2_commercial_core.js'});
const H=sandbox.HaghyarCommercial;if(!H||H.version!=='2.0.0')throw Error('Commercial core 2.0.0 not loaded');
const domains=['property','family','debt','work','contract','criminal','business','other'];
const labels={property:'ملکی',family:'خانواده',debt:'چک و مطالبات',work:'کار و کارگر',contract:'قراردادها',criminal:'کیفری',business:'کسب‌وکار',other:'سایر'};
let total=0,fail=[]; function ok(x,m){total++;if(!x)fail.push(m)}
for(const domain of domains){
  for(let i=0;i<50;i++){
    const c=H.cases.create(domain,[labels[domain],'سناریوی تست '+(i+1)]);
    ok(c.domain===domain,domain+' create '+i); ok(/^HY-/.test(c.id),domain+' id '+i);
    H.cases.answer(c,'province','تهران'); H.cases.answer(c,'city','تهران'); H.cases.answer(c,'goal','بررسی حقوقی');
    H.cases.event(c,{date:'1405/06/'+String((i%28)+1).padStart(2,'0'),title:'رویداد تست '+i,source:'کاربر'});
    H.cases.evidence(c,{title:'مدرک تست '+i,status:i%3===0?'later':'available'});
    let rules=[{id:'province',level:H.level.BLOCKER,weight:5,message:'استان لازم است'},{id:'city',level:H.level.BLOCKER,weight:5,message:'شهر لازم است'},{id:'goal',level:H.level.WARNING,weight:3,message:'خواسته لازم است'}];
    H.readiness.assess(c,rules); ok(c.readiness.score===100,domain+' readiness '+i); ok(c.status===H.status.READY,domain+' ready '+i);
    let loaded=H.cases.load(c.id);ok(loaded&&loaded.answers.city.value==='تهران',domain+' autosave/resume '+i);ok(loaded.timeline.length===1,domain+' timeline '+i);ok(loaded.evidence.length===1,domain+' evidence '+i);
    let b=H.brief.generate(loaded);ok(b.text.includes(c.id),domain+' brief id '+i);ok(b.text.includes('سیر زمانی'),domain+' brief timeline '+i);ok(b.text.includes('مدارک'),domain+' brief evidence '+i);ok(b.text.includes('مشاوره حقوقی محسوب نمی‌شود'),domain+' disclaimer '+i);
    H.cases.answer(loaded,'city','');H.readiness.assess(loaded,rules);ok(loaded.status===H.status.INCOMPLETE,domain+' blocker '+i);ok(loaded.readiness.blockers.some(x=>x.id==='city'),domain+' blocker target '+i);
    H.cases.answer(loaded,'city','تهران');H.readiness.assess(loaded,rules);ok(loaded.status===H.status.READY,domain+' recovery '+i);
    H.cases.remove(c.id);ok(H.cases.load(c.id)===null,domain+' delete '+i);
  }
}
ok(domains.every(d=>H.domains.includes(d)),'all 8 domains declared');
ok(H.features.autosave&&H.features.resume&&H.features.offlineLawyerBrief&&H.features.weightedReadiness,'commercial feature flags');
const runs=domains.length*50;console.log(JSON.stringify({suite:'Haghyar Commercial MVP 2.0 regression',domains:domains.length,loops_per_domain:50,scenario_runs:runs,assertions:total,failed:fail.length,failures:fail.slice(0,30)},null,2));if(fail.length)process.exit(2);if(runs!==400)process.exit(3);
