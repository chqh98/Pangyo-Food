import { distanceMeters } from './geo';
import type { BasePlace } from './overrides';
import type { PlaceOverride } from './overrides';

// API 키가 없을 때 화면을 확인하기 위한 가상의 데이터. 실제 가게가 아니다.
const raw: [string, string, number, number, PlaceOverride][] = [
  ['숯불명가', '음식점 > 한식 > 육류,고기 > 갈비', 0.0018, -0.0012, { privateRoom: true, parking: true, pricePerPerson: 45000, maxGroupSize: 40, signature: '한우 등심' }],
  ['테크노 삼겹살', '음식점 > 한식 > 육류,고기 > 삼겹살', -0.0031, 0.0041, { privateRoom: false, parking: false, pricePerPerson: 28000, maxGroupSize: 30, signature: '숙성 삼겹살' }],
  ['정원 한정식', '음식점 > 한식 > 한정식', 0.0062, -0.0048, { mood: '조용한', privateRoom: true, parking: true, pricePerPerson: 65000, maxGroupSize: 20, signature: '계절 한정식 코스' }],
  ['판교 보쌈집', '음식점 > 한식 > 족발,보쌈', -0.0042, -0.0011, { mood: '시끌벅적', privateRoom: false, pricePerPerson: 25000, maxGroupSize: 25, signature: '보쌈 + 막국수' }],
  ['홍등 중화요리', '음식점 > 중식 > 중국요리', 0.0011, 0.0029, { mood: '조용한', privateRoom: true, parking: true, pricePerPerson: 40000, maxGroupSize: 35, signature: '코스 요리' }],
  ['마라 연구소', '음식점 > 중식 > 중국요리 > 마라탕', -0.0021, 0.0063, { mood: '시끌벅적', pricePerPerson: 22000, maxGroupSize: 16 }],
  ['스시 하나', '음식점 > 일식 > 초밥,롤', 0.0035, 0.0012, { mood: '조용한', privateRoom: true, pricePerPerson: 80000, maxGroupSize: 10, signature: '오마카세' }],
  ['이자카야 판교', '음식점 > 술집 > 일본식주점', -0.0012, -0.0024, { privateRoom: true, parking: false, pricePerPerson: 35000, maxGroupSize: 24 }],
  ['라 테라스', '음식점 > 양식 > 이탈리안', 0.0049, 0.0052, { mood: '조용한', privateRoom: true, parking: true, pricePerPerson: 50000, maxGroupSize: 30 }],
  ['브루펍 밸리', '음식점 > 술집 > 호프,요리주점', -0.0058, 0.0021, { parking: true, pricePerPerson: 30000, maxGroupSize: 60 }],
  ['바다횟집', '음식점 > 한식 > 해물,생선 > 회', 0.0071, 0.0034, { privateRoom: true, parking: true, pricePerPerson: 55000, maxGroupSize: 30 }],
  ['감자탕 본가', '음식점 > 한식 > 감자탕', -0.0068, -0.0039, {}],
  ['포 사이공', '음식점 > 아시아음식 > 베트남음식', 0.0024, -0.0071, { mood: '조용한', pricePerPerson: 18000, maxGroupSize: 12 }],
  ['닭갈비 하우스', '음식점 > 한식 > 닭요리 > 닭갈비', -0.0007, 0.0089, {}],
];

export const demoOverrides: Record<string, PlaceOverride> = Object.fromEntries(raw.map(([, , , , o], i) => [`demo-${i}`, o]));

export function demoPlaces(center: { lat: number; lng: number }): BasePlace[] {
  return raw
    .map(([name, category, dLat, dLng], i) => {
      const lat = center.lat + dLat;
      const lng = center.lng + dLng;
      return {
        id: `demo-${i}`,
        name: `[예시] ${name}`,
        category,
        address: '경기 성남시 분당구 (가상 주소)',
        phone: '',
        lat,
        lng,
        distance: Math.round(distanceMeters(center.lat, center.lng, lat, lng)),
        kakaoUrl: `https://map.kakao.com/?q=${encodeURIComponent(`판교 ${name}`)}`,
      };
    })
    .sort((a, b) => a.distance - b.distance);
}
