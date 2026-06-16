"use client";

import { useState } from "react";
import Link from "next/link";
import { playSound } from "./lib/sounds";

export default function Home() {
  const [screen, setScreen] = useState("title");
  const [ruleLang, setRuleLang] = useState("ja");
  const playClickSound = () => {
    playSound("select");
  };

  if (screen === "level") {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-black text-white">
        <h1 className="mb-10 text-5xl font-bold">Level Select</h1>

        <div className="flex flex-col gap-4 text-2xl">
          <Link
            href="/game/level1"
            onClick={playClickSound}
            className="text-center hover:text-yellow-400"
          >
            Level 1
          </Link>
          <Link
            href="/game/level2"
            onClick={playClickSound}
            className="text-center hover:text-yellow-400"
          >
            Level 2
          </Link>
          <Link
            href="/game/level3"
            onClick={playClickSound}
            className="text-center hover:text-yellow-400"
          >
            Level 3
          </Link>
        </div>

        <button
          onClick={() => {
            playClickSound();
            setScreen("title");
          }}
          className="mt-10 text-lg hover:text-yellow-400"
        >
          Back
        </button>
      </div>
    );
  }

  if (screen === "howToPlay") {
  return (
    <div className="flex min-h-screen flex-col items-center bg-black px-8 py-10 text-white">
      <h1 className="mb-8 text-5xl font-bold">How to Play</h1>

      <div className="mb-8 flex gap-4 text-2xl">
        <button
          onClick={() => setRuleLang("ja")}
          className={`hover:text-yellow-400 ${ruleLang === "ja" ? "text-yellow-400" : ""}`}
        >
          日本語
        </button>
        <button
          onClick={() => setRuleLang("en")}
          className={`hover:text-yellow-400 ${ruleLang === "en" ? "text-yellow-400" : ""}`}
        >
          English
        </button>
      </div>

      {ruleLang === "ja" ? (
        <div className="max-w-2xl text-left text-xl leading-10">
          <p>・お互い両手を出し、最初はそれぞれの手の指の数を1にします。</p>
          <p>・自分の番になったら、自分のどちらかの手で相手の手をタッチします。</p>
          <p>・タッチされた相手の手は、タッチした自分の手の指の数だけ増えます。</p>
          <p>・指の数が5以上になった手はアウトになります。</p>
          <p>・両手がアウトになったプレイヤーの負けです。</p>
          <p>・15ターン以内に勝負がつかない場合、指の合計が少ない方の判定勝ちです。</p>
          <button
            onClick={() => {
              playClickSound();
              setScreen("title");
            }}
            className="mt-4 text-lg hover:text-yellow-400"
          >
            タイトルへ戻る
          </button>
        </div>
        
      ) : (
        <div className="max-w-2xl text-left text-xl leading-10">
          <p>・Both players show their hands, and each starts with one finger.</p>
          <p>・On your turn, touch one of your opponent&apos;s hands with one of your hands.</p>
          <p>・The touched hand will increase by the number of fingers on the hand you used to touch it.</p>
          <p>・A hand with five or more fingers is out.</p>
          <p>・The player whose both hands are out loses.</p>
          <p>・If the battle is not decided within 15 turns, the player with fewer total fingers wins by decision.</p>
          <button
            onClick={() => {
              playClickSound();
              setScreen("title");
            }}
            className="mt-4 text-lg hover:text-yellow-400"
          >
            Back
          </button>
        </div>
      )}


      
    </div>
  );
}
  if (screen === "credit") {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-black text-white">
        <h1 className="mb-10 text-5xl font-bold">CREDIT</h1>

        <div className="text-center text-xl leading-10">
          <p>制作者：三原和馬、藥師寺芙美、秋山瑠星</p>
          <p>BGM：？？？</p>
        </div>

        <button
          onClick={() => {
            playClickSound();
            setScreen("title");
          }}
          className="mt-10 text-lg hover:text-yellow-400"
        >
          Back
        </button>
      </div>
    );
  }

  return (
      <div
        className="flex min-h-screen flex-col items-center justify-center bg-black bg-contain bg-center bg-no-repeat text-white"
        style={{ backgroundImage: "url('/images/home.jpg')" }}
      >
      <h1 className="mb-10 text-6xl font-bold">POKE</h1>

      <div className="flex flex-col gap-4 text-2xl">
        <button
          onClick={() => {
            playClickSound();
            setScreen("level");
          }}
          className="hover:text-yellow-400"
        >
          PLAY
        </button>

        <button
          onClick={() => {
            playClickSound();
            setScreen("howToPlay");
          } }
          className="hover:text-yellow-400"
        >
          HOW TO PLAY
        </button>

        <Link
          href="/ranking"
          onClick={playClickSound}
          className="text-center hover:text-yellow-400"
        >
          RANKING
        </Link>

        <button
          onClick={() => {
            playClickSound();
            setScreen("credit");
          }}
          className="hover:text-yellow-400"
        >
          CREDITS
        </button>
      </div>
    </div>
  );
}
