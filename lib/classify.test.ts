import { describe, expect, it } from 'vitest';
import { classifyCuisine, inferIngredients, inferMood } from './classify';

describe('classifyCuisine', () => {
  it.each([
    ['음식점 > 한식 > 육류,고기 > 삼겹살', '고기'],
    ['음식점 > 한식 > 해물,생선 > 회', '해산물'],
    ['음식점 > 일식 > 초밥,롤', '일식'],
    ['음식점 > 술집 > 일본식주점', '주점'],
    ['음식점 > 중식 > 중국요리', '중식'],
    ['음식점 > 양식 > 이탈리안', '양식'],
    ['음식점 > 아시아음식 > 베트남음식', '아시아'],
    ['음식점 > 한식 > 감자탕', '한식'],
    ['음식점 > 뷔페', '기타'],
  ])('%s → %s', (category, expected) => {
    expect(classifyCuisine(category)).toBe(expected);
  });
});

describe('inferIngredients', () => {
  it('회 → 해산물 + 날것', () => {
    expect(inferIngredients('음식점 > 한식 > 해물,생선 > 회')).toEqual(expect.arrayContaining(['해산물', '날것(회·육회)']));
  });
  it('회가 다른 단어 일부면 매칭하지 않음 (회관, 회식)', () => {
    expect(inferIngredients('음식점 > 한식', '삼평회관')).not.toContain('해산물');
  });
  it('삼겹살 → 돼지고기, 갈비 → 돼지+소', () => {
    expect(inferIngredients('음식점 > 한식 > 육류,고기 > 삼겹살')).toEqual(['돼지고기']);
    expect(inferIngredients('음식점 > 한식 > 육류,고기 > 갈비')).toEqual(expect.arrayContaining(['돼지고기', '소고기']));
  });
  it('가게 이름도 참고 (마라)', () => {
    expect(inferIngredients('음식점 > 중식', '마라 연구소')).toContain('매운 음식');
  });
});

describe('inferMood', () => {
  it('술집/고기집은 시끌벅적, 한정식은 조용한, 나머지는 모름', () => {
    expect(inferMood('음식점 > 술집 > 호프,요리주점')).toBe('시끌벅적');
    expect(inferMood('음식점 > 한식 > 육류,고기 > 삼겹살')).toBe('시끌벅적');
    expect(inferMood('음식점 > 한식 > 한정식')).toBe('조용한');
    expect(inferMood('음식점 > 중식 > 중국요리')).toBeNull();
  });
});
