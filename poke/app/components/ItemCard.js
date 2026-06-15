"use client";

export default function ItemCard({
  item,
  selected,
  stage,
  unavailable,
  onClick,
  onChooseCount,
}) {
  const waitingForHand = selected && stage === "use_wait_hand";
  const choosingCount = selected && stage === "sacrifive_choose_count";
  const previewing = selected && stage === "preview";
  const description =
    unavailable ? "一方の手が既にOUTになっている為このアイテムは使用できません" : item.desc;

  return (
    <div
      className={[
        "border-4 border-double bg-slate-950/95 p-3 transition",
        selected
          ? "border-yellow-300 shadow-[0_0_0_2px_rgba(250,204,21,0.24)]"
          : "border-white/35 hover:border-white/70",
        unavailable ? "opacity-60" : "",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={onClick}
        className="w-full text-left"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-base font-black tracking-[0.08em] text-white">
              {item.name}
            </p>
            <p className="mt-1 text-xs leading-5 text-white/65">
              {description}
            </p>
          </div>

          <span
            className={[
              "shrink-0 border px-2 py-1 text-[10px] font-black tracking-[0.16em]",
              selected
                ? "border-yellow-300 bg-yellow-300 text-black"
                : "border-white/35 text-white/60",
            ].join(" ")}
          >
            {unavailable ? "NG" : selected ? "READY" : "ITEM"}
          </span>
        </div>
      </button>

      {previewing ? (
        <p className="mt-3 border-t border-white/15 pt-2 text-xs font-bold text-yellow-200">
          もう一度カードを押すと使用
        </p>
      ) : null}

      {choosingCount ? (
        <div className="mt-3 flex gap-2 border-t border-white/15 pt-3">
          {[1, 2, 3, 4].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChooseCount(n)}
              className="h-8 w-8 border-2 border-white/50 text-sm font-black hover:bg-white hover:text-black"
            >
              {n}
            </button>
          ))}
        </div>
      ) : null}

      {waitingForHand ? (
        <p className="mt-3 border-t border-white/15 pt-2 text-xs font-bold text-cyan-200">
          {item.id === "roulette"
            ? "ランダムに指を変更する手を選んでください"
            : item.id === "doubleAttack"
            ? "二倍攻撃を行う手を選んでください"
            : "OUTにする自分の手を選んでください"}
        </p>
      ) : null}
    </div>
  );
}
