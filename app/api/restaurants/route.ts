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
    return NextResponse.json({ error: '식당 목록을 가져오지 못했습니다.' }, { status: 502 });
  }
}
