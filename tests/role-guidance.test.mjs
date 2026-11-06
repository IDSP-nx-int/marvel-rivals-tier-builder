import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ROLE_GUIDANCE,SUBROLE_GUIDANCE,FLEX_DPS_BRIDGE,extraVisibleCaps,flexCoverageSummary} from '../js/role-guidance.mjs';
const tax=JSON.parse(readFileSync(new URL('../data/taxonomy.json',import.meta.url)));
test('tres roles oficiales cuentan con definición breve',()=>{
  assert.deepEqual(Object.keys(ROLE_GUIDANCE).sort(),['duelist','strategist','vanguard']);
  assert.ok(Object.values(ROLE_GUIDANCE).every(x=>x.description.length>=30&&x.description.length<150));
});
test('exactamente nueve subroles con descripciones y sin errores de ID',()=>{
  const ids=tax.subroles.map(s=>s.id);
  assert.deepEqual(Object.keys(SUBROLE_GUIDANCE).sort(),[...ids].sort());
  assert.ok(Object.values(SUBROLE_GUIDANCE).every(s=>s.length>45&&s.length<150));
});
test('Flex DPS conserva sus tres dimensiones principales',()=>{
  const s=tax.subroles.find(x=>x.id==='subrole.flex-dps');
  assert.deepEqual(s.coreCapabilities,['cap.anti-dive','cap.kill-conversion','cap.mobility-reset']);
});
test('Flex DPS suma dos capacidades de puente distintas de sus tres principales',()=>{
  const s=tax.subroles.find(x=>x.id==='subrole.flex-dps');
  assert.deepEqual(FLEX_DPS_BRIDGE.map(x=>x.id),['cap.sustained-pressure','cap.off-angle-pressure']);
  assert.ok(FLEX_DPS_BRIDGE.every(x=>tax.capabilities.some(c=>c.id===x.id)&&!s.coreCapabilities.includes(x.id)));
});
test('otros ocho subroles no adquieren preguntas nuevas',()=>{
  for(const s of tax.subroles)if(s.id!=='subrole.flex-dps')assert.deepEqual(extraVisibleCaps(s.id),[]);
});
test('Flex detecta ratings aún no declarados sin asumir cero',()=>{
  assert.deepEqual(flexCoverageSummary({ratings:{}}),{main:'Sin evaluar',off:'Sin evaluar',summary:'Main: Sin evaluar · Off: Sin evaluar'});
});
test('Flex distingue evaluado de N/A',()=>{
  assert.deepEqual(flexCoverageSummary({ratings:{'cap.sustained-pressure':{state:'rated',score:4},'cap.off-angle-pressure':{state:'not_applicable'}}}),{main:'4/5',off:'N/A',summary:'Main: 4/5 · Off: N/A'});
});
test('los niveles mecánicos de M1.6 son independientes de puente funcional',()=>{
  assert.ok(!FLEX_DPS_BRIDGE.some(x=>x.id.startsWith('effective-')||x.id.startsWith('conversion-')));
});
import {analyzeBandV16} from '../js/rank-band-v16.mjs';
const bands=JSON.parse(readFileSync(new URL('../data/rank-bands.v10.json',import.meta.url)));
const flex=(ratings)=>({assignments:[{
 heroId:'hero.synthetic',subroleId:'subrole.flex-dps',tier:'B',
 ratings,
 mechanicRatings:{
  'effective-ttk':{state:'rated',score:4},
  'conversion-reliability':{state:'rated',score:4},
  'independent-agency':{state:'rated',score:4},
  'counterplay-sensitivity':{state:'rated',score:2}}
}]});
test('el motor Flex reconoce coberturas Main y Off verificables sin crear tier nuevo',()=>{
  const report=analyzeBandV16(flex({'cap.sustained-pressure':{state:'rated',score:4},'cap.off-angle-pressure':{state:'rated',score:4}}),'hero.synthetic','subrole.flex-dps',bands,'diamond');
  assert.ok(report.opportunities.some(x=>x.includes('cobertura parcial')));
  assert.equal(report.baselineTier,'B');
  assert.ok(!('derivedTier' in report));
});
test('el motor no inventa cobertura Main al faltar su puntuación',()=>{
 const report=analyzeBandV16(flex({'cap.off-angle-pressure':{state:'rated',score:5}}),'hero.synthetic','subrole.flex-dps',bands,'celestial-plus');
 assert.ok(report.conditions.some(x=>x.includes('sin evaluación completa')));
 assert.ok(!report.opportunities.some(x=>x.includes('cobertura parcial')));
});
