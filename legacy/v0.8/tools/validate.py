"""Validate the fictional v0.8 fixtures: JSON Schema + cross-document contracts.
Run: python tools/validate.py
Requires: pip install jsonschema (development only; not used in GitHub Pages).
"""
import json
from pathlib import Path
from collections import defaultdict
from jsonschema import Draft202012Validator, FormatChecker

ROOT=Path(__file__).resolve().parents[1]
def load(path):return json.loads((ROOT/path).read_text(encoding='utf-8'))
def ensure(condition, explanation):
 if not condition: raise ValueError(explanation)
def index(items, kind):
 ids=[x['id'] for x in items]
 ensure(len(ids)==len(set(ids)),f'{kind}: duplicated IDs')
 return {x['id']:x for x in items}
def schema_validate(kind, record):
 schema=load('schemas/'+kind+'.schema.json')
 Draft202012Validator(schema,format_checker=FormatChecker()).validate(record)

def validate_bundle(catalog,model,comps,matchup,rulepack,report):
 for kind,doc in [('catalog',catalog),('model',model),('rulepack',rulepack),('matchup',matchup),('report',report)]:schema_validate(kind,doc)
 for c in comps:schema_validate('composition',c)
 patch=catalog['patch']['id']
 for x in [model,matchup,rulepack,report['inputs'],*comps]:ensure(x['patchId']==patch,'Patch mismatch')
 heroes=index(catalog['heroes'],'heroes')
 caps=index(catalog['capabilities'],'capabilities')
 subroles=index(catalog['subroles'],'subroles')
 vuls=index(catalog['vulnerabilities'],'vulnerabilities')
 deps=index(catalog['dependencies'],'dependencies')
 mechs=index(catalog['mechanisms'],'mechanisms')
 ensure(len(subroles)==9,'Must have 9 subroles')
 for sr in subroles.values():
  ensure(len(set(sr['coreCapabilities']))==3,f'duplicate core capability: {sr["id"]}')
  for cap in sr['coreCapabilities']:ensure(cap in caps,f'unknown core capability {cap}')
  for v in sr['suggestedVulnerabilities']:ensure(v in vuls,f'unknown vulnerability suggestion {v}')
  for d in sr['suggestedDependencies']:ensure(d in deps,f'unknown dependency suggestion {d}')
 assign=index(model['assignments'],'assignments')
 unique=set()
 elig_seen=set();excluded=set()
 for item in model['eligibilityOverrides']:
  pair=(item['heroId'],item['subroleId'])
  ensure(pair not in elig_seen,f'duplicate eligibility {pair}')
  elig_seen.add(pair)
  ensure(item['heroId'] in heroes and item['subroleId'] in subroles,'Unknown eligibility reference')
  ensure(heroes[item['heroId']]['category']==subroles[item['subroleId']]['category'],'Eligibility across official class')
  if item['status']=='ineligible':excluded.add(pair)
 for a in assign.values():
  hero=a['heroId'];sr=a['subroleId'];pair=(hero,sr)
  ensure(hero in heroes and sr in subroles,'Assignment has invalid hero/subrole')
  ensure(heroes[hero]['category']==subroles[sr]['category'],f'Category mismatch: {hero} {sr}')
  ensure(pair not in unique,f'Duplicate hero×subrole: {pair}')
  ensure(pair not in excluded,f'Ranked hero marked ineligible {pair}')
  unique.add(pair)
  for cap in a['ratings']:ensure(cap in caps,f'Unknown rating capability {cap}')
  for vul in a['vulnerabilities']:ensure(vul in vuls,f'Unknown vulnerability {vul}')
  for dep in a['dependencies']:ensure(dep in deps,f'Unknown dependency {dep}')
 comp_index=index(comps,'compositions')
 pools=index(rulepack['resourcePools'],'resource pools')
 rls=index(rulepack['interactionRules'],'rules')
 for pool in pools.values():ensure(pool['providerHeroId'] in heroes,'Resource provider unknown')
 for rule in rls.values():
  for term in rule['requirements']:ensure(term['capabilityId'] in caps,'Rule references unknown capability')
  if 'mechanismId' in rule:ensure(rule['mechanismId'] in mechs,'Rule references unknown win condition')
 for c in comps:
  ensure(c['modelId']==model['id'] and c['modelRevision']==model['revision'],'Composition uses nonmatching model/revision')
  members=[s['heroId'] for s in c['slots']]
  ensure(len(members)==len(set(members)),f'Duplicate hero within team {c["id"]}')
  for s in c['slots']:
   ensure(s['assignmentId'] in assign and assign[s['assignmentId']]['heroId']==s['heroId'],f'Invalid hero/assignment slot {s}')
  for p in c['winConditionPlans']:
   ensure(p['mechanismId'] in mechs,'Unknown mechanism')
   ensure(len(p['participantHeroIds'])==len(set(p['participantHeroIds'])),'Duplicate plan participants')
   ensure(set(p['participantHeroIds']).issubset(members),'Plan references player not in team')
  ensure(len({p['id'] for p in c['winConditionPlans']})==len(c['winConditionPlans']),'Duplicate plan ids')
  for claim in c['resourceClaims']:
   ensure(claim['resourceId'] in pools,'Unknown resource pool')
   pool=pools[claim['resourceId']]
   ensure(pool['providerHeroId'] in members,'Resource provider not on composition')
   ensure(claim['consumerHeroId'] in members,'Resource consumer not on composition')
   ensure(claim['windowId'] in pool['supportedWindows'],'Resource unavailable in claim window')
 ensure(matchup['modelId']==model['id'] and matchup['modelRevision']==model['revision'],'Matchup/model mismatch')
 a,b=matchup['teamACompositionId'],matchup['teamBCompositionId']
 ensure(a!=b and a in comp_index and b in comp_index,'Matchup invalid composition IDs')
 ensure(report['matchupId']==matchup['id'] and report['rulepackId']==rulepack['id'],'Report references wrong matchup/rulepack')
 inputs=report['inputs']
 ensure(inputs['modelId']==model['id'] and inputs['modelRevision']==model['revision'],'Report/model mismatch')
 ensure(inputs['teamACompositionId']==a and inputs['teamBCompositionId']==b,'Report uses another matchup pair')
 evid_sources={'assignment':assign,'capability':caps,'vulnerability':vuls,'dependency':deps,'rule':rls,'resource':pools,
               'plan':{p['id']:p for c in comps for p in c['winConditionPlans']}}
 for f in report['findings']:
  ensure(f['ruleId'] in rls,'Finding unknown rule')
  for e in f['evidence']:
   ensure(e['sourceId'] in evid_sources[e['sourceType']],f'Unknown evidence {e}')
   if 'heroId' in e:ensure(e['heroId'] in heroes,'Evidence unknown hero')
 # Observations are not schema invalidity: a composition MAY be resource-constrained.
 conflicts=[]
 for c in comps:
  used=defaultdict(int)
  for claim in c['resourceClaims']:used[(claim['resourceId'],claim['windowId'])]+=claim['amount']
  for (resource_id,win),demand in used.items():
   supply=pools[resource_id]['capacity']
   if demand>supply:conflicts.append({'compositionId':c['id'],'resourceId':resource_id,'windowId':win,'demand':demand,'supply':supply})
 return {'heroes':len(heroes),'subroles':len(subroles),'capabilities':len(caps),'assignments':len(assign),'compositions':len(comps),'findings':len(report['findings']),'resourceConflicts':conflicts}

def demo_bundle():
 catalog=load('data/catalog.demo.json')
 model=load('examples/model.personal.demo.json')
 comps=[load('examples/composition.brawl.demo.json'),load('examples/composition.dive.demo.json'),load('examples/composition.conflict.demo.json')]
 matchup=load('examples/matchup.brawl-vs-dive.demo.json')
 rulepack=load('data/rulepack.demo.json')
 report=load('examples/report.brawl-vs-dive.demo.json')
 return catalog,model,comps,matchup,rulepack,report

if __name__=='__main__':
 result=validate_bundle(*demo_bundle())
 print(json.dumps({'validation':'PASSED',**result},ensure_ascii=False,indent=2))
