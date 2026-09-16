const fs=require('fs');
const ui=fs.readFileSync('app/src/main/assets/v2_commercial_ui.js','utf8');
const help=fs.readFileSync('app/src/main/assets/v2_help.js','utf8');
const legacy=fs.readFileSync('app/src/main/assets/v1_6_ui_fix.js','utf8');
const base=fs.readFileSync('app/src/main/assets/v1_1.html','utf8');
let fail=[];function ok(v,m){if(!v)fail.push(m)}
// Ownership: legacy compatibility must never re-install interaction handlers.
ok(!/window\.hyResume\s*=/.test(legacy),'legacy layer overrides hyResume');
ok(!/hyq16|hyHelp16|function\s+deco\s*\(/.test(legacy),'legacy layer injects second Help UI');
// Resume is owned by commercial UI; Help interaction is owned by v2_help.
ok(/window\.hyResume\s*=/.test(ui),'commercial Resume handler missing');
ok(/window\.HaghyarHelp=/.test(help),'Help registry missing');
ok(/function\s+openHelp\s*\(/.test(help),'Help dialog renderer missing');
ok(/function\s+decorate\s*\(/.test(help),'Help decorator missing');
ok(/H\.registry\[z\.id\]|H\.question\(/.test(help),'question Help not connected to registry');
ok(/H\.option\(/.test(help),'option Help not connected to registry');
ok(/hyHelp2Btn/.test(help),'Help button class missing');
ok(/hyHelp2Option/.test(help),'option Help button missing');
ok(/\.onclick=function\(e\)/.test(help),'Help click binding missing');
ok(/setTimeout\(decorate,0\)/.test(help),'Help is not redecorated after render/restore');
// Commercial actions.
for(const fn of ['hyCases','hyOpenCase','hyBrief','hyDeleteCase','hyPrivacy','hyExport','hyCopyLawyer']) ok(new RegExp('window\\.'+fn+'\\s*=').test(ui),'commercial action missing: '+fn);
for(const sig of ['onclick="hyResume()"','onclick="hyCases(false)"','onclick="hyCases(true)"','onclick="hyPrivacy()"']) ok(ui.includes(sig),'home action missing: '+sig);
// Actual base navigation uses onclick prev()/next(), and domains are data in C rendered into #cats.
ok(/onclick="prev\(\)"/.test(base),'Previous control missing');
ok(/onclick="next\(\)"/.test(base),'Next control missing');
ok(/id="cats"/.test(base),'domain container missing');
for(const d of ['property','family','debt','work','contract','criminal','business','other']) ok(new RegExp('(?:const C=\\{|,)'+d+':\\[').test(base),'domain definition missing: '+d);
ok(/Object\.entries\(C\)|Object\.keys\(C\)/.test(base),'domain definitions are not rendered');
// Inline commercial handlers must resolve to v2 globals or known base globals.
const calls=[...ui.matchAll(/onclick="([A-Za-z_$][\w$]*)\(/g)].map(m=>m[1]);
const allowedBase=new Set(['home','historyPage']);
for(const fn of new Set(calls)) ok(new RegExp('window\\.'+fn+'\\s*=').test(ui)||allowedBase.has(fn),'unresolved commercial click handler: '+fn);
console.log(JSON.stringify({suite:'DANJUR Interactive UI Contract',clickHandlers:[...new Set(calls)].length,failures:fail},null,2));
if(fail.length)process.exit(2);
