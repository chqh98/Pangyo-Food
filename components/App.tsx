'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { walkMinutes } from '@/lib/geo';
import { pickRandom, recommend, teamConflicts } from '@/lib/recommend';
import { decodeState, encodeState } from '@/lib/share';
import type { Filters, Recommendation, RestaurantsResponse, TeamMember } from '@/lib/types';
import FilterPanel from './FilterPanel';
import MapView from './MapView';
import RestaurantCard from './RestaurantCard';
import TeamPanel from './TeamPanel';

export const DEFAULT_FILTERS: Filters = {
  groupSize: 8,
  budget: 40000,
  maxDistance: 1000,
  cuisines: [],
  mood: null,
  needPrivateRoom: false,
  needParking: false,
  includeUnknown: true,
};

const STORAGE_KEY = 'pangyo-food:v2';

interface Stored {
  filters: Filters;
  team: TeamMember[];
  favorites: string[];
}

function loadStored(): Partial<Stored> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
  } catch {
    return {};
  }
}

export default function App() {
  const [data, setData] = useState<RestaurantsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [picked, setPicked] = useState<Recommendation | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [copied, setCopied] = useState(false);

  // 저장된 설정 → 공유 링크(#s=) 순으로 불러온다
  useEffect(() => {
    const stored = loadStored();
    const shared = location.hash.startsWith('#s=') ? decodeState(location.hash.slice(3)) : null;
    setFilters({ ...DEFAULT_FILTERS, ...stored.filters, ...shared?.filters });
    setTeam(shared?.team ?? stored.team ?? []);
    setFavorites(stored.favorites ?? []);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ filters, team, favorites } satisfies Stored));
    } catch {
      // 저장소를 쓸 수 없는 환경에서는 세션 동안만 유지
    }
  }, [loaded, filters, team, favorites]);

  useEffect(() => {
    fetch('/api/restaurants')
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? '불러오기 실패');
        setData(body);
      })
      .catch((e) => setError(String(e.message ?? e)));
  }, []);

  const restaurants = data?.restaurants ?? [];
  const recs = useMemo(() => {
    const all = recommend(restaurants, filters, team);
    return onlyFavorites ? all.filter((r) => favorites.includes(r.restaurant.id)) : all;
  }, [restaurants, filters, team, onlyFavorites, favorites]);

  const excludedByTeam = useMemo(
    () => (team.length ? restaurants.filter((r) => teamConflicts(r, team).length > 0).length : 0),
    [restaurants, team],
  );

  const updateFilters = (patch: Partial<Filters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPicked(null);
  };

  const toggleFavorite = (id: string) =>
    setFavorites((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));

  const copyShareLink = async () => {
    const url = `${location.origin}${location.pathname}#s=${encodeState({ filters, team })}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      prompt('아래 링크를 복사하세요', url);
    }
  };

  const select = useCallback((id: string) => {
    setSelectedId(id);
    document.getElementById(`card-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>🍻 판교 회식 추천</h1>
          <p className="sub">
            {data?.origin.name ?? '쏠리드스페이스'} 반경 {((data?.radius ?? 1000) / 1000).toFixed(0)}km 안의 식당을 조건에 맞게 골라드려요
          </p>
        </div>
        <button onClick={copyShareLink}>{copied ? '✅ 복사됨' : '🔗 팀원에게 공유'}</button>
      </header>

      {data?.source === 'demo' && (
        <div className="notice">
          ⚠️ API 키가 설정되지 않아 <strong>예시 데이터</strong>를 보여주고 있어요. README의 설정 방법대로 카카오/네이버/구글 키를 넣으면 실제 식당이 표시됩니다.
        </div>
      )}

      <div className="layout">
        <aside className="sidebar">
          <FilterPanel filters={filters} onChange={updateFilters} onReset={() => { setFilters(DEFAULT_FILTERS); setPicked(null); }}
            onlyFavorites={onlyFavorites} onOnlyFavorites={setOnlyFavorites} />
          <TeamPanel team={team} onChange={(t) => { setTeam(t); setPicked(null); }} excludedCount={excludedByTeam} />
        </aside>

        <main className="main">
          {data && (
            <MapView origin={data.origin} radius={data.radius} recs={recs} selectedId={selectedId} onSelect={select} />
          )}

          <div className="actions">
            <button className="primary" disabled={recs.length === 0} onClick={() => {
              const p = pickRandom(recs);
              setPicked(p);
              if (p) setSelectedId(p.restaurant.id);
            }}>🎲 오늘 회식은 여기!</button>
            {data && (
              <span className="muted small">
                전체 {restaurants.length}곳 중 <strong className="accent">{recs.length}곳</strong> 추천
                · 갱신 {new Date(data.updatedAt).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })}
              </span>
            )}
          </div>

          {picked && (
            <section className="picked">
              <span className="badge-label">오늘의 선택 · 도보 {walkMinutes(picked.restaurant.distance)}분</span>
              <RestaurantCard rec={picked} favorite={favorites.includes(picked.restaurant.id)}
                onFavorite={() => toggleFavorite(picked.restaurant.id)} defaultOpen />
            </section>
          )}

          {error && <p className="error">⚠️ {error}</p>}
          {!data && !error && <p className="muted">식당 목록을 불러오는 중…</p>}
          {data && recs.length === 0 && (
            <p className="muted">조건에 맞는 곳이 없어요. 예산·거리를 늘리거나 &lsquo;정보 없는 곳도 보기&rsquo;를 켜보세요.</p>
          )}

          <ul className="list">
            {recs.map((rec) => (
              <li key={rec.restaurant.id} id={`card-${rec.restaurant.id}`}>
                <RestaurantCard rec={rec} favorite={favorites.includes(rec.restaurant.id)}
                  onFavorite={() => toggleFavorite(rec.restaurant.id)} highlighted={rec.restaurant.id === selectedId} />
              </li>
            ))}
          </ul>
        </main>
      </div>

      <footer className="footer">
        식당 목록: 카카오 로컬 · 평점/리뷰: Google · 분위기·룸·가격은 팀이 확인한 정보(<code>data/overrides.json</code>)와 카테고리 기반 추정입니다.
      </footer>
    </div>
  );
}
