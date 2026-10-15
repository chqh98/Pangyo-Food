import { walkMinutes } from '@/lib/geo';
import { googleSearchUrl, naverMapUrl } from '@/lib/links';
import type { PlaceDetails, Restaurant } from '@/lib/types';

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const stars = (n: number) => '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n));

const STATUS_CLASS: Record<PlaceDetails['status'], string> = {
  '영업중': 'yes', '휴업': 'warn', '폐업': 'no', '확인 필요': 'warn',
};

export const kakaoRouteUrl = (r: Restaurant) =>
  `https://map.kakao.com/link/to/${encodeURIComponent(r.name)},${r.lat},${r.lng}`;

function ratingHtml(d: PlaceDetails | null | 'loading' | 'error'): string {
  if (d === 'loading') return '<span class="pop-muted">평점 불러오는 중…</span>';
  if (d === 'error' || d === null) return '';
  const status = `<span class="pop-status ${STATUS_CLASS[d.status]}">${esc(d.status)}</span>`;
  if (d.google.rating === null) return status;
  return `<span class="pop-score">${d.google.rating.toFixed(1)}</span>`
    + `<span class="pop-stars">${stars(d.google.rating)}</span>`
    + `<span class="pop-muted">(${(d.google.reviewCount ?? 0).toLocaleString('ko-KR')}건 · 구글)</span>${status}`;
}

/** 카카오맵 장소 말풍선처럼 생긴 정보 창 */
export function buildPopup(
  r: Restaurant,
  details: PlaceDetails | null | 'loading' | 'error',
  handlers: { onClose: () => void; onShowInList: () => void },
): HTMLElement {
  const el = document.createElement('div');
  el.className = 'pop';
  const category = r.category.split('>').slice(1).map((s) => s.trim()).join(' · ') || r.cuisine;
  const badges = [
    r.mood && `${r.mood === '시끌벅적' ? '🔊' : '🤫'} ${r.mood}${r.moodSource === 'inferred' ? '(추정)' : ''}`,
    r.privateRoom !== null && (r.privateRoom ? '🚪 룸 있음' : '🚪 룸 없음'),
    r.pricePerPerson !== null && `💰 1인 ${r.pricePerPerson.toLocaleString('ko-KR')}원`,
  ].filter(Boolean) as string[];
  const photo = typeof details === 'object' && details?.google.photoUrl;

  el.innerHTML = `
    <button type="button" class="pop-x" aria-label="닫기">×</button>
    <div class="pop-body">
      <div class="pop-text">
        <div class="pop-title">${esc(r.name)}</div>
        <div class="pop-rating">${ratingHtml(details)}</div>
        <div class="pop-line">${esc(category)} · ${r.distance}m (도보 ${walkMinutes(r.distance)}분)</div>
        <div class="pop-line">${esc(r.address)}</div>
        ${r.phone ? `<div class="pop-phone">${esc(r.phone)}</div>` : ''}
        ${badges.length ? `<div class="pop-badges">${badges.map((b) => `<span>${esc(b)}</span>`).join('')}</div>` : ''}
        <div class="pop-links">
          <a href="${esc(r.kakaoUrl)}" target="_blank" rel="noreferrer">상세보기</a>
          <a href="${esc(naverMapUrl(r.name))}" target="_blank" rel="noreferrer">네이버</a>
          <a href="${esc(typeof details === 'object' && details ? details.google.url : googleSearchUrl(r.name, r.lat, r.lng))}" target="_blank" rel="noreferrer">구글</a>
        </div>
      </div>
      ${photo ? `<figure class="pop-photo"><img src="${esc(photo)}" alt="" loading="lazy" />${
        typeof details === 'object' && details?.google.photoAuthor ? `<figcaption>© ${esc(details.google.photoAuthor)}</figcaption>` : ''
      }</figure>` : ''}
    </div>
    <div class="pop-actions">
      <button type="button" class="pop-list">목록에서 보기</button>
      <a class="pop-route" href="${esc(kakaoRouteUrl(r))}" target="_blank" rel="noreferrer">길찾기</a>
    </div>`;

  el.querySelector('.pop-x')!.addEventListener('click', handlers.onClose);
  el.querySelector('.pop-list')!.addEventListener('click', handlers.onShowInList);
  // 지도 드래그·클릭이 말풍선 아래로 새지 않게
  ['mousedown', 'touchstart', 'click', 'wheel'].forEach((ev) => el.addEventListener(ev, (e) => e.stopPropagation()));
  return el;
}
