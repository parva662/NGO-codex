(function(){
'use strict';
const APP_VERSION='1.6.0';

function syncVersion(){
  document.querySelectorAll('.version').forEach(function(el){
    const t=(el.textContent||'').trim();
    if(t.indexOf('Legal Intake')>=0) el.textContent='Legal Intake • v'+APP_VERSION;
    else if(/^v?\d+\.\d+\.\d+$/.test(t)) el.textContent='v'+APP_VERSION;
  });
}

const QUESTION_HELP={
 pKind:'نوع اصلی اختلاف ملکی را انتخاب کن تا حق‌یار فقط سؤال‌های مرتبط با همان مسیر را نمایش دهد.',
 pRole:'نقش خودت را در این اختلاف مشخص کن؛ حقوق، تعهدات و اقدام مناسب برای مستأجر، موجر، خریدار یا فروشنده متفاوت است.',
 leaseIssue:'مشخص کن اختلاف اجاره دقیقاً درباره چیست؛ مثلاً استرداد ودیعه، تخلیه، اجاره‌بها یا خسارت.',
 leaseWritten:'نوع قرارداد اجاره مشخص می‌کند چه اسنادی برای اثبات رابطه اجاره و شروط قرارداد در دسترس است.',
 leaseStart:'تاریخ شروع اجاره را دقیقاً مطابق قرارداد وارد کن.',
 leaseEnd:'تاریخ پایان مدت اجاره را دقیقاً مطابق قرارداد وارد کن؛ این تاریخ برای تشخیص انقضای مدت اهمیت دارد.',
 earlyTerminationReason:'اگر هنوز مدت اجاره تمام نشده، مبنای خاتمه زودتر باید روشن باشد؛ مانند توافق طرفین یا حق فسخ قراردادی.',
 earlyTerminationProof:'مشخص کن برای خاتمه پیش از موعد چه مدرکی داری؛ قرارداد، توافق کتبی یا پیام می‌تواند در اثبات توافق مؤثر باشد.',
 deposit:'مبلغ ودیعه‌ای را وارد کن که واقعاً به موجر پرداخت شده است و واحد پول را نیز دقیق انتخاب کن.',
 rent:'مبلغ اجاره‌بهای ماهانه مندرج در قرارداد را وارد کن.',
 possession:'مشخص کن ملک و کلید اکنون در اختیار چه کسی است؛ این موضوع در مطالبه ودیعه و تحویل ملک اهمیت دارد.',
 readyVacate:'مشخص کن برای تخلیه و تحویل کلید چه وضعیتی داری تا مطالبه ودیعه با وضعیت واقعی تحویل ملک هماهنگ باشد.',
 handoverClause:'اگر قرارداد درباره ترتیب تخلیه، تحویل کلید و بازپرداخت ودیعه شرطی دارد، همان شرط باید در تحلیل لحاظ شود.',
 arrears:'مشخص کن آیا موجر بابت اجاره‌بها، شارژ، قبوض یا خسارت ادعای بدهی دارد یا خیر.',
 arrearsAmountKnown:'اگر بدهی مطرح است، معلوم بودن مبلغ آن برای محاسبه مبلغ مورد مطالبه و جلوگیری از ادعای بیش از حد لازم است.',
 returnedAmount:'اگر بخشی از ودیعه پس داده شده، مقدار دقیق آن را ثبت کن تا مانده واقعی محاسبه شود.',
 province:'استان مرتبط با ملک، قرارداد، حادثه یا مرجع رسیدگی را انتخاب کن؛ این داده برای بررسی اولیه صلاحیت محلی استفاده می‌شود.',
 city:'شهر یا شهرستان مرتبط با پرونده را وارد کن؛ معمولاً محل ملک، انجام تعهد یا وقوع موضوع پرونده اهمیت دارد.',
 stage:'مرحله فعلی پرونده را انتخاب کن تا حق‌یار بداند هنوز در مرحله اقدام اولیه هستی یا پرونده وارد رسیدگی و اجرا شده است.',
 urgent:'این سؤال فقط برای تشخیص وجود یک تاریخ حساس است؛ وجود تاریخ به‌تنهایی به معنی مهلت قانونی نیست.',
 deadlineSource:'منشأ تاریخ را مشخص کن تا مهلت قضایی، قراردادی یا صرفاً شخصی با هم اشتباه نشوند.',
 deadlineDate:'تاریخی را وارد کن که طبق ابلاغ، قرارداد یا منبع انتخاب‌شده باید تا آن زمان اقدام شود.',
 deadlineProof:'مشخص کن برای تاریخ یا مهلت اعلام‌شده سند قابل بررسی داری یا خیر.',
 generalFiles:'مدارک اصلی و مرتبط را اضافه کن؛ مانند قرارداد، رسید، ابلاغیه، رأی، چک یا مکاتبات مؤثر.',
 goal:'نتیجه‌ای را انتخاب کن که واقعاً از این پرونده می‌خواهی؛ این پاسخ در تعیین اقدام و سند پیشنهادی استفاده می‌شود.'
};

const OPTION_HELP={
 pKind:{
  'اجاره و ودیعه':'اختلاف ناشی از رابطه موجر و مستأجر؛ مانند ودیعه، اجاره‌بها، پایان قرارداد، تعمیرات یا تعهدات اجاره.',
  'تخلیه':'موضوع اصلی، تحویل و تخلیه ملک است؛ چه از طرف موجر درخواست شده باشد و چه درباره نحوه یا زمان تخلیه اختلاف باشد.',
  'خرید و فروش':'اختلاف ناشی از معامله ملک؛ مانند انتقال سند، پرداخت ثمن، تحویل ملک، فسخ یا عیب مورد معامله.',
  'مالکیت/سند':'اختلاف درباره مالک بودن، سند رسمی، انتقال یا اصلاح وضعیت ثبتی و مالکیتی ملک.',
  'تصرف یا مزاحمت':'موضوع درباره تصرف، ممانعت از حق یا ایجاد مزاحمت نسبت به استفاده از ملک است.',
  'ساخت‌وساز':'اختلاف مرتبط با ساخت، عیب یا نقص ساختمانی، تعهدات سازنده یا مسائل مشابه ساخت‌وساز.'
 },
 pRole:{
  'مستأجر':'تو ملک را اجاره کرده‌ای و طرف تعهدات مستأجر هستی.',
  'موجر':'تو ملک را اجاره داده‌ای و طرف تعهدات موجر هستی.',
  'خریدار':'تو در معامله، خریدار ملک هستی.',
  'فروشنده':'تو در معامله، فروشنده ملک هستی.',
  'مالک':'ادعای مالکیت یا حقوق ناشی از مالکیت داری.',
  'متصرف':'ملک در تصرف توست یا اختلاف مستقیماً به تصرف تو مربوط است.'
 },
 stage:{
  'هنوز اقدام رسمی نکرده‌ام':'هنوز دادخواست، شکایت یا اقدام رسمی قضایی ثبت نکرده‌ای.',
  'اظهارنامه/مذاکره انجام شده':'برای حل موضوع، مذاکره یا اظهارنامه انجام شده ولی پرونده وارد رسیدگی قضایی نشده است.',
  'دادخواست یا شکایت ثبت شده':'پرونده در مرجع مربوط ثبت شده اما ممکن است رسیدگی ماهوی هنوز آغاز نشده باشد.',
  'در حال رسیدگی':'پرونده در شعبه یا مرجع رسیدگی فعال است.',
  'رأی صادر شده':'برای پرونده رأی یا تصمیم قضایی صادر شده است.',
  'مرحله اجرا':'پرونده وارد اجرای رأی یا اجرائیه شده است.',
  'نمی‌دانم':'مرحله رسمی پرونده را دقیق نمی‌دانی؛ حق‌یار این مورد را برای بررسی بیشتر علامت می‌زند.'
 },
 urgent:{
  'بله':'یک تاریخ مشخص داری که احتمال می‌دهی پیش از آن باید اقدام کنی؛ در سؤال بعد منشأ آن بررسی می‌شود.',
  'خیر':'در حال حاضر تاریخ مشخص و نزدیکی برای اقدام اعلام نشده است.',
  'مطمئن نیستم':'تاریخی وجود دارد یا ممکن است وجود داشته باشد، اما نمی‌دانی مهلت الزام‌آور است یا نه.'
 },
 deadlineSource:{
  'ابلاغیه قضایی':'تاریخ از ابلاغ رسمی قضایی یا سامانه مربوط به ابلاغ گرفته شده است.',
  'جلسه دادگاه':'تاریخ مربوط به جلسه یا وقت رسیدگی اعلام‌شده از سوی مرجع قضایی است.',
  'مهلت اعتراض/تجدیدنظر':'تاریخ را به عنوان پایان مهلت اعتراض یا تجدیدنظر در نظر گرفته‌ای و باید مبنای آن با ابلاغ بررسی شود.',
  'مهلت قراردادی':'تاریخ مستقیماً از یک شرط یا موعد مندرج در قرارداد ناشی می‌شود.',
  'توافق طرفین':'طرفین برای انجام کاری تا تاریخ مشخص با یکدیگر توافق کرده‌اند.',
  'یادآوری شخصی':'این تاریخ را خودت برای پیگیری تعیین کرده‌ای و به‌تنهایی مهلت قانونی یا قراردادی محسوب نمی‌شود.',
  'نمی‌دانم':'منبع تاریخ را نمی‌دانی؛ قبل از اتکا به آن باید سند یا ابلاغ بررسی شود.'
 }
};

function questionHelp(q){
 if(!q) return 'برای این سؤال هنوز راهنمای اختصاصی تعریف نشده است.';
 return QUESTION_HELP[q.id] || q.h || ('این پاسخ برای تکمیل بخش «'+q.x+'» پرونده استفاده می‌شود. گزینه‌ای را انتخاب کن که دقیقاً با واقعیت و مدارکت منطبق است.');
}
function optionHelp(q,opt){
 if(q && OPTION_HELP[q.id] && OPTION_HELP[q.id][opt]) return OPTION_HELP[q.id][opt];
 const generic={
  'بله':'یعنی موضوعی که در همین سؤال پرسیده شده درباره پرونده تو صدق می‌کند.',
  'خیر':'یعنی موضوعی که در همین سؤال پرسیده شده درباره پرونده تو صدق نمی‌کند.',
  'نمی‌دانم':'یعنی در حال حاضر اطلاعات یا مدرک کافی برای پاسخ قطعی به همین سؤال نداری.',
  'مطمئن نیستم':'یعنی درباره همین موضوع تردید داری و برای پاسخ قطعی باید اطلاعات یا مدرک بیشتری بررسی شود.',
  'مورد اختلاف است':'یعنی طرفین درباره همین موضوع یا مقدار آن توافق ندارند.'
 };
 if(generic[opt]) return generic[opt];
 return 'با انتخاب «'+opt+'» اعلام می‌کنی که این گزینه دقیقاً وضعیت تو در سؤال «'+(q?q.x:'فعلی')+'» را توصیف می‌کند.';
}

function installHelp(){
 let old=document.getElementById('hySheet'); if(old) old.remove();
 let oldStyle=document.getElementById('hyHelpStyle16'); if(oldStyle) oldStyle.remove();
 let st=document.createElement('style'); st.id='hyHelpStyle16';
 st.textContent='.hyq16{display:inline-flex;align-items:center;justify-content:center;width:25px;height:25px;min-width:25px;padding:0;border-radius:50%;border:1px solid #9db2c5;background:#f5f9fc;color:#123e63;font-weight:900;cursor:pointer}.qtitle .hyq16{margin-right:8px}.opt .hyq16{margin-right:auto}.hysheet16{position:fixed;inset:0;background:#00192c88;z-index:10050;display:flex;align-items:flex-end;padding:14px}.hycard16{background:#fff;width:min(720px,100%);margin:auto;border-radius:22px;padding:20px;line-height:2}.hycard16 h3{margin:0 0 8px}.hyhelpcontext{font-size:12px;color:#708096;margin-bottom:6px}.hyhelpbody{font-size:15px;color:#152235}.hyclose16{width:100%;margin-top:14px}';
 document.head.appendChild(st);
 let sheet=document.createElement('div'); sheet.id='hySheet16'; sheet.className='hysheet16 hidden';
 sheet.innerHTML='<div class="hycard16"><h3>راهنمای حق‌یار</h3><div id="hyHelpContext16" class="hyhelpcontext"></div><div id="hyHelpText16" class="hyhelpbody"></div><button id="hyClose16" type="button" class="btn primary hyclose16">متوجه شدم</button></div>';
 document.body.appendChild(sheet);
 sheet.addEventListener('click',function(e){if(e.target===sheet||e.target.id==='hyClose16')sheet.classList.add('hidden')});
 document.addEventListener('click',function(e){
   const b=e.target.closest&&e.target.closest('.hyq16'); if(!b)return;
   e.preventDefault();e.stopPropagation();
   const q=visible()[S.idx];
   document.getElementById('hyHelpContext16').textContent=q?q.x:'';
   document.getElementById('hyHelpText16').textContent=b.dataset.option?optionHelp(q,b.dataset.option):questionHelp(q);
   sheet.classList.remove('hidden');
 },true);
}

function cleanLegacyHelp(){
 document.querySelectorAll('#qw .hyq').forEach(function(x){x.remove()});
 const q=visible()[S.idx]; if(!q)return;
 const title=document.querySelector('#qw .qtitle');
 if(title){let b=document.createElement('button');b.type='button';b.className='hyq16';b.setAttribute('aria-label','راهنمای سؤال');b.textContent='؟';title.appendChild(b)}
 document.querySelectorAll('#qw .opt').forEach(function(l){
   const r=l.querySelector('input[name=ans]'); if(!r)return;
   let b=document.createElement('button');b.type='button';b.className='hyq16';b.dataset.option=r.value;b.setAttribute('aria-label','توضیح گزینه '+r.value);b.textContent='؟';l.appendChild(b);
 });
}

function wrapRender(){
 const previous=render;
 render=function(){previous();syncVersion();cleanLegacyHelp();};
}

function init(){syncVersion();installHelp();wrapRender();cleanLegacyHelp();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
