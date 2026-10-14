import { INGREDIENTS, type TeamMember } from '@/lib/types';
import Chips, { toggle } from './Chips';

export default function TeamPanel({ team, onChange, excludedCount }: {
  team: TeamMember[];
  onChange: (team: TeamMember[]) => void;
  excludedCount: number;
}) {
  const update = (i: number, patch: Partial<TeamMember>) =>
    onChange(team.map((m, j) => (j === i ? { ...m, ...patch } : m)));

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>팀원 못 먹는 음식</h2>
        <button className="link" onClick={() => onChange([...team, { name: '', cannotEat: [] }])}>+ 팀원 추가</button>
      </div>
      {team.length === 0 && <p className="muted small">못 먹는 음식이 있는 팀원을 추가하면 해당 음식이 주메뉴인 식당은 빼고 추천해요.</p>}
      {team.map((m, i) => (
        <div key={i} className="member">
          <div className="member-head">
            <input className="text" placeholder={`팀원 ${i + 1} 이름`} value={m.name} onChange={(e) => update(i, { name: e.target.value })} />
            <button className="link" aria-label="팀원 삭제" onClick={() => onChange(team.filter((_, j) => j !== i))}>삭제</button>
          </div>
          <Chips options={INGREDIENTS} selected={m.cannotEat} danger
            onToggle={(x) => update(i, { cannotEat: toggle(m.cannotEat, x) })} />
        </div>
      ))}
      {excludedCount > 0 && <p className="small danger-text">팀원 때문에 {excludedCount}곳을 제외했어요.</p>}
    </section>
  );
}
