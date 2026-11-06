/** Pure domain logic. No DOM, storage, network, or third-party dependencies. */
export const CATEGORIES=['vanguard','duelist','strategist'];
export const TIERS=['S','A','B','C','D'];
export const TIER_RANK={S:5,A:4,B:3,C:2,D:1};
export const STORE_KEY='mr_tier_builder_v1';
export function newModel(patchId='patch.roster.2026-10-reference') {
 return {kind:'model',schemaVersion:'0.8.0',id:'model.personal.local',patchId,title:'Mi modelo — Sin evaluar',origin:'personal',revision:0,updatedAt:new Date().toISOString(),eligibilityOverrides:[],assignments:[]};
}
export function clone(x){return JSON.parse(JSON.stringify(x));}
export function compatible(hero,subrole){return !!hero&&!!subrole&&Array.isArray(hero.categories)&&hero.categories.includes(subrole.category);}
export function assignment(model,heroId,subroleId){return model.assignments.find(x=>x.heroId===heroId&&x.subroleId===subroleId);}
export function eligibility(model,heroId,subroleId){return model.eligibilityOverrides.find(x=>x.heroId===heroId&&x.subroleId===subroleId)?.status||'unknown';}
export function touch(model){model.revision++;model.updatedAt=new Date().toISOString();return model;}
export function assertWritable(model){if(model.origin==='reference')throw new Error('Modelo de referencia: crea una copia personal primero.');}
export function setTier(model,heroId,subroleId,tier,roster,taxonomy){
 assertWritable(model);
 if(!TIERS.includes(tier))throw new Error('Tier inválido');
 const h=roster.heroes.find(x=>x.id===heroId),s=taxonomy.subroles.find(x=>x.id===subroleId);
 if(!compatible(h,s))throw new Error('Héroe y subrol incompatibles');
 if(eligibility(model,heroId,subroleId)==='ineligible')throw new Error('La asignación está marcada como N/A.');
 let a=assignment(model,heroId,subroleId);
 if(a?.locked)throw new Error('La evaluación está bloqueada: desbloquéala antes.');
 if(a)a.tier=tier;else model.assignments.push({id:`assign.${heroId.slice(5)}.${subroleId.slice(8)}`,heroId,subroleId,tier,locked:false,ratings:{},vulnerabilities:{},dependencies:{},authoredBy:'player'});
 touch(model);return assignment(model,heroId,subroleId);
}
/**
 * Orden intratier: la secuencia de `assignments` es la fuente de verdad.
 * `model.schemaVersion` sigue siendo 0.8.0: no se agregan campos fuera del contrato.
 * Los perfiles bloqueados pueden reordenarse dentro del MISMO tier; sus valores y tier no cambian.
 */
export function placeWithinTier(model,heroId,subroleId,relativeToHeroId=null,placement='end'){
 assertWritable(model);
 const a=assignment(model,heroId,subroleId);
 if(!a)throw new Error('Primero clasifica al héroe en este subrol');
 if(!['before','after','start','end'].includes(placement))throw new Error('Posición intratier inválida');
 let target=null;
 if(relativeToHeroId!==null){
  if(!['before','after'].includes(placement))throw new Error('La referencia requiere before o after');
  target=assignment(model,relativeToHeroId,subroleId);
  if(!target||target.tier!==a.tier)throw new Error('Solo puedes ordenar dentro del mismo tier y subrol');
  if(target===a)return false;
 }else if(placement==='before'||placement==='after')throw new Error('Falta el héroe de referencia');
 const previous=model.assignments;
 const updated=previous.filter(x=>x!==a);
 let index;
 if(target){index=updated.indexOf(target)+(placement==='after'?1:0);}
 else if(placement==='start'){
  index=updated.findIndex(x=>x.tier===a.tier&&x.subroleId===a.subroleId);
  if(index<0)index=updated.length;
 }else{
  let last=-1;
  for(let i=0;i<updated.length;i++)if(updated[i].tier===a.tier&&updated[i].subroleId===a.subroleId)last=i;
  index=last<0?updated.length:last+1;
 }
 updated.splice(index,0,a);
 if(updated.every((x,i)=>previous[i]===x))return false;
 model.assignments=updated;touch(model);return true;
}
export function stepWithinTier(model,heroId,subroleId,direction){
 const a=assignment(model,heroId,subroleId);
 if(!a)throw new Error('Primero clasifica al héroe');
 if(direction!==-1&&direction!==1)throw new Error('Dirección inválida');
 const peers=model.assignments.filter(x=>x.subroleId===subroleId&&x.tier===a.tier);
 const at=peers.indexOf(a),neighbor=peers[at+direction];
 return neighbor?placeWithinTier(model,heroId,subroleId,neighbor.heroId,direction<0?'before':'after'):false;
}
export function removeAssignment(model,heroId,subroleId){assertWritable(model);const a=assignment(model,heroId,subroleId);if(a?.locked)throw new Error('Desbloquea antes de quitar la clasificación');model.assignments=model.assignments.filter(x=>x!==a);touch(model);}
export function markNA(model,heroId,subroleId,roster,taxonomy){
 assertWritable(model);
 const h=roster.heroes.find(x=>x.id===heroId),s=taxonomy.subroles.find(x=>x.id===subroleId);
 if(!compatible(h,s))throw new Error('Héroe y subrol incompatibles');
 const a=assignment(model,heroId,subroleId);if(a?.locked)throw new Error('Desbloquea antes de marcar N/A');
 model.assignments=model.assignments.filter(x=>x!==a);
 model.eligibilityOverrides=model.eligibilityOverrides.filter(x=>!(x.heroId===heroId&&x.subroleId===subroleId));
 model.eligibilityOverrides.push({heroId,subroleId,status:'ineligible'});touch(model);
}
export function clearNA(model,heroId,subroleId){assertWritable(model);model.eligibilityOverrides=model.eligibilityOverrides.filter(x=>!(x.heroId===heroId&&x.subroleId===subroleId));touch(model);}
export function updateRating(model,heroId,subroleId,capId,state,score,taxonomy){
 assertWritable(model);const a=assignment(model,heroId,subroleId);if(!a||a.locked)throw new Error('Necesitas una clasificación editable');
 if(!taxonomy.capabilities.some(x=>x.id===capId))throw new Error('Capacidad desconocida');
 if(state==='unknown')delete a.ratings[capId];else if(state==='not_applicable')a.ratings[capId]={state};else if(state==='rated'&&Number.isInteger(score)&&score>=1&&score<=5)a.ratings[capId]={state,score};else throw new Error('Estado Likert inválido');
 touch(model);
}
export function updateFlag(model,heroId,subroleId,kind,id,state,taxonomy){
 assertWritable(model);const a=assignment(model,heroId,subroleId);if(!a||a.locked)throw new Error('Necesitas una clasificación editable');
 if(!['vulnerabilities','dependencies'].includes(kind)||!taxonomy[kind].some(x=>x.id===id))throw new Error('Restricción desconocida');
 if(state==='unknown')delete a[kind][id];else if(['present','absent'].includes(state))a[kind][id]=state;else throw new Error('Estado de restricción inválido');touch(model);
}
export function lockAssignment(model,heroId,subroleId,locked){assertWritable(model);const a=assignment(model,heroId,subroleId);if(!a)throw new Error('Primero clasifica al héroe');a.locked=!!locked;if(locked)a.lockedAt=new Date().toISOString();else delete a.lockedAt;touch(model);}
export function dominanceWarnings(model,candidate,coreCaps=null){
 if(!candidate) return [];
 const rank=TIER_RANK[candidate.tier],out=[];
 for(const other of model.assignments){
  if(other===candidate||other.subroleId!==candidate.subroleId||!other.locked||!TIER_RANK[other.tier]||other.tier===candidate.tier)continue;
  const caps=(coreCaps||Object.keys(candidate.ratings)).filter(c=>candidate.ratings[c]?.state==='rated'&&other.ratings[c]?.state==='rated');
  // 3 common rated dimensions required. Pairwise structural check, not statistical significance.
  if(caps.length<3)continue;
  const candidateDominates=caps.every(c=>candidate.ratings[c].score>=other.ratings[c].score)&&caps.some(c=>candidate.ratings[c].score>other.ratings[c].score);
  const otherDominates=caps.every(c=>other.ratings[c].score>=candidate.ratings[c].score)&&caps.some(c=>other.ratings[c].score>candidate.ratings[c].score);
  if((candidateDominates&&rank<TIER_RANK[other.tier])||(otherDominates&&rank>TIER_RANK[other.tier]))out.push({otherHeroId:other.heroId,otherTier:other.tier,comparedCapabilities:caps.length,kind:'dominance-discrepancy'});
 }
 return out;
}
/**
 * M1.3: inferencia descriptiva de prioridades con dos clases de preferencia ordinal.
 * 1) Entre tiers (S > A > B > C > D): referencia principal (80%).
 * 2) Dentro del mismo tier: izquierda precede a derecha, señal secundaria (20%).
 * Ambas requieren perfiles BLOQUEADOS y los 3 Likert comunes calificados.
 * Solo se usan posiciones guardadas en el array de asignaciones; no se altera el JSON v0.8.
 * Si no hay pares entre tiers, se muestran señales intratier sin fabricar pesos.
 * No confundir posiciones automáticas de inserción con datos externos objetivos;
 * el ranking visible representa el orden declarado por su autor.
 */
export const INTRATIER_PRIORITY_SHARE=0.20;
export function inferPriorities(model,subroleId,coreCaps){
 const rows=model.assignments.filter(a=>a.subroleId===subroleId&&a.locked&&coreCaps.every(c=>a.ratings[c]?.state==='rated'));
 const counts=coreCaps.map(capId=>({capId,agree:0,disagree:0,ties:0,intraAgree:0,intraDisagree:0,intraTies:0}));
 let pairs=0,withinPairs=0;
 for(let i=0;i<rows.length;i++)for(let j=i+1;j<rows.length;j++){
  const a=rows[i],b=rows[j];
  const within=a.tier===b.tier;
  if(within)withinPairs++;else pairs++;
  // En el mismo tier el array es el orden de preferencia: el primero es preferido.
  const high=within||TIER_RANK[a.tier]>TIER_RANK[b.tier]?a:b;
  const low=high===a?b:a;
  for(const item of counts){
   const dif=high.ratings[item.capId].score-low.ratings[item.capId].score;
   if(within){if(dif>0)item.intraAgree++;else if(dif<0)item.intraDisagree++;else item.intraTies++;}
   else{if(dif>0)item.agree++;else if(dif<0)item.disagree++;else item.ties++;}
  }
 }
 const distinctTiers=new Set(rows.map(r=>r.tier)).size;
 const signals=counts.map(c=>{
  const comparable=c.agree+c.disagree;
  const intraComparable=c.intraAgree+c.intraDisagree;
  const tierConcordance=comparable?(c.agree-c.disagree)/comparable:null;
  const intraConcordance=intraComparable?(c.intraAgree-c.intraDisagree)/intraComparable:null;
  const blendedConcordance=tierConcordance!==null&&intraConcordance!==null
   ?(1-INTRATIER_PRIORITY_SHARE)*tierConcordance+INTRATIER_PRIORITY_SHARE*intraConcordance
   :(tierConcordance??intraConcordance);
  return {...c,comparable,intraComparable,concordance:tierConcordance,intraConcordance,blendedConcordance};
 });
 // Se conserva la puerta de salida conservadora para los pesos; las señales sí
 // se muestran con menos datos, pero sin pretensión de confiabilidad estadística.
 const canWeight=rows.length>=4&&distinctTiers>=3&&signals.every(x=>x.comparable>=2);
 const strengths=canWeight?signals.map(x=>Math.exp(2*x.blendedConcordance)):null;
 const denom=strengths?.reduce((a,b)=>a+b,0);
 const weights=canWeight?Object.fromEntries(signals.map((x,i)=>[x.capId,strengths[i]/denom])):null;
 return {observations:rows.length,distinctTiers,pairs,withinPairs,signals,weights,exploratory:true,
  tierShare:1-INTRATIER_PRIORITY_SHARE,intratierShare:INTRATIER_PRIORITY_SHARE,
  interpretation:'El orden dentro del tier es preferencia declarada y solo modula, no sustituye, la jerarquía S–D.'};
}

export function validateModel(data,roster,taxonomy,expectedPatch){
 const err=[];
 if(!data||typeof data!=='object'||data.kind!=='model'||!Array.isArray(data.assignments)||!Array.isArray(data.eligibilityOverrides))return ['No es un modelo v0.8 reconocible'];
 if(data.schemaVersion!=='0.8.0')err.push('La versión del contrato no es 0.8.0');
 if(expectedPatch&&data.patchId!==expectedPatch)err.push('Parche distinto: se requiere migración deliberada');
 if(!['personal','reference'].includes(data.origin))err.push('Origen inválido');
 const seen=new Set();
 for(const a of data.assignments){
  const key=`${a.heroId}|${a.subroleId}`;if(seen.has(key))err.push('Asignación duplicada: '+key);seen.add(key);
  const h=roster.heroes.find(x=>x.id===a.heroId),s=taxonomy.subroles.find(x=>x.id===a.subroleId);
  if(!compatible(h,s))err.push('Héroe y subrol incompatibles: '+key);
  if(!TIERS.includes(a.tier))err.push('Tier inválido: '+key);
  if(typeof a.locked!=='boolean'||(a.locked&&!a.lockedAt)||(!a.locked&&a.lockedAt))err.push('Bloqueo inválido: '+key);
  if(!a.ratings||typeof a.ratings!=='object'||!a.dependencies||!a.vulnerabilities)err.push('Perfil incompleto de estructura: '+key);
  for(const [c,v] of Object.entries(a.ratings||{}))if(!taxonomy.capabilities.some(x=>x.id===c)||!v||!(['rated','not_applicable'].includes(v.state))||(v.state==='rated'&&(!Number.isInteger(v.score)||v.score<1||v.score>5))||(v.state==='not_applicable'&&'score'in v))err.push('Likert inválido: '+key+' '+c);
  for(const k of ['dependencies','vulnerabilities'])for(const [c,v]of Object.entries(a[k]||{}))if(!taxonomy[k].some(x=>x.id===c)||!['present','absent'].includes(v))err.push('Casilla inválida: '+key+' '+c);
 }
 const na=new Set();for(const x of data.eligibilityOverrides){const key=`${x.heroId}|${x.subroleId}`;if(x.status!=='ineligible'&&x.status!=='eligible')err.push('Estado de elegibilidad inválido');if(na.has(key))err.push('N/A duplicado '+key);na.add(key);if(x.status==='ineligible'&&seen.has(key))err.push('N/A y tier simultáneos '+key);}
 return err;
}
/** Validation of a persisted six-slot composition; same rule for save, import and restore. */
export function validateCompositionDraft(c,model,roster,taxonomy){
 const errors=[];
 if(!c||c.kind!=='composition-draft'||c.schemaVersion!=='1.0.0')return ['Formato de composición incompatible'];
 if(c.modelId!==model.id||c.patchId!==model.patchId)errors.push('Modelo o parche incompatible');
 if(!Array.isArray(c.slots)||c.slots.length!==6)return [...errors,'Se requieren exactamente seis plazas'];
 const positions=new Set(),heroes=new Set();
 for(const slot of c.slots){
  if(!slot||!Number.isInteger(slot.slot)||slot.slot<1||slot.slot>6||positions.has(slot.slot))errors.push('Número de plaza inválido o repetido');
  positions.add(slot?.slot);
  const hero=roster.heroes.find(h=>h.id===slot?.heroId);
  const subrole=taxonomy.subroles.find(s=>s.id===slot?.subroleId);
  if(!hero||!compatible(hero,subrole))errors.push('Héroe o subrol no válido');
  if(heroes.has(slot?.heroId))errors.push('Un héroe no puede ocupar dos plazas');
  heroes.add(slot?.heroId);
 }
 return [...new Set(errors)];
}
export function newComposition(model){return {kind:'composition-draft',schemaVersion:'1.0.0',id:'comp.local.'+Date.now(),modelId:model.id,modelRevision:model.revision,patchId:model.patchId,title:'Nueva composición',slots:Array.from({length:6},(_,i)=>({slot:i+1,heroId:null,subroleId:null})),winConditionPlans:[],resourceClaims:[],context:{side:'unspecified',phase:'unspecified'}};}
export const FUNCTIONAL_JOBS={
 space:['cap.space-control','cap.mitigation'],threat:['cap.poke','cap.sustained-pressure','cap.burst','cap.backline-access','cap.off-angle-pressure'],conversion:['cap.kill-conversion','cap.burst','cap.crowd-control'],sustain:['cap.healing','cap.mitigation','cap.effective-uptime'],response:['cap.anti-dive','cap.peel','cap.crowd-control'],mobility:['cap.mobility-reset','cap.off-angle-pressure','cap.engage'],enablement:['cap.utility','cap.mitigation','cap.displacement']
};
export const CHAINS={
 'Dive / Backline Collapse':['cap.engage','cap.backline-access','cap.kill-conversion'],
 'Brawl / Objective Control':['cap.space-control','cap.sustained-pressure','cap.healing'],
 'Poke / Siege':['cap.poke','cap.kill-conversion'],
 'Counter-Engage':['cap.anti-dive','cap.peel','cap.kill-conversion'],
 'Pick / Displacement':['cap.displacement','cap.crowd-control','cap.kill-conversion']
};
export function compositionAnalysis(comp,model){
 const slots=comp.slots.filter(s=>s.heroId&&s.subroleId), profiles=slots.map(s=>assignment(model,s.heroId,s.subroleId)).filter(Boolean);
 const observed=(cap)=>profiles.filter(a=>a.ratings[cap]?.state==='rated').map(a=>({heroId:a.heroId,score:a.ratings[cap].score}));
 const functions=Object.entries(FUNCTIONAL_JOBS).map(([name,caps])=>{
  const e=caps.flatMap(c=>observed(c).filter(a=>a.score>=4).map(x=>({...x,cap:c})));
  return {name,state:e.length?'evidenced':'unknown',sources:e};
 });
 const chains=Object.entries(CHAINS).map(([name,caps])=>{
  const missing=caps.filter(cap=>!observed(cap).some(x=>x.score>=4));
  return {name,status:missing.length?'not-demonstrated':'potential',missing,requiresKitValidation:true};
 });
 const dependencies=[];for(const a of profiles)for(const [id,state] of Object.entries(a.dependencies||{}))if(state==='present')dependencies.push({heroId:a.heroId,dependencyId:id});
 const counts={};for(const d of dependencies)counts[d.dependencyId]=(counts[d.dependencyId]||0)+1;
 const shared=Object.entries(counts).filter(([,n])=>n>=2).map(([dependencyId,claimants])=>({dependencyId,claimants,conclusion:'possible-contention-only'}));
 return {profiles:profiles.length,slots:slots.length,functions,chains,dependencies,shared,limitations:['No se asignan capacidades ni recursos desconocidos','Sin metadatos de ventanas, alcances y habilidades no se confirman sinergias ni victorias']};
}
export function matchupAnalysis(a,b,model){
 const A=compositionAnalysis(a,model),B=compositionAnalysis(b,model);
 function assess(off,def){
  const defenders=def.functions;
  return off.chains.map(chain=>{
   if(chain.status!=='potential')return {name:chain.name,status:'insufficient-data',reason:'Cadena ofensiva no demostrada'};
   const defensive=defenders.find(x=>x.name==='response');
   return defensive?.state==='evidenced'?{name:chain.name,status:'contested-potential',reason:'Hay respuestas defensivas registradas; faltan ventanas/objetivos'}:{name:chain.name,status:'insufficient-data',reason:'Falta verificar defensas y compatibilidad de habilidades'};
  });
 }
 return {teamA:assess(A,B),teamB:assess(B,A),limitations:['No estima porcentajes de victoria','No valida rutas, posiciones o cooldowns sin datos curados del parche']};
}

/** v0.8 conversion requires six explicit Hero × Subrole assignment IDs.
 * Drafts deliberately remain separate to avoid fabricating records for unranked heroes. */
export function toV08Composition(draft,model){
 const slots=draft.slots.map(s=>{const a=assignment(model,s.heroId,s.subroleId);return a?{heroId:s.heroId,assignmentId:a.id}:null;});
 if(slots.length!==6||slots.some(x=>!x)||new Set(slots.map(s=>s.heroId)).size!==6)return null;
 return {kind:'composition',schemaVersion:'0.8.0',id:draft.id,modelId:model.id,modelRevision:model.revision,patchId:model.patchId,title:draft.title,slots,winConditionPlans:[],resourceClaims:[],context:{side:'unspecified',phase:'unspecified'}};
}
