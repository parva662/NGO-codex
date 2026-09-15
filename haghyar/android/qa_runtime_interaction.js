const fs=require('fs'),vm=require('vm');
const files=p=>fs.readFileSync(p,'utf8');
const base=files('app/src/main/assets/v1_1.html'),help=files('app/src/main/assets/v2_help.js'),ui=files('app/src/main/assets/v2_commercial_ui.js'),post=files('app/src/main/assets/v2_post_integration.js'),main=files('app/src/main/java/ir/haghyar/offline/MainActivity.java');
let fail=[],checks=0;function ok(v,m){checks++;if(!v)fail.push(m)}
const domains=['property','family','debt','work','contract','criminal','business','other'];
// Base runtime navigation/domain wiring.
ok(/function\s+next\s*\(/.test(base),'next() runtime missing');ok(/function\s+prev\s*\(/.test(base),'prev() runtime missing');ok(/onclick="next\(\)"/.test(base),'Next button not wired');ok(/onclick="prev\(\)"/.test(base),'Back button not wired');
for(const d of domains){ok(new RegExp('(?:const C=\\{|,)'+d+':\\[').test(base),'domain missing '+d)}
ok(/Object\.entries\(C\)|Object\.keys\(C\)/.test(base),'domain cards are not generated from C');
// Help runtime: question and option Help must be clickable, registry-backed and closeable.
ok(/function\s+openHelp\s*\(/.test(help),'openHelp missing');ok(/H\.question\(/.test(help)||/H\.registry\[z\.id\]/.test(help),'question help registry lookup missing');ok(/H\.option\(/.test(help),'option help registry lookup missing');ok(/hyHelp2Btn/.test(help)&&/hyHelp2Option/.test(help),'help controls missing');ok(/onclick=function\(e\)/.test(help),'help click event missing');ok(/remove\(\)|display\s*=\s*['"]none/.test(help),'help close behavior missing');
// Resume must restore state and rerender intake instead of merely opening a screen.
ok(/window\.hyResume\s*=/.test(ui),'hyResume missing');ok(/function\s+restoreDraft\s*\(/.test(ui),'restoreDraft missing');ok(/window\.S\s*=\s*d/.test(ui),'resume does not restore state');ok(/S\.all\s*=/.test(ui),'resume does not rebuild question path');ok(/render\(\)/.test(ui),'resume/render integration missing');
// Final post-integration must replace AI-ready export and expose App Lock controls.
ok(/B\.aiReady\(rc\)/.test(post),'AI-ready builder not invoked');ok(/window\.hyExport\s*=/.test(post),'export wrapper missing');ok(/appLockAvailable/.test(post)&&/setAppLock/.test(post)&&/lockNow/.test(post),'app lock UI bridge missing');
// Android runtime load order and privacy lifecycle.
const order=['v2_commercial_core.js','v2_help.js','v2_lawyer_brief.js','v2_commercial_ui.js','v2_post_integration.js'].map(x=>main.indexOf(x));ok(order.every(x=>x>=0)&&order.every((x,i)=>i===0||x>order[i-1]),'Android patch load order invalid');ok(/setVisibility\(View\.INVISIBLE\)/.test(main),'locked WebView is not hidden');ok(/authenticateForUnlock/.test(main),'unlock authentication missing');ok(/onStop\(\)/.test(main)&&/authenticated=false/.test(main),'background relock lifecycle missing');
// No legacy duplicate Help owner.
const legacy=files('app/src/main/assets/v1_6_ui_fix.js');ok(!/hyq16|hyHelp16/.test(legacy),'legacy duplicate help UI returned');
console.log(JSON.stringify({suite:'Haghyar Runtime Interaction Regression',domains:domains.length,checks,failed:fail.length,failures:fail},null,2));if(fail.length)process.exit(2);
