import { EXCLUDED_CATEGORY_KEYWORDS, LIST_REVALIDATE_SECONDS, ORIGIN } from './config';
import { boundingRect, distanceMeters, splitRect, type Rect } from './geo';
import type { BasePlace } from './overrides';

interface KakaoDoc {
  id: string;
  place_name: string;
  category_name: string;
  phone: string;
  address_name: string;
  road_address_name: string;
  x: string;
  y: string;
  place_url: string;
}

interface KakaoResponse<T> {
  meta: { total_count: number; pageable_count: number; is_end: boolean };
  documents: T[];
}

const PAGE_SIZE = 15;
const MAX_PAGEABLE = 45; // 카카오 로컬 API는 질의당 최대 45건까지만 넘겨준다
const MAX_DEPTH = 6;

export const kakaoKey = () => process.env.KAKAO_REST_API_KEY;

async function kakaoGet<T>(path: string, params: Record<string, string | number>): Promise<KakaoResponse<T>> {
  const qs = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]));
  const res = await fetch(`https://dapi.kakao.com${path}?${qs}`, {
    headers: { Authorization: `KakaoAK ${kakaoKey()}` },
    next: { revalidate: LIST_REVALIDATE_SECONDS },
  });
  if (!res.ok) throw new Error(`Kakao API ${res.status}: ${await res.text()}`);
  return res.json();
}

/** 주소로 기준 건물 좌표를 구한다. 실패하면 config의 대략 좌표를 쓴다. */
export async function resolveOrigin(): Promise<{ lat: number; lng: number }> {
  try {
    const data = await kakaoGet<{ x: string; y: string }>('/v2/local/search/address.json', { query: ORIGIN.address });
    const doc = data.documents[0];
    if (doc) return { lat: Number(doc.y), lng: Number(doc.x) };
  } catch (e) {
    console.warn('기준 주소 좌표 조회 실패, 기본 좌표 사용', e);
  }
  return { lat: ORIGIN.lat, lng: ORIGIN.lng };
}

function rectIntersectsCircle(r: Rect, lat: number, lng: number, radius: number): boolean {
  const cLat = Math.min(Math.max(lat, r.minLat), r.maxLat);
  const cLng = Math.min(Math.max(lng, r.minLng), r.maxLng);
  return distanceMeters(lat, lng, cLat, cLng) <= radius;
}

const rectParam = (r: Rect) => `${r.minLng},${r.minLat},${r.maxLng},${r.maxLat}`;

async function collectRect(r: Rect, depth: number, out: Map<string, KakaoDoc>, center: { lat: number; lng: number }, radius: number) {
  if (!rectIntersectsCircle(r, center.lat, center.lng, radius)) return;
  const base = { category_group_code: 'FD6', rect: rectParam(r), size: PAGE_SIZE };
  const first = await kakaoGet<KakaoDoc>('/v2/local/search/category.json', { ...base, page: 1 });

  // 결과가 45건을 넘으면 다 받을 수 없으므로 영역을 4등분해서 다시 조회
  if (first.meta.total_count > MAX_PAGEABLE && depth < MAX_DEPTH) {
    for (const child of splitRect(r)) await collectRect(child, depth + 1, out, center, radius);
    return;
  }
  first.documents.forEach((d) => out.set(d.id, d));
  let meta = first.meta;
  for (let page = 2; !meta.is_end && page <= MAX_PAGEABLE / PAGE_SIZE; page++) {
    const next = await kakaoGet<KakaoDoc>('/v2/local/search/category.json', { ...base, page });
    next.documents.forEach((d) => out.set(d.id, d));
    meta = next.meta;
  }
}

/** 반경 안의 모든 음식점(카카오 FD6 카테고리)을 가져온다 */
export async function fetchKakaoRestaurants(center: { lat: number; lng: number }, radius: number): Promise<BasePlace[]> {
  const docs = new Map<string, KakaoDoc>();
  await collectRect(boundingRect(center.lat, center.lng, radius), 0, docs, center, radius);

  return [...docs.values()]
    .map((d) => {
      const lat = Number(d.y);
      const lng = Number(d.x);
      return {
        id: d.id,
        name: d.place_name,
        category: d.category_name,
        address: d.road_address_name || d.address_name,
        phone: d.phone,
        lat,
        lng,
        distance: Math.round(distanceMeters(center.lat, center.lng, lat, lng)),
        kakaoUrl: d.place_url,
      };
    })
    .filter((p) => p.distance <= radius)
    .filter((p) => !EXCLUDED_CATEGORY_KEYWORDS.some((k) => p.category.includes(k)))
    .sort((a, b) => a.distance - b.distance);
}
