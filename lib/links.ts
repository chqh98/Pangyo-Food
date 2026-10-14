// 브라우저에서도 쓰는 지도 링크 생성 함수
export const naverMapUrl = (name: string) => `https://map.naver.com/p/search/${encodeURIComponent(`판교 ${name}`)}`;

export const googleSearchUrl = (name: string, lat: number, lng: number) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}%20${lat.toFixed(6)},${lng.toFixed(6)}`;
