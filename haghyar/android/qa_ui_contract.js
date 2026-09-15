const fs=require('fs');
const ui=fs.readFileSync('app/src/main/assets/v2_commercial_ui.js','utf8');
const legacy=fs.readFileSync('app/src/main/assets/v1_6_ui_fix.js','utf8');
const base=fs.readFileSync('app/src/main/assets/v1_1.html','utf8');
let fail=[];function ok(v,m){if(!v)fail.push(m)}
// A single owner must control Help/Resume. This catches the regression that broke Build 98.
ok(!/window\.hyResume\s*=/.test(legacy),'legacy layer overrides hyResume');
ok(!/hyq16|hyHelp16|function\s+deco\s*\(/.test(legacy),'legacy layer injects a second Help UI');
ok(/window\.hyResume\s*=/.test(ui),'commercial UI missing Resume handler');
ok(/window\.hyQuestionHelp\s*=/.test(ui),'commercial UI missing question Help handler');
ok(/window\.hyOptionHelp\s*=/.test(ui),'commercial UI missing option Help handler');
ok(/HaghyarHelp\.question/.test(ui),'question Help is not connected to Help registry');
ok(/HaghyarHelp\.option/.test(ui),'option Help is not connected to Help registry');
ok(/class="hyHelpQ"/.test(ui),'question Help button is not rendered');
ok(/class="hyOptHelp"/.test(ui),'option Help button is not rendered');
ok(/onclick="hyQuestionHelp\(/.test(ui),'question Help button has no click action');
ok(/onclick="hyOptionHelp\(/.test(ui),'option Help button has no click action');
ok(/function\s+helpSheet\s*\(/.test(ui),'Help sheet renderer missing');
ok(/hyHelpSheet/.test(ui),'Help sheet DOM missing');
ok(/window\.hyCases\s*=/.test(ui),'My Cases action missing');
ok(/window\.hyOpenCase\s*=/.test(ui),'Open Case action missing');
ok(/window\.hyBrief\s*=/.test(ui),'Lawyer Brief action missing');
ok(/window\.hyDeleteCase\s*=/.test(ui),'Delete Case action missing');
ok(/window\.hyPrivacy\s*=/.test(ui),'Privacy action missing');
ok(/window\.hyExport\s*=/.test(ui),'Export action missing');
ok(/window\.hyCopyLawyer\s*=/.test(ui),'Copy lawyer summary action missing');
ok(/onclick="hyResume\(\)"/.test(ui),'Resume home button missing');
ok(/onclick="hyCases\(false\)"/.test(ui),'My Cases home button missing');
ok(/onclick="hyCases\(true\)"/.test(ui),'Send-to-lawyer home button missing');
ok(/onclick="hyPrivacy\(\)"/.test(ui),'Privacy home button missing');
// Base navigation contract: next/back and eight domain starters must remain reachable.
ok(/id="next"/.test(base),'Next control missing from base intake');
ok(/id="back"/.test(base),'Back control missing from base intake');
for(const d of ['property','family','debt','work','contract','criminal','business','other']) ok(new RegExp("start\\('"+d+"'\\)").test(base),'domain start missing: '+d);
// Every inline commercial onclick target must resolve to either a v2 global or an existing base function.
const calls=[...ui.matchAll(/onclick="([A-Za-z_$][\w$]*)\(/g)].map(m=>m[1]);
const allowedBase=new Set(['home','historyPage']);
for(const fn of new Set(calls)) ok(new RegExp('window\\.'+fn+'\\s*=').test(ui)||allowedBase.has(fn),'unresolved UI click handler: '+fn);
console.log(JSON.stringify({suite:'Haghyar Interactive UI Contract',clickHandlers:[...new Set(calls)].length,failures:fail},null,2));
if(fail.length)process.exit(2);
