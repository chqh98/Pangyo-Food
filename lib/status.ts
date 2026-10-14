import type { OperatingStatus } from './types';

export interface StatusInput {
  kakaoFound: boolean;
  googleConfigured: boolean;
  googleFound: boolean;
  businessStatus: string | null;
  naverConfigured: boolean;
  naverFound: boolean;
}

/** 세 지도 서비스의 결과를 합쳐 영업 상태를 판단한다 */
export function resolveStatus(s: StatusInput): { status: OperatingStatus; reasons: string[] } {
  const reasons: string[] = [];

  if (s.businessStatus === 'CLOSED_PERMANENTLY') return { status: '폐업', reasons: ['구글 지도에 폐업으로 표시됨'] };
  if (s.businessStatus === 'CLOSED_TEMPORARILY') return { status: '휴업', reasons: ['구글 지도에 임시 휴업으로 표시됨'] };

  if (!s.kakaoFound) reasons.push('카카오맵 목록에서 사라짐');
  if (s.googleConfigured && !s.googleFound) reasons.push('구글 지도에서 찾지 못함');
  if (s.naverConfigured && !s.naverFound) reasons.push('네이버 지도에서 찾지 못함');

  const checked = 1 + Number(s.googleConfigured) + Number(s.naverConfigured);
  const missing = reasons.length;
  // 카카오에서 사라졌거나, 확인 가능한 곳 절반 이상에서 안 나오면 확인 필요
  if (!s.kakaoFound || missing * 2 >= checked + 1) return { status: '확인 필요', reasons };

  if (s.businessStatus === 'OPERATIONAL') reasons.unshift('구글 지도: 영업 중');
  if (s.naverFound) reasons.unshift('네이버 지도에 등록됨');
  reasons.unshift('카카오맵에 등록됨');
  return { status: '영업중', reasons };
}
