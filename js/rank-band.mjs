/**
 * Rank-Band Engine v0.9: hypothesis-driven context, no rank-specific tier lists.
 * Core rank/tier/likert data is NEVER modified here.
 * Positive/negative weights are a heuristic, never a validated probability or win rate.
 */
export const QUALITIES=['effective-ttk','conversion-reliability','independent-agency','counterplay-sensitivity','punish-exposure','skill-scalability'];
export function validateBandRulepack(pack){
 const errors=[];
 if(pack?.kind!=='rank-band-rulepack'||pack.schemaVersion!=='0.9.0')errors.push('Version de reglas por banda no soportada');
 const traits=new Map((pack?.traitDefinitions||[]).map(t=>[t.id,t]));
 for(const id of QUALITIES)if(!traits.has(id))errors.push(`Falta cualidad ${id}`);
 for(const band of pack?.bands||[]){
  if(!band?.id||!band?.label)errors.push('Banda incompleta');
  let sum=0;
  for(const id of QUALITIES){const w=band.weights?.[id];if(typeof w!=='number'||!Number.isFinite(w)||w<0)errors.push(`Peso inválido ${band.id} / ${id}`);else sum+=w;}
  if(Math.abs(sum-1)>1e-8)errors.push(`Pesos de ${band.id} no suman 1`);
 }
 if((pack?.bands||[]).length!==5)errors.push('Se esperan cinco bandas');
 for(const [subrole,ids] of Object.entries(pack?.suggestedTraitsBySubrole||{})){
  if(!subrole.startsWith('subrole.')||ids.length!==2||ids.some(id=>!traits.has(id)))errors.push(`Sugerencias inválidas ${subrole}`);
 }
 return errors;
}
export function curatedProfile(pack,heroId,subroleId,patchId){
 const entry=pack?.profiles?.[`${heroId}|${subroleId}`];
 if(!entry||entry.status!=='curated'||entry.patchId!==patchId||!Array.isArray(entry.evidence)||entry.evidence.length===0)return null;
 // Protect against an unsourced score, an invalid number and partial profiles.
 if(QUALITIES.some(id=>!Number.isInteger(entry.qualities?.[id])||entry.qualities[id]<1||entry.qualities[id]>5))return null;
 return entry;
}
/** 'unknown' is a first-class result; no conclusions from empty profiles. */
export function evaluateBand(pack,heroId,subroleId,patchId,bandId,lens='climbing'){
 const band=(pack?.bands||[]).find(b=>b.id===bandId);
 if(!band)return {state:'unknown',reason:'Banda desconocida'};
 const profile=curatedProfile(pack,heroId,subroleId,patchId);
 if(!profile)return {state:'unknown',band:band.id,reason:'Sin perfil mecánico curado y documentado para este héroe/subrol/parche'};
 const traits=new Map(pack.traitDefinitions.map(t=>[t.id,t]));
 const contributions=QUALITIES.map(id=>{
  const raw=profile.qualities[id],w=band.weights[id];
  const score=(raw-3)/2*(traits.get(id).direction==='negative'?-1:1);
  return {id,raw,weight:w,contribution:score*w};
 });
 const total=contributions.reduce((a,x)=>a+x.contribution,0);
 const transferability=(profile.qualities['skill-scalability']-3)/2;
 // Sustainable lens exposes trade-off, it does not rewrite the climbing calculation.
 return {state:'exploratory',band:band.id,lens,score:total,
  reading:total>0.18?'afinidad contextual potencial':total<-.18?'limitaciones contextuales potenciales':'señales mixtas',
  transferability: lens==='sustainable'? (transferability>0?'transferencia favorable hipotética':transferability<0?'transferencia limitada hipotética':'transferencia neutra hipotética'):null,
  contributions, evidence:profile.evidence,calibrationStatus:pack.calibrationStatus,
  warning:'Heurística no validada estadísticamente. No representa un tier, un matchup demostrado ni probabilidad de victoria.'};
}
