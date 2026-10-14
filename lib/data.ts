import { ORIGIN, RADIUS_METERS } from './config';
import { demoOverrides, demoPlaces } from './demo';
import { fetchKakaoRestaurants, kakaoKey, resolveOrigin } from './kakao';
import { buildRestaurant } from './overrides';
import type { RestaurantsResponse } from './types';

export async function getRestaurants(): Promise<RestaurantsResponse> {
  const updatedAt = new Date().toISOString();
  if (!kakaoKey()) {
    const center = { lat: ORIGIN.lat, lng: ORIGIN.lng };
    return {
      origin: { ...ORIGIN, ...center },
      radius: RADIUS_METERS,
      source: 'demo',
      updatedAt,
      restaurants: demoPlaces(center).map((p) => buildRestaurant(p, demoOverrides)),
    };
  }
  const center = await resolveOrigin();
  const places = await fetchKakaoRestaurants(center, RADIUS_METERS);
  return {
    origin: { ...ORIGIN, ...center },
    radius: RADIUS_METERS,
    source: 'kakao',
    updatedAt,
    restaurants: places.map((p) => buildRestaurant(p)),
  };
}
