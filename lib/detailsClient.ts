import type { PlaceDetails } from './types';

const cache = new Map<string, Promise<PlaceDetails>>();

/** 같은 식당의 리뷰·영업상태 조회를 한 번만 하도록 공유한다 (실패하면 다음에 다시 시도) */
export function fetchPlaceDetails(id: string): Promise<PlaceDetails> {
  let p = cache.get(id);
  if (!p) {
    p = fetch(`/api/places/${encodeURIComponent(id)}`).then(async (res) => {
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? '조회 실패');
      return body as PlaceDetails;
    });
    p.catch(() => cache.delete(id));
    cache.set(id, p);
  }
  return p;
}
