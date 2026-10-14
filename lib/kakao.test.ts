import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchKakaoRestaurants } from './kakao';
import { distanceMeters } from './geo';

const center = { lat: 37.4, lng: 127.11 };

// 반경 1km 안에 가짜 식당 200개 + 반경 밖 몇 개를 깔아두고, rect 질의를 흉내 낸다
const fake = Array.from({ length: 220 }, (_, i) => {
  const angle = i * 2.399;
  const r = (i < 200 ? Math.sqrt(i / 200) * 950 : 1300) / 111000;
  return {
    id: String(i), place_name: `식당${i}`, category_name: i % 50 === 0 ? '음식점 > 간식 > 제과,베이커리' : '음식점 > 한식',
    phone: '', address_name: '', road_address_name: '', place_url: '',
    y: String(center.lat + r * Math.sin(angle)), x: String(center.lng + (r * Math.cos(angle)) / Math.cos((center.lat * Math.PI) / 180)),
  };
});

afterEach(() => vi.unstubAllGlobals());

describe('fetchKakaoRestaurants', () => {
  it('45건 제한을 넘으면 영역을 나눠서 반경 안의 모든 식당을 모은다 (간식 카테고리 제외)', async () => {
    process.env.KAKAO_REST_API_KEY = 'test';
    let calls = 0;
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      calls++;
      const u = new URL(url);
      const [minX, minY, maxX, maxY] = u.searchParams.get('rect')!.split(',').map(Number);
      const page = Number(u.searchParams.get('page'));
      const inRect = fake.filter((d) => +d.x >= minX && +d.x < maxX && +d.y >= minY && +d.y < maxY);
      const docs = inRect.slice(0, 45).slice((page - 1) * 15, page * 15);
      return new Response(JSON.stringify({
        meta: { total_count: inRect.length, pageable_count: Math.min(45, inRect.length), is_end: page * 15 >= Math.min(45, inRect.length) },
        documents: docs,
      }));
    }));

    const result = await fetchKakaoRestaurants(center, 1000);
    const expected = fake.filter((d) =>
      distanceMeters(center.lat, center.lng, +d.y, +d.x) <= 1000 && !d.category_name.includes('간식'));
    expect(result.map((r) => r.id).sort()).toEqual(expected.map((d) => d.id).sort());
    expect(result.every((r, i) => i === 0 || result[i - 1].distance <= r.distance)).toBe(true);
    expect(calls).toBeGreaterThan(4);
  });
});
