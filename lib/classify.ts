import type { Cuisine, Ingredient, Mood } from './types';

// 카카오 카테고리 예: "음식점 > 한식 > 육류,고기 > 삼겹살"
const CUISINE_RULES: [RegExp, Cuisine][] = [
  [/술집|호프|주점|포차|이자카야|와인바|(?<![가-힣])바(?![가-힣])|맥주/, '주점'],
  [/육류|고기|갈비|삼겹|곱창|막창|한우|정육|양꼬치|스테이크하우스/, '고기'],
  [/해물|생선|(?<![가-힣])회(?![가-힣])|횟집|조개|대게|장어|아구|복어/, '해산물'],
  [/중식|중국|마라|훠궈|양꼬치/, '중식'],
  [/일식|초밥|스시|돈까스|우동|라멘|오마카세|이자카야/, '일식'],
  [/양식|이탈리안|프랑스|스테이크|피자|파스타|햄버거|멕시칸/, '양식'],
  [/아시아|베트남|태국|인도|쌀국수/, '아시아'],
  [/한식|국밥|찌개|해장국|감자탕|냉면|족발|보쌈|닭갈비|백반|칼국수|순대/, '한식'],
];

const INGREDIENT_RULES: [RegExp, Ingredient[]][] = [
  [/삼겹|돼지|족발|보쌈|감자탕|순대|돈까스|돈카츠|돼지국밥|두루치기/, ['돼지고기']],
  [/한우|소고기|우육|스테이크|샤브|곱창|막창|소갈비|육회/, ['소고기']],
  [/갈비/, ['돼지고기', '소고기']],
  [/치킨|닭|삼계탕/, ['닭고기']],
  [/양꼬치|양고기|램/, ['양고기']],
  [/해물|생선|(?<![가-힣])회(?![가-힣])|횟집|초밥|스시|조개|(?<![가-힣])게(?![가-힣])|대게|장어|아구|낙지|오징어|굴|복어|해산물|오마카세|쭈꾸미|주꾸미/, ['해산물']],
  [/(?<![가-힣])회(?![가-힣])|횟집|초밥|스시|육회|오마카세/, ['날것(회·육회)']],
  [/마라|훠궈|매운|떡볶이|짬뽕|낙지|닭발|쭈꾸미|주꾸미|불닭/, ['매운 음식']],
  [/피자|파스타|이탈리안|치즈/, ['유제품', '밀가루']],
  [/칼국수|우동|라멘|국수|만두|햄버거/, ['밀가루']],
];

export function classifyCuisine(category: string, name = ''): Cuisine {
  const text = `${category} ${name}`;
  for (const [re, cuisine] of CUISINE_RULES) if (re.test(text)) return cuisine;
  return '기타';
}

export function inferIngredients(category: string, name = ''): Ingredient[] {
  const text = `${category} ${name}`;
  const found = new Set<Ingredient>();
  for (const [re, items] of INGREDIENT_RULES) if (re.test(text)) items.forEach((i) => found.add(i));
  return [...found];
}

/** 카테고리만으로 추정 가능한 분위기. 확실하지 않으면 null */
export function inferMood(category: string): Mood | null {
  if (/술집|호프|포차|요리주점|맥주/.test(category)) return '시끌벅적';
  if (/육류,고기|삼겹|곱창|막창/.test(category)) return '시끌벅적';
  if (/오마카세|한정식|파인다이닝/.test(category)) return '조용한';
  return null;
}
