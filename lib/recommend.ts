import { walkMinutes } from './geo';
import type { Filters, Recommendation, Restaurant, TeamMember } from './types';

/** 예산을 이 비율까지 초과하는 곳은 감점 후 후보에 남긴다. */
export const BUDGET_TOLERANCE = 1.2;

/** 이 식당 때문에 못 먹는 팀원 목록 ("민수: 해산물") */
export function teamConflicts(r: Restaurant, team: TeamMember[]): string[] {
  return team.flatMap((m) => {
    const bad = m.cannotEat.filter((i) => r.ingredients.includes(i));
    return bad.length ? [`${m.name || '팀원'}: ${bad.join(', ')}`] : [];
  });
}

/** 조건 비교 결과: true = 통과, false = 탈락, null = 정보 없음 */
function check<T>(value: T | null, ok: (v: T) => boolean): boolean | null {
  return value === null ? null : ok(value);
}

export function evaluate(r: Restaurant, f: Filters, team: TeamMember[]): { eligible: boolean; unknowns: string[] } {
  const unknowns: string[] = [];
  if (r.distance > f.maxDistance) return { eligible: false, unknowns };
  if (f.cuisines.length > 0 && !f.cuisines.includes(r.cuisine)) return { eligible: false, unknowns };
  if (teamConflicts(r, team).length > 0) return { eligible: false, unknowns };

  const checks: [string, boolean | null][] = [
    ['최대 인원', check(r.maxGroupSize, (v) => v >= f.groupSize)],
    ['가격', check(r.pricePerPerson, (v) => v <= f.budget * BUDGET_TOLERANCE)],
  ];
  if (f.needPrivateRoom) checks.push(['룸', check(r.privateRoom, (v) => v)]);
  if (f.needParking) checks.push(['주차', check(r.parking, (v) => v)]);
  if (f.mood) checks.push(['분위기', check(r.mood, (v) => v === f.mood)]);

  for (const [label, result] of checks) {
    if (result === false) return { eligible: false, unknowns };
    if (result === null) unknowns.push(label);
  }
  // 꼭 필요한 조건(룸/주차/분위기)의 정보가 없으면 includeUnknown일 때만 노출
  const required = unknowns.filter((u) => u === '룸' || u === '주차' || u === '분위기');
  if (!f.includeUnknown && required.length > 0) return { eligible: false, unknowns };
  return { eligible: true, unknowns };
}

export function scoreRestaurant(r: Restaurant, f: Filters, unknowns: string[] = []): Recommendation {
  const reasons: string[] = [];
  let score = 20;

  if (r.distance <= 300) {
    score += 25;
    reasons.push(`도보 ${walkMinutes(r.distance)}분`);
  } else if (r.distance <= 600) {
    score += 15;
    reasons.push(`도보 ${walkMinutes(r.distance)}분`);
  } else {
    score += 5;
  }

  if (r.pricePerPerson !== null) {
    if (r.pricePerPerson <= f.budget) {
      score += 25;
      reasons.push('예산 안');
    } else {
      const over = r.pricePerPerson / f.budget - 1;
      score += Math.round(25 - over * 125);
      reasons.push(`예산 ${Math.round(over * 100)}% 초과`);
    }
  }

  if (f.mood && r.mood === f.mood) {
    score += r.moodSource === 'curated' ? 15 : 8;
    reasons.push(`${r.mood} 분위기${r.moodSource === 'inferred' ? '(추정)' : ''}`);
  }

  if (f.groupSize >= 8 && r.privateRoom) {
    score += 10;
    reasons.push('단체 룸');
  }
  if (r.maxGroupSize !== null && r.maxGroupSize >= f.groupSize * 1.5) score += 5;

  return { restaurant: r, score: Math.max(0, Math.min(100, score)), reasons, unknowns };
}

export function recommend(list: Restaurant[], f: Filters, team: TeamMember[] = []): Recommendation[] {
  return list
    .map((r) => ({ r, ev: evaluate(r, f, team) }))
    .filter(({ ev }) => ev.eligible)
    .map(({ r, ev }) => scoreRestaurant(r, f, ev.unknowns))
    .sort((a, b) => b.score - a.score || a.restaurant.distance - b.restaurant.distance);
}

/** 상위 후보 중에서 하나를 무작위로 고른다. */
export function pickRandom(recs: Recommendation[], topN = 5, rand: () => number = Math.random): Recommendation | null {
  const pool = recs.slice(0, topN);
  if (pool.length === 0) return null;
  return pool[Math.floor(rand() * pool.length)];
}
