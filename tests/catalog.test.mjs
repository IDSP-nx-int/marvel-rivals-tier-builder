import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {newModel,setTier,markNA,removeAssignment} from '../js/core.mjs';
import {pendingSubrolesForHero,availableHeroesForCategory} from '../js/catalog.mjs';
const src=p=>JSON.parse(readFileSync(new URL('../data/'+p,import.meta.url),'utf-8'));
const roster=src('roster.reference.json'), tax=src('taxonomy.json');
const model=()=>newModel();
const list=(m,c='duelist')=>availableHeroesForCategory(m,roster,tax,c).map(h=>h.id);
const roles=['subrole.main-dps','subrole.off-dps','subrole.flex-dps'];
const hero='hero.black-widow';
function assign(m,sub){setTier(m,hero,sub,'A',roster,tax);}
test('Black Widow remains catalogued after only one or two classifications',()=>{
 const m=model();assign(m,roles[0]);assert.ok(list(m).includes(hero));assign(m,roles[1]);assert.ok(list(m).includes(hero));
});
test('Black Widow disappears only after Main, Off and Flex all classified',()=>{
 const m=model();roles.forEach(x=>assign(m,x));assert.ok(!list(m).includes(hero));assert.equal(m.assignments.length,3);
});
test('explicit N/A counts as resolved for catalog visibility, not as an assignment',()=>{
 const m=model();assign(m,roles[0]);assign(m,roles[1]);markNA(m,hero,roles[2],roster,tax);
 assert.ok(!list(m).includes(hero));assert.equal(m.assignments.length,2);
});
test('removing a classification makes the hero visible again',()=>{
 const m=model();roles.forEach(x=>assign(m,x));removeAssignment(m,hero,roles[2]);assert.ok(list(m).includes(hero));
});
test('pending subroles are reported in stable main/off/flex order',()=>{
 const m=model();assign(m,roles[0]);const h=roster.heroes.find(x=>x.id===hero);
 assert.deepEqual(pendingSubrolesForHero(m,h,tax.subroles.filter(s=>s.category==='duelist')).map(s=>s.id),roles.slice(1));
});
test('catalog count preserves other heroes and does not mutate model',()=>{
 const m=model(),before=JSON.stringify(m);assert.equal(list(m).length,roster.heroes.filter(h=>h.categories.includes('duelist')).length);assert.equal(JSON.stringify(m),before);
});
test('Deadpool is independent by official category and will not disappear from other category prematurely',()=>{
 const m=model(),h='hero.deadpool';
 ['main-dps','off-dps','flex-dps'].forEach(s=>setTier(m,h,'subrole.'+s,'B',roster,tax));
 assert.ok(!list(m,'duelist').includes(h));assert.ok(list(m,'vanguard').includes(h));assert.ok(list(m,'strategist').includes(h));
});
