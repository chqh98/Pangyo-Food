import type { Filters, Recommendation, Restaurant } from '../types';

/** 예산을 이 비율까지 초과하는 곳은 감점 후 후보에 남긴다. */
export const BUDGET_TOLERANCE = 1.2;

export function isEligible(r: Restaurant, f: Filters): boolean {
  if (r.maxGroupSize < f.groupSize) return false;
  if (r.pricePerPerson > f.budget * BUDGET_TOLERANCE) return false;
  if (f.cuisines.length > 0 && !f.cuisines.includes(r.cuisine)) return false;
  if (f.areas.length > 0 && !f.areas.includes(r.area)) return false;
  if (f.needPrivateRoom && !r.hasPrivateRoom) return false;
  if (f.needParking && !r.parking) return false;
  return true;
}

export function scoreRestaurant(r: Restaurant, f: Filters): Recommendation {
  const reasons: string[] = [];
  let score = 20;

  if (r.pricePerPerson <= f.budget) {
    score += 30;
    reasons.push('예산 안에 들어와요');
  } else {
    const overRatio = r.pricePerPerson / f.budget - 1;
    score += Math.round(30 - overRatio * 150);
    reasons.push(`예산보다 ${Math.round(overRatio * 100)}% 비싸요`);
  }

  if (f.mood && r.moods.includes(f.mood)) {
    score += 20;
    reasons.push(`'${f.mood}' 분위기`);
  }

  if (r.walkMinutes <= 5) {
    score += 15;
    reasons.push(`판교역 도보 ${r.walkMinutes}분`);
  } else if (r.walkMinutes <= 10) {
    score += 8;
  }

  if (f.groupSize >= 8 && r.hasPrivateRoom) {
    score += 15;
    reasons.push('단체 룸 보유');
  }

  // 정원에 꽉 차는 곳보다 여유 있는 곳을 약간 선호
  if (r.maxGroupSize >= f.groupSize * 1.5) score += 5;

  return { restaurant: r, score: Math.max(0, Math.min(100, score)), reasons };
}

export function recommend(list: Restaurant[], f: Filters): Recommendation[] {
  return list
    .filter((r) => isEligible(r, f))
    .map((r) => scoreRestaurant(r, f))
    .sort((a, b) => b.score - a.score || a.restaurant.pricePerPerson - b.restaurant.pricePerPerson);
}

/** 상위 후보 중에서 하나를 무작위로 고른다. */
export function pickRandom(
  recs: Recommendation[],
  topN = 5,
  rand: () => number = Math.random,
): Recommendation | null {
  const pool = recs.slice(0, topN);
  if (pool.length === 0) return null;
  return pool[Math.floor(rand() * pool.length)];
}
