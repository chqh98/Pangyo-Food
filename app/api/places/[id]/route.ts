import { NextResponse, type NextRequest } from 'next/server';
import { getRestaurants } from '@/lib/data';
import { lookupGoogle, uncheckedGoogle } from '@/lib/google';
import { lookupNaver, uncheckedNaver } from '@/lib/naver';
import { resolveStatus } from '@/lib/status';
import type { PlaceDetails } from '@/lib/types';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const list = await getRestaurants().catch(() => null);
  const place = list?.restaurants.find((r) => r.id === id);
  if (!place) {
    return NextResponse.json({ error: '카카오맵 목록에 없는 식당입니다 (폐업 또는 이전 가능성).' }, { status: 404 });
  }

  // 데모 데이터는 실제 가게가 아니므로 외부 조회를 하지 않는다
  const isDemo = list?.source === 'demo';
  const name = place.name;
  const [google, naver] = await Promise.all([
    isDemo
      ? uncheckedGoogle(name, place.lat, place.lng)
      : lookupGoogle(name, place.lat, place.lng).catch((e) => {
          console.error(e);
          return uncheckedGoogle(name, place.lat, place.lng);
        }),
    isDemo
      ? uncheckedNaver(name)
      : lookupNaver(name, place.lat, place.lng).catch((e) => {
          console.error(e);
          return uncheckedNaver(name);
        }),
  ]);

  const { status, reasons } = isDemo ? { status: '확인 필요' as const, reasons: ['예시 데이터라 실제 영업 상태를 확인하지 않음'] } : resolveStatus({
    kakaoFound: true,
    googleConfigured: google.configured,
    googleFound: google.found,
    businessStatus: google.businessStatus,
    naverConfigured: naver.configured,
    naverFound: naver.found,
  });

  const body: PlaceDetails = {
    status,
    statusReasons: reasons,
    google,
    naver,
    kakao: { found: true, url: place.kakaoUrl },
    checkedAt: new Date().toISOString(),
  };
  return NextResponse.json(body, {
    headers: { 'Cache-Control': 's-maxage=21600, stale-while-revalidate=86400' },
  });
}
