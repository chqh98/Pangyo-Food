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
          return { ...uncheckedGoogle(name, place.lat, place.lng), error: explainGoogleError(e) };
        }),
    isDemo
      ? uncheckedNaver(name)
      : lookupNaver(name, place.lat, place.lng).catch((e) => {
          console.error(e);
          return { ...uncheckedNaver(name), error: explainNaverError(e) };
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

/** 자주 나오는 설정 오류를 화면에서 바로 알 수 있게 풀어서 보여준다 */
function explainGoogleError(e: unknown): string {
  const msg = String(e instanceof Error ? e.message : e);
  if (/BILLING|billing/.test(msg)) return '구글 클라우드 프로젝트에 결제 계정이 연결되지 않았어요.';
  if (/SERVICE_DISABLED|has not been used|is disabled/.test(msg)) return '"Places API (New)"가 사용 설정되지 않았어요.';
  if (/API_KEY_INVALID|API key not valid/.test(msg)) return '구글 API 키가 올바르지 않아요. Vercel 환경 변수 값을 확인하세요.';
  if (/API_KEY_SERVICE_BLOCKED|referer|IP address/i.test(msg)) return 'API 키 제한 설정 때문에 막혔어요. 애플리케이션 제한사항은 "없음", API 제한사항은 "Places API (New)"로 설정하세요.';
  if (/429|RESOURCE_EXHAUSTED/.test(msg)) return '구글 하루 할당량을 다 썼어요. 내일 다시 시도하거나 할당량을 늘리세요.';
  return `구글 조회 실패: ${msg.slice(0, 160)}`;
}

function explainNaverError(e: unknown): string {
  const msg = String(e instanceof Error ? e.message : e);
  if (msg.includes('401')) return '네이버 Client ID/Secret이 올바르지 않아요.';
  if (msg.includes('403')) return '네이버 애플리케이션에 "검색" API가 추가되지 않았어요.';
  if (msg.includes('429')) return '네이버 하루 호출 한도를 넘었어요.';
  return `네이버 조회 실패: ${msg.slice(0, 160)}`;
}
