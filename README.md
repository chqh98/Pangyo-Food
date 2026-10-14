# 판교 회식 추천 🍻

**쏠리드스페이스(경기 성남시 분당구 판교역로 220) 반경 1km** 안의 식당 가운데 회식 장소를 골라주는 웹사이트입니다.

## 기능

| 기능 | 설명 |
| --- | --- |
| 반경 1km 식당 전체 | 카카오 로컬 API로 반경 안 음식점(카페·간식 제외)을 모두 가져옴. 거리 슬라이더로 200m~1km 조절 |
| 리뷰 한 번에 보기 | 구글 평점·리뷰를 사이트 안에서 보여주고, 네이버·카카오 리뷰 페이지로 바로 연결 |
| 영업 상태 / 폐업 확인 | 구글 영업 상태 + 네이버·카카오 등록 여부를 합쳐 `영업중 / 휴업 / 폐업 / 확인 필요` 표시. 목록은 하루, 상세는 6시간마다 새로 조회 |
| 팀원 못 먹는 음식 제외 | 팀원별로 돼지고기·소고기·닭고기·양고기·해산물·날것·매운 음식·유제품·밀가루 선택 → 주메뉴에 해당하는 식당 제외 |
| 분위기·룸·주차·가격 표시 | 🔊 시끌벅적 / 🤫 조용한, 룸·주차 유무, 1인 가격, 최대 인원 |
| 조건 필터 | 인원, 1인 예산, 거리, 음식 종류, 분위기, 룸 필수, 주차 필수, 즐겨찾기 |
| 추천 점수 + 랜덤 | 거리·예산·분위기·단체 룸으로 점수를 매기고, 🎲 상위 5곳 중 하나 뽑기 |
| 지도 | 반경 1km 원과 식당 위치. 지도에서 점을 누르면 해당 식당으로 이동 |
| 팀 공유 | 🔗 버튼으로 조건과 팀원 설정이 담긴 링크 복사 |

## 데이터는 어디서 오나

- **식당 목록·주소·카테고리**: 카카오 로컬 API (`category_group_code=FD6`). 질의당 45건 제한이 있어 영역을 4등분하며 전부 수집합니다.
- **구글 평점·리뷰·영업 상태**: Google Places API (New) Text Search.
- **네이버**: 네이버 검색(지역) API로 등록 여부만 확인합니다.
- **분위기·룸·주차·가격·최대 인원**: 지도 API들이 제공하지 않는 정보라 **팀이 직접 `data/overrides.json`에 입력**합니다. 입력 전에는 `미확인`으로 표시되고, 분위기만 카테고리(술집·고기집 → 시끌벅적 등)로 `(추정)` 표시합니다.
- **못 먹는 음식 판단**: 카카오 카테고리와 가게 이름으로 주재료를 추정합니다(예: `회` → 해산물·날것). 틀리면 overrides의 `ingredients`로 바로잡으세요.

> ⚠️ **네이버·카카오 리뷰 본문은 가져오지 않습니다.** 두 회사 모두 리뷰를 공식 API로 제공하지 않고, 크롤링은 약관 위반이라 각 서비스의 장소 페이지로 연결합니다.

### 식당 정보 입력하기 (`data/overrides.json`)

카카오맵 장소 URL(`https://place.map.kakao.com/12345678`)의 숫자가 ID입니다. 가게 이름으로 써도 됩니다.

```json
{
  "places": {
    "12345678": { "mood": "조용한", "privateRoom": true, "parking": true, "pricePerPerson": 45000, "maxGroupSize": 20, "signature": "한우 등심", "notes": "룸 최대 12명" },
    "판교 보쌈집": { "mood": "시끌벅적", "privateRoom": false }
  }
}
```

## 실행

```bash
npm install
cp .env.example .env.local   # 키 입력 (없으면 예시 데이터로 동작)
npm run dev                  # http://localhost:3000
npm test                     # 단위 테스트
npm run build                # 프로덕션 빌드
```

## API 키 발급

| 키 | 필수 여부 | 발급처 |
| --- | --- | --- |
| `KAKAO_REST_API_KEY` | **필수** (없으면 예시 데이터) | [Kakao Developers](https://developers.kakao.com) → 앱 생성 → [앱] > [플랫폼 키] → REST API 키. 카카오맵 사용 설정 ON, 허용 IP는 비워두기 |
| `NEXT_PUBLIC_KAKAO_JS_KEY` | 선택 (지도 표시) | 같은 화면의 JavaScript 키. 키 항목의 "JavaScript SDK 도메인"에 사이트 주소 등록 |
| `NAVER_CLIENT_ID` / `NAVER_CLIENT_SECRET` | 선택 | [NAVER Developers](https://developers.naver.com) → 애플리케이션 등록 → 검색 API |
| `GOOGLE_PLACES_API_KEY` | 선택 | [Google Cloud Console](https://console.cloud.google.com) → Places API (New) 사용 설정 → API 키. 결제 계정 필요(유료 구간 있음) |

## 배포 (Vercel 권장)

1. [vercel.com](https://vercel.com)에서 이 GitHub 저장소를 Import
2. Settings → Environment Variables에 위 키들을 입력
3. Deploy → 발급된 `https://<프로젝트>.vercel.app` 주소를 팀에 공유
4. 카카오 JavaScript 키를 쓰면 Kakao Developers의 [앱] > [플랫폼 키] > JavaScript 키 > "JavaScript SDK 도메인"에 그 주소를 등록

## 구조

```
app/
  page.tsx                   메인 페이지
  api/restaurants/route.ts   반경 1km 식당 목록 (하루 캐시)
  api/places/[id]/route.ts   리뷰·영업 상태 조회 (6시간 캐시)
components/                  화면 컴포넌트 (필터, 팀원, 카드, 리뷰, 지도)
lib/
  kakao.ts / naver.ts / google.ts   외부 API
  classify.ts                카테고리 → 음식 종류·주재료·분위기 추정
  recommend.ts               필터링·점수
  status.ts                  영업 상태 판단
  config.ts                  기준 건물, 반경
data/overrides.json          팀이 확인한 식당 정보
```
