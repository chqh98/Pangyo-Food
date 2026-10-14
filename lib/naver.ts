import { DETAIL_REVALIDATE_SECONDS } from './config';
import { distanceMeters } from './geo';
import { naverMapUrl } from './links';

interface NaverItem {
  title: string;
  link: string;
  category: string;
  roadAddress: string;
  mapx: string;
  mapy: string;
}

export const naverConfigured = () => Boolean(process.env.NAVER_CLIENT_ID && process.env.NAVER_CLIENT_SECRET);

export const normalizeName = (s: string) =>
  s.replace(/<[^>]+>/g, '').replace(/[\s·.,()&\-_'"]/g, '').toLowerCase();

export function namesMatch(a: string, b: string): boolean {
  const x = normalizeName(a);
  const y = normalizeName(b);
  return x.length > 0 && y.length > 0 && (x.includes(y) || y.includes(x));
}


/** 네이버 지역 검색에 해당 가게가 아직 나오는지 확인 (리뷰는 공식 API로 제공되지 않음) */
/** 조회하지 않은(또는 실패한) 결과. configured=false라 영업 상태 판단에서 빠진다 */
export const uncheckedNaver = (name: string) => ({
  found: false,
  configured: false,
  category: null as string | null,
  url: naverMapUrl(name),
});

export async function lookupNaver(name: string, lat: number, lng: number) {
  const result = { ...uncheckedNaver(name), configured: naverConfigured() };
  if (!result.configured) return result;

  const qs = new URLSearchParams({ query: `판교 ${name}`, display: '5' });
  const res = await fetch(`https://openapi.naver.com/v1/search/local.json?${qs}`, {
    headers: {
      'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID!,
      'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET!,
    },
    next: { revalidate: DETAIL_REVALIDATE_SECONDS },
  });
  if (!res.ok) throw new Error(`Naver API ${res.status}`);
  const data: { items: NaverItem[] } = await res.json();

  const match = data.items.find((item) => {
    if (!namesMatch(item.title, name)) return false;
    // mapx/mapy: WGS84 좌표 x 10^7
    const iLng = Number(item.mapx) / 1e7;
    const iLat = Number(item.mapy) / 1e7;
    return !Number.isFinite(iLat) || iLat === 0 || distanceMeters(lat, lng, iLat, iLng) < 500;
  });
  if (match) {
    result.found = true;
    result.category = match.category;
  }
  return result;
}
