'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { cachedPlaceDetails, fetchPlaceDetails } from '@/lib/detailsClient';
import type { Recommendation, RestaurantsResponse } from '@/lib/types';
import { buildPopup } from './mapPopup';

declare global {
  interface Window { kakao: any }
}

const KAKAO_JS_KEY = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;

function loadKakaoSdk(): Promise<any> {
  if (typeof window === 'undefined') return Promise.reject();
  if (window.kakao?.maps?.LatLng) return Promise.resolve(window.kakao);
  return new Promise((resolve, reject) => {
    // 등록되지 않은 도메인이면 스크립트가 실패하거나 지도가 끝내 준비되지 않는다
    const timer = setTimeout(() => reject(new Error('timeout')), 8000);
    const s = document.createElement('script');
    s.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JS_KEY}&autoload=false`;
    s.onload = () => {
      if (!window.kakao?.maps) return reject(new Error('sdk'));
      window.kakao.maps.load(() => {
        clearTimeout(timer);
        resolve(window.kakao);
      });
    };
    s.onerror = () => reject(new Error('script'));
    document.head.appendChild(s);
  });
}

interface Props {
  origin: RestaurantsResponse['origin'];
  radius: number;
  recs: Recommendation[];
  selectedId: string | null;
  onSelect: (id: string, scroll?: boolean) => void;
}

export default function MapView(props: Props) {
  const [kakaoFailed, setKakaoFailed] = useState(false);
  const onFail = useCallback(() => setKakaoFailed(true), []);
  if (KAKAO_JS_KEY && !kakaoFailed) return <KakaoMap {...props} onFail={onFail} />;
  return <SchematicMap {...props} reason={KAKAO_JS_KEY ? 'load-failed' : 'no-key'} />;
}

function KakaoMap({ origin, radius, recs, selectedId, onSelect, onFail }: Props & { onFail: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const popupRef = useRef<any>(null);
  const [popupId, setPopupId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadKakaoSdk().then((kakao) => {
      if (cancelled || !ref.current) return;
      const center = new kakao.maps.LatLng(origin.lat, origin.lng);
      const map = new kakao.maps.Map(ref.current, { center, level: 5 });
      new kakao.maps.Circle({
        map, center, radius,
        strokeWeight: 2, strokeColor: '#e8590c', strokeOpacity: 0.8, fillColor: '#e8590c', fillOpacity: 0.06,
      });
      new kakao.maps.CustomOverlay({
        map, position: center, yAnchor: 1.4,
        content: `<div class="map-origin">🏢 ${origin.name}</div>`,
      });
      popupRef.current = new kakao.maps.CustomOverlay({ yAnchor: 1, zIndex: 10, clickable: true });
      mapRef.current = map;
      setReady(true);
    }).catch(onFail);
    return () => { cancelled = true; };
  }, [origin, radius, onFail]);

  useEffect(() => {
    const kakao = window.kakao;
    const map = mapRef.current;
    if (!ready || !kakao || !map) return;
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current.clear();
    for (const rec of recs) {
      const r = rec.restaurant;
      const marker = new kakao.maps.Marker({ map, position: new kakao.maps.LatLng(r.lat, r.lng), title: r.name });
      kakao.maps.event.addListener(marker, 'click', () => {
        setPopupId(r.id);
        onSelect(r.id, false);
      });
      markersRef.current.set(r.id, marker);
    }
  }, [ready, recs, onSelect]);

  // 목록에서 고른 식당도 지도에 정보 창을 띄운다
  useEffect(() => {
    if (selectedId) setPopupId(selectedId);
  }, [selectedId]);

  useEffect(() => {
    const overlay = popupRef.current;
    const marker = popupId && markersRef.current.get(popupId);
    const rec = recs.find((x) => x.restaurant.id === popupId);
    if (!ready || !overlay) return;
    if (!marker || !rec) {
      overlay.setMap(null);
      return;
    }
    let cancelled = false;
    const r = rec.restaurant;
    const render = (d: Parameters<typeof buildPopup>[1]) => {
      if (!cancelled) overlay.setContent(buildPopup(r, d, handlers));
    };
    const load = (p: Promise<unknown>) => {
      render('loading');
      p.then((d) => render(d as Parameters<typeof buildPopup>[1]), () => render('error'));
    };
    const handlers = {
      onClose: () => setPopupId(null),
      onShowInList: () => onSelect(r.id, true),
      onLoadDetails: () => load(fetchPlaceDetails(r.id)),
    };
    // 이미 조회한 식당이면 그 결과를 보여주고, 아니면 버튼을 눌러야 구글을 조회한다
    const cached = cachedPlaceDetails(r.id);
    if (cached) load(cached);
    else render(null);
    overlay.setPosition(marker.getPosition());
    overlay.setMap(mapRef.current);
    mapRef.current.panTo(marker.getPosition());
    return () => { cancelled = true; };
  }, [ready, popupId, recs, onSelect]);

  return <div ref={ref} className="map" />;
}

/** 지도 키가 없을 때: 기준 건물 중심의 개략도 */
function SchematicMap({ origin, radius, recs, selectedId, onSelect, reason }: Props & { reason: 'no-key' | 'load-failed' }) {
  const size = radius * 1.15;
  const cos = Math.cos((origin.lat * Math.PI) / 180);
  const toXY = (lat: number, lng: number) => ({
    x: (lng - origin.lng) * 111320 * cos,
    y: -(lat - origin.lat) * 110540,
  });

  return (
    <div className="map schematic">
      <svg viewBox={`${-size} ${-size} ${size * 2} ${size * 2}`} role="img" aria-label={`${origin.name} 반경 ${radius}m 식당 위치`}>
        <circle cx={0} cy={0} r={radius} className="radius" />
        <circle cx={0} cy={0} r={radius / 2} className="radius inner" />
        <text x={0} y={-radius / 2 - 16} textAnchor="middle" className="label">500m</text>
        <text x={0} y={-radius - 16} textAnchor="middle" className="label">{radius >= 1000 ? `${radius / 1000}km` : `${radius}m`}</text>
        {recs.map(({ restaurant: r }) => {
          const { x, y } = toXY(r.lat, r.lng);
          const on = r.id === selectedId;
          return (
            <g key={r.id} onClick={() => onSelect(r.id)} className={`dot${on ? ' on' : ''}`}>
              <circle cx={x} cy={y} r={on ? 44 : 30}><title>{r.name}</title></circle>
              {on && <text x={x} y={y - 60} textAnchor="middle" className="dot-label">{r.name}</text>}
            </g>
          );
        })}
        <rect x={-26} y={-26} width={52} height={52} rx={8} className="origin" />
        <text x={0} y={95} textAnchor="middle" className="label strong">{origin.name}</text>
      </svg>
      <p className="tiny muted map-note">
        {reason === 'no-key' ? (
          <>개략도입니다. 사이트에 카카오 JavaScript 키가 없어요. Vercel에 <code>NEXT_PUBLIC_KAKAO_JS_KEY</code>를 <strong>Config</strong> 타입으로 넣고 다시 배포하세요.</>
        ) : (
          <>카카오 지도를 불러오지 못해 개략도를 보여줘요. Kakao Developers → [플랫폼 키] → JavaScript 키 → <strong>JavaScript SDK 도메인</strong>에 <code>{typeof window === 'undefined' ? '' : location.origin}</code>을 등록하세요.</>
        )}
      </p>
    </div>
  );
}
