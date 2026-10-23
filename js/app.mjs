import {CATEGORIES,TIERS,STORE_KEY,newModel,clone,assignment,eligibility,compatible,setTier,removeAssignment,markNA,clearNA,updateRating,updateFlag,lockAssignment,dominanceWarnings,inferPriorities,validateModel,newComposition,compositionAnalysis,matchupAnalysis,toV08Composition} from './core.mjs';

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=x=>String(x??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const opt=(id,title,selected)=>`<option value="${esc(id)}" ${selected===id?'selected':''}>${esc(title)}</option>`;
const names={vanguard:'Tank',duelist:'DPS',strategist:'Support'};
const labels={space:'Espacio',threat:'Amenaza',conversion:'Conversión',sustain:'Sustain',response:'Respuesta defensiva',mobility:'Movilidad/rotación',enablement:'Habilitación'};
const defaultPatch='patch.roster.2026-10-reference';
const state={roster:null,taxonomy:null,model:null,category:'duelist',selected:null,expanded:false,compositions:[],currentComp:null,availableArt:new Set(),activeView:'rankings',saveTimer:null};
function notify(msg){const x=$('#status');x.textContent=msg;x.classList.add('visible');clearTimeout(state.saveTimer);state.saveTimer=setTimeout(()=>x.classList.remove('visible'),4200);}
function persist(){try{localStorage.setItem(STORE_KEY,JSON.stringify({model:state.model,compositions:state.compositions}));}catch(e){notify('Almacenamiento bloqueado o lleno: exporta un respaldo JSON.');}}
function displayName(heroId){return state.roster.heroes.find(h=>h.id===heroId)?.name||'Héroe desconocido';}
function sr(subroleId){return state.taxonomy.subroles.find(s=>s.id===subroleId);}
function capName(id){return state.taxonomy.capabilities.find(c=>c.id===id)?.label||id;}
function flagName(kind,id){return state.taxonomy[kind].find(c=>c.id===id)?.label||id;}
function portrait(hero,{locked=false,pool=false,subroleId=null}={}){
 const initials=hero.name.split(/\s+|&/).filter(Boolean).slice(0,2).map(p=>p[0]).join('').toUpperCase();
 const index=[...hero.name].reduce((a,c)=>a+c.charCodeAt(0),0)%4;
 const selected=state.selected?.heroId===hero.id&&(pool||state.selected.subroleId===subroleId);
 // The asset path is fixed to the checked-in roster; onerror falls back to initials without external network.
 return `<div class="portrait ${selected?'active':''}" data-hero="${esc(hero.id)}" data-source-subrole="${esc(subroleId||'')}" data-color="${index}" role="button" tabindex="0" draggable="true" title="${esc(hero.name)}"><div class="face"><span>${esc(initials)}</span>${state.availableArt.has(hero.id)?`<img loading="lazy" src="./${esc(hero.portrait)}" alt="" />`:''}</div><span class="hero-label">${esc(hero.name)}</span>${locked?'<span class="mini-lock">🔒</span>':''}</div>`;
}
function heroesForCategory(){return state.roster.heroes.filter(h=>h.categories.includes(state.category));}
function pick(heroId,subroleId){
 const hero=state.roster.heroes.find(h=>h.id===heroId);if(!hero)return;
 const s=sr(subroleId), fallback=state.taxonomy.subroles.find(r=>r.category===state.category);
 if(s&&!compatible(hero,s))return notify('Héroe incompatible con ese subrol');
 state.selected={heroId,subroleId:s?.id||fallback.id};state.expanded=false;renderRankings();
}
function renderRankings(){
 $$('.category-tab').forEach(b=>b.classList.toggle('active',b.dataset.category===state.category));
 const subs=state.taxonomy.subroles.filter(s=>s.category===state.category);
 $('#boards').innerHTML=subs.map((s,i)=>`<section class="subboard ${['main','off','flex'][i]}" data-subrole="${esc(s.id)}"><div class="board-head"><h3><i class="dot"></i>${esc(s.label)}</h3><small>Tier S → D</small></div>${TIERS.map(t=>{
  const entries=state.model.assignments.filter(a=>a.subroleId===s.id&&a.tier===t);
  return `<div class="tier" data-tier="${t}" data-target-subrole="${esc(s.id)}" role="button" tabindex="0" aria-label="Asignar seleccionado a ${esc(s.label)}, tier ${t}"><div class="grade ${t}">${t}</div><div class="tier-items ${entries.length?'':'empty'}">${entries.map(a=>portrait(state.roster.heroes.find(h=>h.id===a.heroId),{locked:a.locked,subroleId:s.id})).join('')}</div></div>`;
 }).join('')}</section>`).join('');
 const q=$('#heroSearch').value.toLocaleLowerCase();let list=heroesForCategory().filter(h=>h.name.toLocaleLowerCase().includes(q));
 $('#heroPool').innerHTML=list.map(h=>portrait(h,{pool:true})).join('')||'<p class="muted">Sin resultados</p>';
 $('#poolInfo').textContent=`${heroesForCategory().length} héroes disponibles en esta categoría · Los tiers son decisiones tuyas, no datos del meta.`;
 renderEditor();
}
function renderEditor(){
 const sel=state.selected;if(!sel){$('#editor').innerHTML='<div class="editor-empty">Selecciona un héroe del catálogo, después una fila S–D, para empezar. Puedes editar cada subrol independientemente.</div>';return;}
 const hero=state.roster.heroes.find(h=>h.id===sel.heroId), s=sr(sel.subroleId);
 if(!hero||!s||s.category!==state.category){state.selected=null;return renderEditor();}
 const a=assignment(state.model,sel.heroId,sel.subroleId),status=eligibility(state.model,sel.heroId,sel.subroleId),readOnly=state.model.origin==='reference';
 const disabled=a?.locked||readOnly;
 const current=a?.tier||'Pendiente';
 const pct=state.model.assignments.filter(x=>x.subroleId===s.id&&x.locked).length;
 const inference=inferPriorities(state.model,s.id,s.coreCapabilities);
 let metrics=s.coreCapabilities.map(id=>scoreRow(id,a,disabled)).join('');
 const extra=state.taxonomy.capabilities.filter(c=>!s.coreCapabilities.includes(c.id));
 const more=state.expanded?`<div class="extended"><h4>Más capacidades (opcionales)</h4>${extra.map(c=>scoreRow(c.id,a,disabled)).join('')}<h4>Vulnerabilidades y dependencias adicionales</h4><div class="two-col"><div>${state.taxonomy.vulnerabilities.filter(v=>!s.suggestedVulnerabilities.includes(v.id)).map(v=>flagRow('vulnerabilities',v.id,a,disabled)).join('')}</div><div>${state.taxonomy.dependencies.filter(v=>!s.suggestedDependencies.includes(v.id)).map(v=>flagRow('dependencies',v.id,a,disabled)).join('')}</div></div><h4>Justificación (opcional)</h4><textarea id="noteInput" class="note" maxlength="2000" ${disabled?'disabled':''}>${esc(a?.note||'')}</textarea><label class="title-sm">Confianza <select id="confidenceInput" class="input select-mini" ${disabled?'disabled':''}>${opt('','Sin indicar',a?.confidence||'')}${['low','medium','high'].map(x=>opt(x,{low:'Baja',medium:'Media',high:'Alta'}[x],a?.confidence)).join('')}</select></label></div>`:'';
 $('#editor').innerHTML=`
 <div class="editor-top"><div class="big-icon">${esc(hero.name.split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase())}</div><div><h3>Evaluación rápida · ${esc(hero.name)}</h3><p>${esc(s.label)} · Tier <b>${esc(current)}</b> · ${a?.locked?'Bloqueado':status==='ineligible'?'N/A':'Editable / sin evaluar'}</p></div><div class="editor-badge"><span class="badge ${a?.locked?'good':'none'}">${a?.locked?'🔒 Confirmado':a?'Borrador':'Sin clasificar'}</span></div></div>
 <div class="editor-body"><div class="editor-col"><h4>Asignación funcional</h4><p>Selecciona un tier en la columna de ${esc(s.label)}. La clasificación puede guardarse sin Likert.</p><div class="detail"><strong>Tier ${esc(current)}</strong>${status==='ineligible'?'<span class="mark-na">N/A explícito</span>':'<span class="muted">No hay penalización por datos incompletos.</span>'}</div><div class="detail"><strong>Prioridades del subrol</strong><p>${pct} perfiles bloqueados · ${inference.pairs} pares comparables</p><p>${pct<2?'Sin inferencia suficiente':inference.signals.map(x=>capName(x.capId)+': '+(x.concordance==null?'sin contraste':x.agree+' favor / '+x.disagree+' contra')+(inference.weights?' · '+(100*inference.weights[x.capId]).toFixed(1)+'% exp.':'' )).join('<br>')}</p></div></div>
 <div class="editor-col"><h4>Likert sugeridos · 1 a 5 <span class="muted">(opcional)</span></h4>${metrics}<p class="hint">Una selección es la evaluación declarada. «N/A» no es lo mismo que no haber evaluado.</p></div>
 <div class="editor-col"><h4>Vulnerabilidades</h4>${s.suggestedVulnerabilities.map(id=>flagRow('vulnerabilities',id,a,disabled)).join('')}<h4 style="margin-top:13px">Dependencias</h4>${s.suggestedDependencies.map(id=>flagRow('dependencies',id,a,disabled)).join('')}<p class="hint">? = desconocido; Sí = presente; No = ausente.</p></div></div>
 ${more}
 <div class="editor-actions"><button class="btn outline" data-action="toggleExtra">${state.expanded?'− Ocultar opciones':'+ Más capacidades y restricciones'}</button>${a?`<button class="btn soft" data-action="save">Guardar cambios</button><button class="btn primary" data-action="toggleLock" ${readOnly?'disabled':''}>${a.locked?'Desbloquear':'🔒 Bloquear tier'}</button><button class="btn negative" data-action="remove" ${a.locked||readOnly?'disabled':''}>Quitar de ${esc(s.label)}</button>`:''}<button class="btn outline" data-action="toggleNA" ${disabled?'disabled':''}>${status==='ineligible'?'Quitar N/A':'Marcar N/A'}</button><span class="hint">Cambios guardados localmente · Exporta JSON para respaldar</span></div>`;
}
function scoreRow(id,a,disabled){const v=a?.ratings[id],score=v?.state==='rated'?v.score:0,na=v?.state==='not_applicable';return `<div class="score-row"><span class="metric" title="${esc(state.taxonomy.capabilities.find(c=>c.id===id)?.definition||'')}">${esc(capName(id))}</span><div class="score-btns">${[1,2,3,4,5].map(i=>`<button class="score-btn ${score===i?'on':''}" data-score="${i}" data-cap="${esc(id)}" ${!a||disabled?'disabled':''} aria-label="${esc(capName(id))}: ${i} de 5">${i}</button>`).join('')}<button class="score-btn ${na?'na':''}" data-score="na" data-cap="${esc(id)}" ${!a||disabled?'disabled':''} title="No aplicable">N/A</button><button class="score-btn" data-score="unknown" data-cap="${esc(id)}" ${!a||disabled?'disabled':''} title="Sin evaluar">×</button></div></div>`;}
function flagRow(kind,id,a,disabled){const v=a?.[kind]?.[id]||'unknown';return `<label class="flag-row"><span>${esc(flagName(kind,id))}</span><select data-flag="${esc(kind)}" data-flag-id="${esc(id)}" ${!a||disabled?'disabled':''}>${opt('unknown','? Sin evaluar',v)}${opt('present','Sí',v)}${opt('absent','No',v)}</select></label>`;}
function handleTier(heroId,subroleId,tier){
 const a=assignment(state.model,heroId,subroleId);
 try{setTier(state.model,heroId,subroleId,tier,state.roster,state.taxonomy);state.selected={heroId,subroleId};state.expanded=false;persist();renderRankings();notify(`Clasificado: ${displayName(heroId)} · ${sr(subroleId).label} · ${tier}`);}catch(e){notify(e.message);if(a?.locked)pick(heroId,subroleId);}
}
function renderOverview(){const m=state.model,ranked=m.assignments.length,locked=m.assignments.filter(a=>a.locked).length,complete=m.assignments.filter(a=>sr(a.subroleId)?.coreCapabilities.every(c=>a.ratings[c]?.state==='rated')).length;
 $('#overviewBody').innerHTML=`<div class="stats"><div class="stat"><strong>${ranked}</strong><small>Asignaciones Hero × Subrole</small></div><div class="stat"><strong>${locked}</strong><small>Tiers confirmados</small></div><div class="stat"><strong>${complete}</strong><small>Perfiles con tres Likert</small></div><div class="stat"><strong>${state.compositions.length}</strong><small>Composiciones guardadas</small></div></div><div class="two-col"><div class="panel"><h3>Modelo activo: ${esc(m.title)}</h3><p class="muted">Parche: ${esc(m.patchId)} · Revisión ${m.revision} · ${m.origin==='reference'?'Referencia de solo lectura':'Personal editable'}</p><p>Los rankings expresan tu criterio. Una clasificación sin perfil no se usa para inferir prioridades.</p><div class="toolbar"><input id="modelTitleInput" class="input" maxlength="150" value="${esc(m.title)}" ${m.origin==='reference'?'disabled':''} aria-label="Título del modelo"/><button class="btn soft" id="renameModel" ${m.origin==='reference'?'disabled':''}>Renombrar</button><button class="btn outline" id="exportModel">Exportar modelo v0.8</button><button class="btn primary" data-nav="rankings">Abrir rankings</button></div></div><div class="panel"><h3>Estado de confianza</h3><p>Los pesos por subrol son asociaciones descriptivas. La validación de prioridades y las sinergias reales requieren más evidencia y reglas versionadas.</p><div class="disclaimer">El roster es una referencia de octubre de 2026. No incluye ratings reales de temporada.</div></div></div>`;}
function renderComposition(){const c=state.currentComp;if(!c)return;$('#compTitle').value=c.title;
 $('#compSlots').innerHTML=c.slots.map((slot,i)=>{
  const hero=state.roster.heroes.find(h=>h.id===slot.heroId);
  const subs=hero?state.taxonomy.subroles.filter(s=>compatible(hero,s)):[];
  return `<div class="comp-slot"><h3>PLAYER ${String(i+1).padStart(2,'0')} · ${esc(slot.subroleId?sr(slot.subroleId)?.label:'Sin función')}</h3><label>Héroe</label><select class="input" data-comp-slot="${i}">${opt('','— Seleccionar —',slot.heroId)}${state.roster.heroes.map(h=>opt(h.id,h.name,slot.heroId)).join('')}</select><label>Función asignada</label><select class="input" data-comp-sub="${i}" ${hero?'':'disabled'}>${opt('','— Sin asignar —',slot.subroleId)}${subs.map(s=>opt(s.id,s.label,slot.subroleId)).join('')}</select></div>`;
 }).join('');
 renderCompAnalysis();renderSavedComps();
}
function renderCompAnalysis(){const c=state.currentComp,ids=c.slots.filter(s=>s.heroId).map(s=>s.heroId);const dup=ids.length!==new Set(ids).size;const a=compositionAnalysis(c,state.model);
 $('#compAnalysis').innerHTML=`<h3>Diagnóstico funcional <span class="badge">Preliminar</span></h3><p class="muted">${a.slots}/6 plazas con héroe y función · ${a.profiles} perfiles evaluables</p>${dup?'<div class="disclaimer">Hay héroes duplicados: la composición no se puede guardar.</div>':''}<h4>Cobertura registrada</h4>${a.functions.map(f=>`<div class="detail"><strong>${esc(labels[f.name])}: <span class="badge ${f.state==='evidenced'?'good':'none'}">${f.state==='evidenced'?'Evidencia funcional':'Desconocida'}</span></strong><p>${f.sources.length?f.sources.map(x=>`${esc(displayName(x.heroId))} · ${esc(capName(x.cap))} ${x.score}/5`).join(' · '):'No existe puntuación suficiente. No implica ausencia de capacidad.'}</p></div>`).join('')}<h4>Win conditions potenciales</h4>${a.chains.map(x=>`<div class="detail"><strong>${esc(x.name)} <span class="badge ${x.status==='potential'?'warning':'none'}">${x.status==='potential'?'Potencial · no confirmada':'No demostrada'}</span></strong><p>${x.missing.length?'Faltan evaluaciones de: '+x.missing.map(capName).map(esc).join(', '):'Se identifican capacidades requeridas, pero faltan datos de alcance, ventanas y objetivos.'}</p></div>`).join('')}<h4>Dependencias compartidas</h4>${a.shared.length?a.shared.map(s=>`<div class="detail">${esc(flagName('dependencies',s.dependencyId))} · ${s.claimants} demandantes · contención posible, no confirmada</div>`).join(''):'<p class="muted">No se han registrado dependencias compartidas. Puede faltar información.</p>'}<p class="disclaimer">Sin habilidades curadas por parche, el sistema no confirma sinergias ni recursos simultáneos a partir de Likert.</p>`;
}
function renderSavedComps(){$('#savedComps').innerHTML=`<h3>Composiciones guardadas (${state.compositions.length})</h3>${state.compositions.length?state.compositions.map(c=>`<div class="detail"><strong>${esc(c.title)}</strong><p>${c.slots.map(s=>displayName(s.heroId)).join(' · ')}</p><button class="btn small soft" data-load-comp="${esc(c.id)}">Editar copia</button> <button class="btn small negative" data-remove-comp="${esc(c.id)}">Eliminar</button></div>`).join(''):'<div class="empty-state">Todavía no hay composiciones guardadas. Completa seis plazas y pulsa Guardar.</div>'}`;}
function renderMatchup(){const selections=state.compositions.map(c=>opt(c.id,c.title,''));const priorA=$('#teamA').value,priorB=$('#teamB').value;
 $('#teamA').innerHTML=opt('','— Composición A —','')+selections.join('');$('#teamB').innerHTML=opt('','— Composición B —','')+selections.join('');
 if(state.compositions.some(c=>c.id===priorA))$('#teamA').value=priorA;
 if(state.compositions.some(c=>c.id===priorB))$('#teamB').value=priorB;
 $('#matchupBody').innerHTML='<div class="empty-state">Selecciona dos composiciones guardadas para generar un análisis bidireccional basado únicamente en información evaluada.</div>';
}
function runMatchup(){const a=state.compositions.find(c=>c.id===$('#teamA').value),b=state.compositions.find(c=>c.id===$('#teamB').value);if(!a||!b||a.id===b.id)return notify('Selecciona dos composiciones diferentes.');
 const r=matchupAnalysis(a,b,state.model);
 $('#matchupBody').innerHTML=`<h3>${esc(a.title)} vs. ${esc(b.title)}</h3><p class="disclaimer">Sin geometría, cooldowns, metadatos de habilidades o evaluación de perfiles completos, no se infiere quién gana.</p><div class="two-col"><div><h3>Equipo A → B</h3>${r.teamA.map(x=>`<div class="detail"><strong>${esc(x.name)} <span class="badge ${x.status==='contested-potential'?'warning':'none'}">${x.status==='contested-potential'?'Potencialmente disputada':'Datos insuficientes'}</span></strong><p>${esc(x.reason)}</p></div>`).join('')}</div><div><h3>Equipo B → A</h3>${r.teamB.map(x=>`<div class="detail"><strong>${esc(x.name)} <span class="badge ${x.status==='contested-potential'?'warning':'none'}">${x.status==='contested-potential'?'Potencialmente disputada':'Datos insuficientes'}</span></strong><p>${esc(x.reason)}</p></div>`).join('')}</div></div>`;
}
function renderRules(){$('#rulesBody').innerHTML=`<div class="rule-grid"><div class="panel"><h3>Jerarquía metodológica</h3><p>Hero × Subrole × Model × Patch es la unidad de evaluación. El tier es una decisión humana y no una suma de Likert. Un mismo héroe admite distintas posiciones Main/Off/Flex.</p><p>Escala 1–5: marginal, limitada, funcional, fuerte y excepcional. La capacidad sin evaluar no equivale a 1/5 ni a cero.</p><p>N/A es una exclusión explícita; sin clasificación es pendiente.</p></div><div class="panel"><h3>Consistency & Priority</h3><p>Las advertencias de dominancia comparan únicamente evaluaciones completas y bloqueadas del mismo subrol, sin convertirlas en verdades del meta.</p><p>La asociación por pares permite explorar prioridades, pero con el roster pequeño no se impone una muestra n≥20 ni se reclaman pesos confiables.</p></div><div class="panel"><h3>Composition & Matchup</h3><p>Los módulos de cobertura y win conditions usan solo capacidades puntuadas, sin inventar alcance, cooldowns, disponibilidad de recursos o coincidencia de objetivos. Las reglas específicas de habilidades y Team-Ups quedan pendientes.</p><p>El análisis contextual no estima probabilidades de victoria ni penaliza composiciones distintas de 2–2–2.</p></div><div class="panel"><h3>Documentos y procedencia</h3><p><a href="./docs/Documento_Maestro_v1.0.pdf" target="_blank" rel="noopener">Documento Maestro de Trazabilidad (PDF)</a></p><p><a href="./docs/mockup_tres_subroles.png" target="_blank" rel="noopener">Referencia visual: tres subroles simultáneos</a></p><p><a href="./data/roster.sources.md" target="_blank" rel="noopener">Procedencia del roster</a></p><p><a href="./legacy/v0.8/README.md" target="_blank" rel="noopener">Contratos originales v0.8</a></p></div><div class="panel"><h3>Datos personales</h3><p>Los datos se guardan exclusivamente en localStorage y pueden perderse al borrar datos del navegador. No se sincronizan entre equipos. Exportar/Importar crea respaldo manual.</p><p><button id="newEmptyModel" class="btn outline">Crear modelo vacío</button> <button id="forkButton" class="btn soft" ${state.model.origin==='personal'?'disabled':''}>Crear copia personal</button></p></div><div class="panel"><h3>Pendientes de implementación</h3><p>Retratos Lord autorizados y locales; catálogo real de habilidades por parche; ventanas, recursos, Team-Ups; avisos ampliados; pruebas end-to-end y mejoras de accesibilidad; generación/exportación de reportes persistentes.</p><p>El catálogo v0.8 original usa categoría única. El runtime añade compatibilidad multirrol para Deadpool sin alterar ese contrato; pendiente versionar una evolución del esquema.</p></div></div>`;}
function setPage(name){state.activeView=name;$$('.view').forEach(v=>v.hidden=v.id!==`view-${name}`);$$('.nav').forEach(b=>b.classList.toggle('active',b.dataset.page===name));if(name==='overview')renderOverview();if(name==='rankings')renderRankings();if(name==='composition')renderComposition();if(name==='matchup')renderMatchup();if(name==='rules')renderRules();}
function exportBackup(){const backup={kind:'tier-builder-backup',backupVersion:'1.0.0',exportedAt:new Date().toISOString(),rosterVersion:state.roster.rosterVersion,model:state.model,compositions:state.compositions,contractCompositions:state.compositions.map(c=>toV08Composition(c,state.model)).filter(Boolean)};download(backup,'marvel-rivals-tier-builder-backup.json');}
function download(data,name){const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);}
function validateCompositions(list,m){const errors=[];if(!Array.isArray(list))return ['Composiciones inválidas'];for(const c of list){if(c.kind!=='composition-draft'||c.schemaVersion!=='1.0.0')errors.push('Formato de borrador desconocido');if(c.modelId!==m.id||c.patchId!==m.patchId)errors.push('Modelo o parche de composición incompatible');if(!Array.isArray(c.slots)||c.slots.length!==6)errors.push('Cada composición requiere seis plazas');for(const s of c.slots||[]){if(!s.heroId&&!s.subroleId)continue;const h=state.roster.heroes.find(x=>x.id===s.heroId);if(!compatible(h,sr(s.subroleId)))errors.push('Héroe / subrol inválido en composición');}}return errors;}
async function handleImport(file){try{if(file.size>2000000)throw new Error('El archivo supera 2 MB.');const input=JSON.parse(await file.text());let model,comps=[];
 if(input.kind==='tier-builder-backup'){model=input.model;comps=input.compositions||[];}else if(input.kind==='model')model=input;else throw new Error('Se espera un modelo v0.8 o un respaldo de Tier Builder.');
 const errors=[...validateModel(model,state.roster,state.taxonomy,defaultPatch),...validateCompositions(comps,model)];if(errors.length)throw new Error(errors.slice(0,4).join(' · '));
 if(!confirm('¿Reemplazar el trabajo local por este archivo? Antes puedes exportar un respaldo del modelo actual.'))return;
 state.model=clone(model);state.compositions=clone(comps);state.currentComp=newComposition(state.model);state.selected=null;persist();setPage('rankings');notify('Archivo importado y validado.');
 }catch(e){notify('Importación rechazada: '+e.message);}finally{$('#fileInput').value='';}}
function modalWarning(warnings,cb){const other=warnings.map(w=>`${esc(displayName(w.otherHeroId))} (Tier ${esc(w.otherTier)})`).join(', ');$('#confirmBody').innerHTML=`<h3>Advertencia de coherencia estructural</h3><p>La clasificación difiere de al menos un perfil bloqueado que domina en las ${warnings[0].comparedCapabilities} dimensiones comparadas: <b>${other}</b>.</p><p class="disclaimer">Este contraste no demuestra que tu tier esté mal. Pueden existir sinergias o circunstancias no evaluadas. La decisión es tuya.</p>`;const dlg=$('#confirmModal');dlg.showModal();$('#approveModal').onclick=()=>{dlg.close();cb();};}
function bindUI(){
 $('#mainNav').addEventListener('click',e=>{const b=e.target.closest('[data-page]');if(b)setPage(b.dataset.page);});
 $('#importBtn').onclick=()=>$('#fileInput').click();$('#fileInput').onchange=e=>{const f=e.target.files?.[0];if(f)handleImport(f);};$('#exportBtn').onclick=exportBackup;
 $('#heroSearch').addEventListener('input',renderRankings);
 $$('.category-tab').forEach(b=>b.onclick=()=>{state.category=b.dataset.category;state.selected=null;state.expanded=false;$('#heroSearch').value='';renderRankings();});
 $('#boards').addEventListener('click',e=>{const p=e.target.closest('.portrait');if(p){pick(p.dataset.hero,p.dataset.sourceSubrole);return;}const row=e.target.closest('.tier');if(!row)return;if(!state.selected)return notify('Primero selecciona un héroe del catálogo.');handleTier(state.selected.heroId,row.dataset.targetSubrole,row.dataset.tier);});
 $('#heroPool').addEventListener('click',e=>{const p=e.target.closest('.portrait');if(p)pick(p.dataset.hero,null);});
 $('#heroPool').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){const p=e.target.closest('.portrait');if(p){e.preventDefault();pick(p.dataset.hero,null);}}});
 $('#boards').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){const p=e.target.closest('.portrait');if(p){e.preventDefault();pick(p.dataset.hero,p.dataset.sourceSubrole);return;}const row=e.target.closest('.tier');if(row&&state.selected){e.preventDefault();handleTier(state.selected.heroId,row.dataset.targetSubrole,row.dataset.tier);}}});
 for(const target of ['#heroPool','#boards'])$(target).addEventListener('dragstart',e=>{const p=e.target.closest('.portrait');if(p)e.dataTransfer.setData('text/plain',p.dataset.hero);});
 $('#boards').addEventListener('dragover',e=>{const row=e.target.closest('.tier');if(row){e.preventDefault();e.dataTransfer.dropEffect='move';row.classList.add('over');}});
 $('#boards').addEventListener('dragleave',e=>{const row=e.target.closest('.tier');if(row)row.classList.remove('over');});
 $('#boards').addEventListener('drop',e=>{const row=e.target.closest('.tier');if(!row)return;e.preventDefault();row.classList.remove('over');const id=e.dataTransfer.getData('text/plain');if(id)handleTier(id,row.dataset.targetSubrole,row.dataset.tier);});
 $('#editor').addEventListener('click',e=>{
  const sel=state.selected;if(!sel)return;
  const score=e.target.closest('[data-score]');if(score){try{const s=score.dataset.score;updateRating(state.model,sel.heroId,sel.subroleId,score.dataset.cap,s==='na'?'not_applicable':s==='unknown'?'unknown':'rated',s==='na'||s==='unknown'?null:Number(s),state.taxonomy);persist();renderEditor();}catch(x){notify(x.message);}return;}
  const b=e.target.closest('[data-action]');if(!b)return;
  const action=b.dataset.action,a=assignment(state.model,sel.heroId,sel.subroleId);
  try{
   if(action==='toggleExtra'){state.expanded=!state.expanded;renderEditor();return;}
   if(action==='save'){persist();notify('Cambios guardados en este navegador. Exporta un respaldo si deseas conservarlos fuera de él.');return;}
   if(action==='toggleLock'){
    const apply=()=>{lockAssignment(state.model,sel.heroId,sel.subroleId,!a.locked);persist();renderRankings();notify(a.locked?'Evaluación confirmada.':'Evaluación desbloqueada.');};
    if(!a.locked){const w=dominanceWarnings(state.model,a,sr(sel.subroleId).coreCapabilities);if(w.length)return modalWarning(w,apply);}apply();return;
   }
   if(action==='remove'){removeAssignment(state.model,sel.heroId,sel.subroleId);persist();renderRankings();notify('Asignación retirada.');return;}
   if(action==='toggleNA'){if(eligibility(state.model,sel.heroId,sel.subroleId)==='ineligible')clearNA(state.model,sel.heroId,sel.subroleId);else markNA(state.model,sel.heroId,sel.subroleId,state.roster,state.taxonomy);persist();renderRankings();return;}
  }catch(x){notify(x.message);}
 });
 $('#editor').addEventListener('change',e=>{const sel=state.selected;if(!sel)return;try{
  const f=e.target.closest('[data-flag]');if(f){updateFlag(state.model,sel.heroId,sel.subroleId,f.dataset.flag,f.dataset.flagId,f.value,state.taxonomy);persist();return;}
  const a=assignment(state.model,sel.heroId,sel.subroleId);if(!a||a.locked)throw new Error('La evaluación no está editable');
  if(e.target.id==='noteInput'){a.note=e.target.value;state.model.revision++;persist();}
  if(e.target.id==='confidenceInput'){if(e.target.value)a.confidence=e.target.value;else delete a.confidence;state.model.revision++;persist();}
 }catch(x){notify(x.message);}});
 $('#compTitle').oninput=e=>{state.currentComp.title=e.target.value;};
 $('#compSlots').addEventListener('change',e=>{
  const index=Number(e.target.dataset.compSlot??e.target.dataset.compSub);if(!Number.isInteger(index)||index<0||index>5)return;
  const slot=state.currentComp.slots[index];
  if('compSlot'in e.target.dataset){slot.heroId=e.target.value||null;const h=state.roster.heroes.find(x=>x.id===slot.heroId);if(!compatible(h,sr(slot.subroleId)))slot.subroleId=state.taxonomy.subroles.find(s=>compatible(h,s))?.id||null;}
  else slot.subroleId=e.target.value||null;renderComposition();
 });
 $('#exampleComp').onclick=()=>{const heroes=['Magneto','Venom','Hela','Elsa Bloodstone','Luna Snow','Mantis'];const roles=['subrole.main-tank','subrole.off-tank','subrole.main-dps','subrole.off-dps','subrole.main-support','subrole.off-support'];state.currentComp.slots=heroes.map((name,i)=>({slot:i+1,heroId:state.roster.heroes.find(h=>h.name===name)?.id||null,subroleId:roles[i]}));state.currentComp.title='Ejemplo de composición — sin evaluaciones';renderComposition();notify('Solo se rellenaron los nombres; no se atribuyó ningún tier o capacidad.');};
 $('#saveComp').onclick=()=>{const c=state.currentComp,ids=c.slots.map(x=>x.heroId);if(ids.some(x=>!x)||new Set(ids).size!==6||c.slots.some(x=>!x.subroleId))return notify('Completa seis héroes únicos con funciones válidas.');c.title=($('#compTitle').value||'Composición sin título').trim();const cloneComp=clone(c);cloneComp.id='comp.local.'+Date.now();cloneComp.modelRevision=state.model.revision;state.compositions.push(cloneComp);persist();renderSavedComps();notify('Composición guardada.');};
 $('#savedComps').onclick=e=>{const del=e.target.closest('[data-remove-comp]'),load=e.target.closest('[data-load-comp]');if(del){if(confirm('¿Eliminar esta composición guardada?')){state.compositions=state.compositions.filter(x=>x.id!==del.dataset.removeComp);persist();renderSavedComps();}}else if(load){const c=state.compositions.find(x=>x.id===load.dataset.loadComp);if(c){state.currentComp=clone(c);renderComposition();notify('Se cargó una copia editable. Guardar creará una nueva versión.');}}};
 $('#analyzeMatchup').onclick=runMatchup;
 $('#view-rules').onclick=e=>{if(e.target.closest('#newEmptyModel')){if(confirm('¿Crear modelo vacío? Exporta antes el trabajo actual; se borrarán los datos locales.')){state.model=newModel(defaultPatch);state.compositions=[];state.currentComp=newComposition(state.model);state.selected=null;persist();setPage('rankings');notify('Modelo nuevo creado.');}}
 if(e.target.closest('#forkButton')&&state.model.origin==='reference'){state.model=clone(state.model);state.model.origin='personal';state.model.forkedFrom={modelId:state.model.id,revision:state.model.revision};state.model.id='model.personal.fork';state.model.title+=' (copia personal)';state.model.revision=0;state.compositions=[];persist();setPage('rankings');}};
 $('#view-overview').onclick=e=>{const b=e.target.closest('[data-nav]');if(b)setPage(b.dataset.nav);
  if(e.target.closest('#exportModel'))download(state.model,'marvel-rivals-model-v08.json');
  if(e.target.closest('#renameModel')&&state.model.origin==='personal'){const title=$('#modelTitleInput').value.trim();if(!title)return notify('El título no puede estar vacío');state.model.title=title;state.model.revision++;state.model.updatedAt=new Date().toISOString();persist();renderOverview();notify('Modelo renombrado.');}
 };
 $('#cancelModal').onclick=()=>$('#confirmModal').close();
}
async function init(){try{
 const [r,t,manifest]=await Promise.all([fetch('./data/roster.reference.json').then(x=>{if(!x.ok)throw new Error('roster');return x.json();}),fetch('./data/taxonomy.json').then(x=>{if(!x.ok)throw new Error('taxonomía');return x.json();}),fetch('./assets/heroes/manifest.json').then(x=>x.json()).catch(()=>({heroIds:[]}))]);state.roster=r;state.taxonomy=t;state.availableArt=new Set(manifest.heroIds||[]);
 let saved;try{saved=JSON.parse(localStorage.getItem(STORE_KEY));}catch{}
 const candidate=saved?.model,errors=candidate?validateModel(candidate,r,t,defaultPatch):[];
 state.model=candidate&&!errors.length?candidate:newModel(defaultPatch);
 if(candidate&&errors.length)notify('Respaldo local incompatible, no fue sobrescrito: '+errors[0]);
 const comps=Array.isArray(saved?.compositions)?saved.compositions:[];
 state.compositions=candidate&&!errors.length&&!validateCompositions(comps,state.model).length?comps:[];
 state.currentComp=newComposition(state.model);bindUI();setPage('rankings');
 }catch(e){document.querySelector('.main').innerHTML=`<div class="disclaimer">No se pudo cargar la aplicación: ${esc(e.message)}. Para ejecutar localmente usa un servidor HTTP, por ejemplo <code>python -m http.server 8000</code>, y entra en http://localhost:8000/ . GitHub Pages la servirá por HTTP automáticamente.</div>`;}}
init();
