"use client";

import { useState } from "react";
import Image from "next/image";

const initialHands = {
  player: { left: 1, right: 1 },
  enemy: { left: 1, right: 1 },
};

const handLabel = {
  left: "左手",
  right: "右手",
};

const handOrder = ["left", "right"];
const enemyDisplayOrder = ["right", "left"];

function handImagePath(owner, side, count) {
  const imageCount = Math.min(count, 5);

  if (owner === "enemy") {
    const enemySide = side === "left" ? "left " : "right";
    return `/images/hands/hand_${enemySide}_enemy${imageCount}.png`;
  }

  return `/images/hands/hand_${side}${imageCount}.png`;
}

function isOut(count) {
  return count === 5;
}

function nextFingerCount(currentCount, power) {
  const total = currentCount + power;

  if (total > 5) {
    return total % 5 || 5;
  }

  return total;
}

function Hand({ owner, side, count, selected, disabled, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isOut(count)}
      className={[
        "group relative flex min-h-60 flex-col items-center justify-between border-4 border-double p-3 transition",
        owner === "player"
          ? "border-cyan-300 bg-slate-950/85 hover:bg-cyan-950/80"
          : "border-rose-300 bg-slate-950/85 hover:bg-rose-950/80",
        selected ? "translate-y-[-4px] ring-4 ring-yellow-300" : "",
        isOut(count) ? "cursor-not-allowed opacity-40" : "",
        disabled && !isOut(count) ? "cursor-not-allowed" : "",
      ].join(" ")}
    >
      {selected ? (
        <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-2xl font-black text-yellow-300">
          ▼
        </span>
      ) : null}

      <div className="flex w-full items-center justify-between">
        <span className="text-xs font-black tracking-[0.18em] text-white/75">{handLabel[side]}</span>
        <span className="border border-white/50 bg-white px-2 py-1 text-base font-black text-black">
          {isOut(count) ? "OUT" : `F${count}`}
        </span>
      </div>

      <Image
        src={handImagePath(owner, side, count)}
        alt={`${owner === "player" ? "プレイヤー" : "相手"}の${handLabel[side]} 指${Math.min(count, 5)}本`}
        width={270}
        height={350}
        className="mt-2 h-40 w-auto object-contain drop-shadow-[0_12px_18px_rgba(0,0,0,0.75)] transition group-hover:scale-105"
      />

    </button>
  );
}

export default function MainGame() {
  const [hands, setHands] = useState(initialHands);
  const [selectedHand, setSelectedHand] = useState(null);
  const [turn, setTurn] = useState("player");
  const [message, setMessage] = useState("自分の手を選んでください");
  const [winner, setWinner] = useState(null);

  const playerLose = isOut(hands.player.left) && isOut(hands.player.right);
  const enemyLose = isOut(hands.enemy.left) && isOut(hands.enemy.right);

  function resetGame() {
    setHands(initialHands);
    setSelectedHand(null);
    setTurn("player");
    setMessage("自分の手を選んでください");
    setWinner(null);
  }

  function attackEnemy(targetHand) {
    if (turn !== "player" || !selectedHand || winner) return;

    const power = hands.player[selectedHand];
    const nextEnemyHands = {
      ...hands.enemy,
      [targetHand]: nextFingerCount(hands.enemy[targetHand], power),
    };

    const nextHands = {
      ...hands,
      enemy: nextEnemyHands,
    };

    setHands(nextHands);
    setSelectedHand(null);

    if (isOut(nextEnemyHands.left) && isOut(nextEnemyHands.right)) {
      setWinner("player");
      setMessage("YOU WIN!");
      return;
    }

    setTurn("enemy");
    setMessage("相手の番です");

    setTimeout(() => enemyAttack(nextHands), 700);
  }

  function enemyAttack(currentHands) {
    const enemyOptions = handOrder.filter((side) => !isOut(currentHands.enemy[side]));
    const playerOptions = handOrder.filter((side) => !isOut(currentHands.player[side]));

    if (enemyOptions.length === 0 || playerOptions.length === 0) return;

    const enemyHand = enemyOptions[0];
    const playerHand = playerOptions[0];
    const power = currentHands.enemy[enemyHand];

    const nextPlayerHands = {
      ...currentHands.player,
      [playerHand]: nextFingerCount(currentHands.player[playerHand], power),
    };

    setHands({
      ...currentHands,
      player: nextPlayerHands,
    });

    if (isOut(nextPlayerHands.left) && isOut(nextPlayerHands.right)) {
      setWinner("enemy");
      setMessage("YOU LOSE...");
      return;
    }

    setTurn("player");
    setMessage("自分の手を選んでください");
  }

  return (
    <main className="min-h-screen bg-black px-4 py-5 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-40px)] max-w-6xl flex-col gap-4">
        <header className="flex items-center justify-between border-4 border-double border-white/50 bg-black/80 px-4 py-3">
          <div>
            <p className="text-xs font-black tracking-[0.3em] text-yellow-300">BATTLE SCENE</p>
            <h1 className="text-4xl font-black tracking-[0.16em]">POKE</h1>
          </div>

          <button
            type="button"
            onClick={resetGame}
            className="border-2 border-white/60 px-4 py-2 font-black tracking-[0.12em] hover:bg-white hover:text-black"
          >
            RESET
          </button>
        </header>

        <section className="flex flex-1">
          <div className="flex min-h-[560px] w-full flex-col justify-between gap-4 border-4 border-double border-white/40 bg-[radial-gradient(circle_at_center,#1f2937_0%,#020617_62%,#000_100%)] p-4">
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-2xl font-black tracking-[0.12em] text-rose-200">ENEMY</h2>
                <span className="text-sm font-bold text-rose-200">{enemyLose ? "両手アウト" : "TARGET"}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {enemyDisplayOrder.map((side) => (
                  <Hand
                    key={side}
                    owner="enemy"
                    side={side}
                    count={hands.enemy[side]}
                    disabled={turn !== "player" || !selectedHand || winner}
                    onClick={() => attackEnemy(side)}
                  />
                ))}
              </div>
            </section>

            <div className="h-10 border-y border-dashed border-white/20" />

            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-2xl font-black tracking-[0.12em] text-cyan-200">PLAYER</h2>
                <span className="text-sm font-bold text-cyan-200">{playerLose ? "両手アウト" : "SELECT"}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {handOrder.map((side) => (
                  <Hand
                    key={side}
                    owner="player"
                    side={side}
                    count={hands.player[side]}
                    selected={selectedHand === side}
                    disabled={turn !== "player" || winner}
                    onClick={() => {
                      setSelectedHand(side);
                      setMessage(`▶ 自分の${handLabel[side]}で、相手のどちらをつつく？`);
                    }}
                  />
                ))}
              </div>
            </section>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-[1fr_260px]">
          <div className="border-4 border-double border-white/60 bg-black p-4 shadow-[0_0_0_2px_rgba(255,255,255,0.16)]">
            <p className="text-xs font-black tracking-[0.22em] text-yellow-300">
              {winner ? "RESULT" : turn === "player" ? "COMMAND" : "ENEMY TURN"}
            </p>
            <p className="mt-2 min-h-8 text-2xl font-black">{message}</p>
            {turn === "player" && !winner ? (
              <p className="mt-2 text-sm text-white/70">
                ▶ 自分の手を選ぶ → 相手の手を選んで POKE
              </p>
            ) : null}
          </div>

          <div className="border-4 border-double border-white/60 bg-black p-4">
            <p className="text-xs font-black tracking-[0.22em] text-yellow-300">RULE</p>
            <p className="mt-2 text-sm leading-6 text-white/80">
              つつかれた手は指の数だけ増える。5ちょうどでアウト。5を超えたら余りになる。
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
