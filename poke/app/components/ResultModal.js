"use client";

import Link from "next/link";

export default function ResultModal({ winner, reason, onRetry }) {
  if (!winner) return null;

  const playerWon = winner === "player";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="result-title"
        className="w-full max-w-md border-4 border-double border-white bg-black p-6 text-center shadow-[0_0_0_2px_rgba(255,255,255,0.2)]"
      >
        <p className="text-xs font-black tracking-[0.28em] text-yellow-300">RESULT</p>
        <h2 id="result-title" className="mt-3 text-4xl font-black">
          {playerWon ? "YOU WIN!" : "YOU LOSE..."}
        </h2>
        {reason ? (
          <p className="mt-3 text-sm font-bold leading-6 text-white/75">{reason}</p>
        ) : null}

        <div className="mt-6 grid gap-3">
          <button
            type="button"
            onClick={onRetry}
            className="border-2 border-white/70 px-4 py-3 font-black tracking-[0.12em] hover:bg-white hover:text-black"
          >
            もう一度
          </button>
          <Link
            href="/"
            className="border-2 border-white/40 px-4 py-3 font-black tracking-[0.12em] text-white/80 hover:bg-white hover:text-black"
          >
            ホームへ戻る
          </Link>
        </div>
      </section>
    </div>
  );
}
