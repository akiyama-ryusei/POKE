"use client";

import { useState } from "react";
import Image from "next/image";

// 手のデータを作る関数
function createHand(count = 1) {
  return {
    count,
    shield: false,
    attackBonus: 0,
    itemBlocked: false,
  };
}


// const levelSettings = {
//   1: {
//     label: "LEVEL 1",
//     useItems: false,
//   },
//   2: {
//     label: "LEVEL 2",
//     useItems: false,
//   },
//   3: {
//     label: "LEVEL 3",
//     useItems: true,
//   },
// };

// それぞれの手を初期化する関数
function createInitialHands() {
  return {
    player: { left: createHand(), right: createHand() },
    enemy: { left: createHand(), right: createHand() },
  };
}

// 左右のラベル付をするための変数
const handLabel = {
  left: "左手",
  right: "右手",
};
// 手の表示する順番を定義
const handOrder = ["left", "right"];
const enemyDisplayOrder = ["right", "left"];

// 手の画像ファイルのパスを取得する関数
function handImagePath(owner, side, count) {
  const imageCount = Math.min(count, 5);

  if (owner === "enemy") {
    const enemySide = side === "left" ? "left " : "right";
    return `/images/hands/hand_${enemySide}_enemy${imageCount}.png`;
  }

  return `/images/hands/hand_${side}${imageCount}.png`;
}

// 指の数が5になった時を判断する関数
function isOut(count) {
  return count === 5;
}

// 手のオブジェクトを受け取って指の数が5本かどうかを判定する関数
function isHandOut(hand) {
  return isOut(hand.count);
}

// 指の数が5をこえた時にあまりを次の指の数にする関数
function nextFingerCount(currentCount, power) {
  const total = currentCount + power;

  if (total > 5) {
    return total % 5 || 5;
  }

  return total;
}

// 追加ダメージを含めて最終的な攻撃力を計算する関数
// アイテムの効果で増やすときに役立ちそう
function attackPower(hand) {
  return hand.count + hand.attackBonus;
}

// 攻撃する関数
// なんかシールドの要素が追加されてる(アイテム用?)
function attackedHand(hand, power) {
  if (hand.shield) {
    return {
      ...hand,
      shield: false,
    };
  }

  return {
    ...hand,
    count: nextFingerCount(hand.count, power),
  };
}

// 手を表示する
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

// メインゲームの画面を表示する関数
// exportが付いているのでこの関数が最終的に
export default function MainGame({ level = 1 }) {
  const [hands, setHands] = useState(createInitialHands);
  const [selectedHand, setSelectedHand] = useState(null);
  const [turn, setTurn] = useState("player");
  const [message, setMessage] = useState("自分の手を選んでください");
  const [winner, setWinner] = useState(null);

  const playerLose = isHandOut(hands.player.left) && isHandOut(hands.player.right);
  const enemyLose = isHandOut(hands.enemy.left) && isHandOut(hands.enemy.right);

  function resetGame() {
    setHands(createInitialHands());
    setSelectedHand(null);
    setTurn("player");
    setMessage("自分の手を選んでください");
    setWinner(null);
  }

  function attackEnemy(targetHand) {
    if (turn !== "player" || !selectedHand || winner) return;

    const power = attackPower(hands.player[selectedHand]);
    const nextEnemyHands = {
      ...hands.enemy,
      [targetHand]: attackedHand(hands.enemy[targetHand], power),
    };

    const nextHands = {
      ...hands,
      enemy: nextEnemyHands,
    };

    setHands(nextHands);
    setSelectedHand(null);

    if (isHandOut(nextEnemyHands.left) && isHandOut(nextEnemyHands.right)) {
      setWinner("player");
      setMessage("YOU WIN!");
      return;
    }

    setTurn("enemy");
    setMessage("相手の番です");

    setTimeout(() => enemyAttack(nextHands), 700);
  }

  function enemyAttack(currentHands) {
    const enemyOptions = handOrder.filter((side) => !isHandOut(currentHands.enemy[side]));
    const playerOptions = handOrder.filter((side) => !isHandOut(currentHands.player[side]));

    if (enemyOptions.length === 0 || playerOptions.length === 0) return;

    const enemyHand = enemyOptions[0];
    const playerHand = playerOptions[0];
    const power = attackPower(currentHands.enemy[enemyHand]);

    const nextPlayerHands = {
      ...currentHands.player,
      [playerHand]: attackedHand(currentHands.player[playerHand], power),
    };

    setHands({
      ...currentHands,
      player: nextPlayerHands,
    });

    if (isHandOut(nextPlayerHands.left) && isHandOut(nextPlayerHands.right)) {
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
            <h1 className="text-4xl font-black tracking-[0.16em]">POKE</h1>
            <p className="mt-1 text-sm font-bold text-yellow-300">LEVEL {level}</p>
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
                    count={hands.enemy[side].count}
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
                    count={hands.player[side].count}
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

        <section className="grid gap-4 w-full">
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
        </section>
      </div>
    </main>
  );
}
