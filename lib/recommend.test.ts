import { describe, expect, it } from 'vitest';
import { buildRestaurant } from './overrides';
import { evaluate, pickRandom, recommend, scoreRestaurant, teamConflicts } from './recommend';
import type { Filters, Restaurant } from './types';

const base: Restaurant = buildRestaurant(
  { id: 't', name: '테스트', category: '음식점 > 한식 > 육류,고기 > 삼겹살', address: '', phone: '', lat: 37.4, lng: 127.1, distance: 200, kakaoUrl: '' },
  { t: { privateRoom: true, parking: false, pricePerPerson: 30000, maxGroupSize: 20 } },
);
const filters: Filters = {
  groupSize: 10, budget: 40000, maxDistance: 1000, cuisines: [], mood: null,
  needPrivateRoom: false, needParking: false, includeUnknown: true,
};
const unknown: Restaurant = { ...base, id: 'u', privateRoom: null, parking: null, pricePerPerson: null, maxGroupSize: null, mood: null, moodSource: null };

describe('buildRestaurant', () => {
  it('카테고리 추정 + overrides 병합', () => {
    expect(base.cuisine).toBe('고기');
    expect(base.ingredients).toEqual(['돼지고기']);
    expect(base.mood).toBe('시끌벅적');
    expect(base.moodSource).toBe('inferred');
    expect(base.privateRoom).toBe(true);
  });
  it('이름으로도 overrides 적용, ingredients는 추정값을 대체', () => {
    const r = buildRestaurant({ ...base, id: 'x' }, { 테스트: { mood: '조용한', ingredients: ['소고기'] } });
    expect(r.mood).toBe('조용한');
    expect(r.moodSource).toBe('curated');
    expect(r.ingredients).toEqual(['소고기']);
  });
});

describe('팀원 못 먹는 음식', () => {
  const team = [{ name: '민수', cannotEat: ['돼지고기' as const] }, { name: '지영', cannotEat: ['해산물' as const] }];
  it('주재료가 겹치면 제외', () => {
    expect(teamConflicts(base, team)).toEqual(['민수: 돼지고기']);
    expect(evaluate(base, filters, team).eligible).toBe(false);
  });
  it('겹치지 않으면 통과', () => {
    expect(evaluate(base, filters, [team[1]]).eligible).toBe(true);
  });
});

describe('evaluate', () => {
  it('거리, 인원, 예산 20% 초과', () => {
    expect(evaluate({ ...base, distance: 900 }, { ...filters, maxDistance: 500 }, []).eligible).toBe(false);
    expect(evaluate({ ...base, maxGroupSize: 8 }, filters, []).eligible).toBe(false);
    expect(evaluate({ ...base, pricePerPerson: 49000 }, filters, []).eligible).toBe(false);
    expect(evaluate({ ...base, pricePerPerson: 48000 }, filters, []).eligible).toBe(true);
  });
  it('룸/주차/분위기 필수 조건', () => {
    expect(evaluate(base, { ...filters, needParking: true }, []).eligible).toBe(false);
    expect(evaluate(base, { ...filters, needPrivateRoom: true }, []).eligible).toBe(true);
    expect(evaluate(base, { ...filters, mood: '조용한' }, []).eligible).toBe(false);
  });
  it('정보 없는 곳: includeUnknown에 따라 노출, 확인 필요 항목 표시', () => {
    const f = { ...filters, needPrivateRoom: true };
    expect(evaluate(unknown, f, [])).toEqual({ eligible: true, unknowns: ['최대 인원', '가격', '룸'] });
    expect(evaluate(unknown, { ...f, includeUnknown: false }, []).eligible).toBe(false);
    // 필수 조건이 없으면 가격/인원 정보가 없어도 노출
    expect(evaluate(unknown, { ...filters, includeUnknown: false }, []).eligible).toBe(true);
  });
  it('음식 종류', () => {
    expect(evaluate(base, { ...filters, cuisines: ['중식'] }, []).eligible).toBe(false);
  });
});

describe('scoreRestaurant / recommend', () => {
  it('가까울수록, 예산 안일수록 점수가 높음', () => {
    expect(scoreRestaurant(base, filters).score).toBeGreaterThan(scoreRestaurant({ ...base, distance: 900 }, filters).score);
    expect(scoreRestaurant(base, filters).score).toBeGreaterThan(scoreRestaurant({ ...base, pricePerPerson: 46000 }, filters).score);
  });
  it('직접 확인한 분위기는 추정보다 가점이 큼', () => {
    const f = { ...filters, mood: '시끌벅적' as const };
    expect(scoreRestaurant({ ...base, moodSource: 'curated' }, f).score).toBeGreaterThan(scoreRestaurant(base, f).score);
  });
  it('점수 내림차순, 0~100', () => {
    const recs = recommend([{ ...base, id: 'far', distance: 950 }, { ...base, id: 'near', distance: 100 }], filters);
    expect(recs.map((r) => r.restaurant.id)).toEqual(['near', 'far']);
    recs.forEach((r) => expect(r.score).toBeLessThanOrEqual(100));
  });
  it('pickRandom은 상위 N개 안에서만', () => {
    const recs = recommend(Array.from({ length: 8 }, (_, i) => ({ ...base, id: `r${i}`, distance: i * 120 })), filters);
    expect(pickRandom(recs, 3, () => 0.999)?.restaurant.id).toBe(recs[2].restaurant.id);
    expect(pickRandom([])).toBeNull();
  });
});
