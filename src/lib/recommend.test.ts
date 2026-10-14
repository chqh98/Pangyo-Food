import { describe, expect, it } from 'vitest';
import type { Filters, Restaurant } from '../types';
import { isEligible, pickRandom, recommend, scoreRestaurant } from './recommend';

const base: Restaurant = {
  id: 't', name: '테스트', cuisine: '고기', area: '판교역', pricePerPerson: 30000,
  maxGroupSize: 20, hasPrivateRoom: false, parking: false, moods: ['활기참'],
  walkMinutes: 3, signature: '', tags: [],
};
const filters: Filters = {
  groupSize: 10, budget: 40000, cuisines: [], areas: [], mood: null,
  needPrivateRoom: false, needParking: false,
};

describe('isEligible', () => {
  it('인원 초과 시 제외', () => {
    expect(isEligible({ ...base, maxGroupSize: 8 }, filters)).toBe(false);
  });
  it('예산 20% 초과 시 제외, 이내면 포함', () => {
    expect(isEligible({ ...base, pricePerPerson: 49000 }, filters)).toBe(false);
    expect(isEligible({ ...base, pricePerPerson: 48000 }, filters)).toBe(true);
  });
  it('룸/주차/종류/지역 조건', () => {
    expect(isEligible(base, { ...filters, needPrivateRoom: true })).toBe(false);
    expect(isEligible(base, { ...filters, needParking: true })).toBe(false);
    expect(isEligible(base, { ...filters, cuisines: ['중식'] })).toBe(false);
    expect(isEligible(base, { ...filters, areas: ['서판교'] })).toBe(false);
    expect(isEligible(base, { ...filters, cuisines: ['고기'], areas: ['판교역'] })).toBe(true);
  });
});

describe('scoreRestaurant', () => {
  it('예산 초과는 감점', () => {
    const under = scoreRestaurant(base, filters).score;
    const over = scoreRestaurant({ ...base, pricePerPerson: 46000 }, filters).score;
    expect(over).toBeLessThan(under);
  });
  it('분위기 일치와 단체 룸은 가점', () => {
    const plain = scoreRestaurant(base, filters).score;
    expect(scoreRestaurant(base, { ...filters, mood: '활기참' }).score).toBeGreaterThan(plain);
    expect(scoreRestaurant({ ...base, hasPrivateRoom: true }, filters).score).toBeGreaterThan(plain);
  });
  it('점수는 0~100 범위', () => {
    const s = scoreRestaurant({ ...base, hasPrivateRoom: true }, { ...filters, mood: '활기참' }).score;
    expect(s).toBeLessThanOrEqual(100);
  });
});

describe('recommend / pickRandom', () => {
  it('점수 내림차순 정렬', () => {
    const recs = recommend(
      [{ ...base, id: 'far', walkMinutes: 20 }, { ...base, id: 'near' }],
      filters,
    );
    expect(recs.map((r) => r.restaurant.id)).toEqual(['near', 'far']);
  });
  it('후보가 없으면 null', () => {
    expect(pickRandom([])).toBeNull();
  });
  it('상위 N개 안에서만 고른다', () => {
    const recs = recommend(
      Array.from({ length: 8 }, (_, i) => ({ ...base, id: `r${i}`, walkMinutes: i * 3 })),
      filters,
    );
    const picked = pickRandom(recs, 3, () => 0.999);
    expect(picked?.restaurant.id).toBe(recs[2].restaurant.id);
  });
});
