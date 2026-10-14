import type { Restaurant } from '../types';

// 샘플 데이터입니다. 실제 가게 정보가 아니므로 운영 전에 실제 데이터(직접 수집 또는 카카오/네이버 지역 검색 API)로 교체하세요.
export const restaurants: Restaurant[] = [
  { id: 'r01', name: '숯불명가 판교점', cuisine: '고기', area: '판교역', pricePerPerson: 45000, maxGroupSize: 40, hasPrivateRoom: true, parking: true, moods: ['활기참'], walkMinutes: 4, signature: '한우 등심', tags: ['단체석', '콜키지'] },
  { id: 'r02', name: '테크노 삼겹살', cuisine: '고기', area: '테크노밸리', pricePerPerson: 28000, maxGroupSize: 30, hasPrivateRoom: false, parking: false, moods: ['활기참'], walkMinutes: 12, signature: '숙성 삼겹살', tags: ['가성비', '단체석'] },
  { id: 'r03', name: '정원 한정식', cuisine: '한식', area: '서판교', pricePerPerson: 65000, maxGroupSize: 20, hasPrivateRoom: true, parking: true, moods: ['조용함', '고급'], walkMinutes: 20, signature: '계절 한정식 코스', tags: ['임원 회식', '룸'] },
  { id: 'r04', name: '판교 보쌈집', cuisine: '한식', area: '판교역', pricePerPerson: 25000, maxGroupSize: 25, hasPrivateRoom: false, parking: false, moods: ['활기참'], walkMinutes: 3, signature: '보쌈 + 막국수', tags: ['가성비'] },
  { id: 'r05', name: '홍등 중화요리', cuisine: '중식', area: '알파돔', pricePerPerson: 40000, maxGroupSize: 35, hasPrivateRoom: true, parking: true, moods: ['조용함'], walkMinutes: 5, signature: '코스 요리, 멘보샤', tags: ['원형 테이블', '룸'] },
  { id: 'r06', name: '마라 연구소', cuisine: '중식', area: '테크노밸리', pricePerPerson: 22000, maxGroupSize: 16, hasPrivateRoom: false, parking: false, moods: ['활기참'], walkMinutes: 10, signature: '마라샹궈', tags: ['가성비', '젊은 팀'] },
  { id: 'r07', name: '스시 하나', cuisine: '일식', area: '아브뉴프랑', pricePerPerson: 80000, maxGroupSize: 10, hasPrivateRoom: true, parking: true, moods: ['조용함', '고급'], walkMinutes: 6, signature: '오마카세', tags: ['소규모', '룸'] },
  { id: 'r08', name: '이자카야 판교', cuisine: '주점', area: '판교역', pricePerPerson: 35000, maxGroupSize: 24, hasPrivateRoom: true, parking: false, moods: ['활기참'], walkMinutes: 2, signature: '꼬치 모둠, 하이볼', tags: ['2차', '룸'] },
  { id: 'r09', name: '라 테라스', cuisine: '양식', area: '아브뉴프랑', pricePerPerson: 50000, maxGroupSize: 30, hasPrivateRoom: true, parking: true, moods: ['조용함', '고급'], walkMinutes: 7, signature: '스테이크 & 와인', tags: ['대관 가능', '룸'] },
  { id: 'r10', name: '브루펍 밸리', cuisine: '주점', area: '테크노밸리', pricePerPerson: 30000, maxGroupSize: 60, hasPrivateRoom: false, parking: true, moods: ['활기참'], walkMinutes: 11, signature: '수제맥주 + 피자', tags: ['대관 가능', '대규모'] },
  { id: 'r11', name: '바다횟집', cuisine: '해산물', area: '서판교', pricePerPerson: 55000, maxGroupSize: 30, hasPrivateRoom: true, parking: true, moods: ['조용함'], walkMinutes: 18, signature: '모둠회, 대게', tags: ['룸', '주차 편함'] },
  { id: 'r12', name: '조개구이 포차', cuisine: '해산물', area: '판교역', pricePerPerson: 33000, maxGroupSize: 20, hasPrivateRoom: false, parking: false, moods: ['활기참'], walkMinutes: 5, signature: '조개구이', tags: ['2차'] },
  { id: 'r13', name: '한우 오마카세 결', cuisine: '고기', area: '알파돔', pricePerPerson: 95000, maxGroupSize: 12, hasPrivateRoom: true, parking: true, moods: ['조용함', '고급'], walkMinutes: 4, signature: '한우 오마카세', tags: ['임원 회식', '룸'] },
  { id: 'r14', name: '돈카츠 공방', cuisine: '일식', area: '테크노밸리', pricePerPerson: 18000, maxGroupSize: 14, hasPrivateRoom: false, parking: false, moods: ['조용함'], walkMinutes: 9, signature: '로스카츠', tags: ['점심 회식', '가성비'] },
  { id: 'r15', name: '파스타 키친', cuisine: '양식', area: '판교역', pricePerPerson: 32000, maxGroupSize: 22, hasPrivateRoom: false, parking: false, moods: ['조용함'], walkMinutes: 3, signature: '트러플 파스타', tags: ['점심 회식'] },
  { id: 'r16', name: '감자탕 본가', cuisine: '한식', area: '테크노밸리', pricePerPerson: 20000, maxGroupSize: 50, hasPrivateRoom: false, parking: true, moods: ['활기참'], walkMinutes: 13, signature: '감자탕, 볶음밥', tags: ['가성비', '대규모'] },
];
