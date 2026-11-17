import { isProfileId, type Companion } from '../features/companions/invite.ts';
import { currentTravelDestination, findDestination, parseTravelDestination, type TravelDestination } from '../features/travel/catalog.ts';
export type Progress = { version: 1; stage: 'intro' | 'name' | 'preferences' | 'foods' | 'companions' | 'home'; homeGuideSeen?: boolean; travelDestinationId?: string; travelDestination?: TravelDestination; travelDestinationEnabled?: boolean; pendingInvite?: string; profileId?: string; profileToken?: string; companions?: Companion[]; travelCompanionIds?: string[]; companionStatus?: 'selected' | 'later'; slide: number; name: string; allergyIds?: string[]; allergyStatus?: 'selected' | 'none'; avoidedFoods?: string[]; foodStatus?: 'selected' | 'none' };
export const initialProgress: Progress = { version: 1, stage: 'intro', slide: 0, name: '' };
export function parseProgress(raw: string | null): Progress {
  if (!raw) return initialProgress;
  try {
    const p = JSON.parse(raw);
    if (p.version !== 1 || !['intro', 'name', 'preferences', 'foods', 'companions', 'home'].includes(p.stage) || !Number.isInteger(p.slide) || p.slide < 0 || p.slide > 2 || typeof p.name !== 'string') return initialProgress;
    if (['preferences','foods','companions','home'].includes(p.stage) && !p.name.trim()) return { ...initialProgress, stage: 'name' };
    const allergyIds = Array.isArray(p.allergyIds) ? [...new Set(p.allergyIds.filter((id: unknown): id is string => typeof id === 'string' && /^food-r?f[0-9]+$/.test(id)))] as string[] : [];
    const avoidedFoods = Array.isArray(p.avoidedFoods) ? [...new Set(p.avoidedFoods.filter((x: unknown): x is string => typeof x === 'string').map((x: string) => x.normalize('NFC').trim().replace(/\s+/g, ' ').slice(0,40)).filter(Boolean))] as string[] : [];
    let stage = ['foods', 'companions', 'home'].includes(p.stage) && !(p.allergyStatus === 'none' || (p.allergyStatus === 'selected' && allergyIds.length)) ? 'preferences' : p.stage;
    if (['companions', 'home'].includes(stage) && !(p.foodStatus === 'none' || (p.foodStatus === 'selected' && avoidedFoods.length))) stage = 'foods';
    const storedTravel = parseTravelDestination(p.travelDestination);
    const travelDestination = (storedTravel?.id === p.travelDestinationId ? storedTravel : undefined) ?? findDestination(p.travelDestinationId);
    const companions: Companion[] = [];
    if (Array.isArray(p.companions)) for (const person of p.companions) {
      if (person && isProfileId(person.id) && person.id !== p.profileId && typeof person.name === 'string' && person.name.trim() && person.name.length <= 20 && !companions.some(c => c.id === person.id.toLowerCase())) companions.push({id: person.id.toLowerCase(), name: person.name.trim()});
    }
    const travelCompanionIds = Array.isArray(p.travelCompanionIds) ? companions.filter(person => p.travelCompanionIds.includes(person.id)).map(person => person.id) : undefined;
    return { version: 1, stage, ...(travelDestination ? { travelDestinationId: travelDestination.id, travelDestination } : {}), travelDestinationEnabled: p.travelDestinationEnabled !== false, homeGuideSeen: p.homeGuideSeen === true, ...(typeof p.pendingInvite === 'string' && /^[A-Z0-9]{8}$/.test(p.pendingInvite) ? {pendingInvite:p.pendingInvite} : {}), ...(isProfileId(p.profileId) ? {profileId:p.profileId.toLowerCase()} : {}), ...(isProfileId(p.profileToken) ? {profileToken:p.profileToken} : {}), companions, ...(travelCompanionIds ? { travelCompanionIds } : {}), ...(p.companionStatus === 'later' || p.companionStatus === 'selected' ? {companionStatus: p.companionStatus} : {}), slide: p.slide, name: p.name.slice(0, 20), ...(p.foodStatus === 'none' ? { avoidedFoods: [], foodStatus: 'none' as const } : p.foodStatus === 'selected' && avoidedFoods.length ? { avoidedFoods, foodStatus: 'selected' as const } : {}), ...(p.allergyStatus === 'none' ? { allergyIds: [], allergyStatus: 'none' as const } : p.allergyStatus === 'selected' && allergyIds.length ? { allergyIds, allergyStatus: 'selected' as const } : {}) };
  } catch { return initialProgress; }
}
export function destination(p: Progress) {
  return p.stage === 'home' ? '/home' : p.stage === 'companions' ? '/setup/companions' : p.stage === 'intro' ? '/onboarding' : p.stage === 'name' ? '/setup/name' : p.stage === 'foods' ? '/setup/foods' : '/setup/preferences';
}
export function advance(p: Progress): Progress {
  return p.slide < 2 ? { ...p, slide: p.slide + 1 } : { ...p, stage: 'name' };
}

export function finishSetup(p: Progress, status: 'selected' | 'later'): Progress {
  return { ...p, stage: 'home', companionStatus: status, pendingInvite: undefined };
}

export function toggleTravelDestination(progress: Progress, value: string | TravelDestination): Progress {
  const place = typeof value === 'string' ? findDestination(value) : parseTravelDestination(value);
  if (!place) return progress;
  const current = currentTravelDestination(progress);
  return { ...progress, travelDestinationId: place.id, travelDestination: place, travelDestinationEnabled: current.id !== place.id || progress.travelDestinationEnabled === false };
}

// Older setups treated every connected friend as a companion. Preserve that until
// the user makes an explicit trip selection; an empty selection must stay empty.
export function travelCompanions(progress: Progress): Companion[] {
  const friends = progress.companions ?? [];
  return progress.travelCompanionIds === undefined ? friends : friends.filter(person => progress.travelCompanionIds!.includes(person.id));
}

export function toggleTravelCompanion(progress: Progress, id: string): Progress {
  if (!progress.companions?.some(person => person.id === id)) return progress;
  const selected = travelCompanions(progress).map(person => person.id);
  return { ...progress, travelCompanionIds: selected.includes(id) ? selected.filter(value => value !== id) : [...selected, id] };
}

export function withCompanions(progress: Progress, people: Companion[]): Progress {
  return {
    ...progress, companions: people, companionStatus: undefined,
    ...(progress.travelCompanionIds === undefined ? {} : { travelCompanionIds: people.filter(person => progress.travelCompanionIds!.includes(person.id)).map(person => person.id) }),
  };
}
