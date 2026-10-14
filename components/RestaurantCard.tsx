'use client';

import { useState } from 'react';
import { walkMinutes } from '@/lib/geo';
import { googleSearchUrl, naverMapUrl } from '@/lib/links';
import type { Recommendation } from '@/lib/types';
import ReviewPanel from './ReviewPanel';

const yesNo = (v: boolean | null, label: string) =>
  v === null ? { text: `${label} 미확인`, cls: 'unknown' } : v ? { text: `${label} 있음`, cls: 'yes' } : { text: `${label} 없음`, cls: 'no' };

export default function RestaurantCard({ rec, favorite, onFavorite, defaultOpen = false, highlighted = false }: {
  rec: Recommendation;
  favorite: boolean;
  onFavorite: () => void;
  defaultOpen?: boolean;
  highlighted?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const r = rec.restaurant;
  const room = yesNo(r.privateRoom, '룸');
  const parking = yesNo(r.parking, '주차');
  const categoryTail = r.category.split('>').slice(1).map((s) => s.trim()).join(' · ');

  return (
    <article className={`card${highlighted ? ' highlighted' : ''}`}>
      <div className="card-head">
        <div>
          <h3>{r.name}</h3>
          <p className="meta">{categoryTail || r.cuisine} · {r.distance}m (도보 {walkMinutes(r.distance)}분)</p>
          <p className="meta">{r.address}{r.phone && ` · ${r.phone}`}</p>
        </div>
        <div className="score" title="추천 점수">{rec.score}</div>
      </div>

      <div className="badges">
        <span className={`badge ${r.mood ? 'mood' : 'unknown'}`}>
          {r.mood === '시끌벅적' ? '🔊 ' : r.mood === '조용한' ? '🤫 ' : ''}
          {r.mood ?? '분위기 미확인'}{r.moodSource === 'inferred' && ' (추정)'}
        </span>
        <span className={`badge ${room.cls}`}>🚪 {room.text}</span>
        <span className={`badge ${parking.cls}`}>🅿️ {parking.text}</span>
        <span className={`badge ${r.pricePerPerson ? 'info' : 'unknown'}`}>
          💰 {r.pricePerPerson ? `1인 약 ${r.pricePerPerson.toLocaleString('ko-KR')}원` : '가격 미확인'}
        </span>
        {r.maxGroupSize && <span className="badge info">👥 최대 {r.maxGroupSize}명</span>}
      </div>

      {r.signature && <p className="signature">대표 메뉴: {r.signature}</p>}
      {r.notes && <p className="meta">📝 {r.notes}</p>}

      <div className="reasons">
        {rec.reasons.map((x) => <span key={x}>{x}</span>)}
        {r.ingredients.map((i) => <span key={i} className="ingredient">#{i}</span>)}
      </div>
      {rec.unknowns.length > 0 && <p className="meta small">확인 필요: {rec.unknowns.join(', ')}</p>}

      <div className="card-actions">
        <button onClick={() => setOpen((o) => !o)} aria-expanded={open}>{open ? '접기' : '⭐ 리뷰 · 영업상태'}</button>
        <button onClick={onFavorite} aria-pressed={favorite}>{favorite ? '★' : '☆'} 즐겨찾기</button>
        <span className="maplinks">
          <a href={naverMapUrl(r.name)} target="_blank" rel="noreferrer" className="naver">네이버</a>
          <a href={googleSearchUrl(r.name, r.lat, r.lng)} target="_blank" rel="noreferrer" className="google">구글</a>
          <a href={r.kakaoUrl} target="_blank" rel="noreferrer" className="kakao">카카오</a>
        </span>
      </div>

      {open && <ReviewPanel id={r.id} />}
    </article>
  );
}
