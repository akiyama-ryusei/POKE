"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import ResultModal from "./ResultModal";
import { saveGameResult } from "../lib/gameResults";
import { playSound } from "../lib/sounds";

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

// アイテム定義
const ITEMS = [
  { id: "guard", name: "Guard", desc: "相手の攻撃をはねのける（次の敵の攻撃を無効化）" },
  { id: "sacrifive", name: "Sacrifive", desc: "片手を犠牲にしてもう片方の指を1-4に設定する" },
  { id: "roulette", name: "Finger Roulette", desc: "自分の選んだ手の指を1-4のランダムに変更する（そのターンのみ）" },
  { id: "doubleAttack", name: "Double Attack", desc: "次の攻撃が2倍になる" },
];

const ENEMY_EFFECT_DURATION_MS = 1800;

// ITEMS から重複なくランダムに n 個選ぶ
function pickRandomItems(n) {
  const pool = [...ITEMS];
  const picked = [];
  while (picked.length < n && pool.length > 0) {
    const i = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(i, 1)[0]);
  }
  return picked;
}
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

// CPUの行動を決めるための補助関数
function getPossibleMoves(currentHands, attacker) {
  const defender = attacker === "enemy" ? "player" : "enemy";

  const attackerOptions = handOrder.filter(
    (side) => !isHandOut(currentHands[attacker][side])
  );

  const defenderOptions = handOrder.filter(
    (side) => !isHandOut(currentHands[defender][side])
  );

  const moves = [];

  attackerOptions.forEach((attackerHand) => {
    defenderOptions.forEach((defenderHand) => {
      moves.push({ attackerHand, defenderHand });
    });
  });

  return moves;
}

function simulateAttack(currentHands, attacker, move) {
  const defender = attacker === "enemy" ? "player" : "enemy";
  const power = attackPower(currentHands[attacker][move.attackerHand]);

  return {
    ...currentHands,
    [defender]: {
      ...currentHands[defender],
      [move.defenderHand]: attackedHand(
        currentHands[defender][move.defenderHand],
        power
      ),
    },
  };
}

function isPlayerLose(currentHands) {
  return (
    isHandOut(currentHands.player.left) &&
    isHandOut(currentHands.player.right)
  );
}

function isEnemyLose(currentHands) {
  return (
    isHandOut(currentHands.enemy.left) &&
    isHandOut(currentHands.enemy.right)
  );
}

function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomRouletteCount() {
  return Math.floor(Math.random() * 4) + 1;
}

function chooseEnemyMove(currentHands) {
  const enemyMoves = getPossibleMoves(currentHands, "enemy");

  if (enemyMoves.length === 0) return null;

  // 1. 今勝てるなら勝つ
  const winningMoves = enemyMoves.filter((move) => {
    const afterEnemyAttack = simulateAttack(currentHands, "enemy", move);
    return isPlayerLose(afterEnemyAttack);
  });

  if (winningMoves.length > 0) {
    return randomChoice(winningMoves);
  }

  // 2. 次に負ける手は避ける
  const safeMoves = enemyMoves.filter((move) => {
    const afterEnemyAttack = simulateAttack(currentHands, "enemy", move);
    const playerMoves = getPossibleMoves(afterEnemyAttack, "player");

    const playerCanWin = playerMoves.some((playerMove) => {
      const afterPlayerAttack = simulateAttack(
        afterEnemyAttack,
        "player",
        playerMove
      );

      return isEnemyLose(afterPlayerAttack);
    });

    return !playerCanWin;
  });

  // 3. 安全手があるなら高確率で選ぶ
  if (safeMoves.length > 0) {
    if (Math.random() < 0.8) {
      return randomChoice(safeMoves);
    }
  }

  // 4. 安全手があるなら安全手からランダム
  if (safeMoves.length > 0) {
    return randomChoice(safeMoves);
  }
  
  // 5. どうしようもなければランダム
  return randomChoice(enemyMoves);
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
        isOut(count) ? "cursor-not-allowed opacity-30 grayscale" : "",
        disabled && !isOut(count) ? "cursor-not-allowed opacity-70 saturate-75 brightness-90" : "",
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
          {isOut(count) ? "OUT" : `${count}`}
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
  const [turnCount, setTurnCount] = useState(0);

  // アイテム関連の状態
  const [playerItems, setPlayerItems] = useState(() => (level >= 2 ? pickRandomItems(2) : []));
  const [itemMenuOpen, setItemMenuOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [itemStage, setItemStage] = useState(null); // null | 'preview' | 'use_wait_hand' | 'sacrifive_choose_count'
  const [sacrifiveChoice, setSacrifiveChoice] = useState(null);
  const [guardActive, setGuardActive] = useState(false);
  const [doubleAttackActive, setDoubleAttackActive] = useState(false);
  const [enemyGuardActive, setEnemyGuardActive] = useState(false);
  const [enemyGuardUses, setEnemyGuardUses] = useState(level >= 2 ? 1 : 0);
  const [enemyEffect, setEnemyEffect] = useState(null);
  const enemyEffectTimerRef = useRef(null);
  const [enemyLives, setEnemyLives] = useState(level >= 3 ? 2 : 0);

  const playerLose = isHandOut(hands.player.left) && isHandOut(hands.player.right);
  const enemyLose = isHandOut(hands.enemy.left) && isHandOut(hands.enemy.right);
  const sacrifiveUnavailable = isHandOut(hands.player.left) || isHandOut(hands.player.right);

  function recordGameResult(resultWinner, resultTurns) {
    saveGameResult({
      level,
      turns: resultTurns,
      winner: resultWinner,
    })
      .then(({ error }) => {
        if (error) {
          console.error("Failed to save game result:", error);
        }
      })
      .catch((error) => {
        console.error("Failed to save game result:", error);
      });
  }

  function showEnemyEffect(effect) {
    if (enemyEffectTimerRef.current) {
      clearTimeout(enemyEffectTimerRef.current);
    }

    if (effect === "guard") {
      playSound("guard");
    }

    setEnemyEffect(effect);
    enemyEffectTimerRef.current = setTimeout(() => {
      setEnemyEffect(null);
      enemyEffectTimerRef.current = null;
    }, ENEMY_EFFECT_DURATION_MS);
  }

  function resetGame() {
    if (enemyEffectTimerRef.current) {
      clearTimeout(enemyEffectTimerRef.current);
      enemyEffectTimerRef.current = null;
    }

    setHands(createInitialHands());
    setSelectedHand(null);
    setTurn("player");
    setMessage("自分の手を選んでください");
    setWinner(null);
    setTurnCount(0);
    // level2 以上ではゲーム開始時にランダムでアイテムを配布
    setPlayerItems(level >= 2 ? pickRandomItems(2) : []);
    setItemMenuOpen(false);
    setSelectedItemId(null);
    setItemStage(null);
    setSacrifiveChoice(null);
    setGuardActive(false);
    setDoubleAttackActive(false);
    setEnemyGuardActive(false);
    setEnemyGuardUses(level >= 2 ? 1 : 0);
    setEnemyEffect(null);
    setEnemyLives(level >= 3 ? 2 : 0);
  }

  function attackEnemy(targetHand) {
    if (turn !== "player" || !selectedHand || winner) return;
    const nextTurnCount = turnCount + 1;
    setTurnCount(nextTurnCount);

    if (enemyGuardActive) {
      setEnemyGuardActive(false);
      showEnemyEffect("guard");

      setMessage("相手がGuardを発動。この攻撃を2本軽減しました");
      setTurn("enemy");
      setDoubleAttackActive(false);

      setTimeout(() => enemyAttack(hands, nextTurnCount), 700);

      return;
    }
    let power = attackPower(hands.player[selectedHand]);
    if (doubleAttackActive) {
      power *= 2;
      setDoubleAttackActive(false);
    }
    const nextEnemyHands = {
      ...hands.enemy,
      [targetHand]: attackedHand(hands.enemy[targetHand], power),
    };
    if (level >= 3 && enemyLives > 0 && isHandOut(nextEnemyHands[targetHand])) {
      nextEnemyHands[targetHand] = createHand(1);
      setEnemyLives((prev) => Math.max(prev - 1, 0));
    }
    const nextHands = {
      ...hands,
      enemy: nextEnemyHands,
    };

    setHands(nextHands);
    setSelectedHand(null);

    if (isHandOut(nextEnemyHands.left) && isHandOut(nextEnemyHands.right)) {
      recordGameResult("player", nextTurnCount);
      setWinner("player");
      setMessage("YOU WIN!");
      return;
    }

    setTurn("enemy");
    setMessage("相手の番です");

    setTimeout(() => enemyAttack(nextHands, nextTurnCount), 700);
  }
  
  // CPUの行動を決めるための補助関数
  function getPossibleMoves(currentHands, attacker) {
  const defender = attacker === "enemy" ? "player" : "enemy";

  const attackerOptions = handOrder.filter(
    (side) => !isHandOut(currentHands[attacker][side])
  );

  const defenderOptions = handOrder.filter(
    (side) => !isHandOut(currentHands[defender][side])
  );

  const moves = [];

  attackerOptions.forEach((attackerHand) => {
    defenderOptions.forEach((defenderHand) => {
      moves.push({ attackerHand, defenderHand });
    });
  });

  return moves;
}

function simulateAttack(currentHands, attacker, move) {
  const defender = attacker === "enemy" ? "player" : "enemy";
  const power = attackPower(currentHands[attacker][move.attackerHand]);

  return {
    ...currentHands,
    [defender]: {
      ...currentHands[defender],
      [move.defenderHand]: attackedHand(
        currentHands[defender][move.defenderHand],
        power
      ),
    },
  };
}

function isPlayerLose(currentHands) {
  return (
    isHandOut(currentHands.player.left) &&
    isHandOut(currentHands.player.right)
  );
}

function isEnemyLose(currentHands) {
  return (
    isHandOut(currentHands.enemy.left) &&
    isHandOut(currentHands.enemy.right)
  );
}

function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function chooseEnemyMove(currentHands) {
  const enemyMoves = getPossibleMoves(currentHands, "enemy");

  if (enemyMoves.length === 0) return null;

  // 1. 今勝てるなら勝つ
  const winningMoves = enemyMoves.filter((move) => {
    const afterEnemyAttack = simulateAttack(currentHands, "enemy", move);
    return isPlayerLose(afterEnemyAttack);
  });

  if (winningMoves.length > 0) {
    return randomChoice(winningMoves);
  }

  // 2. 次に負ける手は避ける
  const safeMoves = enemyMoves.filter((move) => {
    const afterEnemyAttack = simulateAttack(currentHands, "enemy", move);
    const playerMoves = getPossibleMoves(afterEnemyAttack, "player");

    const playerCanWin = playerMoves.some((playerMove) => {
      const afterPlayerAttack = simulateAttack(
        afterEnemyAttack,
        "player",
        playerMove
      );

      return isEnemyLose(afterPlayerAttack);
    });

    return !playerCanWin;
  });

  // Level 2以上では、2手先で勝てる手を高確率で狙う
  if (level >= 2) {
    const twoStepAttackMoves = safeMoves.filter((move) => {
      const afterEnemyAttack = simulateAttack(currentHands, "enemy", move);
      const playerMoves = getPossibleMoves(afterEnemyAttack, "player");

      return playerMoves.every((playerMove) => {
        const afterPlayerAttack = simulateAttack(
          afterEnemyAttack,
          "player",
          playerMove
        );

        const nextEnemyMoves = getPossibleMoves(afterPlayerAttack, "enemy");

        return nextEnemyMoves.some((nextEnemyMove) => {
          const targetHand = nextEnemyMove.defenderHand;
          const afterNextEnemyAttack = simulateAttack(
            afterPlayerAttack,
            "enemy",
            nextEnemyMove
          );

          return (
            !isHandOut(afterPlayerAttack.player[targetHand]) &&
            isHandOut(afterNextEnemyAttack.player[targetHand])
          );
        });
      });
    });

    if (twoStepAttackMoves.length > 0 && Math.random() < 0.9) {
      return randomChoice(twoStepAttackMoves);
    }
  }
  // 3. 安全手があるなら高確率で選ぶ
  if (safeMoves.length > 0) {
    if (Math.random() < 0.8) {
      return randomChoice(safeMoves);
    }
  }

  // 4. 安全手があるなら安全手からランダム
  if (safeMoves.length > 0) {
    return randomChoice(safeMoves);
  }
  
  // 5. どうしようもなければランダム
  return randomChoice(enemyMoves);
}
  // CPUがGuardを使うべきか判断して、使うならどの手でGuardするかを決める関数
function chooseEnemyGuardHand(currentHands) {
  if (level < 2 || enemyGuardUses <= 0 ) return false;

  const playerMoves = getPossibleMoves(currentHands, "player");

  // 1. 次のプレイヤー攻撃でCPUが両手OUTになるなら、必ずGuard
  const loseDangerMoves = playerMoves.filter((move) => {
    const afterPlayerAttack = simulateAttack(currentHands, "player", move);
    return isEnemyLose(afterPlayerAttack);
  });

  if (loseDangerMoves.length > 0) {
    return true;
  }

  // 2. 次のプレイヤー攻撃でCPUの片手がOUTになるなら、80%でGuard
  const oneHandDangerMoves = playerMoves.filter((move) => {
    const targetHand = move.defenderHand;
    const afterPlayerAttack = simulateAttack(currentHands, "player", move);

    return (
      !isHandOut(currentHands.enemy[targetHand]) &&
      isHandOut(afterPlayerAttack.enemy[targetHand])
    );
  });

  if (oneHandDangerMoves.length > 0 ) {
    return true;
  }

  return false;
}

  // CPUの攻撃を実行する関数
  function enemyAttack(currentHands, resultTurns = turnCount) {
    // Guard が有効ならこの攻撃を無効化してプレイヤーの手番に戻す
    if (guardActive) {
      playSound("guard");
      setGuardActive(false);
      setTurn("player");
      setMessage("相手の攻撃をガードしました。自分の手を選んでください");
      return;
    }

    const enemyOptions = handOrder.filter((side) => !isHandOut(currentHands.enemy[side]));
    const playerOptions = handOrder.filter((side) => !isHandOut(currentHands.player[side]));

    if (enemyOptions.length === 0 || playerOptions.length === 0) return;
    const useGuard = chooseEnemyGuardHand(currentHands);

    if (useGuard) {
      setEnemyGuardActive(true);
      setEnemyGuardUses((prev) => Math.max(prev - 1, 0));
    }
          setTurn("player");
          setMessage("自分の手を選んでください");

    const selectedMove = chooseEnemyMove(currentHands);

    if (!selectedMove) return;

    const enemyHand = selectedMove.attackerHand;
    const playerHand = selectedMove.defenderHand;
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
      recordGameResult("enemy", resultTurns);
      setWinner("enemy");
      setMessage("YOU LOSE...");
      return;
    }

    setTurn("player");
    setMessage("自分の手を選んでください");
  }

  // アイテム消費ヘルパー
  function consumeItem(itemId) {
    setPlayerItems((prev) => prev.filter((it) => it.id !== itemId));
  }

  // アイテム使用の起点（メニューでアイテムを押したとき）
  function handleItemClick(itemId) {
    // Sacrifive が使用できない状態なら説明でそれを表示する
    if (itemId === 'sacrifive' && sacrifiveUnavailable) {
      setSelectedItemId(itemId);
      setItemStage('preview');
      setMessage('一方の手が既にOUTになっている為このアイテムは使用できません');
      return;
    }

    // アイテム説明表示フェーズ
    if (selectedItemId !== itemId) {
      setSelectedItemId(itemId);
      setItemStage('preview');
      // メッセージは補助的に表示（既存テキストは変更しない）
      const it = ITEMS.find((i) => i.id === itemId);
      setMessage(it ? it.desc : '');
      return;
    }

    // 同じアイテム名をもう一度押すと使用開始
    if (itemId === 'guard') {
      // Guard は即時発動
      setGuardActive(true);
      consumeItem('guard');
      setItemMenuOpen(false);
      setSelectedItemId(null);
      setItemStage(null);
      setMessage('Guard を使用しました。相手の次の攻撃を無効化します');
      return;
    }

    if (itemId === 'sacrifive') {
      // Sacrifive はまず指の数を選ばせる
      setItemStage('sacrifive_choose_count');
      setMessage('Sacrifive: 1〜4 の数を選んでください');
      return;
    }

    if (itemId === 'roulette') {
      // Roulette は手を選ばせる
      setItemStage('use_wait_hand');
      setMessage('Finger Roulette: 本数を変更する手を選んでください');
      // メニューは開いたままにしておく
      return;
    }

    if (itemId === 'doubleAttack') {
      // Double Attack は次の攻撃を2倍にする
      setItemStage('use_wait_hand');
      setMessage('Double Attack: 使用する手を選んでください');
      return;
    }
  }

  // Sacrifive: 数を選択したときの処理
  function handleSacrifiveChooseCount(n) {
    setSacrifiveChoice(n);
    setItemStage('use_wait_hand');
    setMessage(`Sacrifive: ${n} にする手とは別の手を犠牲にする手を選んでください`);
  }

  // アイテムの効果を適用する（プレイヤーの手を対象にするアイテム）
  function applyItemToPlayerHand(itemId, handSide) {
    if (!itemId) return;

    if (itemId === 'sacrifive') {
      // Sacrifive: handSide を犠牲（5にする）、もう片方を sacrifiveChoice にする
      const other = handSide === 'left' ? 'right' : 'left';
      setHands((prev) => ({
        ...prev,
        player: {
          ...prev.player,
          [handSide]: { ...prev.player[handSide], count: 5 }, // 犠牲にする
          [other]: { ...prev.player[other], count: sacrifiveChoice },
        },
      }));
      consumeItem('sacrifive');
      setItemMenuOpen(false);
      setSelectedItemId(null);
      setItemStage(null);
      setSacrifiveChoice(null);
      setMessage('Sacrifive を使用しました。自分の手番です');
      return;
    }

    if (itemId === 'roulette') {
      // Finger Roulette: 対象手の指を1-4でランダムに設定
      const rand = randomRouletteCount();
      setHands((prev) => ({
        ...prev,
        player: {
          ...prev.player,
          [handSide]: { ...prev.player[handSide], count: rand },
        },
      }));
      consumeItem('roulette');
      setItemMenuOpen(false);
      setSelectedItemId(null);
      setItemStage(null);
      setMessage(`Finger Roulette を使用しました（${rand} 本になりました）。自分の手番です`);
      return;
    }

    if (itemId === 'doubleAttack') {
      setSelectedHand(handSide);
      setDoubleAttackActive(true);
      consumeItem('doubleAttack');
      setItemMenuOpen(false);
      setSelectedItemId(null);
      setItemStage(null);
      setMessage(`Double Attack を使用しました。自分の${handLabel[handSide]}で相手を攻撃してください`);
      return;
    }
  }

  return (
    <main className="relative min-h-screen bg-black px-4 py-5 text-white">
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
            <section className="relative">
              {enemyEffect === "guard" ? (
                <div className="pointer-events-none absolute inset-x-0 top-12 z-20 flex justify-center">
                  <div className="border-4 border-yellow-300 bg-black px-5 py-3 text-center text-xl font-black tracking-[0.08em] text-yellow-300 shadow-[0_0_24px_rgba(253,224,71,0.45)] animate-pulse">
                    <span className="block text-3xl">🛡️</span>
                    <span className="block">相手がGuardを発動!</span>
                    <span className="mt-1 block text-sm tracking-[0.04em] text-white">
                      この攻撃を2本軽減
                    </span>
                  </div>
                </div>
              ) : null}

              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-2xl font-black tracking-[0.12em] text-rose-200">ENEMY</h2>

                <div className="flex items-center gap-3">
                    {level >= 2 && (
                    <span className="rounded border border-rose-300 px-2 py-1 text-lg font-black text-rose-300">
                      🛡️ × {enemyGuardUses}
                    </span>
                    )}
                    {level >= 3 && (
                    <span className="rounded border border-rose-300 px-2 py-1 text-lg font-black text-rose-300">
                      💀 × {enemyLives}
                    </span>
                    )}
                    <span className="text-sm font-bold text-rose-200">
                      {enemyLose ? "両手アウト" : "TARGET"}
                    </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {enemyDisplayOrder.map((side) => (
                  <Hand
                    key={side}
                    owner="enemy"
                    side={side}
                    count={hands.enemy[side].count}
                    // アイテム使用でプレイヤーの手を選ぶフェーズ時は敵手を押せない
                    disabled={turn !== "player" || !selectedHand || winner || itemStage === 'use_wait_hand'}
                    onClick={() => attackEnemy(side)}
                  />
                ))}
              </div>
            </section>

            <div className="flex items-center justify-center gap-4">
              {level >= 2 ? (
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-3">
                    <div className="rounded border border-white/20 bg-white/10 px-3 py-2 text-sm text-white">
                      アイテムを使用できます →<br />
                      you can use items.
                    </div>
                    <button
                      type="button"
                      onClick={() => setItemMenuOpen((s) => !s)}
                      className="border-2 border-white/60 px-4 py-2 font-black tracking-[0.12em] hover:bg-white hover:text-black"
                    >
                      ITEM
                    </button>
                  </div>

                  {/* アイテムメニュー */}
                  {itemMenuOpen ? (
                    <div className="mt-3 w-72 space-y-2 rounded border border-white/20 bg-black/70 p-3 text-left">
                      {/* 所持アイテム一覧 */}
                      {playerItems.length === 0 ? (
                        <p className="text-sm text-white/60">アイテムがありません</p>
                      ) : (
                        playerItems.map((it) => (
                          <div key={it.id} className="flex flex-col">
                            <button
                              type="button"
                              onClick={() => handleItemClick(it.id)}
                              className="text-left font-bold hover:text-yellow-300"
                            >
                              {it.name}
                            </button>

                            {/* 説明表示 (選択時) */}
                            {selectedItemId === it.id && itemStage === 'preview' ? (
                              <div className="mt-1">
                                <p className="text-sm text-white/70">
                                  {it.id === 'sacrifive' && sacrifiveUnavailable
                                    ? '一方の手が既にOUTになっている為このアイテムは使用できません'
                                    : it.desc}
                                </p>
                                <div className="mt-2">
                                  <span className="text-xs text-white/60">アイテム名をもう一度押すと使用</span>
                                </div>
                              </div>
                            ) : null}

                            {/* Sacrifive の数選択 */}
                            {selectedItemId === it.id && itemStage === 'sacrifive_choose_count' ? (
                              <div className="mt-1 flex gap-2">
                                {[1,2,3,4].map((n) => (
                                  <button
                                    key={n}
                                    type="button"
                                    onClick={() => handleSacrifiveChooseCount(n)}
                                    className="border px-2 py-1 text-sm hover:bg-white hover:text-black"
                                  >
                                    {`${n}`}
                                  </button>
                                ))}
                              </div>
                            ) : null}

                            {/* 使用待ちの案内 */}
                            {selectedItemId === it.id && itemStage === 'use_wait_hand' ? (
                              <p className="mt-1 text-xs text-white/60">
                                {it.id === 'roulette'
                                  ? 'ランダムに指を変更する手を選んでください'
                                  : it.id === 'doubleAttack'
                                  ? '二倍攻撃を行う手を選んでください'
                                  : 'OUTにする自分の手を選んでください'}
                              </p>
                            ) : null}
                          </div>
                        ))
                      )}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="h-10 border-y border-dashed border-white/20" />
              )}
            </div>

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
                      // アイテムメニューが開いている場合
                      if (itemMenuOpen) {
                        // アイテムの手を対象にするフェーズならアイテムを適用
                        if (itemStage === 'use_wait_hand' && selectedItemId) {
                          applyItemToPlayerHand(selectedItemId, side);
                          return;
                        }
                        // アイテム使用をやめて通常の操作に戻る
                        setItemMenuOpen(false);
                        setSelectedItemId(null);
                        setItemStage(null);
                        setMessage(`▶ 自分の${handLabel[side]}で、相手のどちらをつつく？`);
                        setSelectedHand(side);
                        return;
                      }

                      // 通常の手選択
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

      <ResultModal winner={winner} onRetry={resetGame} />
    </main>
  );
}
