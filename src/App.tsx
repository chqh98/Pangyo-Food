import { useEffect, useMemo, useState } from 'react';
import { restaurants } from './data/restaurants';
import { pickRandom, recommend } from './lib/recommend';
import { AREAS, CUISINES, MOODS, type Filters, type Recommendation } from './types';

const DEFAULT_FILTERS: Filters = {
  groupSize: 8,
  budget: 40000,
  cuisines: [],
  areas: [],
  mood: null,
  needPrivateRoom: false,
  needParking: false,
};

const FAVORITES_KEY = 'pangyo-food:favorites';

function loadFavorites(): string[] {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function toggle<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

const won = (n: number) => `${n.toLocaleString('ko-KR')}원`;

export default function App() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [favorites, setFavorites] = useState<string[]>(loadFavorites);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [picked, setPicked] = useState<Recommendation | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    } catch {
      // 저장소를 쓸 수 없는 환경에서는 즐겨찾기를 세션 동안만 유지
    }
  }, [favorites]);

  const recs = useMemo(() => {
    const all = recommend(restaurants, filters);
    return onlyFavorites ? all.filter((r) => favorites.includes(r.restaurant.id)) : all;
  }, [filters, onlyFavorites, favorites]);

  const update = (patch: Partial<Filters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPicked(null);
  };

  return (
    <div className="app">
      <header>
        <h1>🍻 판교 회식 추천</h1>
        <p className="sub">인원·예산·분위기만 정하면 회식 장소를 골라드려요</p>
      </header>

      <section className="panel">
        <div className="row">
          <label>
            인원 <strong>{filters.groupSize}명</strong>
            <input type="range" min={2} max={60} value={filters.groupSize}
              onChange={(e) => update({ groupSize: Number(e.target.value) })} />
          </label>
          <label>
            1인 예산 <strong>{won(filters.budget)}</strong>
            <input type="range" min={15000} max={100000} step={5000} value={filters.budget}
              onChange={(e) => update({ budget: Number(e.target.value) })} />
          </label>
        </div>

        <ChipGroup label="음식 종류" options={CUISINES} selected={filters.cuisines}
          onToggle={(c) => update({ cuisines: toggle(filters.cuisines, c) })} />
        <ChipGroup label="위치" options={AREAS} selected={filters.areas}
          onToggle={(a) => update({ areas: toggle(filters.areas, a) })} />
        <ChipGroup label="분위기" options={MOODS} selected={filters.mood ? [filters.mood] : []}
          onToggle={(m) => update({ mood: filters.mood === m ? null : m })} />

        <div className="checks">
          <label><input type="checkbox" checked={filters.needPrivateRoom}
            onChange={(e) => update({ needPrivateRoom: e.target.checked })} /> 룸 필수</label>
          <label><input type="checkbox" checked={filters.needParking}
            onChange={(e) => update({ needParking: e.target.checked })} /> 주차 필수</label>
          <label><input type="checkbox" checked={onlyFavorites}
            onChange={(e) => setOnlyFavorites(e.target.checked)} /> 즐겨찾기만</label>
        </div>

        <div className="actions">
          <button className="primary" disabled={recs.length === 0}
            onClick={() => setPicked(pickRandom(recs))}>🎲 오늘 회식은 여기!</button>
          <button onClick={() => { setFilters(DEFAULT_FILTERS); setPicked(null); }}>초기화</button>
        </div>
      </section>

      {picked && (
        <section className="picked">
          <span className="badge">오늘의 선택</span>
          <Card rec={picked} favorite={favorites.includes(picked.restaurant.id)}
            onFavorite={() => setFavorites((f) => toggle(f, picked.restaurant.id))} />
        </section>
      )}

      <section>
        <h2>추천 결과 <span className="count">{recs.length}곳</span></h2>
        {recs.length === 0 ? (
          <p className="empty">조건에 맞는 곳이 없어요. 예산을 올리거나 조건을 줄여보세요.</p>
        ) : (
          <ul className="list">
            {recs.map((rec) => (
              <li key={rec.restaurant.id}>
                <Card rec={rec} favorite={favorites.includes(rec.restaurant.id)}
                  onFavorite={() => setFavorites((f) => toggle(f, rec.restaurant.id))} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer>※ 현재 목록은 샘플 데이터입니다.</footer>
    </div>
  );
}

function ChipGroup<T extends string>(props: {
  label: string;
  options: readonly T[];
  selected: T[];
  onToggle: (v: T) => void;
}) {
  return (
    <div className="chips">
      <span className="chips-label">{props.label}</span>
      {props.options.map((o) => (
        <button key={o} className={props.selected.includes(o) ? 'chip on' : 'chip'}
          aria-pressed={props.selected.includes(o)} onClick={() => props.onToggle(o)}>
          {o}
        </button>
      ))}
    </div>
  );
}

function Card({ rec, favorite, onFavorite }: {
  rec: Recommendation;
  favorite: boolean;
  onFavorite: () => void;
}) {
  const r = rec.restaurant;
  const mapQuery = encodeURIComponent(`${r.area} ${r.cuisine} 회식`);
  return (
    <article className="card">
      <div className="card-head">
        <div>
          <h3>{r.name}</h3>
          <p className="meta">{r.cuisine} · {r.area} · 도보 {r.walkMinutes}분</p>
        </div>
        <div className="score" title="추천 점수">{rec.score}</div>
      </div>
      <p className="signature">대표 메뉴: {r.signature}</p>
      <p className="meta">1인 약 {won(r.pricePerPerson)} · 최대 {r.maxGroupSize}명
        {r.hasPrivateRoom && ' · 룸'}{r.parking && ' · 주차'}</p>
      <div className="reasons">
        {rec.reasons.map((x) => <span key={x}>{x}</span>)}
        {r.tags.map((t) => <span key={t} className="tag">#{t}</span>)}
      </div>
      <div className="card-actions">
        <button onClick={onFavorite} aria-pressed={favorite}>{favorite ? '★ 즐겨찾기' : '☆ 즐겨찾기'}</button>
        <a href={`https://map.kakao.com/?q=${mapQuery}`} target="_blank" rel="noreferrer">지도에서 찾기</a>
      </div>
    </article>
  );
}
