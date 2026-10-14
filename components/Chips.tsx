export default function Chips<T extends string>(props: {
  options: readonly T[];
  selected: T[];
  onToggle: (v: T) => void;
  danger?: boolean;
}) {
  return (
    <div className="chips">
      {props.options.map((o) => {
        const on = props.selected.includes(o);
        return (
          <button key={o} type="button" className={`chip${on ? (props.danger ? ' on danger' : ' on') : ''}`}
            aria-pressed={on} onClick={() => props.onToggle(o)}>
            {o}
          </button>
        );
      })}
    </div>
  );
}

export function toggle<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}
