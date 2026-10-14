import { NextResponse } from 'next/server';
import { getRestaurants } from '@/lib/data';

export const revalidate = 86400;

export async function GET() {
  try {
    const data = await getRestaurants();
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400' },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: explainError(e) }, { status: 502 });
  }
}

/** 자주 나오는 카카오 설정 오류를 화면에서 바로 알 수 있게 풀어서 보여준다 */
function explainError(e: unknown): string {
  const msg = String(e instanceof Error ? e.message : e);
  if (msg.includes('OPEN_MAP_AND_LOCAL')) {
    return '카카오맵 사용 설정이 꺼져 있어요. Kakao Developers → 내 앱 → 카카오맵 → 사용 설정 ON 후 새로고침하세요.';
  }
  if (/ip mismatch/i.test(msg)) {
    return '카카오 REST API 키에 허용 IP가 설정돼 있어요. [플랫폼 키] → REST API 키의 허용 IP를 비워주세요.';
  }
  if (msg.includes('Kakao API 401')) return '카카오 REST API 키가 올바르지 않아요. Vercel 환경 변수 값을 확인하세요.';
  if (msg.includes('Kakao API 403')) return `카카오 API 권한 오류예요: ${msg.slice(0, 200)}`;
  return '식당 목록을 가져오지 못했습니다.';
}
