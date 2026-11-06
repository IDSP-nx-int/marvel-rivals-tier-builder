/** Mechanical evaluations are authored by the user, independently for each subrole. */
export const MECHANICS = Object.freeze([
  {id:'effective-ttk',label:'Effective TTK',description:'Rapidez de eliminar en una ventana real, no daño en laboratorio',low:'Lenta',high:'Muy rápida',direction:'positive'},
  {id:'conversion-reliability',label:'Conversion Reliability',description:'Repetibilidad de la eliminación cuando la oportunidad existe',low:'Inconsistente',high:'Muy fiable',direction:'positive'},
  {id:'independent-agency',label:'Independent Agency',description:'Capacidad de crear impacto sin coordinación de aliados',low:'Requiere apoyo',high:'Muy autónomo',direction:'positive'},
  {id:'counterplay-sensitivity',label:'Counterplay Sensitivity',description:'Cuánto pierde cuando el rival identifica y responde a su plan; 5 es MÁS vulnerable',low:'Poco sensible',high:'Muy sensible',direction:'negative'}
]);
export const MECHANIC_IDS = MECHANICS.map(x=>x.id);
export function migrateModelToV09(model){
  if(!model||typeof model!=='object')throw new Error('Modelo no reconocible');
  if(model.schemaVersion==='0.9.0')return model;
  if(model.schemaVersion!=='0.8.0')throw new Error('Versión de modelo no soportada');
  const next=structuredClone(model);
  next.schemaVersion='0.9.0';
  if(!Array.isArray(next.assignments))throw new Error('Asignaciones no reconocibles');
  for(const a of next.assignments) a.mechanicRatings={};
  return next;
}
export function setMechanicRating(model,heroId,subroleId,traitId,state,score){
  if(model?.origin==='reference')throw new Error('Modelo de referencia no editable');
  if(model?.schemaVersion!=='0.9.0')throw new Error('Actualiza el modelo antes de evaluar mecánicas');
  if(!MECHANIC_IDS.includes(traitId))throw new Error('Mecánica desconocida');
  const a=model.assignments?.find(x=>x.heroId===heroId&&x.subroleId===subroleId);
  if(!a||a.locked)throw new Error('Necesitas una clasificación editable');
  if(!a.mechanicRatings)a.mechanicRatings={};
  if(state==='unknown')delete a.mechanicRatings[traitId];
  else if(state==='not_applicable')a.mechanicRatings[traitId]={state};
  else if(state==='rated'&&Number.isInteger(score)&&score>=1&&score<=5)a.mechanicRatings[traitId]={state,score};
  else throw new Error('Evaluación mecánica inválida');
  model.revision++;model.updatedAt=new Date().toISOString();
  return a;
}
export function validateMechanics(model){
 const errors=[];
 if(model?.schemaVersion!=='0.9.0')return ['Versión de mecánicas incorrecta'];
 for(const a of model.assignments||[]){
  if(!a.mechanicRatings||typeof a.mechanicRatings!=='object'||Array.isArray(a.mechanicRatings)){errors.push(`Faltan mecánicas en ${a.heroId}`);continue;}
  for(const [key,v] of Object.entries(a.mechanicRatings)){
   if(!MECHANIC_IDS.includes(key)||!v||!['rated','not_applicable'].includes(v.state)||
     (v.state==='rated'&&(!Number.isInteger(v.score)||v.score<1||v.score>5))||
     (v.state==='not_applicable'&&'score'in v))errors.push(`Mecánica inválida: ${a.heroId}/${a.subroleId}/${key}`);
  }
 }
 return errors;
}
