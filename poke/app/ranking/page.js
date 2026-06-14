"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetchAllLevelTurnHistograms } from "../lib/gameResults";
import { isSupabaseConfigured } from "../lib/supabaseRest";

const LEVELS = [1, 2, 3];

function groupByLevel(rows) {
  return LEVELS.reduce((result, level) => {
    result[level] = rows.filter((row) => row.level === level);
    return result;
  }, {});
}

function RankingBars({ level, rows }) {
  const maxCount = Math.max(...rows.map((row) => row.clear_count), 0);

  return (
    <section className="border-4 border-double border-white/70 bg-black/80 p-4">
      <div className="flex items-end justify-between gap-4 border-b border-white/25 pb-3">
        <h2 className="text-2xl font-black">LEVEL {level}</h2>
        <p className="text-xs font-black tracking-[0.18em] text-yellow-300">
          {rows.length ? "CLEAR TURNS" : "NO DATA"}
        </p>
      </div>

      {rows.length ? (
        <div className="mt-5 grid gap-3">
          {rows.map((row) => {
            const width = maxCount ? Math.max((row.clear_count / maxCount) * 100, 8) : 0;

            return (
              <div key={`${row.level}-${row.turns}`} className="grid grid-cols-[4.5rem_1fr_3rem] items-center gap-3">
                <span className="text-sm font-black text-white/80">{row.turns} TURN</span>
                <div className="h-8 border-2 border-cyan-200/60 bg-slate-950">
                  <div
                    className="flex h-full items-center justify-end bg-cyan-300 pr-2 text-sm font-black text-black"
                    style={{ width: `${width}%` }}
                  >
                    {row.clear_count}
                  </div>
                </div>
                <span className="text-right text-sm font-black text-white/80">{row.clear_count}回</span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-5 flex h-28 items-center justify-center border-2 border-dashed border-white/25 text-sm font-black tracking-[0.16em] text-white/45">
          NO CLEAR DATA
        </div>
      )}
    </section>
  );
}

export default function RankingPage() {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadRanking() {
      if (!isSupabaseConfigured()) {
        setStatus("error");
        setErrorMessage("Supabase の環境変数が未設定です");
        return;
      }

      const { data, error } = await fetchAllLevelTurnHistograms();

      if (!active) return;

      if (error) {
        setStatus("error");
        setErrorMessage("ランキングの取得に失敗しました");
        return;
      }

      setRows(data || []);
      setStatus("ready");
    }

    loadRanking();

    return () => {
      active = false;
    };
  }, []);

  const rowsByLevel = useMemo(() => groupByLevel(rows), [rows]);

  return (
    <main className="min-h-screen bg-black px-5 py-8 text-white">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b-4 border-double border-white/70 pb-5">
          <div>
            <p className="text-xs font-black tracking-[0.28em] text-yellow-300">RANKING</p>
            <h1 className="mt-2 text-4xl font-black">Clear Turn Chart</h1>
          </div>
          <Link
            href="/"
            className="border-2 border-white/60 px-4 py-2 text-sm font-black tracking-[0.14em] hover:bg-white hover:text-black"
          >
            HOME
          </Link>
        </header>

        {status === "loading" ? (
          <div className="flex h-52 items-center justify-center border-4 border-double border-white/50 text-sm font-black tracking-[0.2em] text-white/70">
            LOADING
          </div>
        ) : null}

        {status === "error" ? (
          <div className="border-4 border-double border-rose-300 bg-rose-950/30 p-5 text-sm font-black text-rose-100">
            {errorMessage}
          </div>
        ) : null}

        {status === "ready" ? (
          <div className="grid gap-5 lg:grid-cols-3">
            {LEVELS.map((level) => (
              <RankingBars key={level} level={level} rows={rowsByLevel[level]} />
            ))}
          </div>
        ) : null}
      </div>
    </main>
  );
}
