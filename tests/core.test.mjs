import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {newModel,setTier,placeWithinTier,stepWithinTier,assignment,updateRating,updateFlag,lockAssignment,markNA,clearNA,removeAssignment,dominanceWarnings,inferPriorities,INTRATIER_PRIORITY_SHARE,newComposition,toV08Composition,compositionAnalysis,matchupAnalysis,validateModel,compatible} from '../js/core.mjs';
const src=p=>JSON.parse(readFileSync(new URL('../data/'+p,import.meta.url),'utf-8'));
const roster=src('roster.reference.json'),tax=src('taxonomy.json');
const model=()=>newModel();
function tier(m,hero,sub,t){return setTier(m,'hero.'+hero,'subrole.'+sub,t,roster,tax);}
function rate3(m,h,s,values){const sub='subrole.'+s;const caps=tax.subroles.find(x=>x.id===sub).coreCapabilities;caps.forEach((c,i)=>updateRating(m,'hero.'+h,sub,c,'rated',values[i],tax));}
test('roster preserves unique identities and multirole Deadpool',()=>{assert.equal(roster.heroes.length,54);assert.equal(new Set(roster.heroes.map(h=>h.id)).size,54);assert.deepEqual(roster.heroes.find(h=>h.name==='Deadpool').categories,['vanguard','duelist','strategist']);});
test('taxonomy has 9 distinct subroles, 17 universal capabilities, 3 core each',()=>{assert.equal(tax.subroles.length,9);assert.equal(tax.capabilities.length,17);assert.ok(tax.subroles.every(s=>s.coreCapabilities.length===3));});
test('assigning one hero across main/off/flex is independent',()=>{const m=model();tier(m,'hela','main-dps','S');tier(m,'hela','off-dps','C');assert.equal(m.assignments.length,2);assert.equal(assignment(m,'hero.hela','subrole.off-dps').tier,'C');assert.equal(assignment(m,'hero.hela','subrole.main-dps').tier,'S');});
test('moving an assigned hero within one board changes only that board',()=>{const m=model();tier(m,'hela','main-dps','S');tier(m,'hela','off-dps','C');tier(m,'hela','off-dps','A');assert.equal(assignment(m,'hero.hela','subrole.main-dps').tier,'S');assert.equal(m.assignments.length,2);});
test('hero cannot be ranked in incompatible official category',()=>{const m=model();assert.throws(()=>tier(m,'hela','main-tank','S'),/incompatibles/);});
test('Deadpool qualifies in all official categories',()=>{const d=roster.heroes.find(h=>h.name==='Deadpool');assert.ok(tax.subroles.every(s=>compatible(d,s)));});
test('unknown differs from not applicable and rated 1',()=>{const m=model();tier(m,'hela','off-dps','A');const a=assignment(m,'hero.hela','subrole.off-dps');assert.equal(Object.keys(a.ratings).length,0);const id=tax.subroles.find(s=>s.id==='subrole.off-dps').coreCapabilities[0];updateRating(m,'hero.hela','subrole.off-dps',id,'not_applicable',null,tax);assert.equal(a.ratings[id].state,'not_applicable');updateRating(m,'hero.hela','subrole.off-dps',id,'rated',1,tax);assert.equal(a.ratings[id].score,1);updateRating(m,'hero.hela','subrole.off-dps',id,'unknown',null,tax);assert.ok(!(id in a.ratings));});
test('vulnerabilities have three distinct states',()=>{const m=model();tier(m,'hela','main-dps','B');const a=assignment(m,'hero.hela','subrole.main-dps');updateFlag(m,a.heroId,a.subroleId,'vulnerabilities','vul.dive','absent',tax);assert.equal(a.vulnerabilities['vul.dive'],'absent');updateFlag(m,a.heroId,a.subroleId,'vulnerabilities','vul.dive','unknown',tax);assert.ok(!('vul.dive' in a.vulnerabilities));});
test('locked profile resists tier and rating edits without removing independence',()=>{const m=model();tier(m,'hela','main-dps','S');lockAssignment(m,'hero.hela','subrole.main-dps',true);assert.throws(()=>tier(m,'hela','main-dps','B'),/bloqueada/);assert.throws(()=>updateRating(m,'hero.hela','subrole.main-dps','cap.poke','rated',2,tax),/clasificación editable/);tier(m,'hela','off-dps','A');assert.equal(m.assignments.length,2);});
test('locking incomplete profile is allowed and schema-valid',()=>{const m=model();tier(m,'magneto','main-tank','A');lockAssignment(m,'hero.magneto','subrole.main-tank',true);assert.deepEqual(validateModel(m,roster,tax,m.patchId),[]);});
test('N/A explicitly differs from unassigned, cannot coexist with tier',()=>{const m=model();assert.equal(m.eligibilityOverrides.length,0);markNA(m,'hero.hela','subrole.off-dps',roster,tax);assert.throws(()=>tier(m,'hela','off-dps','S'),/N\/A/);clearNA(m,'hero.hela','subrole.off-dps');tier(m,'hela','off-dps','S');assert.equal(m.assignments.length,1);});
test('tier order is not computed from Likert sum',()=>{const m=model();tier(m,'hela','off-dps','S');rate3(m,'hela','off-dps',[1,1,1]);assert.equal(assignment(m,'hero.hela','subrole.off-dps').tier,'S');});
test('dominance alert only when candidate disagrees with other locked full profile',()=>{const m=model();tier(m,'hela','off-dps','A');rate3(m,'hela','off-dps',[5,5,5]);lockAssignment(m,'hero.hela','subrole.off-dps',true);tier(m,'psylocke','off-dps','S');rate3(m,'psylocke','off-dps',[2,3,4]);const w=dominanceWarnings(m,assignment(m,'hero.psylocke','subrole.off-dps'));assert.equal(w.length,1);assert.equal(w[0].otherHeroId,'hero.hela');});
test('priority descriptives use other tiers and no invented win probabilities',()=>{const m=model();tier(m,'hela','off-dps','S');rate3(m,'hela','off-dps',[2,5,4]);lockAssignment(m,'hero.hela','subrole.off-dps',true);tier(m,'psylocke','off-dps','B');rate3(m,'psylocke','off-dps',[5,3,2]);lockAssignment(m,'hero.psylocke','subrole.off-dps',true);const x=inferPriorities(m,'subrole.off-dps',tax.subroles.find(s=>s.id==='subrole.off-dps').coreCapabilities);assert.equal(x.pairs,1);assert.equal(x.signals[0].disagree,1);assert.equal(x.signals[1].agree,1);});
test('composition drafts are not misrepresented as v0.8 full compositions',()=>{const m=model(),c=newComposition(m);assert.equal(c.kind,'composition-draft');assert.equal(toV08Composition(c,m),null);});
test('composition contract exports only with all six assignments',()=>{const m=model(),c=newComposition(m);const heroes=['magneto','venom','hela','psylocke','luna-snow','mantis'],subs=['main-tank','off-tank','main-dps','off-dps','main-support','off-support'];heroes.forEach((h,i)=>{tier(m,h,subs[i],'B');c.slots[i]={slot:i+1,heroId:'hero.'+h,subroleId:'subrole.'+subs[i]};});const full=toV08Composition(c,m);assert.equal(full?.slots.length,6);assert.ok(full.slots.every(x=>x.assignmentId));});
test('composition with no evaluated attributes does not hallucinate weakness or win condition',()=>{const m=model(),c=newComposition(m);c.slots[0]={slot:1,heroId:'hero.hela',subroleId:'subrole.main-dps'};const a=compositionAnalysis(c,m);assert.equal(a.functions.filter(x=>x.state==='evidenced').length,0);assert.equal(a.chains.filter(x=>x.status==='potential').length,0);});
test('different teams with missing data produce insufficient-data rather than victory claims',()=>{const m=model(),a=newComposition(m),b=newComposition(m);const res=matchupAnalysis(a,b,m);assert.ok(res.teamA.every(x=>x.status==='insufficient-data'));assert.equal('winProbability' in res,false);});
test('invalid import rejects duplicate assignments and bad scores',()=>{const m=model();tier(m,'hela','off-dps','S');m.assignments.push(structuredClone(m.assignments[0]));m.assignments[0].ratings['cap.poke']={state:'rated',score:99};const errors=validateModel(m,roster,tax,m.patchId);assert.ok(errors.some(x=>x.includes('duplicada')));assert.ok(errors.some(x=>x.includes('Likert')));});
test('foreign patch triggers a deliberate migration boundary',()=>{const m=model();m.patchId='patch.other';assert.ok(validateModel(m,roster,tax,'patch.roster.2026-10-reference').some(x=>x.includes('Parche distinto')));});

// Regresión M1.1: orden manual dentro de un mismo tier y de un mismo subrol.
test('manual ordering within tier is explicit, persistent and independent of another subrole',()=>{
 const m=model();tier(m,'hela','main-dps','S');tier(m,'psylocke','main-dps','S');tier(m,'moon-knight','main-dps','S');
 tier(m,'hela','off-dps','A');tier(m,'psylocke','off-dps','A');
 const order=s=>m.assignments.filter(x=>x.subroleId==='subrole.'+s&&x.tier==='S').map(x=>x.heroId);
 assert.deepEqual(order('main-dps'),['hero.hela','hero.psylocke','hero.moon-knight']);
 assert.equal(placeWithinTier(m,'hero.moon-knight','subrole.main-dps','hero.hela','before'),true);
 assert.deepEqual(order('main-dps'),['hero.moon-knight','hero.hela','hero.psylocke']);
 assert.deepEqual(m.assignments.filter(x=>x.subroleId==='subrole.off-dps').map(x=>x.heroId),['hero.hela','hero.psylocke']);
 assert.deepEqual(validateModel(m,roster,tax,m.patchId),[]);
 const restored=JSON.parse(JSON.stringify(m));
 assert.deepEqual(restored.assignments.filter(x=>x.subroleId==='subrole.main-dps'&&x.tier==='S').map(x=>x.heroId),order('main-dps'));
});
test('locked tier remains locked but manual order can change without modifying profile',()=>{
 const m=model();tier(m,'hela','off-dps','A');tier(m,'psylocke','off-dps','A');
 updateRating(m,'hero.hela','subrole.off-dps','cap.off-angle-pressure','rated',4,tax);
 lockAssignment(m,'hero.hela','subrole.off-dps',true);
 const original=structuredClone(assignment(m,'hero.hela','subrole.off-dps'));
 assert.equal(stepWithinTier(m,'hero.hela','subrole.off-dps',1),true);
 assert.deepEqual(assignment(m,'hero.hela','subrole.off-dps'),original);
 assert.deepEqual(m.assignments.filter(x=>x.subroleId==='subrole.off-dps').map(x=>x.heroId),['hero.psylocke','hero.hela']);
 assert.throws(()=>tier(m,'hela','off-dps','S'),/bloqueada/);
 assert.equal(stepWithinTier(m,'hero.hela','subrole.off-dps',1),false);
});
test('ordering can target start, end and reject cross-tier or cross-subrole anchors',()=>{
 const m=model();tier(m,'hela','main-dps','S');tier(m,'psylocke','main-dps','S');tier(m,'moon-knight','main-dps','B');
 assert.throws(()=>placeWithinTier(m,'hero.hela','subrole.main-dps','hero.moon-knight','before'),/mismo tier/);
 assert.equal(placeWithinTier(m,'hero.hela','subrole.main-dps',null,'end'),true);
 assert.deepEqual(m.assignments.filter(x=>x.subroleId==='subrole.main-dps'&&x.tier==='S').map(x=>x.heroId),['hero.psylocke','hero.hela']);
 assert.equal(placeWithinTier(m,'hero.hela','subrole.main-dps',null,'start'),true);
 assert.deepEqual(m.assignments.filter(x=>x.subroleId==='subrole.main-dps'&&x.tier==='S').map(x=>x.heroId),['hero.hela','hero.psylocke']);
});
test('moving to a different tier can append at its end without losing ratings',()=>{
 const m=model();tier(m,'hela','main-dps','S');tier(m,'psylocke','main-dps','S');tier(m,'moon-knight','main-dps','B');
 updateRating(m,'hero.moon-knight','subrole.main-dps','cap.poke','rated',5,tax);
 setTier(m,'hero.moon-knight','subrole.main-dps','S',roster,tax);
 placeWithinTier(m,'hero.moon-knight','subrole.main-dps',null,'end');
 assert.deepEqual(m.assignments.filter(x=>x.subroleId==='subrole.main-dps'&&x.tier==='S').map(x=>x.heroId),['hero.hela','hero.psylocke','hero.moon-knight']);
 assert.equal(assignment(m,'hero.moon-knight','subrole.main-dps').ratings['cap.poke'].score,5);
});

// Regresión M1.2: las definiciones no deben ocultarse detrás de otra vista ni de un filtro de subrol.
test('rankings shows five tier meanings above the three simultaneous boards',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf-8');
 const required=['Dominante / referente','Fuerte / consistente','Viable / contextual','Nicho / ineficiente','Inferior / poco competitivo'];
 assert.ok(required.every(label=>html.includes(label)), 'Falta una definición corta de tier');
 const guide=html.indexOf('class="tier-guide"');
 const boards=html.indexOf('id="boards"');
 assert.ok(guide>=0&&boards>guide,'La guía debe estar antes de Main / Off / Flex');
 assert.match(html, /Ver definiciones completas de S–D y N\/A/);
 assert.match(html, /N\/A — No aplicable/);
});
test('tier guide does not require app data changes and has responsive styles',()=>{
 const css=readFileSync(new URL('../css/style.css',import.meta.url),'utf-8');
 assert.match(css,/\.tier-guide-grid\{display:grid;grid-template-columns:repeat\(5/);
 assert.match(css,/\.tier-guide-expanded/);
 assert.match(css,/max-width:610px[^}]+\.tier-guide/);
});

// M1.3: el ranking intratier es evidencia secundaria, no cambia el tier.
test('within-tier locked order yields directional pairwise priority evidence',()=>{
 const m=model();tier(m,'hela','off-dps','S');tier(m,'psylocke','off-dps','S');
 rate3(m,'hela','off-dps',[2,5,4]);rate3(m,'psylocke','off-dps',[5,3,4]);
 lockAssignment(m,'hero.hela','subrole.off-dps',true);lockAssignment(m,'hero.psylocke','subrole.off-dps',true);
 const caps=tax.subroles.find(s=>s.id==='subrole.off-dps').coreCapabilities;
 const x=inferPriorities(m,'subrole.off-dps',caps);
 assert.equal(x.pairs,0);assert.equal(x.withinPairs,1);
 assert.equal(x.signals[0].intraDisagree,1);assert.equal(x.signals[1].intraAgree,1);assert.equal(x.signals[2].intraTies,1);
 assert.equal(x.weights,null,'No weights from just two heroes in one tier');
});
test('reordering locked heroes reverses intratier evidence without changing their ratings or tier',()=>{
 const m=model();tier(m,'hela','off-dps','S');tier(m,'psylocke','off-dps','S');
 rate3(m,'hela','off-dps',[2,5,4]);rate3(m,'psylocke','off-dps',[5,3,4]);
 lockAssignment(m,'hero.hela','subrole.off-dps',true);lockAssignment(m,'hero.psylocke','subrole.off-dps',true);
 const caps=tax.subroles.find(s=>s.id==='subrole.off-dps').coreCapabilities;
 const before=inferPriorities(m,'subrole.off-dps',caps);
 placeWithinTier(m,'hero.psylocke','subrole.off-dps','hero.hela','before');
 const after=inferPriorities(m,'subrole.off-dps',caps);
 assert.equal(before.signals[1].intraAgree,1);assert.equal(after.signals[1].intraDisagree,1);
 assert.equal(assignment(m,'hero.hela','subrole.off-dps').tier,'S');
 assert.equal(assignment(m,'hero.psylocke','subrole.off-dps').ratings[caps[0]].score,5);
});
test('incomplete or unlocked profiles cannot influence intratier priority inference',()=>{
 const m=model();for(const h of ['hela','psylocke','moon-knight'])tier(m,h,'off-dps','A');
 rate3(m,'hela','off-dps',[1,5,3]);rate3(m,'psylocke','off-dps',[5,1,3]);
 lockAssignment(m,'hero.hela','subrole.off-dps',true);
 // Psylocke todavía sin bloquear; Moon Knight sin Likert.
 lockAssignment(m,'hero.moon-knight','subrole.off-dps',true);
 const caps=tax.subroles.find(s=>s.id==='subrole.off-dps').coreCapabilities;
 const x=inferPriorities(m,'subrole.off-dps',caps);
 assert.equal(x.withinPairs,0);assert.equal(x.observations,1);
 lockAssignment(m,'hero.psylocke','subrole.off-dps',true);
 assert.equal(inferPriorities(m,'subrole.off-dps',caps).withinPairs,1);
});
test('intratier ordering in one subrole does not alter another subrole inference',()=>{
 const m=model();for(const role of ['main-dps','off-dps'])for(const h of ['hela','psylocke']){
  tier(m,h,role,'S');rate3(m,h,role,h==='hela'?[2,5,4]:[5,2,3]);
  lockAssignment(m,'hero.'+h,'subrole.'+role,true);
 }
 const mainCaps=tax.subroles.find(s=>s.id==='subrole.main-dps').coreCapabilities;
 const offCaps=tax.subroles.find(s=>s.id==='subrole.off-dps').coreCapabilities;
 const baseline=inferPriorities(m,'subrole.main-dps',mainCaps);
 placeWithinTier(m,'hero.psylocke','subrole.off-dps','hero.hela','before');
 assert.deepEqual(inferPriorities(m,'subrole.main-dps',mainCaps),baseline);
 assert.equal(inferPriorities(m,'subrole.off-dps',offCaps).signals[0].intraAgree,1);
});
test('tier associations remain dominant in blended exponential weights, intratier contributes 20%',()=>{
 const m=model();
 // Tiers S, A, B, C, A: at least four rows and three distinct tiers, plus a same-tier pair.
 const h=['hela','psylocke','moon-knight','star-lord','black-widow'];
 const t=['S','A','A','B','C'];
 const vals=[[2,5,4],[4,4,5],[5,3,4],[3,2,3],[1,1,1]];
 h.forEach((hero,i)=>{tier(m,hero,'off-dps',t[i]);rate3(m,hero,'off-dps',vals[i]);lockAssignment(m,'hero.'+hero,'subrole.off-dps',true);});
 const caps=tax.subroles.find(s=>s.id==='subrole.off-dps').coreCapabilities;
 const x=inferPriorities(m,'subrole.off-dps',caps);
 assert.equal(x.withinPairs,1);assert.equal(x.pairs,9);
 assert.equal(x.tierShare,0.8);assert.equal(x.intratierShare,INTRATIER_PRIORITY_SHARE);
 assert.ok(x.weights);
 for(const c of x.signals)if(c.comparable&&c.intraComparable){
  const expected=0.8*c.concordance+0.2*c.intraConcordance;
  assert.ok(Math.abs(c.blendedConcordance-expected)<1e-10);
 }
 assert.ok(Math.abs(Object.values(x.weights).reduce((a,b)=>a+b,0)-1)<1e-10);
 assert.deepEqual(validateModel(m,roster,tax,m.patchId),[]);
});
test('import export assignment order preserves intratier preference signal',()=>{
 const m=model();tier(m,'hela','off-dps','S');tier(m,'psylocke','off-dps','S');
 rate3(m,'hela','off-dps',[1,4,3]);rate3(m,'psylocke','off-dps',[5,2,4]);
 lockAssignment(m,'hero.hela','subrole.off-dps',true);lockAssignment(m,'hero.psylocke','subrole.off-dps',true);
 placeWithinTier(m,'hero.psylocke','subrole.off-dps','hero.hela','before');
 const copy=JSON.parse(JSON.stringify(m));
 assert.deepEqual(validateModel(copy,roster,tax,m.patchId),[]);
 const caps=tax.subroles.find(s=>s.id==='subrole.off-dps').coreCapabilities;
 assert.deepEqual(inferPriorities(copy,'subrole.off-dps',caps),inferPriorities(m,'subrole.off-dps',caps));
});
