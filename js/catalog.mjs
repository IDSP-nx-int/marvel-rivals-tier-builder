/** Pure catalog availability logic: a hero can appear once in each applicable subrole. */
import {assignment, eligibility, compatible} from './core.mjs';

/** An unassigned subrole is pending; explicit N/A is resolved and should not block completion. */
export function pendingSubrolesForHero(model,hero,subroles){
 if(!model||!hero||!Array.isArray(subroles))return [];
 return subroles.filter(s=>compatible(hero,s)
   && !assignment(model,hero.id,s.id)
   && eligibility(model,hero.id,s.id)!=='ineligible');
}
/** Display a hero in the catalog only while at least one compatible subrole remains unclassified. */
export function availableHeroesForCategory(model,roster,taxonomy,category){
 const subs=taxonomy?.subroles?.filter(s=>s.category===category)||[];
 return (roster?.heroes||[]).filter(hero=>hero.categories.includes(category)
   && pendingSubrolesForHero(model,hero,subs).length>0);
}
