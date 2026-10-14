export const CUISINES = ['한식', '고기', '해산물', '중식', '일식', '양식', '아시아', '주점', '기타'] as const;
export type Cuisine = (typeof CUISINES)[number];

/** 팀원이 못 먹는 음식 (식당 주재료와 비교해 제외) */
export const INGREDIENTS = [
  '돼지고기', '소고기', '닭고기', '양고기', '해산물', '날것(회·육회)', '매운 음식', '유제품', '밀가루',
] as const;
export type Ingredient = (typeof INGREDIENTS)[number];

export const MOODS = ['시끌벅적', '조용한'] as const;
export type Mood = (typeof MOODS)[number];

/** 값의 출처: 팀이 직접 확인(curated) / 카테고리로 추정(inferred) */
export type Provenance = 'curated' | 'inferred';

export interface Restaurant {
  /** 카카오 장소 ID */
  id: string;
  name: string;
  category: string;
  cuisine: Cuisine;
  address: string;
  phone: string;
  lat: number;
  lng: number;
  /** 기준 건물로부터의 직선거리 (m) */
  distance: number;
  kakaoUrl: string;
  ingredients: Ingredient[];
  mood: Mood | null;
  moodSource: Provenance | null;
  /** null = 정보 없음 */
  privateRoom: boolean | null;
  parking: boolean | null;
  pricePerPerson: number | null;
  maxGroupSize: number | null;
  signature: string | null;
  notes: string | null;
}

export interface TeamMember {
  name: string;
  cannotEat: Ingredient[];
}

export interface Filters {
  groupSize: number;
  /** 1인 예산 (원) */
  budget: number;
  maxDistance: number;
  cuisines: Cuisine[];
  mood: Mood | null;
  needPrivateRoom: boolean;
  needParking: boolean;
  /** 룸/주차/예산/인원/분위기 정보가 없는 곳도 보여줄지 */
  includeUnknown: boolean;
}

export interface Recommendation {
  restaurant: Restaurant;
  score: number;
  reasons: string[];
  /** 정보가 없어 확인이 필요한 항목 */
  unknowns: string[];
}

export type OperatingStatus = '영업중' | '휴업' | '폐업' | '확인 필요';

export interface GoogleReview {
  author: string;
  authorUri: string | null;
  rating: number;
  text: string;
  when: string;
}

export interface PlaceDetails {
  status: OperatingStatus;
  statusReasons: string[];
  google: {
    found: boolean;
    configured: boolean;
    rating: number | null;
    reviewCount: number | null;
    businessStatus: string | null;
    url: string;
    reviews: GoogleReview[];
  };
  naver: {
    found: boolean;
    configured: boolean;
    category: string | null;
    url: string;
  };
  kakao: {
    found: boolean;
    url: string;
  };
  checkedAt: string;
}

export interface RestaurantsResponse {
  origin: { name: string; address: string; lat: number; lng: number };
  radius: number;
  source: 'kakao' | 'demo';
  updatedAt: string;
  restaurants: Restaurant[];
}
