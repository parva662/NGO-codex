/* Haghyar Commercial MVP v2.1 — offline case quality engine shared by all 8 legal domains */
(function(){'use strict';
const VERSION='2.0.0';
const DOMAINS=['property','family','debt','work','contract','criminal','business','other'];
const STATUS={DRAFT:'draft',INCOMPLETE:'needs_completion',READY:'ready_to_share',EXPORTED:'exported'};
const LEVEL={BLOCKER:'blocker',WARNING:'warning',INFO:'info'};
const FACT={KNOWN:'known',UNKNOWN:'unknown',NA:'not_applicable'};
const EVIDENCE={AVAILABLE:'available',LATER:'later',MISSING:'missing',UNKNOWN:'unknown'};
const WEIGHT={CRITICAL:5,REQUIRED:3,RECOMMENDED:1,OPTIONAL:0};
function safeParse(x,d){try{return JSON.parse(x)}catch(e){return d}}
function key(id){return 'haghyar.v2.case.'+id}
function now(){return new Date().toISOString()}
function makeId(){return 'HY-'+Date.now()+'-'+Math.random().toString(36).slice(2,7).toUpperCase()}
function list(){return safeParse(localStorage.getItem('haghyar.v2.index'),[])||[]}
function saveIndex(a){localStorage.setItem('haghyar.v2.index',JSON.stringify(a))}
function create(domain,path){if(!DOMAINS.includes(domain))throw Error('invalid domain');let c={schema:'HaghyarCommercialCase/2.1',id:makeId(),domain,path:path||[],createdAt:now(),updatedAt:now(),status:STATUS.DRAFT,answers:{},timeline:[],evidence:[],issues:[],contradictions:[],unknowns:[],deadlines:[],readiness:{score:0,blockers:[],warnings:[],info:[],components:{information:0,evidence:0,timeline:0}},share:{redactions:{}},brief:null};localStorage.setItem(key(c.id),JSON.stringify(c));let a=list();a.unshift({id:c.id,domain:c.domain,path:c.path,status:c.status,updatedAt:c.updatedAt,score:0});saveIndex(a);return c}
function load(id){return safeParse(localStorage.getItem(key(id)),null)}
function persist(c){c.updatedAt=now();localStorage.setItem(key(c.id),JSON.stringify(c));let a=list(),i=a.findIndex(x=>x.id===c.id),m={id:c.id,domain:c.domain,path:c.path,status:c.status,updatedAt:c.updatedAt,score:(c.readiness&&c.readiness.score)||0};if(i<0)a.unshift(m);else a[i]=m;saveIndex(a);return c}
function answer(c,id,value,meta){c.answers[id]={value,state:value===null||value===''?FACT.UNKNOWN:FACT.KNOWN,updatedAt:now(),meta:meta||{}};return persist(c)}
function av(c,id){let a=c.answers[id];return a&&a.state===FACT.KNOWN?a.value:null}
function known(c,id){let v=av(c,id);return v!==null&&v!==''}
function evidence(c,item){let status=item&&item.status;if(!Object.values(EVIDENCE).includes(status))status=EVIDENCE.AVAILABLE;c.evidence.push(Object.assign({id:'EV-'+Date.now(),status,createdAt:now()},item||{}, {status}));return persist(c)}
function event(c,item){c.timeline.push(Object.assign({id:'TL-'+Date.now(),date:null,source:'user',createdAt:now()},item||{}));return persist(c)}
function issue(id,level,message,action,type){return {id,level,message,action:action||id,type:type||'missing'}}
function contradictionRules(c){let a=c.answers||{},out=[];function add(id,hard,msg,fields){out.push({id,hard,type:hard?'hard':'soft',message:msg,fields})}
 if(known(c,'partialRefund')&&/^بله/.test(String(av(c,'partialRefund')))&&!known(c,'returnedAmount'))add('partial_refund_without_amount',false,'بازپرداخت بخشی اعلام شده، اما مبلغ بازپرداخت ثبت نشده است.',['partialRefund','returnedAmount']);
 if(known(c,'partialPay')&&/^بله/.test(String(av(c,'partialPay')))&&!known(c,'paidAmount'))add('partial_payment_without_amount',false,'پرداخت بخشی اعلام شده، اما مبلغ پرداخت‌شده مشخص نشده است.',['partialPay','paidAmount']);
 if(known(c,'children')&&/^خیر/.test(String(av(c,'children')))&&known(c,'childAge'))add('children_age_conflict',true,'نداشتن فرزند با ثبت سن فرزند ناسازگار است.',['children','childAge']);
 if(known(c,'workEndStatus')&&/^خیر/.test(String(av(c,'workEndStatus')))&&known(c,'workEnd'))add('work_end_conflict',true,'ادامه رابطه کاری با ثبت تاریخ پایان کار ناسازگار است.',['workEndStatus','workEnd']);
 if(known(c,'complaintFiled')&&/^خیر/.test(String(av(c,'complaintFiled')))&&known(c,'caseNo'))add('criminal_case_number_conflict',false,'برای موضوع کیفری عدم ثبت شکایت اعلام شده، اما شماره پرونده نیز وارد شده است؛ وضعیت پرونده نیازمند بازبینی است.',['complaintFiled','caseNo']);
 if(known(c,'writtenLease')&&/^خیر/.test(String(av(c,'writtenLease')))&&known(c,'leaseFile'))add('lease_document_conflict',false,'قرارداد اجاره کتبی «خیر» ثبت شده ولی فایل قرارداد نیز اعلام شده است.',['writtenLease','leaseFile']);
 if(known(c,'written')&&/^خیر/.test(String(av(c,'written')))&&known(c,'contractFile'))add('contract_document_conflict',false,'قرارداد کتبی «خیر» ثبت شده ولی فایل قرارداد نیز اعلام شده است.',['written','contractFile']);
 return out}
const DOMAIN_RULES={
 property:[['propertyKind',5,'موضوع ملکی'],['goal',3,'خواسته'],['leaseRole',3,'نقش در اجاره',c=>av(c,'propertyKind')==='اجاره و ودیعه'],['leaseIssue',3,'مسئله اجاره',c=>av(c,'propertyKind')==='اجاره و ودیعه'],['writtenLease',3,'وضعیت قرارداد اجاره',c=>av(c,'propertyKind')==='اجاره و ودیعه'],['deposit',3,'مبلغ ودیعه',c=>av(c,'leaseIssue')==='استرداد ودیعه'],['possession',3,'وضعیت تصرف',c=>av(c,'propertyKind')==='اجاره و ودیعه'],['saleRole',3,'نقش در معامله',c=>av(c,'propertyKind')==='خرید و فروش'],['saleIssue',3,'مسئله خرید و فروش',c=>av(c,'propertyKind')==='خرید و فروش']],
 family:[['familyKind',5,'موضوع خانوادگی'],['familyRole',3,'نقش کاربر'],['goal',3,'خواسته'],['children',1,'وضعیت فرزند',c=>['طلاق','حضانت','نفقه'].includes(av(c,'familyKind'))]],
 debt:[['instrument',5,'مبنای مطالبه'],['creditorRole',3,'نقش کاربر'],['claimAmount',3,'مبلغ ادعایی'],['dueDate',3,'سررسید'],['goal',3,'خواسته']],
 work:[['workRole',5,'نقش در رابطه کاری'],['employment',3,'نوع رابطه کاری'],['workIssue',5,'موضوع اختلاف کاری'],['workStart',3,'تاریخ شروع'],['goal',3,'خواسته']],
 contract:[['contractRole',3,'نقش قراردادی'],['written',5,'وضعیت قرارداد'],['breachType',5,'نوع نقض ادعایی'],['contractDate',3,'تاریخ قرارداد'],['goal',3,'خواسته']],
 criminal:[['criminalRole',5,'نقش در موضوع کیفری'],['offense',5,'موضوع اعلامی'],['incidentDate',3,'تاریخ واقعه'],['safety',5,'وضعیت خطر فوری'],['goal',3,'خواسته']],
 business:[['bizForm',3,'نوع کسب‌وکار'],['bizRole',3,'نقش کاربر'],['bizIssue',5,'موضوع اختلاف'],['goal',3,'خواسته']],
 other:[['otherKind',5,'نوع موضوع'],['otherRole',3,'نقش کاربر'],['goal',3,'خواسته']]
};
function rulesFor(c){let common=[['province',3,'استان'],['city',1,'شهر'],['stage',3,'مرحله پرونده']];return common.concat(DOMAIN_RULES[c.domain]||[]).map(x=>({id:x[0],weight:x[1],message:x[2]+' مشخص نشده است.',when:x[3]}))}
function evidenceScore(c){if(!c.evidence.length)return 0;let good=c.evidence.filter(x=>x.status===EVIDENCE.AVAILABLE).length,later=c.evidence.filter(x=>x.status===EVIDENCE.LATER).length;return Math.round(Math.min(1,(good+later*.5)/Math.max(1,c.evidence.length))*100)}
function timelineScore(c){if(!c.timeline.length)return 0;let dated=c.timeline.filter(x=>x.date).length;return Math.round(dated/c.timeline.length*100)}
function assess(c,rules){let earned=0,total=0,b=[],w=[],inf=[],unknowns=[];let active=(rules||rulesFor(c)).filter(r=>!r.when||r.when(c));active.forEach(r=>{let weight=r.weight==null?WEIGHT.RECOMMENDED:r.weight;if(weight>0)total+=weight;let ok=known(c,r.id);if(ok)earned+=weight;else {unknowns.push(r.id);let level=weight>=WEIGHT.CRITICAL?LEVEL.BLOCKER:weight>=WEIGHT.REQUIRED?LEVEL.WARNING:LEVEL.INFO;let x=issue(r.id,level,r.message||'اطلاعات این بخش تکمیل نشده است.',r.action||r.id);(level===LEVEL.BLOCKER?b:level===LEVEL.WARNING?w:inf).push(x)}});let contradictions=contradictionRules(c);contradictions.forEach(x=>{let z=issue(x.id,x.hard?LEVEL.BLOCKER:LEVEL.WARNING,x.message,x.fields[0],'contradiction');z.fields=x.fields;(x.hard?b:w).push(z)});let information=total?Math.round(earned*100/total):0;c.contradictions=contradictions;c.unknowns=unknowns;c.readiness={score:information,blockers:b,warnings:w,info:inf,components:{information,evidence:evidenceScore(c),timeline:timelineScore(c)}};c.status=b.length?STATUS.INCOMPLETE:STATUS.READY;return persist(c)}
function val(c,id,fallback){let v=av(c,id);return v!==null?v:(fallback||'مشخص نشده است')}
function brief(c){assess(c);let r=c.readiness,lines=['حق‌یار — خلاصه پرونده جهت بررسی حقوقی','شناسه: '+c.id,'حوزه: '+c.domain,'مسیر: '+((c.path||[]).join(' ← ')||'مشخص نشده است'),'آمادگی اطلاعات: '+r.score+'٪','','خلاصه اطلاعات اعلام‌شده:'];Object.keys(c.answers).forEach(k=>lines.push('• '+k+': '+val(c,k)));if(c.timeline.length){lines.push('','سیر زمانی:');c.timeline.forEach(x=>lines.push('• '+(x.date||'تاریخ مشخص نشده است')+' — '+(x.title||x.event||'رویداد')+' ['+(x.source||'کاربر')+']'))}if(c.evidence.length){lines.push('','وضعیت مدارک:');c.evidence.forEach(x=>lines.push('• '+(x.title||x.name||'مدرک')+' — '+x.status))}if(c.unknowns.length){lines.push('','اطلاعات مهم نامشخص:');c.unknowns.forEach(x=>lines.push('• '+x+' مشخص نشده است.'))}if(c.contradictions.length){lines.push('','موارد ناسازگار نیازمند بازبینی:');c.contradictions.forEach(x=>lines.push('• '+(x.hard?'ضروری: ':'بازبینی: ')+x.message))}if(r.warnings.length||r.info.length){lines.push('','نکات پیشنهادی برای بررسی وکیل:');r.warnings.concat(r.info).filter(x=>x.type!=='contradiction').forEach(x=>lines.push('• '+x.message))}lines.push('','این گزارش به‌صورت خودکار و صرفاً بر اساس اطلاعات واردشده توسط کاربر تهیه شده است؛ صحت اطلاعات ورودی توسط حق‌یار تأیید نشده و این گزارش به‌تنهایی نظر یا مشاوره حقوقی محسوب نمی‌شود.');c.brief={generatedAt:now(),text:lines.join('\n'),readiness:r,unknowns:c.unknowns.slice(),contradictions:c.contradictions.slice()};persist(c);return c.brief}
function remove(id){localStorage.removeItem(key(id));saveIndex(list().filter(x=>x.id!==id))}
window.HaghyarCommercial={version:VERSION,domains:DOMAINS,status:STATUS,level:LEVEL,fact:FACT,evidenceStatus:EVIDENCE,weight:WEIGHT,cases:{create,load,list,persist,remove,answer,evidence,event},readiness:{assess,rulesFor},contradictions:{detect:contradictionRules},brief:{generate:brief},privacy:{offlineFirst:true,cloudSync:false,redactionReady:true},features:{autosave:true,resume:true,adaptiveIntake:true,questionHelp:true,answerHelp:true,timeline:true,evidence:true,contradictions:true,weightedReadiness:true,offlineLawyerBrief:true,sharePreview:true,paidHooks:true}};
})();
