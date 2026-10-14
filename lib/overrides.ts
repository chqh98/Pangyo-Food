import raw from '@/data/overrides.json';
import { classifyCuisine, inferIngredients, inferMood } from './classify';
import { INGREDIENTS, MOODS, type Ingredient, type Mood, type Restaurant } from './types';

export interface PlaceOverride {
  mood?: Mood;
  privateRoom?: boolean;
  parking?: boolean;
  pricePerPerson?: number;
  maxGroupSize?: number;
  signature?: string;
  ingredients?: Ingredient[];
  notes?: string;
}

const places = (raw as { places: Record<string, PlaceOverride> }).places;

export interface BasePlace {
  id: string;
  name: string;
  category: string;
  address: string;
  phone: string;
  lat: number;
  lng: number;
  distance: number;
  kakaoUrl: string;
}

/** 카카오 장소 정보 + 카테고리 추정값 + 팀 확인 정보(overrides)를 합친다 */
export function buildRestaurant(p: BasePlace, overrides: Record<string, PlaceOverride> = places): Restaurant {
  const o = overrides[p.id] ?? overrides[p.name] ?? {};
  const inferredMood = inferMood(p.category);
  const mood = o.mood && MOODS.includes(o.mood) ? o.mood : inferredMood;
  const ingredients = o.ingredients
    ? o.ingredients.filter((i) => INGREDIENTS.includes(i))
    : inferIngredients(p.category, p.name);
  return {
    ...p,
    cuisine: classifyCuisine(p.category, p.name),
    ingredients,
    mood,
    moodSource: o.mood ? 'curated' : inferredMood ? 'inferred' : null,
    privateRoom: o.privateRoom ?? null,
    parking: o.parking ?? null,
    pricePerPerson: o.pricePerPerson ?? null,
    maxGroupSize: o.maxGroupSize ?? null,
    signature: o.signature ?? null,
    notes: o.notes ?? null,
  };
}
