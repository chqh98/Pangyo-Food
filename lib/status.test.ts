import { describe, expect, it } from 'vitest';
import { resolveStatus, type StatusInput } from './status';

const ok: StatusInput = {
  kakaoFound: true, googleConfigured: true, googleFound: true, businessStatus: 'OPERATIONAL',
  naverConfigured: true, naverFound: true,
};

describe('resolveStatus', () => {
  it('모두 확인되면 영업중', () => {
    expect(resolveStatus(ok).status).toBe('영업중');
  });
  it('구글 폐업/휴업 표시가 우선', () => {
    expect(resolveStatus({ ...ok, businessStatus: 'CLOSED_PERMANENTLY' }).status).toBe('폐업');
    expect(resolveStatus({ ...ok, businessStatus: 'CLOSED_TEMPORARILY' }).status).toBe('휴업');
  });
  it('한 곳에서만 안 보이면 영업중, 두 곳 이상이면 확인 필요', () => {
    expect(resolveStatus({ ...ok, naverFound: false }).status).toBe('영업중');
    expect(resolveStatus({ ...ok, naverFound: false, googleFound: false, businessStatus: null }).status).toBe('확인 필요');
  });
  it('카카오 목록에서 사라지면 확인 필요', () => {
    expect(resolveStatus({ ...ok, kakaoFound: false }).status).toBe('확인 필요');
  });
  it('키가 없는 서비스는 판단에서 제외', () => {
    expect(resolveStatus({ ...ok, googleConfigured: false, googleFound: false, businessStatus: null, naverConfigured: false, naverFound: false }).status).toBe('영업중');
  });
});
