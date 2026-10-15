'use client';

import { useEffect, useState } from 'react';
import { fetchPlaceDetails } from '@/lib/detailsClient';
import type { PlaceDetails } from '@/lib/types';

const STATUS_CLASS: Record<PlaceDetails['status'], string> = {
  '영업중': 'yes',
  '휴업': 'warn',
  '폐업': 'no',
  '확인 필요': 'warn',
};

const stars = (n: number) => '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n));

export default function ReviewPanel({ id }: { id: string }) {
  const [d, setD] = useState<PlaceDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchPlaceDetails(id)
      .then(setD)
      .catch((e) => setError(String(e.message ?? e)));
  }, [id]);

  if (error) return <div className="reviews"><p className="error">⚠️ {error}</p></div>;
  if (!d) return <div className="reviews"><p className="muted small">네이버·구글·카카오에서 확인하는 중…</p></div>;

  const reviews = showAll ? d.google.reviews : d.google.reviews.slice(0, 2);

  return (
    <div className="reviews">
      <div className="status-row">
        <span className={`badge ${STATUS_CLASS[d.status]}`}>{d.status}</span>
        <span className="muted small">{d.statusReasons.join(' · ')}</span>
      </div>

      <div className="review-grid">
        <section className="source google">
          <h4>구글</h4>
          {d.google.error ? (
            <p className="small danger-text">⚠️ {d.google.error}</p>
          ) : !d.google.configured ? (
            <p className="muted small">구글 API 키가 없어 평점을 불러오지 못했어요.</p>
          ) : !d.google.found ? (
            <p className="muted small">구글 지도에서 찾지 못했어요.</p>
          ) : (
            <>
              <p className="rating">
                <span className="stars">{d.google.rating ? stars(d.google.rating) : ''}</span>{' '}
                <strong>{d.google.rating?.toFixed(1) ?? '-'}</strong>{' '}
                <span className="muted small">({d.google.reviewCount?.toLocaleString('ko-KR') ?? 0}개)</span>
              </p>
              {reviews.map((r, i) => (
                <blockquote key={i} className="review">
                  <div className="small">
                    <span className="stars">{stars(r.rating)}</span>{' '}
                    {r.authorUri ? <a href={r.authorUri} target="_blank" rel="noreferrer">{r.author}</a> : r.author}
                    <span className="muted"> · {r.when}</span>
                  </div>
                  <p>{r.text}</p>
                </blockquote>
              ))}
              {d.google.reviews.length > 2 && (
                <button className="link" onClick={() => setShowAll((s) => !s)}>{showAll ? '접기' : `리뷰 ${d.google.reviews.length}개 모두 보기`}</button>
              )}
            </>
          )}
          <a className="outlink" href={d.google.url} target="_blank" rel="noreferrer">구글 지도에서 리뷰 보기 →</a>
        </section>

        <section className="source naver">
          <h4>네이버</h4>
          <p className="small">
            {d.naver.error ? <span className="danger-text">⚠️ {d.naver.error}</span>
              : !d.naver.configured ? <span className="muted">네이버 API 키 미설정</span>
              : d.naver.found ? <>✅ 네이버 지도에 등록됨{d.naver.category && <span className="muted"> · {d.naver.category}</span>}</>
              : <span className="danger-text">네이버에서 찾지 못함</span>}
          </p>
          <p className="muted small">네이버는 리뷰를 공식 API로 제공하지 않아 네이버 지도에서 바로 확인할 수 있게 연결해요.</p>
          <a className="outlink" href={d.naver.url} target="_blank" rel="noreferrer">네이버 지도에서 리뷰 보기 →</a>
        </section>

        <section className="source kakao">
          <h4>카카오</h4>
          <p className="small">{d.kakao.found ? '✅ 카카오맵에 등록됨' : <span className="danger-text">카카오맵에서 사라짐</span>}</p>
          <p className="muted small">카카오도 리뷰 API가 없어 카카오맵 장소 페이지(별점·후기)로 연결해요.</p>
          <a className="outlink" href={d.kakao.url} target="_blank" rel="noreferrer">카카오맵에서 리뷰 보기 →</a>
        </section>
      </div>
      <p className="muted tiny">확인 시각 {new Date(d.checkedAt).toLocaleString('ko-KR')}</p>
    </div>
  );
}
