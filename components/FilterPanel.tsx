import { CUISINES, MOODS, type Filters } from '@/lib/types';
import Chips, { toggle } from './Chips';

const won = (n: number) => `${n.toLocaleString('ko-KR')}원`;

export default function FilterPanel({ filters: f, onChange, onReset, onlyFavorites, onOnlyFavorites }: {
  filters: Filters;
  onChange: (patch: Partial<Filters>) => void;
  onReset: () => void;
  onlyFavorites: boolean;
  onOnlyFavorites: (v: boolean) => void;
}) {
  return (
    <section className="panel">
      <div className="panel-head">
        <h2>조건</h2>
        <button className="link" onClick={onReset}>초기화</button>
      </div>

      <label className="field">
        <span>인원 <strong>{f.groupSize}명</strong></span>
        <input type="range" min={2} max={60} value={f.groupSize} onChange={(e) => onChange({ groupSize: Number(e.target.value) })} />
      </label>
      <label className="field">
        <span>1인 예산 <strong>{won(f.budget)}</strong></span>
        <input type="range" min={15000} max={150000} step={5000} value={f.budget} onChange={(e) => onChange({ budget: Number(e.target.value) })} />
      </label>
      <label className="field">
        <span>거리 <strong>{f.maxDistance}m 이내</strong></span>
        <input type="range" min={200} max={1000} step={100} value={f.maxDistance} onChange={(e) => onChange({ maxDistance: Number(e.target.value) })} />
      </label>

      <div className="field">
        <span>음식 종류</span>
        <Chips options={CUISINES} selected={f.cuisines} onToggle={(c) => onChange({ cuisines: toggle(f.cuisines, c) })} />
      </div>
      <div className="field">
        <span>분위기</span>
        <Chips options={MOODS} selected={f.mood ? [f.mood] : []} onToggle={(m) => onChange({ mood: f.mood === m ? null : m })} />
      </div>

      <div className="checks">
        <label><input type="checkbox" checked={f.needPrivateRoom} onChange={(e) => onChange({ needPrivateRoom: e.target.checked })} /> 룸 필수</label>
        <label><input type="checkbox" checked={f.needParking} onChange={(e) => onChange({ needParking: e.target.checked })} /> 주차 필수</label>
        <label><input type="checkbox" checked={onlyFavorites} onChange={(e) => onOnlyFavorites(e.target.checked)} /> 즐겨찾기만</label>
        <label title="룸·주차·분위기 정보가 아직 확인되지 않은 식당도 결과에 포함">
          <input type="checkbox" checked={f.includeUnknown} onChange={(e) => onChange({ includeUnknown: e.target.checked })} /> 정보 없는 곳도 보기
        </label>
      </div>
    </section>
  );
}
