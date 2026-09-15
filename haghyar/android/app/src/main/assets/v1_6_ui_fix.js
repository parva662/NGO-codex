/* Haghyar v2 compatibility layer.
   Legacy UI/help/resume overrides were intentionally removed.
   v2_commercial_ui.js is the single owner of commercial UI interactions,
   and v2_help.js is the single source of contextual help content. */
(function(){'use strict';
const V='2.0.0';
function native(){return window.Android||null}
function err(x){try{alert(x)}catch(e){}}
function sync(){document.querySelectorAll('.version').forEach(e=>e.textContent='Commercial MVP • v'+V);document.documentElement.dataset.haghyarVersion=V}
window.outJSON=function(){try{let a=native();if(!a||!a.save)throw 0;a.save(name()+'.json',JSON.stringify(last,null,2),'application/json')}catch(e){err('خروجی JSON اجرا نشد.')}};
window.outPDF=function(){try{let a=native();if(!a||!a.savePdf)throw 0;a.savePdf(name()+'.pdf',text(last))}catch(e){err('خروجی PDF اجرا نشد.')}};
window.outDOCX=function(){try{let a=native();if(!a||!a.saveDocx)throw 0;a.saveDocx(name()+'.docx','حق‌یار — پرونده حقوقی',text(last))}catch(e){err('خروجی Word اجرا نشد.')}};
window.outZIP=function(){try{let a=native();if(!a||!a.saveZip)throw 0;a.saveZip(name()+'.zip',JSON.stringify(last,null,2),text(last),JSON.stringify(last.attachments||[]))}catch(e){err('خروجی ZIP اجرا نشد.')}};
let sr=window.showResult;if(typeof sr==='function')window.showResult=function(){let x=sr.apply(this,arguments);sync();return x};
sync();
window.HaghyarFinal={version:V,compatibilityOnly:true,offlineKnowledge:true,exportsFixed:true,commercial:true};
})();
