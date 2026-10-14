export const ORIGIN = {
  name: '쏠리드스페이스',
  address: '경기 성남시 분당구 판교역로 220',
  // 대략적인 좌표. 카카오 키가 있으면 주소 검색으로 정확한 좌표를 받아 덮어쓴다.
  lat: 37.4007,
  lng: 127.1106,
};

export const RADIUS_METERS = 1000;

/** 회식 장소로 부적합한 카카오 카테고리 (간식·카페 등) */
export const EXCLUDED_CATEGORY_KEYWORDS = ['간식', '카페', '제과', '베이커리', '아이스크림', '도시락', '패스트푸드', '샌드위치', '떡'];

/** 데이터 갱신 주기(초): 폐업 반영을 위해 하루 한 번 다시 가져온다 */
export const LIST_REVALIDATE_SECONDS = 60 * 60 * 24;
export const DETAIL_REVALIDATE_SECONDS = 60 * 60 * 6;
