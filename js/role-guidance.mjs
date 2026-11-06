/** Semantic role copy and optional cross-coverage assessments. No hero ratings are assumed. */
export const ROLE_GUIDANCE=Object.freeze({
  vanguard:{title:'Vanguard',description:'Crea y disputa espacio, mitiga amenazas y habilita posiciones para el equipo.'},
  duelist:{title:'Duelist',description:'Genera presión ofensiva y convierte oportunidades de eliminación desde distintos ángulos.'},
  strategist:{title:'Strategist',description:'Sostiene, protege y habilita al equipo con curación, recursos y utilidad.'}
});
export const SUBROLE_GUIDANCE=Object.freeze({
  'subrole.main-tank':'Sostiene la estructura frontal: controla espacio, mitiga daño y mantiene posiciones.',
  'subrole.off-tank':'Disputa ángulos y rutas secundarias; amenaza entradas sin descuidar el apoyo al equipo.',
  'subrole.flex-tank':'Alterna control frontal, protección y rotaciones según amenazas y composición.',
  'subrole.main-dps':'Mantiene presión en neutral y convierte ventajas desde posiciones relativamente estables.',
  'subrole.off-dps':'Crea ángulos laterales, divide atención rival y busca ventanas de amenaza o eliminación.',
  'subrole.flex-dps':'Cubre parte del neutral de Main y la presión lateral de Off; adapta su función al matchup.',
  'subrole.main-support':'Asegura sustain y estabilidad defensiva para sostener al equipo en neutral.',
  'subrole.off-support':'Aporta utilidad activa, protección y movilidad para apoyar rutas y respuestas.',
  'subrole.flex-support':'Combina protección, utilidad y continuidad de apoyo para cubrir necesidades cambiantes.'
});
/** Flex DPS retains its THREE original core capabilities; these two are supplemental. */
export const FLEX_DPS_BRIDGE=Object.freeze([
  Object.freeze({id:'cap.sustained-pressure',label:'Cobertura Main',description:'Presión sostenida en neutral para cubrir parcialmente el trabajo de un Main DPS.'}),
  Object.freeze({id:'cap.off-angle-pressure',label:'Cobertura Off',description:'Presión lateral desde ángulos alternos para cubrir parcialmente el trabajo de un Off DPS.'})
]);
export function extraVisibleCaps(subroleId){return subroleId==='subrole.flex-dps'?FLEX_DPS_BRIDGE.map(x=>x.id):[];}
/** This deliberately reports ratings, not a new tier or validated cross-role replacement. */
export function flexCoverageSummary(assignment){
 if(!assignment)return {main:'Sin evaluar',off:'Sin evaluar',summary:'Cobertura Main y Off sin evaluar'};
 const read=id=>{
   const r=assignment.ratings?.[id];
   return r?.state==='rated'&&Number.isInteger(r.score)?`${r.score}/5`:r?.state==='not_applicable'?'N/A':'Sin evaluar';
 };
 const main=read('cap.sustained-pressure'),off=read('cap.off-angle-pressure');
 return {main,off,summary:`Main: ${main} · Off: ${off}`};
}
