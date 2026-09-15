/* Haghyar Commercial MVP v2.0 — offline-first shared engine for all 8 legal domains */
(function(){'use strict';
const VERSION='2.0.0';
const DOMAINS=['property','family','debt','work','contract','criminal','business','other'];
const STATUS={DRAFT:'draft',INCOMPLETE:'needs_completion',READY:'ready_to_share',EXPORTED:'exported'};
const LEVEL={BLOCKER:'blocker',WARNING:'warning',INFO:'info'};
const FACT={KNOWN:'known',UNKNOWN:'unknown',NA:'not_applicable'};
function safeParse(x,d){try{return JSON.parse(x)}catch(e){return d}}
function key(id){return 'haghyar.v2.case.'+id}
function now(){return new Date().toISOString()}
function makeId(){return 'HY-'+Date.now()+'-'+Math.random().toString(36).slice(2,7).toUpperCase()}
function list(){return safeParse(localStorage.getItem('haghyar.v2.index'),[])||[]}
function saveIndex(a){localStorage.setItem('haghyar.v2.index',JSON.stringify(a))}
function create(domain,path){if(!DOMAINS.includes(domain))throw Error('invalid domain');let c={schema:'HaghyarCommercialCase/2.0',id:makeId(),domain,path:path||[],createdAt:now(),updatedAt:now(),status:STATUS.DRAFT,answers:{},timeline:[],evidence:[],issues:[],readiness:{score:0,blockers:[],warnings:[],info:[]},share:{redactions:{}},brief:null};localStorage.setItem(key(c.id),JSON.stringify(c));let a=list();a.unshift({id:c.id,domain:c.domain,path:c.path,status:c.status,updatedAt:c.updatedAt,score:0});saveIndex(a);return c}
function load(id){return safeParse(localStorage.getItem(key(id)),null)}
function persist(c){c.updatedAt=now();localStorage.setItem(key(c.id),JSON.stringify(c));let a=list(),i=a.findIndex(x=>x.id===c.id),m={id:c.id,domain:c.domain,path:c.path,status:c.status,updatedAt:c.updatedAt,score:(c.readiness&&c.readiness.score)||0};if(i<0)a.unshift(m);else a[i]=m;saveIndex(a);return c}
function answer(c,id,value,meta){c.answers[id]={value:value,state:value===null||value===''?FACT.UNKNOWN:FACT.KNOWN,updatedAt:now(),meta:meta||{}};return persist(c)}
function evidence(c,item){c.evidence.push(Object.assign({id:'EV-'+Date.now(),status:'available',createdAt:now()},item||{}));return persist(c)}
function event(c,item){c.timeline.push(Object.assign({id:'TL-'+Date.now(),date:null,source:'user',createdAt:now()},item||{}));return persist(c)}
function assess(c,rules){let earned=0,total=0,b=[],w=[],inf=[];(rules||[]).filter(r=>!r.when||r.when(c)).forEach(r=>{let weight=r.weight==null?(r.level===LEVEL.BLOCKER?5:r.level===LEVEL.WARNING?3:1):r.weight;if(weight>0)total+=weight;let a=c.answers[r.id],ok=!!(a&&a.state===FACT.KNOWN&&a.value!==''&&a.value!==null);if(ok)earned+=weight;else {let x={id:r.id,message:r.message||'اطلاعات این بخش تکمیل نشده است.',action:r.action||r.id};(r.level===LEVEL.BLOCKER?b:r.level===LEVEL.WARNING?w:inf).push(x)}});let score=total?Math.round(earned*100/total):0;c.readiness={score,blockers:b,warnings:w,info:inf};c.status=b.length?STATUS.INCOMPLETE:STATUS.READY;return persist(c)}
function val(c,id,fallback){let a=c.answers[id];return a&&a.state===FACT.KNOWN?a.value:(fallback||'نامشخص')}
function brief(c){let lines=[];lines.push('حق‌یار — خلاصه پرونده جهت بررسی حقوقی');lines.push('شناسه: '+c.id);lines.push('حوزه: '+c.domain);lines.push('مسیر: '+((c.path||[]).join(' ← ')||'نامشخص'));lines.push('آمادگی اطلاعات: '+((c.readiness&&c.readiness.score)||0)+'٪');lines.push('');lines.push('اطلاعات ثبت‌شده:');Object.keys(c.answers).forEach(k=>lines.push('• '+k+': '+val(c,k)));if(c.timeline.length){lines.push('');lines.push('سیر زمانی:');c.timeline.forEach(x=>lines.push('• '+(x.date||'تاریخ نامشخص')+' — '+(x.title||x.event||'رویداد')+' ['+(x.source||'کاربر')+']'))}if(c.evidence.length){lines.push('');lines.push('مدارک:');c.evidence.forEach(x=>lines.push('• '+(x.title||x.name||'مدرک')+' — '+(x.status||'نامشخص')))}let r=c.readiness||{};if((r.warnings||[]).length||(r.info||[]).length){lines.push('');lines.push('موارد نیازمند بررسی:');(r.warnings||[]).concat(r.info||[]).forEach(x=>lines.push('• '+x.message))}lines.push('');lines.push('این گزارش به‌صورت خودکار و صرفاً بر اساس اطلاعات واردشده توسط کاربر تهیه شده است؛ صحت اطلاعات ورودی توسط حق‌یار تأیید نشده و این گزارش به‌تنهایی نظر یا مشاوره حقوقی محسوب نمی‌شود.');c.brief={generatedAt:now(),text:lines.join('\n')};persist(c);return c.brief}
function remove(id){localStorage.removeItem(key(id));saveIndex(list().filter(x=>x.id!==id))}
window.HaghyarCommercial={version:VERSION,domains:DOMAINS,status:STATUS,level:LEVEL,fact:FACT,cases:{create,load,list,persist,remove,answer,evidence,event},readiness:{assess},brief:{generate:brief},privacy:{offlineFirst:true,cloudSync:false,redactionReady:true},features:{autosave:true,resume:true,adaptiveIntake:true,questionHelp:true,answerHelp:true,timeline:true,evidence:true,contradictions:true,weightedReadiness:true,offlineLawyerBrief:true,sharePreview:true,paidHooks:true}};
})();
