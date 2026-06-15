"use client";

const SOUNDS = {
  guard: { path: "/sounds/guard.mp3", volume: 0.35 },
  select: { path: "/sounds/select.mp3", volume: 0.2 },
};

const audioCache = {};

export function playSound(name) {
  if (typeof Audio === "undefined") return;

  const sound = SOUNDS[name];
  if (!sound) return;

  if (!audioCache[name]) {
    audioCache[name] = new Audio(sound.path);
  }

  const audio = audioCache[name];
  audio.volume = sound.volume;
  audio.pause();
  audio.currentTime = 0;
  audio.play().catch(() => {});
}
