import {locations} from './journey-config.js?v=8';
export const STORAGE_KEY='mukhavets.journey.v1';
export const freshState=()=>({version:1,active:false,seen:{}});
export function normalizeState(value){
  const state=freshState();
  if(!value||value.version!==1)return state;
  state.active=value.active===true;
  // Ignore invalid keys and prevent a damaged save from skipping a stage.
  for(const place of locations){
    state.seen[place.id]=place.points.filter(p=>Array.isArray(value.seen?.[place.id])&&value.seen[place.id].includes(p.id)).map(p=>p.id);
    if(!isComplete(state,place.id))break;
  }
  return state;
}
export function isComplete(state,id){const place=locations.find(p=>p.id===id);return !!place&&place.points.every(p=>state.seen[id]?.includes(p.id));}
export function unlocked(state,id){const index=locations.findIndex(p=>p.id===id);return index>=0&&locations.slice(0,index).every(p=>isComplete(state,p.id));}
export function currentLocation(state){return locations.find(p=>!isComplete(state,p.id))||locations[locations.length-1];}
export function recordVisit(state,id,point){
  if(state.seen[id]?.includes(point))return state;
  if(!state.active||!unlocked(state,id)||!locations.find(p=>p.id===id)?.points.some(p=>p.id===point))return state;
  return {...state,seen:{...state.seen,[id]:[...new Set([...(state.seen[id]||[]),point])]}};
}
