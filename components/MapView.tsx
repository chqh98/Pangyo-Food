'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Recommendation, RestaurantsResponse } from '@/lib/types';

declare global {
  interface Window { kakao: any }
}

const KAKAO_JS_KEY = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;

function loadKakaoSdk(): Promise<any> {
  if (typeof window === 'undefined') return Promise.reject();
  if (window.kakao?.maps?.LatLng) return Promise.resolve(window.kakao);
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JS_KEY}&autoload=false`;
    s.onload = () => window.kakao.maps.load(() => resolve(window.kakao));
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

interface Props {
  origin: RestaurantsResponse['origin'];
  radius: number;
  recs: Recommendation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function MapView(props: Props) {
  const [kakaoFailed, setKakaoFailed] = useState(false);
  const onFail = useCallback(() => setKakaoFailed(true), []);
  return KAKAO_JS_KEY && !kakaoFailed ? <KakaoMap {...props} onFail={onFail} /> : <SchematicMap {...props} />;
}

function KakaoMap({ origin, radius, recs, selectedId, onSelect, onFail }: Props & { onFail: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const infoRef = useRef<any>(null);
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
      infoRef.current = new kakao.maps.InfoWindow({ removable: false });
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
      kakao.maps.event.addListener(marker, 'click', () => onSelect(r.id));
      markersRef.current.set(r.id, marker);
    }
  }, [ready, recs, onSelect]);

  useEffect(() => {
    const marker = selectedId && markersRef.current.get(selectedId);
    const rec = recs.find((x) => x.restaurant.id === selectedId);
    if (!marker || !rec || !infoRef.current) return;
    infoRef.current.setContent(`<div class="map-info">${rec.restaurant.name}</div>`);
    infoRef.current.open(mapRef.current, marker);
    mapRef.current.panTo(marker.getPosition());
  }, [ready, selectedId, recs]);

  return <div ref={ref} className="map" />;
}

/** 지도 키가 없을 때: 기준 건물 중심의 개략도 */
function SchematicMap({ origin, radius, recs, selectedId, onSelect }: Props) {
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
      <p className="tiny muted map-note">개략도입니다. <code>NEXT_PUBLIC_KAKAO_JS_KEY</code>를 설정하면 카카오 지도가 표시돼요.</p>
    </div>
  );
}
