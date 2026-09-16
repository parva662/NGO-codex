/* DANJUR — domain-specific AI document & analysis action engine */
(function(){'use strict';
var LABEL={property:'ملکی',family:'خانواده',debt:'چک و مطالبات',work:'کار و کارگر',contract:'قراردادها',criminal:'کیفری',business:'کسب‌وکار',other:'سایر'};
var COMMON=[
{id:'analysis',title:'تحلیل حقوقی پرونده',kind:'analysis'},
{id:'next_steps',title:'پیشنهاد اقدامات و مراحل بعدی',kind:'analysis'},
{id:'evidence_review',title:'بررسی مدارک، ابهام‌ها و اطلاعات ناقص',kind:'analysis'},
{id:'lawyer_summary',title:'خلاصه تخصصی برای بررسی وکیل',kind:'summary'}
];
var CATALOG={
property:[{id:'notice',title:'تنظیم اظهارنامه',kind:'document'},{id:'petition',title:'تنظیم دادخواست',kind:'document'},{id:'defense',title:'تنظیم لایحه / دفاعیه',kind:'document'},{id:'notice_reply',title:'پاسخ به اظهارنامه',kind:'document'},{id:'settlement',title:'پیش‌نویس توافق یا صورتجلسه',kind:'document'}],
family:[{id:'petition',title:'تنظیم دادخواست خانواده',kind:'document'},{id:'defense',title:'تنظیم لایحه / دفاعیه',kind:'document'},{id:'notice',title:'تنظیم اظهارنامه مرتبط',kind:'document'},{id:'request',title:'تنظیم درخواست قضایی مرتبط',kind:'document'},{id:'settlement',title:'پیش‌نویس توافق خانوادگی',kind:'document'}],
debt:[{id:'notice',title:'اظهارنامه مطالبه وجه / طلب',kind:'document'},{id:'petition',title:'دادخواست مطالبه وجه',kind:'document'},{id:'defense',title:'لایحه / دفاعیه',kind:'document'},{id:'notice_reply',title:'پاسخ به اظهارنامه مطالبه',kind:'document'},{id:'settlement',title:'توافق‌نامه پرداخت / تسویه',kind:'document'}],
work:[{id:'labor_claim',title:'متن مطالبه / درخواست اداره کار',kind:'document'},{id:'defense',title:'لایحه / دفاعیه کارگری یا کارفرمایی',kind:'document'},{id:'notice',title:'اظهارنامه مرتبط با رابطه کاری',kind:'document'},{id:'settlement',title:'توافق‌نامه تسویه یا خاتمه همکاری',kind:'document'}],
contract:[{id:'notice',title:'اظهارنامه قراردادی',kind:'document'},{id:'petition',title:'دادخواست مرتبط با قرارداد',kind:'document'},{id:'defense',title:'لایحه / دفاعیه قراردادی',kind:'document'},{id:'contract_draft',title:'تنظیم قرارداد یا بند قراردادی',kind:'document'},{id:'notice_reply',title:'پاسخ به اخطار / اظهارنامه قراردادی',kind:'document'},{id:'termination',title:'متن فسخ / خاتمه / اعلام نقض',kind:'document'}],
criminal:[{id:'complaint',title:'تنظیم شکواییه',kind:'document'},{id:'criminal_defense',title:'تنظیم لایحه دفاعیه کیفری',kind:'document'},{id:'request',title:'تنظیم درخواست قضایی مرتبط',kind:'document'},{id:'evidence_statement',title:'تنظیم شرح واقعه و فهرست ادله',kind:'document'}],
business:[{id:'commercial_notice',title:'اظهارنامه / اخطار تجاری',kind:'document'},{id:'commercial_claim',title:'دادخواست یا مطالبه تجاری',kind:'document'},{id:'defense',title:'لایحه / پاسخ حقوقی',kind:'document'},{id:'contract_draft',title:'قرارداد یا بند تجاری',kind:'document'},{id:'partner_agreement',title:'توافق شرکا / سهامداران',kind:'document'},{id:'settlement',title:'توافق‌نامه حل اختلاف تجاری',kind:'document'}],
other:[{id:'notice',title:'تنظیم اظهارنامه یا اخطار مرتبط',kind:'document'},{id:'request',title:'تنظیم درخواست / اعتراض مرتبط',kind:'document'},{id:'defense',title:'تنظیم پاسخ / لایحه',kind:'document'},{id:'petition',title:'پیش‌نویس دادخواست در صورت ارتباط',kind:'document'}]
};
function actions(domain){return (CATALOG[domain]||CATALOG.other).concat(COMMON)}
function find(domain,id){var a=actions(domain);for(var i=0;i<a.length;i++)if(a[i].id===id)return a[i];return null}
function critical(c){var out=[],r=c.readiness||{};(r.blockers||[]).forEach(function(x){out.push(x.message||String(x))});(c.contradictions||[]).filter(function(x){return x.hard}).forEach(function(x){out.push(x.message||String(x))});return out}
function prompt(c,action,payload){var blocks=critical(c),goal=c.answers&&c.answers.goal&&c.answers.goal.value;var p=[];
p.push('نقش شما: دستیار حقوقی دقیق و محتاط برای حقوق ایران.');
p.push('درخواست کاربر: '+action.title+'.');
p.push('حوزه پرونده: '+(LABEL[c.domain]||c.domain)+'.');
if(goal)p.push('خواسته ثبت‌شده کاربر: '+String(goal)+'.');
p.push('فقط از اطلاعات موجود در بسته پرونده زیر استفاده کن. هیچ واقعیت، تاریخ، مبلغ، نام، مدرک، اقرار، نتیجه قضایی یا ماده قانونی را حدس نزن یا جعل نکن.');
p.push('اگر برای استناد قانونی به قانون جاری نیاز است، ابتدا اعتبار و نسخه جاری آن را بررسی کن؛ اگر امکان بررسی منبع معتبر نداری، شماره ماده یا حکم قانونی را با قطعیت نساز و این محدودیت را صریح اعلام کن.');
p.push('میان ادعای کاربر، مدرک موجود، اطلاعات نامعلوم و نتیجه حقوقی تمایز روشن حفظ کن. در پرونده کیفری، ادعا را به‌عنوان واقعیت اثبات‌شده یا وقوع جرم بیان نکن.');
if(blocks.length)p.push('قبل از تولید نسخه نهایی، این موارد بحرانی/متناقض را بررسی و صریحاً اعلام کن: '+blocks.join(' | ')+'. اگر بدون رفع آنها سند نهایی می‌تواند گمراه‌کننده باشد، ابتدا سؤال‌های تکمیلی لازم را ارائه کن.');
if(action.kind==='document')p.push('خروجی مطلوب: ابتدا «موارد ضروری ناقص یا نیازمند تأیید»، سپس پیش‌نویس حرفه‌ای و قابل ویرایشِ سند انتخاب‌شده. برای داده‌های واقعاً نامعلوم از جای‌خالی مشخص استفاده کن و آن را با واقعیت ساختگی پر نکن. لحن رسمی، روشن و غیراغراق‌آمیز باشد.');
else if(action.id==='analysis')p.push('خروجی مطلوب: مسائل حقوقی اصلی، اطلاعات مؤثر، نقاط قوت و ضعف مستند، ابهام‌ها، ریسک‌ها، موارد نیازمند بررسی منبع و سؤال‌های تکمیلی؛ بدون پیش‌بینی قطعی نتیجه پرونده.');
else if(action.id==='next_steps')p.push('خروجی مطلوب: اقدامات بعدی ممکن را بر اساس مرحله فعلی پرونده توضیح بده، پیش‌نیاز هر اقدام و اطلاعات ناقص را مشخص کن و نتیجه قضایی را تضمین نکن.');
else if(action.id==='evidence_review')p.push('خروجی مطلوب: ماتریس ادعا/مدرک، مدارک موجود، مدارک نامعلوم یا ناقص، تعارض‌ها و سؤال‌های لازم برای تکمیل پرونده.');
else p.push('خروجی مطلوب: خلاصه ساختاریافته، بی‌طرف و فشرده برای بررسی توسط وکیل، با تفکیک واقعیت‌های ثبت‌شده، ابهام‌ها، مدارک و خواسته کاربر.');
p.push('بسته ساختاریافته پرونده (داده مرجع):\n'+JSON.stringify(payload,null,2));return p.join('\n\n')}
function build(c,actionId){var B=window.HaghyarLawyerBrief,action=find(c.domain,actionId);if(!action)throw new Error('AI action is not applicable to this domain');if(!B||typeof B.aiReady!=='function')throw new Error('AI-ready builder unavailable');var data=B.aiReady(c);return {schema:'DanjurAIPrompt/1.0',generated_at:new Date().toISOString(),request:{domain:c.domain,domain_label:LABEL[c.domain]||c.domain,action_id:action.id,action_title:action.title,action_kind:action.kind},preflight:{critical_issues:critical(c),ready_for_ai:critical(c).length===0},case:data.case||data,prompt:prompt(c,action,data)}}
window.DanjurAIActions={version:'1.0.0',domains:Object.keys(CATALOG),catalog:CATALOG,common:COMMON,actions:actions,find:find,build:build};
})();