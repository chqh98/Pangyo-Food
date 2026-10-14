export const CUISINES = ['한식', '고기', '중식', '일식', '양식', '해산물', '주점'] as const;
export const AREAS = ['판교역', '테크노밸리', '아브뉴프랑', '알파돔', '서판교'] as const;
export const MOODS = ['조용함', '활기참', '고급'] as const;

export type Cuisine = (typeof CUISINES)[number];
export type Area = (typeof AREAS)[number];
export type Mood = (typeof MOODS)[number];

export interface Restaurant {
  id: string;
  name: string;
  cuisine: Cuisine;
  area: Area;
  /** 1인 예상 비용 (원, 주류 포함) */
  pricePerPerson: number;
  /** 한 번에 받을 수 있는 최대 단체 인원 */
  maxGroupSize: number;
  hasPrivateRoom: boolean;
  parking: boolean;
  moods: Mood[];
  /** 판교역에서 도보 시간 (분) */
  walkMinutes: number;
  signature: string;
  tags: string[];
}

export interface Filters {
  groupSize: number;
  /** 1인 예산 (원) */
  budget: number;
  cuisines: Cuisine[];
  areas: Area[];
  mood: Mood | null;
  needPrivateRoom: boolean;
  needParking: boolean;
}

export interface Recommendation {
  restaurant: Restaurant;
  score: number;
  reasons: string[];
}
