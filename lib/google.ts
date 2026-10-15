import { DETAIL_REVALIDATE_SECONDS } from './config';
import { distanceMeters } from './geo';
import { googleSearchUrl } from './links';
import { namesMatch } from './naver';
import type { GoogleReview } from './types';

interface GooglePlace {
  id: string;
  displayName?: { text: string };
  rating?: number;
  userRatingCount?: number;
  businessStatus?: string;
  googleMapsUri?: string;
  location?: { latitude: number; longitude: number };
  photos?: { name: string; authorAttributions?: { displayName?: string; uri?: string }[] }[];
  reviews?: {
    rating: number;
    text?: { text: string };
    originalText?: { text: string };
    relativePublishTimeDescription?: string;
    authorAttribution?: { displayName?: string; uri?: string };
  }[];
}

const FIELD_MASK = [
  'places.id', 'places.displayName', 'places.rating', 'places.userRatingCount',
  'places.businessStatus', 'places.googleMapsUri', 'places.location', 'places.reviews', 'places.photos',
].join(',');

/** 사진 리소스 이름 → 키 없이 열 수 있는 이미지 URL (실패하면 null) */
async function fetchPhotoUrl(photoName: string): Promise<string | null> {
  try {
    const qs = new URLSearchParams({ maxWidthPx: '400', skipHttpRedirect: 'true', key: process.env.GOOGLE_PLACES_API_KEY! });
    const res = await fetch(`https://places.googleapis.com/v1/${photoName}/media?${qs}`, {
      next: { revalidate: DETAIL_REVALIDATE_SECONDS },
    });
    if (!res.ok) return null;
    const data: { photoUri?: string } = await res.json();
    return data.photoUri ?? null;
  } catch {
    return null;
  }
}

export const googleConfigured = () => Boolean(process.env.GOOGLE_PLACES_API_KEY);


/** 구글 Places API(New)로 평점·리뷰·영업 상태를 가져온다 */
/** 조회하지 않은(또는 실패한) 결과. configured=false라 영업 상태 판단에서 빠진다 */
export const uncheckedGoogle = (name: string, lat: number, lng: number) => ({
  found: false,
  configured: false,
  rating: null as number | null,
  reviewCount: null as number | null,
  businessStatus: null as string | null,
  url: googleSearchUrl(name, lat, lng),
  reviews: [] as GoogleReview[],
  photoUrl: null as string | null,
  photoAuthor: null as string | null,
});

export async function lookupGoogle(name: string, lat: number, lng: number) {
  const result = { ...uncheckedGoogle(name, lat, lng), configured: googleConfigured() };
  if (!result.configured) return result;

  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY!,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify({
      textQuery: name,
      languageCode: 'ko',
      regionCode: 'KR',
      pageSize: 5,
      locationBias: { circle: { center: { latitude: lat, longitude: lng }, radius: 300 } },
    }),
    next: { revalidate: DETAIL_REVALIDATE_SECONDS },
  });
  if (!res.ok) throw new Error(`Google Places API ${res.status}: ${await res.text()}`);
  const data: { places?: GooglePlace[] } = await res.json();

  // 이름이 비슷하고 300m 이내이거나, 이름이 달라도 40m 이내(표기 차이)면 같은 가게로 본다
  const place = (data.places ?? []).find((p) => {
    if (!p.location) return false;
    const d = distanceMeters(lat, lng, p.location.latitude, p.location.longitude);
    return d < 40 || (d < 300 && namesMatch(p.displayName?.text ?? '', name));
  });
  if (!place) return result;

  const photo = place.photos?.[0];
  const photoUrl = photo ? await fetchPhotoUrl(photo.name) : null;

  return {
    ...result,
    photoUrl,
    photoAuthor: photoUrl ? photo?.authorAttributions?.[0]?.displayName ?? null : null,
    found: true,
    rating: place.rating ?? null,
    reviewCount: place.userRatingCount ?? null,
    businessStatus: place.businessStatus ?? null,
    url: place.googleMapsUri ?? result.url,
    reviews: (place.reviews ?? []).map((r) => ({
      author: r.authorAttribution?.displayName ?? '익명',
      authorUri: r.authorAttribution?.uri ?? null,
      rating: r.rating,
      text: r.text?.text ?? r.originalText?.text ?? '',
      when: r.relativePublishTimeDescription ?? '',
    })),
  };
}
