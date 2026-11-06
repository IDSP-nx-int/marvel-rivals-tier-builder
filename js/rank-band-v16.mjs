/** Deterministic contextual reasoning, no rank-specific tiers, win percentages, or inferred missing skills. */
import {MECHANICS} from './mechanics.mjs';
const value=(a,k)=>a?.mechanicRatings?.[k]?.state==='rated'?a.mechanicRatings[k].score:null;
const functional=(a,k)=>a?.ratings?.[k]?.state==='rated'?a.ratings[k].score:null;
export function validateBandV16Rulepack(pack){
 const err=[];
 if(pack?.kind!=='rank-band-rulepack'||pack.schemaVersion!=='1.0.0')err.push('Contrato del rulepack por bandas inválido');
 if(!Array.isArray(pack?.bands)||pack.bands.length!==5)err.push('Se esperan cinco bandas');
 if(!Array.isArray(pack?.lenses)||pack.lenses.length!==2)err.push('Se esperan dos objetivos');
 const ids=new Set();for(const b of pack?.bands||[]){
  if(ids.has(b.id))err.push('Banda repetida');ids.add(b.id);
  for(const k of ['flankAwareness','defensiveResponse','coordination','punishReliability','adaptation']){
   if(!Number.isInteger(b.environment?.[k])||b.environment[k]<1||b.environment[k]>5)err.push(`Valor inválido de ${k} para ${b.id}`);
  }
 }
 for(const k of ['strong','low','highResponse','weakResponse'])if(!Number.isInteger(pack?.thresholds?.[k])||pack.thresholds[k]<1||pack.thresholds[k]>5)err.push('Umbral inválido: '+k);
 return err;
}
export function analyzeBandV16(model,heroId,subroleId,pack,bandId,lens='climbing'){
 const band=pack?.bands?.find(x=>x.id===bandId);
 if(!band||!pack?.lenses?.some(l=>l.id===lens))return {state:'invalid',reason:'Contexto de banda desconocido'};
 const a=model?.assignments?.find(x=>x.heroId===heroId&&x.subroleId===subroleId);
 const base={bandId,lens,rulepackVersion:pack.version,baselineTier:a?.tier??null,opportunities:[],limitations:[],conditions:[],evidence:[],missing:[],transferability:'No determinada',confidence:'hypothesis'};
 if(!a)return {...base,state:'unrated',reason:'Héroe sin tier en este subrol'};
 const t=pack.thresholds, env=band.environment, v={};
 for(const m of MECHANICS){v[m.id]=value(a,m.id);if(v[m.id]===null)base.missing.push(m.label);else base.evidence.push(m.label+' '+v[m.id]+'/5');}
 if(!base.evidence.length)return {...base,state:'unrated',reason:'Evalúa los cuatro Likert mecánicos para analizar esta banda'};
 const fast=v['effective-ttk']!==null&&v['effective-ttk']>=t.strong;
 const reliable=v['conversion-reliability']!==null&&v['conversion-reliability']>=t.strong;
 const autonomous=v['independent-agency']!==null&&v['independent-agency']>=t.strong;
 const counterSensitive=v['counterplay-sensitivity']!==null&&v['counterplay-sensitivity']>=t.strong;
 const counterRobust=v['counterplay-sensitivity']!==null&&v['counterplay-sensitivity']<=t.low;
 const accessValues=[functional(a,'cap.backline-access'),functional(a,'cap.off-angle-pressure')].filter(Number.isInteger);
 const lateral=accessValues.length?Math.max(...accessValues):null;
 if(fast&&reliable){
  base.opportunities.push('TTK y conversión declarados altos: existe potencial de picks rápidos cuando se obtiene una ventana viable.');
  if(env.defensiveResponse<=t.weakResponse)base.opportunities.push('La banda supone respuestas defensivas menos consistentes; una oportunidad real podría durar lo suficiente para completar el pick.');
  if(env.defensiveResponse>=t.highResponse)base.limitations.push('La banda supone defensas más preparadas: se necesitan ventanas de compromiso verificables.');
  if(lateral!==null&&lateral>=t.strong&&env.flankAwareness<=t.weakResponse)base.opportunities.push('El perfil incluye acceso lateral evaluado y la banda supone vigilancia irregular: posible ventaja de off-angle/flank.');
  else if(lateral!==null&&lateral>=t.strong&&env.flankAwareness>=t.highResponse)base.limitations.push('Acceso lateral alto pero vigilancia de flancos también alta según la banda: se requiere variación de rutas, setup o engaño; no asumir flank gratuito.');
  else if(lateral===null)base.conditions.push('No se presume flank: falta evaluar Backline Access u Off-Angle Pressure.');
  else if(lateral<t.strong)base.conditions.push('El perfil no acredita un acceso lateral fuerte; TTK alto no equivale a flank eficaz.');
 }else if(v['effective-ttk']!==null&&v['conversion-reliability']!==null){
  base.conditions.push('El perfil no declara simultáneamente TTK y fiabilidad altos; no se infiere picks rápidos repetibles.');
 }
 if(autonomous){
  if(env.coordination<=t.weakResponse)base.opportunities.push('La alta autonomía declarada puede reducir dependencia de coordinación en esta banda.');
  else base.opportunities.push('La autonomía declarada aporta flexibilidad, pero no sustituye el neutral y la coordinación.');
 }else if(v['independent-agency']!==null&&v['independent-agency']<=t.low&&env.coordination<=t.weakResponse){
  base.limitations.push('La autonomía declarada es baja y esta banda supone coordinación irregular.');
 }
 if(counterSensitive&&env.adaptation>=t.highResponse){
  base.limitations.push('Sensibilidad alta al counterplay: la adaptación y vigilancia supuestas en esta banda amenazan un plan repetitivo.');
  if(env.punishReliability>=t.highResponse)base.limitations.push('La banda presupone castigos más fiables ante compromisos fallidos: un plan predecible puede tener un costo mayor.');
 }else if(counterSensitive){
  base.conditions.push('El héroe es sensible al counterplay; la ventaja depende de que el rival no conteste la secuencia.');
 }
 if(counterRobust&&env.adaptation>=t.highResponse){
  base.opportunities.push('La baja sensibilidad al counterplay puede favorecer planes repetibles ante respuestas más adaptativas.');
 }
 if(counterSensitive)base.transferability='Condicionada: para escalar habrá que demostrar planes alternos cuando el rival conteste.';
 else if(counterRobust&&reliable)base.transferability='Potencialmente favorable por fiabilidad y robustez declaradas; no demuestra dominio del neutral.';
 else if(v['counterplay-sensitivity']!==null)base.transferability='Indeterminada: faltan mediciones de adaptación, posicionamiento y otros fundamentos.';
 if(subroleId==='subrole.flex-dps'){
  const main=functional(a,'cap.sustained-pressure'),off=functional(a,'cap.off-angle-pressure');
  if(main===null||off===null)base.conditions.push('Cobertura Flex Main/Off sin evaluación completa: Sustained Pressure y Off-Angle Pressure son opcionales.');
  else if(main>=t.strong&&off>=t.strong)base.opportunities.push('Flex DPS: presión sostenida y lateral declaradas altas; hay indicios de cobertura parcial de Main y Off, condicionados al matchup y la ejecución.');
  else base.conditions.push('Flex DPS: la cobertura parcial de Main y Off no está acreditada simultáneamente por las dos puntuaciones declaradas.');
 }
 if(base.missing.length)base.conditions.push('Análisis incompleto: atributos sin evaluar no se sustituyen por valores promedio.');
 if(!base.opportunities.length&&!base.limitations.length)base.conditions.push('Sin señales direccionales suficientes bajo las reglas actuales.');
 return {...base,state:base.missing.length?'partial':'evaluated',reason:base.missing.length?'Señales parciales: '+base.missing.join(', '):'Señales cualitativas, no probabilidad de victoria',
  summary:base.opportunities.length+' oportunidades · '+base.limitations.length+' limitaciones'};
}
