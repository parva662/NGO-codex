/* Haghyar v2 — structured, neutral, offline Lawyer Brief NLG for all 8 domains */
(function(){'use strict';
const LABEL={property:'ملکی',family:'خانواده',debt:'چک و مطالبات',work:'کار و کارگر',contract:'قراردادها',criminal:'کیفری',business:'کسب‌وکار',other:'سایر'};
const EV={available:'موجود',later:'بعداً اضافه می‌کنم',missing:'ناموجود',unknown:'وضعیت نامشخص'};
const FIELDS={
 property:[['propertyKind','موضوع ملکی'],['leaseRole','نقش در اجاره'],['leaseIssue','مسئله اجاره'],['writtenLease','قرارداد کتبی'],['leaseStart','شروع اجاره'],['leaseEnd','پایان اجاره'],['earlyTerminationReason','علت پایان زودتر'],['deposit','ودیعه'],['rent','اجاره'],['possession','وضعیت تصرف'],['vacateReady','آمادگی تخلیه'],['landlordPosition','موضع موجر'],['arrears','معوقات'],['returnedAmount','مبلغ مستردشده'],['saleRole','نقش در معامله'],['saleValue','ارزش معامله'],['saleIssue','مسئله معامله']],
 family:[['familyKind','موضوع خانوادگی'],['familyRole','نقش کاربر'],['marriage','نوع رابطه زوجیت'],['children','فرزند'],['childAge','سن فرزند'],['dowryType','نوع مهریه'],['violence','خشونت اعلام‌شده'],['familyOrder','دستور/رأی مرتبط']],
 debt:[['instrument','مبنای مطالبه'],['creditorRole','نقش کاربر'],['claimAmount','مبلغ ادعایی'],['dueDate','سررسید اعلامی'],['sayad','وضعیت صیاد'],['returnCert','گواهی عدم پرداخت'],['guarantor','ضامن'],['partialPay','پرداخت بخشی'],['paidAmount','مبلغ پرداخت‌شده'],['debtProof','مدرک اصلی']],
 work:[['employment','نوع رابطه کاری'],['workRole','نقش کاربر'],['workStart','شروع کار'],['workEndStatus','پایان رابطه کاری'],['workEnd','تاریخ پایان'],['insured','وضعیت بیمه'],['workIssue','موضوع اختلاف'],['salary','مبلغ حقوق'],['terminationProof','مدرک خاتمه']],
 contract:[['contractRole','نقش قراردادی'],['written','قرارداد کتبی'],['contractDate','تاریخ قرارداد'],['contractValue','ارزش قرارداد'],['breachType','نقض ادعایی'],['breachDue','موعد تعهد'],['penalty','وجه التزام'],['arbitration','شرط داوری'],['jurisdictionClause','شرط مرجع رسیدگی']],
 criminal:[['criminalRole','نقش کاربر'],['offense','موضوع اعلامی'],['incidentDate','تاریخ واقعه اعلامی'],['complaintFiled','شکایت ثبت شده'],['custody','بازداشت/توقیف اعلامی'],['safety','خطر فوری اعلامی'],['digitalEvidence','نوع مدرک اعلامی']],
 business:[['bizForm','نوع کسب‌وکار'],['bizRole','نقش کاربر'],['bizIssue','موضوع اختلاف'],['companyDocs','اسناد شرکت'],['shareAgreement','توافق شرکا/سهامداران'],['bizContract','قرارداد مرتبط'],['bizValue','ارزش مالی اعلامی']],
 other:[['otherKind','نوع موضوع'],['otherRole','نقش کاربر']]
};
const COMMON=[['province','استان'],['city','شهر'],['stage','مرحله پرونده'],['caseNo','شماره پرونده'],['branch','مرجع/شعبه'],['noticeDate','تاریخ ابلاغ'],['urgent','مهلت یا فوریت اعلامی'],['deadlineSource','منشأ مهلت'],['deadlineDate','تاریخ مهلت اعلامی'],['goal','خواسته کاربر'],['extra','توضیحات تکمیلی']];
function v(c,id){let a=c.answers&&c.answers[id];return a&&a.state==='known'&&a.value!==''&&a.value!=null?a.value:null}
function fmt(x){if(x&&typeof x==='object'){if('amount'in x)return String(x.amount)+(x.currency?' '+x.currency:'');try{return JSON.stringify(x)}catch(e){return String(x)}}return String(x)}
function rows(c){return COMMON.concat(FIELDS[c.domain]||[]).map(([id,label])=>({id,label,value:v(c,id)})).filter(x=>x.value!==null)}
function narrative(c){let r=rows(c),map={};r.forEach(x=>map[x.id]=x);let pick=id=>map[id]?fmt(map[id].value):'مشخص نشده است',lead='کاربر پرونده‌ای در حوزه '+(LABEL[c.domain]||c.domain)+' ثبت کرده است.';
 if(c.domain==='property')lead+=' موضوع اعلامی «'+pick('propertyKind')+'» است'+(v(c,'leaseIssue')?' و مسئله اصلی اجاره «'+pick('leaseIssue')+'» اعلام شده است.':'.');
 else if(c.domain==='family')lead+=' موضوع خانوادگی «'+pick('familyKind')+'» و نقش اعلامی کاربر «'+pick('familyRole')+'» است.';
 else if(c.domain==='debt')lead+=' مبنای مطالبه «'+pick('instrument')+'» و نقش اعلامی کاربر «'+pick('creditorRole')+'» است.';
 else if(c.domain==='work')lead+=' موضوع اختلاف کاری «'+pick('workIssue')+'» و نقش کاربر «'+pick('workRole')+'» اعلام شده است.';
 else if(c.domain==='contract')lead+=' نقض قراردادی اعلامی «'+pick('breachType')+'» و نقش کاربر «'+pick('contractRole')+'» است.';
 else if(c.domain==='criminal')lead+=' کاربر موضوع «'+pick('offense')+'» را اعلام کرده و نقش خود را «'+pick('criminalRole')+'» ثبت کرده است؛ این توصیف صرفاً بازتاب اظهارات کاربر است و وقوع جرم را تأیید نمی‌کند.';
 else if(c.domain==='business')lead+=' موضوع کسب‌وکار «'+pick('bizIssue')+'» و نقش کاربر «'+pick('bizRole')+'» اعلام شده است.';
 else lead+=' موضوع اعلامی «'+pick('otherKind')+'» و نقش کاربر «'+pick('otherRole')+'» است.';
 if(v(c,'goal'))lead+=' خواسته ثبت‌شده کاربر: «'+pick('goal')+'».';return lead}
function build(c){let H=window.HaghyarCommercial;if(H&&H.readiness)H.readiness.assess(c);let rr=c.readiness||{score:0,components:{},blockers:[],warnings:[],info:[]},out=[];out.push('حق‌یار | خلاصه پرونده جهت بررسی حقوقی','شناسه پرونده: '+c.id,'حوزه: '+(LABEL[c.domain]||c.domain),'موضوع/مسیر: '+((c.path||[]).join(' ← ')||'مشخص نشده است'),'وضعیت آمادگی: '+rr.score+'٪','تاریخ تهیه گزارش: '+new Date().toISOString(),'','شرح فشرده پرونده',narrative(c),'','اطلاعات ساختاریافته');rows(c).forEach(x=>out.push('• '+x.label+': '+fmt(x.value)));
 out.push('','سیر زمانی');if(!(c.timeline||[]).length)out.push('• رویداد زمانی ثبت نشده است.');else c.timeline.forEach(x=>out.push('• '+(x.date||'تاریخ مشخص نشده است')+' — '+(x.title||x.event||'رویداد اعلامی')+' — منبع: '+(x.source||'کاربر')));
 out.push('','وضعیت مدارک');if(!(c.evidence||[]).length)out.push('• مدرکی در این بخش ثبت نشده است.');else c.evidence.forEach(x=>out.push('• '+(x.title||x.name||'مدرک')+': '+(EV[x.status]||'وضعیت نامشخص')));
 out.push('','اطلاعات مهم نامشخص');if(!(c.unknowns||[]).length)out.push('• مورد مهم نامشخصی در قواعد فعلی ثبت نشده است.');else c.unknowns.forEach(id=>out.push('• '+id+': مشخص نشده است.'));
 out.push('','موارد نیازمند بازبینی');let cons=c.contradictions||[];if(!cons.length)out.push('• ناسازگاری ثبت‌شده‌ای در قواعد فعلی مشاهده نشد.');else cons.forEach(x=>out.push('• '+(x.hard?'ضروری':'پیشنهادی')+': '+x.message));
 out.push('','نکات برای بررسی وکیل');let review=(rr.blockers||[]).concat(rr.warnings||[],rr.info||[]).filter(x=>x.type!=='contradiction');if(!review.length)out.push('• مورد تکمیلی مشخصی در قواعد فعلی ثبت نشده است.');else review.forEach(x=>out.push('• '+x.message));
 out.push('','آمادگی اجزا','• اطلاعات: '+((rr.components&&rr.components.information)||0)+'٪','• مدارک: '+((rr.components&&rr.components.evidence)||0)+'٪','• سیر زمانی: '+((rr.components&&rr.components.timeline)||0)+'٪','','این گزارش به‌صورت خودکار بر اساس اطلاعات واردشده توسط کاربر در حق‌یار تهیه شده و به‌تنهایی نظر یا مشاوره حقوقی محسوب نمی‌شود.');return {generatedAt:new Date().toISOString(),domain:c.domain,caseId:c.id,text:out.join('\n'),sections:{narrative:narrative(c),facts:rows(c),timeline:(c.timeline||[]).slice(),evidence:(c.evidence||[]).slice(),unknowns:(c.unknowns||[]).slice(),contradictions:cons.slice(),reviewPoints:review.slice()},readiness:rr}}
function messenger(c){let b=build(c),goal=v(c,'goal')||'مشخص نشده است',topic=(c.path||[]).join(' ← ')||LABEL[c.domain]||c.domain;return ['خلاصه پرونده برای وکیل','شناسه: '+c.id,'موضوع: '+topic,'آمادگی اطلاعات: '+b.readiness.score+'٪','شرح: '+b.sections.narrative,'خواسته کاربر: '+fmt(goal),'موارد نیازمند بازبینی: '+b.sections.contradictions.length,'مدارک ثبت‌شده: '+(c.evidence||[]).length,'','این خلاصه بر اساس اطلاعات واردشده توسط کاربر در حق‌یار تهیه شده است.'].join('\n')}
window.HaghyarLawyerBrief={version:'2.0.0',labels:LABEL,fields:FIELDS,build,messenger};
})();
